/**
 * HYBRID ARCHITECTURE: DEDICATED MESSAGING HOOK
 * 
 * Uses dedicated messages_v2 table for optimal performance
 * Previously used attribute system (migrated to dedicated table)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id?: string;
  content: string;
  message_type: string;
  metadata: any;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  title?: string;
  description?: string;
  conversation_type: string;
  is_active: boolean;
  last_message_at?: string;
  metadata: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useMessaging = (userId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch conversations for user
  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [userId])
        .eq('is_active', true)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setConversations((data || []) as Conversation[]);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta konversationer",
        variant: "destructive"
      });
    }
  }, [userId, toast]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages_v2')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta meddelanden",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Send a message
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    receiverId?: string,
    messageType: string = 'text',
    metadata: any = {}
  ): Promise<Message | null> => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('messages_v2')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          receiver_id: receiverId,
          content,
          message_type: messageType,
          metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Refresh messages
      await fetchMessages(conversationId);

      return data as Message;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelande",
        variant: "destructive"
      });
      return null;
    }
  }, [userId, fetchMessages, toast]);

  // Create a new conversation
  const createConversation = useCallback(async (
    participantIds: string[],
    title?: string,
    conversationType: string = 'direct'
  ): Promise<Conversation | null> => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_ids: participantIds,
          title,
          conversation_type: conversationType,
          created_by: userId,
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;

      await fetchConversations();
      return data as Conversation;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa konversation",
        variant: "destructive"
      });
      return null;
    }
  }, [userId, fetchConversations, toast]);

  // Mark message as read - simplified for now
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      // Note: read_at functionality can be implemented when table supports it
      console.log('Mark as read:', messageId);
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  }, [userId]);

  // Get unread message count - simplified for now
  const getUnreadCount = useCallback(async (): Promise<number> => {
    if (!userId) return 0;
    return 0; // Simplified implementation
  }, [userId]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages_v2',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      setLoading(true);
      await fetchConversations();
      setLoading(false);
    };

    loadData();
  }, [userId, fetchConversations]);

  return {
    messages,
    conversations,
    loading,
    sendMessage,
    fetchMessages,
    createConversation,
    markAsRead,
    getUnreadCount,
    refreshConversations: fetchConversations
  };
};