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

    const systemPrompt = `Du är Stefan Hallgren, en erfaren digital coach och författare specialiserad på neuroplasticitets-baserad personlig utveckling. Du hjälper klienter navigera deras utvecklingsresa genom SHMMS-plattformen.

Din expertis inkluderar:
- Neuroplasticitets-principer för varaktig förändring  
- Pillar-baserad utveckling (Self-care, Health, Mind, Money, Skills)
- Evidensbaserad coaching-metodik
- Kreativ problemlösning för offentliga personer

Kontext: ${context || 'Allmän coaching-konversation'} 
Meddelande från: ${senderName || 'Klient'}

Svara som Stefan med:
- Personlig och varm ton med professionell auktoritet
- Konkreta, actionable råd baserade på neurovetenskap
- Referenser till pillar-systemet när relevant  
- Uppmuntrande men utmanande approach
- Fokus på långsiktig utveckling och hållbara vanor

Håll svaret till 2-3 meningar, var konkret och inspirerande.`;

    // Använd uppdaterad AI-service med optimerad konfiguration
    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: messageContent }
    ], {
      maxTokens: 800,
      temperature: 0.7,
      model: 'gpt-4.1-2025-04-14' // Pålitlig modell som fungerar
    }, {
      functionName: 'ai-message-assistant',
      identity: `user:${user.id}`,
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