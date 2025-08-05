import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContextEngine } from './useContextEngine';

/**
 * 🤖 PROACTIVE MESSAGING ENGINE
 * Stefan kan nu autonomt skicka meddelanden baserat på användarens beteende
 * ÅTERSTÄLLD: Använder fullständigt konversationssystem med chat-funktionalitet
 */

const STEFAN_USER_ID = '00000000-0000-0000-0000-000000000001'; // Stefan AI system user

interface ProactiveMessage {
  id: string;
  trigger_type: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sent_at?: string;
  user_responded?: boolean;
}

export interface ProactiveMessageLog {
  id: string;
  trigger_type: string;
  content: string;
  sent_at: string;
  user_responded: boolean;
}

export const useProactiveMessaging = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentSessionState, insights } = useContextEngine();
  const [pendingMessages, setPendingMessages] = useState<ProactiveMessage[]>([]);
  const [stefanConversationId, setStefanConversationId] = useState<string | null>(null);

  // Hämta eller skapa Stefan konversation
  const getOrCreateStefanConversation = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    try {
      // Försök hitta befintlig konversation med Stefan
      const { data: existingConversations, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [user.id, STEFAN_USER_ID])
        .eq('conversation_type', 'coaching')
        .eq('is_active', true)
        .limit(1);

      if (searchError) throw searchError;

      if (existingConversations && existingConversations.length > 0) {
        const conversationId = existingConversations[0].id;
        setStefanConversationId(conversationId);
        return conversationId;
      }

      // Skapa ny konversation med Stefan
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          title: 'Coaching med Stefan AI',
          description: 'Din personliga AI-coach för utveckling och motivation',
          conversation_type: 'coaching',
          participant_ids: [user.id, STEFAN_USER_ID],
          created_by: STEFAN_USER_ID,
          metadata: {
            stefan_conversation: true,
            auto_created: true,
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (createError) throw createError;

      const conversationId = newConversation.id;
      setStefanConversationId(conversationId);
      
      console.log('🤖 Created new Stefan conversation:', conversationId);
      return conversationId;

    } catch (error) {
      console.error('Error managing Stefan conversation:', error);
      return null;
    }
  }, [user]);

  // Skicka proaktivt meddelande från Stefan
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
      // Säkerställ att Stefan konversation finns
      const conversationId = await getOrCreateStefanConversation();
      if (!conversationId) {
        throw new Error('Could not establish Stefan conversation');
      }

      // Förbättra meddelandet med Stefans personlighet
      const enhancedMessage = await enhanceMessageWithPersonality(message, triggerType);

      // Skicka meddelandet i konversationen
      const { error: messageError } = await supabase
        .from('messages_v2')
        .insert({
          conversation_id: conversationId,
          sender_id: STEFAN_USER_ID,
          content: enhancedMessage,
          message_type: 'text',
          metadata: {
            proactive_trigger: triggerType,
            priority,
            stefan_ai: true,
            auto_generated: true
          }
        });

      if (messageError) throw messageError;

      // Lagra även som proactive intervention för analytics
      const { error: interventionError } = await supabase
        .from('proactive_interventions')
        .insert({
          user_id: user.id,
          trigger_condition: triggerType,
          intervention_type: 'chat_message',
          content: enhancedMessage,
          delivery_method: 'conversation',
          context_snapshot: {
            trigger_type: triggerType,
            priority,
            conversation_id: conversationId,
            timestamp: new Date().toISOString()
          }
        });

      if (interventionError) {
        console.warn('Could not log intervention:', interventionError);
      }

      console.log('✅ Stefan proactive message sent successfully');
      
      // Visa toast för att uppmärksamma användaren om nytt meddelande
      toast({
        title: "💬 Stefan AI har skickat ett meddelande",
        description: "Du har en ny konversation med Stefan! Gå till Messages för att fortsätta chatten.",
        duration: 8000
      });

    } catch (error) {
      console.error('Failed to send Stefan proactive message:', error);
      
      // Fallback till toast notification om konversation misslyckas
      toast({
        title: "💬 Stefan säger:",
        description: message,
        duration: 5000,
      });
    }
  }, [user, getOrCreateStefanConversation, toast]);

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

  // Hämta senaste proaktiva meddelanden för display
  const getRecentProactiveMessages = useCallback(async (): Promise<ProactiveMessageLog[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('proactive_interventions')
        .select('*')
        .eq('user_id', user.id)
        .eq('intervention_type', 'chat_message')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data.map(intervention => ({
        id: intervention.id,
        trigger_type: intervention.trigger_condition,
        content: intervention.content,
        sent_at: intervention.created_at,
        user_responded: false // Response tracking disabled for now
      }));

    } catch (error) {
      console.error('Error fetching proactive messages:', error);
      return [];
    }
  }, [user]);

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
    analyzeAndSendProactiveMessages,
    getRecentProactiveMessages,
    getOrCreateStefanConversation,
    stefanConversationId
  };
};