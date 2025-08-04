import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContextEngine } from './useContextEngine';

/**
 * 🤖 PROACTIVE MESSAGING ENGINE
 * Stefan kan nu autonomt skicka meddelanden baserat på användarens beteende
 * UPPDATERAD: Använder toast notifications istället för konversationssystem
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
  const { toast } = useToast();
  const { currentSessionState, insights } = useContextEngine();
  const [pendingMessages, setPendingMessages] = useState<ProactiveMessage[]>([]);

  // Skicka proaktivt meddelande från Stefan (utan att skapa konversation)
  const sendProactiveMessage = useCallback(async (
    triggerType: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!user) return;

    console.log('🤖 Stefan sending proactive message:', {
      triggerType,
      priority,
      message: message.substring(0, 50) + '...'
    });

    try {
      // Istället för att skapa konversation, lagra meddelandet som proactive intervention
      const { error } = await supabase
        .from('proactive_interventions')
        .insert({
          user_id: user.id,
          trigger_condition: triggerType,
          intervention_type: 'chat_message',
          content: message,
          delivery_method: 'widget',
          context_snapshot: {
            trigger_type: triggerType,
            priority,
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error('❌ Error storing proactive message:', error);
        throw error;
      }

      console.log('✅ Stefan proactive message stored successfully');
      
      // Kör toast notification istället för konversation
      toast({
        title: "💬 Stefan säger:",
        description: message,
        duration: 5000,
      });

    } catch (error) {
      console.error('Failed to send Stefan proactive message:', error);
      toast({
        title: "Stefan AI",
        description: "Stefan försöker nå dig men har svårigheter med anslutningen.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

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
      progress_milestone: "Du har kommit så långt på din resa! Titta tillbaka på var du startade - vilken fantastisk utveckling! 📈",
      motivation_boost: "Du gör ett fantastiskt jobb med din utveckling! Jag ser dina framsteg och är imponerad! 🌟",
      learning_opportunity: "Jag hittade något som kan hjälpa dig utvecklas ännu mer. Vill du ta en titt? 💡"
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