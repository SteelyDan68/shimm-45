/**
 * AI Service - Centraliserad AI-funktionalitet med OpenAI primary och Gemini fallback
 */

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  content: string;
  model: 'openai' | 'gemini';
  success: boolean;
  error?: string;
}

interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export class AIService {
  private openAIKey: string | null;
  private geminiKey: string | null;

  constructor() {
    this.openAIKey = Deno.env.get('OPENAI_API_KEY') || null;
    this.geminiKey = Deno.env.get('GEMINI_API_KEY') || null;
  }

  /**
   * Huvudmetod för AI-anrop med fallback
   */
  async generateResponse(
    messages: AIMessage[],
    options: AIOptions = {}
  ): Promise<AIResponse> {
    const {
      maxTokens = 800,
      temperature = 0.7,
      model = 'gpt-4.1-2025-04-14'
    } = options;

    console.log('AI Service: Initiating request...');

    // Försök OpenAI först
    if (this.openAIKey) {
      try {
        console.log('AI Service: Trying OpenAI...');
        const result = await this.callOpenAI(messages, { maxTokens, temperature, model });
        console.log('AI Service: OpenAI success');
        return {
          content: result,
          model: 'openai',
          success: true
        };
      } catch (error) {
        console.warn('AI Service: OpenAI failed, falling back to Gemini:', error.message);
      }
    } else {
      console.warn('AI Service: OpenAI API key not available, trying Gemini');
    }

    // Fallback till Gemini
    if (this.geminiKey) {
      try {
        console.log('AI Service: Trying Gemini fallback...');
        const result = await this.callGemini(messages, { maxTokens, temperature });
        console.log('AI Service: Gemini success');
        return {
          content: result,
          model: 'gemini',
          success: true
        };
      } catch (error) {
        console.error('AI Service: Gemini also failed:', error.message);
        return {
          content: '',
          model: 'gemini',
          success: false,
          error: `Both OpenAI and Gemini failed. OpenAI: ${this.openAIKey ? 'API error' : 'No API key'}. Gemini: ${error.message}`
        };
      }
    }

    return {
      content: '',
      model: 'openai',
      success: false,
      error: 'No AI API keys available'
    };
  }

  /**
   * OpenAI API-anrop
   */
  private async callOpenAI(
    messages: AIMessage[],
    options: { maxTokens: number; temperature: number; model: string }
  ): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model,
        messages: messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Gemini API-anrop
   */
  private async callGemini(
    messages: AIMessage[],
    options: { maxTokens: number; temperature: number }
  ): Promise<string> {
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
      return data.candidates[0].content.parts[0].text;
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
    options: AIOptions = {}
  ): Promise<AIResponse> {
    const messages: AIMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    return this.generateResponse(messages, options);
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