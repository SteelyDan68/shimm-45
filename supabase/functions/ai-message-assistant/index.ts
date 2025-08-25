import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { aiService } from '../_shared/ai-service.ts';
import { authGate } from '../_shared/auth-gate.ts';
import { HttpResponse, RequestValidator, PerformanceMonitor } from '../_shared/http-utils.ts';

serve(async (req) => {
  const monitor = new PerformanceMonitor('ai-message-assistant');
  
  if (req.method === 'OPTIONS') {
    return HttpResponse.options();
  }

  try {
    console.log('AI Message Assistant: Request received');

    // Auth-validering med krävd autentisering
    const authResult = await authGate.protect(req, {
      requireAuth: true,
      allowPublic: false
    });

    if (authResult instanceof Response) {
      return authResult; // Auth misslyckades
    }

    const { user } = authResult;
    const identity = authGate.getIdentity(user, req);

    // Validera request body
    const parseResult = await RequestValidator.safeParseJson(req);
    if (!parseResult.success) {
      return HttpResponse.validationError(parseResult.error!);
    }

    const { messageContent, senderName, context } = parseResult.data;

    // Validera required fields
    const validationError = RequestValidator.validateRequired(parseResult.data, ['messageContent']);
    if (validationError) {
      return HttpResponse.validationError(validationError);
    }

    console.log(`AI Message Assistant: Processing request for user ${user.id}`);

    // Kontrollera AI-tillgänglighet
    const availability = await aiService.checkAvailability();
    if (!availability.openai && !availability.gemini) {
      return HttpResponse.serviceUnavailable('AI');
    }

    const systemPrompt = `Du är en hjälpsam coach-assistent som hjälper till att svara på meddelanden från klienter. 
    Du ska vara professionell, empatisk och uprmuntrande. Svara på svenska.
    
    Kontext: ${context || 'Allmän coaching-konversation'}
    Meddelande från: ${senderName || 'Okänd avsändare'}
    
    Skapa ett passande svar som är:
    - Professionellt men vänligt
    - Uppmuntrande och stödjande
    - Konkret och hjälpsamt
    - Anpassat till coaching-miljön`;

    // Använd uppdaterad AI-service med rate limiting och logging
    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: messageContent }
    ], {
      maxTokens: 500,
      temperature: 0.7,
      model: 'gpt-4o-mini'
    }, {
      functionName: 'ai-message-assistant',
      identity: identity,
      userId: user.id
    });

    if (!aiResponse.success) {
      console.error('AI response failed:', aiResponse.error);
      return HttpResponse.error('AI-tjänst misslyckades: ' + aiResponse.error, 'AI_FAILED', 500);
    }

    monitor.log({ model: aiResponse.model, ai_latency_ms: aiResponse.latency_ms });

    return HttpResponse.success(
      { aiSuggestion: aiResponse.content },
      'AI suggestion generated successfully',
      {
        performance: monitor.getMetadata(),
        ai_metadata: {
          model: aiResponse.model,
          latency_ms: aiResponse.latency_ms,
          cost_estimate: aiResponse.cost_estimate,
          tokens: {
            prompt: aiResponse.prompt_tokens,
            completion: aiResponse.completion_tokens,
            total: aiResponse.total_tokens
          }
        }
      }
    );
    
  } catch (error) {
    console.error('Error in AI message assistant:', error);
    
    // Logga säkerhetsrelaterade fel
    await authGate.logSecurityEvent('ai_message_assistant_error', {
      error: error.message,
      execution_time_ms: monitor.getElapsed(),
      timestamp: new Date().toISOString()
    });

    return HttpResponse.internalError('An unexpected error occurred');
  }
});