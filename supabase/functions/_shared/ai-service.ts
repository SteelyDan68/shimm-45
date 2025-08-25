/**
 * AI Service - Centraliserad AI-funktionalitet med OpenAI primary, Gemini fallback, 
 * rate limiting, retry-policy och komplett response logging
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  content: string;
  model: 'openai' | 'gemini';
  success: boolean;
  error?: string;
  latency_ms?: number;
  cost_estimate?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  request_id?: string;
}

interface RateLimitResult {
  allowed: boolean;
  current_count: number;
  limit: number;
  reset_time: Date;
}

interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export class AIService {
  private openAIKey: string | null;
  private geminiKey: string | null;
  private supabase: any;
  
  // Rate limit config (requests per minute)
  private readonly RATE_LIMIT = 20;
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor() {
    this.openAIKey = Deno.env.get('OPENAI_API_KEY') || null;
    this.geminiKey = Deno.env.get('GEMINI_API_KEY') || null;
    
    // Initialisera Supabase för logging och rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Rate limiting - fixed window per minut
   */
  async checkRateLimit(identity: string): Promise<RateLimitResult> {
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());

    try {
      // Försök uppdatera befintlig window
      const { data: existing, error: selectError } = await this.supabase
        .from('ai_rate_limits')
        .select('*')
        .eq('identity', identity)
        .eq('window_start', windowStart.toISOString())
        .maybeSingle();

      if (selectError) {
        console.error('Rate limit check error:', selectError);
        return { allowed: true, current_count: 0, limit: this.RATE_LIMIT, reset_time: new Date(windowStart.getTime() + 60000) };
      }

      if (existing) {
        // Kontrollera om limit överskridits
        if (existing.count >= this.RATE_LIMIT) {
          return {
            allowed: false,
            current_count: existing.count,
            limit: this.RATE_LIMIT,
            reset_time: new Date(windowStart.getTime() + 60000)
          };
        }

        // Uppdatera count
        const { error: updateError } = await this.supabase
          .from('ai_rate_limits')
          .update({
            count: existing.count + 1,
            last_request_at: now.toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Rate limit update error:', updateError);
        }

        return {
          allowed: true,
          current_count: existing.count + 1,
          limit: this.RATE_LIMIT,
          reset_time: new Date(windowStart.getTime() + 60000)
        };
      } else {
        // Skapa ny window
        const { error: insertError } = await this.supabase
          .from('ai_rate_limits')
          .insert({
            identity: identity,
            window_start: windowStart.toISOString(),
            count: 1,
            last_request_at: now.toISOString()
          });

        if (insertError) {
          console.error('Rate limit insert error:', insertError);
        }

        return {
          allowed: true,
          current_count: 1,
          limit: this.RATE_LIMIT,
          reset_time: new Date(windowStart.getTime() + 60000)
        };
      }
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Tillåt vid fel för att undvika blockering
      return { allowed: true, current_count: 0, limit: this.RATE_LIMIT, reset_time: new Date(windowStart.getTime() + 60000) };
    }
  }

  /**
   * Logga AI-svar med alla detaljer
   */
  async logResponse(
    functionName: string,
    identity: string,
    userId: string | null,
    response: AIResponse,
    error?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('ai_response_logs')
        .insert({
          function_name: functionName,
          user_id: userId,
          identity: identity,
          provider: response.model,
          model: response.model === 'openai' ? 'gpt-4.1-2025-04-14' : 'gemini-1.5-flash',
          latency_ms: response.latency_ms || 0,
          cost_estimate: response.cost_estimate || null,
          prompt_tokens: response.prompt_tokens || null,
          completion_tokens: response.completion_tokens || null,
          total_tokens: response.total_tokens || null,
          request_id: response.request_id || null,
          status: response.success ? 'success' : 'error',
          error: error || null,
          metadata: {
            timestamp: new Date().toISOString(),
            function: functionName
          }
        });
    } catch (logError) {
      console.error('Failed to log AI response:', logError);
      // Logga inte om det misslyckas - vi vill inte störa huvudfunktionen
    }
  }

  /**
   * Retry wrapper med exponential backoff
   */
  async withRetry<T>(operation: () => Promise<T>, attempt = 1): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.RETRY_ATTEMPTS) {
        throw error;
      }
      
      console.warn(`AI request failed (attempt ${attempt}/${this.RETRY_ATTEMPTS}):`, error.message);
      
      // Exponential backoff
      const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.withRetry(operation, attempt + 1);
    }
  }

  /**
   * Huvudmetod för AI-anrop med rate limiting, retry och logging
   */
  async generateResponse(
    messages: AIMessage[],
    options: AIOptions = {},
    context: { functionName?: string; identity?: string; userId?: string } = {}
  ): Promise<AIResponse> {
    const { functionName = 'unknown', identity = 'unknown', userId = null } = context;
    const startTime = Date.now();
    const {
      maxTokens = 800,
      temperature = 0.7,
      model = 'gpt-4.1-2025-04-14'
    } = options;

    console.log(`AI Service [${functionName}]: Initiating request for ${identity}`);

    // Kontrollera rate limit
    const rateLimitResult = await this.checkRateLimit(identity);
    if (!rateLimitResult.allowed) {
      const error = `Rate limit exceeded: ${rateLimitResult.current_count}/${rateLimitResult.limit}. Reset at: ${rateLimitResult.reset_time.toISOString()}`;
      const response: AIResponse = {
        content: '',
        model: 'openai',
        success: false,
        error: error,
        latency_ms: Date.now() - startTime
      };
      
      await this.logResponse(functionName, identity, userId, response, error);
      return response;
    }

    let finalResponse: AIResponse;

    try {
      // Försök OpenAI först med retry
      if (this.openAIKey) {
        try {
          console.log(`AI Service [${functionName}]: Trying OpenAI...`);
          const result = await this.withRetry(() => 
            this.callOpenAI(messages, { maxTokens, temperature, model })
          );
          
          const latency = Date.now() - startTime;
          console.log(`AI Service [${functionName}]: OpenAI success (${latency}ms)`);
          
          finalResponse = {
            content: result.content,
            model: 'openai',
            success: true,
            latency_ms: latency,
            cost_estimate: this.estimateCost('openai', result.prompt_tokens || 0, result.completion_tokens || 0),
            prompt_tokens: result.prompt_tokens,
            completion_tokens: result.completion_tokens,
            total_tokens: result.total_tokens,
            request_id: result.request_id
          };
          
          await this.logResponse(functionName, identity, userId, finalResponse);
          return finalResponse;
        } catch (error) {
          console.warn(`AI Service [${functionName}]: OpenAI failed, falling back to Gemini:`, error.message);
        }
      } else {
        console.warn(`AI Service [${functionName}]: OpenAI API key not available, trying Gemini`);
      }

      // Fallback till Gemini med retry
      if (this.geminiKey) {
        try {
          console.log(`AI Service [${functionName}]: Trying Gemini fallback...`);
          const result = await this.withRetry(() => 
            this.callGemini(messages, { maxTokens, temperature })
          );
          
          const latency = Date.now() - startTime;
          console.log(`AI Service [${functionName}]: Gemini success (${latency}ms)`);
          
          finalResponse = {
            content: result.content,
            model: 'gemini',
            success: true,
            latency_ms: latency,
            cost_estimate: this.estimateCost('gemini', result.prompt_tokens || 0, result.completion_tokens || 0),
            prompt_tokens: result.prompt_tokens,
            completion_tokens: result.completion_tokens,
            total_tokens: result.total_tokens
          };
          
          await this.logResponse(functionName, identity, userId, finalResponse);
          return finalResponse;
        } catch (error) {
          console.error(`AI Service [${functionName}]: Gemini also failed:`, error.message);
          const errorMsg = `Both OpenAI and Gemini failed. OpenAI: ${this.openAIKey ? 'API error' : 'No API key'}. Gemini: ${error.message}`;
          
          finalResponse = {
            content: '',
            model: 'gemini',
            success: false,
            error: errorMsg,
            latency_ms: Date.now() - startTime
          };
          
          await this.logResponse(functionName, identity, userId, finalResponse, errorMsg);
          return finalResponse;
        }
      }

      const errorMsg = 'No AI API keys available';
      finalResponse = {
        content: '',
        model: 'openai',
        success: false,
        error: errorMsg,
        latency_ms: Date.now() - startTime
      };
      
      await this.logResponse(functionName, identity, userId, finalResponse, errorMsg);
      return finalResponse;

    } catch (error) {
      const errorMsg = `Unexpected error: ${error.message}`;
      finalResponse = {
        content: '',
        model: 'openai',
        success: false,
        error: errorMsg,
        latency_ms: Date.now() - startTime
      };
      
      await this.logResponse(functionName, identity, userId, finalResponse, errorMsg);
      return finalResponse;
    }
  }

  /**
   * Beräkna ungefärlig kostnad (USD)
   */
  private estimateCost(provider: string, promptTokens: number, completionTokens: number): number {
    if (provider === 'openai') {
      // GPT-4.1 pricing (approximation)
      const promptCost = (promptTokens / 1000) * 0.03; // $0.03/1K tokens
      const completionCost = (completionTokens / 1000) * 0.06; // $0.06/1K tokens
      return promptCost + completionCost;
    } else if (provider === 'gemini') {
      // Gemini pricing (approximation)  
      const promptCost = (promptTokens / 1000) * 0.00015; // $0.00015/1K tokens
      const completionCost = (completionTokens / 1000) * 0.0006; // $0.0006/1K tokens
      return promptCost + completionCost;
    }
    return 0;
  }

  /**
   * OpenAI API-anrop med detaljerad response
   */
  private async callOpenAI(
    messages: AIMessage[],
    options: { maxTokens: number; temperature: number; model: string }
  ): Promise<{
    content: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    request_id?: string;
  }> {
    const requestBody = {
      model: options.model,
      messages: messages,
      max_completion_tokens: options.maxTokens, // Nyare modeller använder max_completion_tokens
      // temperature stöds inte för GPT-5 och nyare modeller
    };

    // Lägg till temperature endast för äldre modeller
    if (options.model.includes('gpt-4o') || options.model.includes('gpt-4.1')) {
      requestBody.temperature = options.temperature;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      prompt_tokens: data.usage?.prompt_tokens,
      completion_tokens: data.usage?.completion_tokens,
      total_tokens: data.usage?.total_tokens,
      request_id: response.headers.get('x-request-id') || undefined
    };
  }

  /**
   * Gemini API-anrop med detaljerad response
   */
  private async callGemini(
    messages: AIMessage[],
    options: { maxTokens: number; temperature: number }
  ): Promise<{
    content: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  }> {
    // Konvertera meddelanden till Gemini-format
    const prompt = this.convertMessagesToGeminiPrompt(messages);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: options.temperature,
            maxOutputTokens: options.maxTokens,
            topP: 0.95,
            topK: 40
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content.parts[0].text;
      
      // Gemini returnerar inte alltid token usage
      const promptTokens = data.usageMetadata?.promptTokenCount;
      const completionTokens = data.usageMetadata?.candidatesTokenCount;
      
      return {
        content: content,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens && completionTokens ? promptTokens + completionTokens : undefined
      };
    }
    
    throw new Error('Invalid Gemini response format');
  }

  /**
   * Konverterar ChatGPT-format till Gemini-prompt
   */
  private convertMessagesToGeminiPrompt(messages: AIMessage[]): string {
    let prompt = '';
    
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          prompt += `SYSTEM INSTRUCTIONS: ${message.content}\n\n`;
          break;
        case 'user':
          prompt += `USER: ${message.content}\n\n`;
          break;
        case 'assistant':
          prompt += `ASSISTANT: ${message.content}\n\n`;
          break;
      }
    }

    prompt += 'ASSISTANT: ';
    return prompt;
  }

  /**
   * Enkel textgenerering för bakåtkompatibilitet
   */
  async generateText(
    prompt: string,
    systemPrompt?: string,
    options: AIOptions = {},
    context: { functionName?: string; identity?: string; userId?: string } = {}
  ): Promise<AIResponse> {
    const messages: AIMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    return this.generateResponse(messages, options, context);
  }

  /**
   * Kontrollera API-tillgänglighet
   */
  async checkAvailability(): Promise<{
    openai: boolean;
    gemini: boolean;
    primary: 'openai' | 'gemini' | 'none';
  }> {
    const result = {
      openai: false,
      gemini: false,
      primary: 'none' as 'openai' | 'gemini' | 'none'
    };

    // Testa OpenAI
    if (this.openAIKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${this.openAIKey}` }
        });
        result.openai = response.ok;
      } catch {
        result.openai = false;
      }
    }

    // Testa Gemini
    if (this.geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${this.geminiKey}`
        );
        result.gemini = response.ok;
      } catch {
        result.gemini = false;
      }
    }

    // Bestäm primär
    if (result.openai) {
      result.primary = 'openai';
    } else if (result.gemini) {
      result.primary = 'gemini';
    }

    return result;
  }
}

// Exportera singleton-instans
export const aiService = new AIService();