import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { useContextEngine } from '@/hooks/useContextEngine';

/**
 * 🤖 PROACTIVE MESSAGING ENGINE
 * Stefan kan nu autonomt skicka meddelanden baserat på användarens beteende
 */

interface ProactiveMessage {
  id: string;
  trigger_type: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sent_at?: string;
  user_responded?: boolean;
}

export const useProactiveMessaging = () => {
  const { user } = useAuth();
  const { sendMessage, getOrCreateDirectConversation } = useMessagingV2();
  const { currentSessionState, insights } = useContextEngine();
  const [pendingMessages, setPendingMessages] = useState<ProactiveMessage[]>([]);

  // Stefan AI system-användare (generera en valid UUID)
  const STEFAN_USER_ID = '00000000-0000-0000-0000-000000000001'; // Reserved system UUID

  // Skicka proaktivt meddelande från Stefan
  const sendProactiveMessage = useCallback(async (
    triggerType: string,
    content: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) => {
    if (!user) return false;

    try {
      console.log('🤖 Stefan sending proactive message:', { triggerType, priority });

      // Skapa eller hämta konversation med Stefan
      const conversationId = await getOrCreateDirectConversation(STEFAN_USER_ID);
      if (!conversationId) {
        console.error('Failed to create conversation with Stefan');
        return false;
      }

      // Lägg till Stefan's personlighet och kontext
      const enhancedContent = await enhanceMessageWithPersonality(content, triggerType);

      // Skicka meddelandet
      const success = await sendMessage(conversationId, enhancedContent);

      if (success) {
        // Logga proaktiv intervention
        await supabase.from('stefan_interactions').insert({
          user_id: user.id,
          interaction_type: 'proactive_message',
          context: {
            trigger_type: triggerType,
            priority,
            original_content: content,
            enhanced_content: enhancedContent
          },
          timestamp: new Date().toISOString()
        });

        console.log('✅ Stefan successfully sent proactive message');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending proactive message:', error);
      return false;
    }
  }, [user, getOrCreateDirectConversation, sendMessage]);

  // Förbättra meddelande med Stefans personlighet
  const enhanceMessageWithPersonality = async (content: string, triggerType: string): Promise<string> => {
    const personalityPrefixes = {
      inactivity_check: "Hej! Jag märkte att du har varit borta ett tag. ",
      task_reminder: "🎯 Hej igen! Jag ville påminna dig om ",
      progress_celebration: "🎉 Fantastiskt! Jag såg att du ",
      struggling_support: "💪 Hej! Jag märker att du kanske behöver lite extra stöd. ",
      learning_opportunity: "💡 Hej! Jag hittade något som kan intressera dig: ",
      weekly_checkin: "📊 Hej! Dags för vår veckovis check-in. ",
      achievement_unlock: "🏆 Grattis! Du har just uppnått ",
      motivation_boost: "🌟 Hej! Jag ville bara säga att "
    };

    const prefix = personalityPrefixes[triggerType as keyof typeof personalityPrefixes] || "Hej! ";
    const signature = "\n\n// Stefan AI 🧠";

    return `${prefix}${content}${signature}`;
  };

  // Analysera användarens beteende och skicka proaktiva meddelanden
  const analyzeAndSendProactiveMessages = useCallback(async () => {
    if (!user || !currentSessionState) return;

    try {
      console.log('🤖 Stefan analyzing user behavior for proactive messaging...');

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // 1. INAKTIVITETS-CHECK (användarens har varit inaktiv > 2 timmar)
      if (currentSessionState.last_active_at && 
          new Date(currentSessionState.last_active_at) < twoHoursAgo &&
          currentSessionState.total_time_spent_minutes > 10) {
        
        await sendProactiveMessage(
          'inactivity_check',
          'Hur går det med din utvecklingsresa? Jag finns här om du behöver stöd eller vill prata om dina mål! 😊',
          'low'
        );
      }

      // 2. STRUGGELING SUPPORT (många abandoned tasks)
      const recentInsights = insights.filter(insight => 
        new Date(insight.generated_at) > twoHoursAgo &&
        insight.insight_type === 'struggling_pattern'
      );

      if (recentInsights.length > 0) {
        await sendProactiveMessage(
          'struggling_support',
          'Jag ser att du arbetar hårt med dina mål. Kom ihåg att små steg framåt är viktiga framsteg! Vill du prata om hur jag kan stötta dig bättre?',
          'medium'
        );
      }

      // 3. PROGRESS CELEBRATION (många completed tasks)
      if (currentSessionState.daily_completions > 3) {
        await sendProactiveMessage(
          'progress_celebration',
          `har genomfört ${currentSessionState.daily_completions} aktiviteter idag! Du är verkligen på rätt spår. Fortsätt så här! 🚀`,
          'medium'
        );
      }

      // 4. LEARNING OPPORTUNITY (baserat på användarens aktuella fokusområden)
      const lowScoreAreas = Object.entries(currentSessionState.session_data || {})
        .filter(([key, value]) => key.includes('_score') && (value as number) < 5)
        .map(([key]) => key.replace('_score', ''));

      if (lowScoreAreas.length > 0) {
        const area = lowScoreAreas[0];
        await sendProactiveMessage(
          'learning_opportunity',
          `Jag har några konkreta tips för att utveckla din ${area}. Vill du att vi går igenom dem tillsammans?`,
          'low'
        );
      }

      // 5. VECKOVIS CHECK-IN (varje måndag)
      const isMonday = now.getDay() === 1;
      const isMorning = now.getHours() >= 8 && now.getHours() <= 10;
      
      if (isMonday && isMorning) {
        await sendProactiveMessage(
          'weekly_checkin',
          'Hur känns det inför en ny vecka? Låt oss planera för framgång! Vill du att jag hjälper dig sätta upp veckans mål?',
          'medium'
        );
      }

      console.log('✅ Stefan completed proactive message analysis');

    } catch (error) {
      console.error('Error in proactive messaging analysis:', error);
    }
  }, [user, currentSessionState, insights, sendProactiveMessage]);

  // Skicka motivationsmeddelande baserat på specifik trigger
  const sendMotivationalMessage = useCallback(async (context: string) => {
    const motivationalMessages = {
      assessment_completed: "Du har precis genomfört en bedömning! Det krävs mod att vara ärlig med sig själv. Jag är stolt över dig! 💪",
      streak_broken: "Ingen fara att du bröt din streak! Det viktiga är att du är här nu. Låt oss börja om tillsammans! 🌟",
      goal_achieved: "WOW! Du har uppnått ett viktigt mål! Ta en paus och fira detta. Du förtjänar det! 🎉",
      stuck_too_long: "Jag märker att du har fastnat på samma ställe ett tag. Ibland behöver vi bara en ny vinkel. Vill du att jag hjälper till? 🤔",
      progress_milestone: "Du har kommit så långt på din resa! Titta tillbaka på var du startade - vilken fantastisk utveckling! 📈"
    };

    const message = motivationalMessages[context as keyof typeof motivationalMessages] || 
      "Jag tänker på dig och din utvecklingsresa! Du gör ett fantastiskt jobb! 💙";

    await sendProactiveMessage('motivation_boost', message, 'medium');
  }, [sendProactiveMessage]);

  // Auto-trigger baserat på context engine events
  useEffect(() => {
    const triggerInterval = setInterval(analyzeAndSendProactiveMessages, 30 * 60 * 1000); // Var 30:e minut
    
    // Initial check efter 2 minuter
    const initialTimeout = setTimeout(analyzeAndSendProactiveMessages, 2 * 60 * 1000);

    return () => {
      clearInterval(triggerInterval);
      clearTimeout(initialTimeout);
    };
  }, [analyzeAndSendProactiveMessages]);

  return {
    sendProactiveMessage,
    sendMotivationalMessage,
    pendingMessages,
    analyzeAndSendProactiveMessages
  };
};