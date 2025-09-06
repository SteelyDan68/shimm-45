import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

interface ContextualHelpOptions {
  currentRoute?: string;
  userRole?: string;
  context?: string;
  metadata?: Record<string, any>;
}

interface AIResponse {
  message: string;
  suggestions?: string[];
  confidence: number;
}

/**
 * 🧠 CONTEXT-AWARE AI HOOK
 * Provides intelligent, location and role-aware AI assistance
 * Integrates with Stefan AI and general assistance systems
 */
export const useContextAwareAI = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);

  /**
   * Get contextual help based on user's current situation
   */
  const getContextualHelp = useCallback(async (
    question: string,
    options: ContextualHelpOptions = {}
  ): Promise<string | null> => {
    if (!question.trim()) return null;

    setIsLoading(true);
    try {
      // Build context from current state
      const context = {
        route: options.currentRoute || location.pathname,
        userRole: options.userRole || user?.user_metadata?.role || 'client',
        userEmail: user?.email,
        timestamp: new Date().toISOString(),
        systemContext: options.context || 'general',
        ...options.metadata
      };

      // Enhanced system prompt based on location and role
      const systemPrompt = buildContextualPrompt(context);
      
      console.log(`Context-Aware AI: Calling ai-message-assistant for ${question}`);

      const { data, error } = await supabase.functions.invoke('ai-message-assistant', {
        body: {
          messageContent: question,
          senderName: user?.email?.split('@')[0] || 'Användare',
          context: systemPrompt,
          metadata: context
        }
      });

      if (error) throw error;

      const response: AIResponse = {
        message: data?.aiSuggestion || 'Kunde inte generera svar.',
        confidence: 0.8
      };

      setLastResponse(response);
      return response.message;

    } catch (error) {
      console.error('Context-aware AI error:', error);
      // Returnera ett hjälpsamt felmeddelande istället för null
      return `Jag har tekniska problem just nu, men jag kan ändå hjälpa dig! 
      
För ${location.pathname === '/pillar-journey' ? 'pillar-systemet' : 'den här sidan'}: Försök navigera med menyn eller kontakta support om du behöver direkt hjälp.`;
    } finally {
      setIsLoading(false);
    }
  }, [user, location.pathname]);

  /**
   * Get quick help for current page
   */
  const getPageHelp = useCallback(async (): Promise<string | null> => {
    const pageQuestions = {
      '/client-dashboard': 'Vad kan jag göra på den här sidan?',
      '/messages': 'Hur fungerar meddelandesystemet?',
      '/assessments': 'Hur gör jag en bedömning?',
      '/pillar-journey': 'Vad är pillar-systemet?',
      '/calendar': 'Hur använder jag kalendern?'
    };

    const question = pageQuestions[location.pathname as keyof typeof pageQuestions] || 
                    'Vad kan jag göra här?';

    return getContextualHelp(question, {
      context: 'page_help',
      currentRoute: location.pathname
    });
  }, [location.pathname, getContextualHelp]);

  /**
   * Get role-specific guidance
   */
  const getRoleGuidance = useCallback(async (topic?: string): Promise<string | null> => {
    const userRole = user?.user_metadata?.role || 'client';
    const question = topic ? 
      `Som ${userRole}, hur arbetar jag med ${topic}?` :
      `Vad kan jag göra som ${userRole} i systemet?`;

    return getContextualHelp(question, {
      context: 'role_guidance',
      userRole
    });
  }, [user, getContextualHelp]);

  return {
    getContextualHelp,
    getPageHelp,
    getRoleGuidance,
    isLoading,
    lastResponse
  };
};

/**
 * Build context-aware system prompt
 */
function buildContextualPrompt(context: any): string {
  const basePrompt = `Du är en hjälpsam AI-assistent för SHMMS-systemet (Stefan Hallgren Coaching). 
Du hjälper användare med systemspecifika frågor och coaching-relaterad vägledning.`;

  const contextPrompts = {
    '/client-dashboard': `Användaren är på klientdashboard. Fokusera på: progress tracking, nästa steg i coaching, overview av aktiviteter.`,
    '/messages': `Användaren är i meddelandesystemet. Hjälp med: kommunikation, kontakt med coaches, meddelandefunktioner.`,
    '/assessments': `Användaren arbetar med bedömningar. Förklara: assessment-processen, resultat-tolkning, nästa steg.`,
    '/pillar-journey': `Användaren utforskar pillar-systemet. Beskriv: olika pillars, utvecklingsresan, personlig tillväxt.`,
    '/calendar': `Användaren använder kalendern. Hjälp med: bokning, schemaläggning, coaching-sessioner.`
  };

  const rolePrompts = {
    client: `Användaren är en klient. Fokusera på personlig utveckling, coaching-process och tillgängliga resurser.`,
    coach: `Användaren är en coach. Hjälp med klient-hantering, verktyg och coaching-metoder.`,
    admin: `Användaren är administratör. Fokusera på systemhantering och översiktlig information.`
  };

  const routeContext = contextPrompts[context.route as keyof typeof contextPrompts] || '';
  const roleContext = rolePrompts[context.userRole as keyof typeof rolePrompts] || '';

  return `${basePrompt}

KONTEXT:
- Aktuell sida: ${context.route}
- Användarroll: ${context.userRole}
- Systemkontext: ${context.systemContext}

${routeContext}
${roleContext}

Svara på svenska, var hjälpsam och konkret. Hänvisa till specifika systemfunktioner när relevant.`;
}