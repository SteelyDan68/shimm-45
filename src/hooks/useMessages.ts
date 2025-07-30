import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject?: string;
  content: string;
  is_read: boolean;
  is_ai_assisted: boolean;
  parent_message_id?: string;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  receiver_profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface MessagePreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  internal_notifications: boolean;
  auto_ai_assistance: boolean;
  created_at: string;
  updated_at: string;
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<MessagePreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch messages
  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);

      // Count unread messages
      const unread = data?.filter(msg => msg.receiver_id === user.id && !msg.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta meddelanden",
        variant: "destructive"
      });
    }
  };

  // Fetch preferences
  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('message_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      setPreferences(data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  // Send message
  const sendMessage = async (receiverId: string, content: string, subject?: string, parentMessageId?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          subject,
          parent_message_id: parentMessageId
        });

      if (error) throw error;

      toast({
        title: "Meddelande skickat",
        description: "Ditt meddelande har skickats framgångsrikt"
      });

      await fetchMessages();
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelandet",
        variant: "destructive"
      });
      return false;
    }
  };

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      await fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Update preferences
  const updatePreferences = async (newPrefs: Partial<MessagePreferences>) => {
    if (!user) return false;

    try {
      if (preferences) {
        const { error } = await supabase
          .from('message_preferences')
          .update(newPrefs)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('message_preferences')
          .insert({
            user_id: user.id,
            ...newPrefs
          });

        if (error) throw error;
      }

      await fetchPreferences();
      toast({
        title: "Inställningar uppdaterade",
        description: "Dina meddelandeinställningar har sparats"
      });
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera inställningar",
        variant: "destructive"
      });
      return false;
    }
  };

  // Get AI suggestion
  const getAISuggestion = async (messageContent: string, senderName: string, context?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-message-assistant', {
        body: { messageContent, senderName, context }
      });

      if (error) throw error;
      return data.aiSuggestion;
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta AI-förslag",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchPreferences();
      setLoading(false);

      // Set up real-time subscription
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    messages,
    unreadCount,
    preferences,
    loading,
    sendMessage,
    markAsRead,
    updatePreferences,
    getAISuggestion,
    refetch: fetchMessages
  };
};