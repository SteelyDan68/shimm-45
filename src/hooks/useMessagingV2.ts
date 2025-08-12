import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from './use-toast';
import { logger } from '@/utils/logger';
import { useStableData } from '@/hooks/useStableData';

// 🚀 Modern Enterprise Message System 2025
// Based on world-class architecture with Single Source of Truth principle

export interface Conversation {
  id: string;
  created_by: string;
  participant_ids: string[];
  conversation_type: 'direct' | 'group' | 'support';
  title?: string;
  description?: string;
  metadata: Record<string, any>;
  is_active: boolean;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  last_message?: MessageV2;
  unread_count?: number;
  participants?: UserProfile[];
}

export interface MessageV2 {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'emoji' | 'file' | 'voice' | 'system';
  parent_message_id?: string;
  metadata: Record<string, any>;
  reactions: Record<string, string>; // {user_id: emoji}
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  sender_profile?: UserProfile;
  is_read?: boolean;
  parent_message?: MessageV2;
}

export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface UserPresence {
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  typing_in_conversation?: string;
  metadata: Record<string, any>;
  updated_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  desktop_notifications: boolean;
  sound_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  muted_conversations: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useMessagingV2 = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, MessageV2[]>>({});
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  const { user } = useAuth();
  const { toast } = useToast();

  // 🔥 Real-time channels
  const [conversationsChannel, setConversationsChannel] = useState<any>(null);
  const [messagesChannel, setMessagesChannel] = useState<any>(null);
  const [presenceChannel, setPresenceChannel] = useState<any>(null);

  // 📊 Statistics
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

  // 🔍 Optimized fetch with caching and stability
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      logger.setContext({ component: 'useMessagingV2' });
      
      // Simplified query utan nested selects som kan orsaka problem
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [user.id])
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch conversations', error);
        throw error;
      }

      // Enrich with participant profiles and unread counts
      const enrichedConversations = await Promise.all(
        (conversationsData || []).map(async (conv: any) => {
          // Get participant profiles (excluding current user for title)
          const { data: participants } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, avatar_url')
            .in('id', conv.participant_ids);

          // Generate conversation title
          let conversationTitle = conv.title;
          
          if (!conversationTitle || conversationTitle === 'Utan titel') {
            if (conv.metadata?.stefan_ai === 'true') {
              conversationTitle = '🤖 Stefan AI Chat';
            } else {
              // Find other participants (not current user) - REMOVE DUPLICATES
              const uniqueParticipants = (participants || [])
                .filter(p => p.id !== user.id)
                .filter((participant, index, array) => 
                  array.findIndex(p => p.id === participant.id) === index
                );
              
              if (uniqueParticipants.length > 0) {
                const participant = uniqueParticipants[0];
                conversationTitle = `${participant.first_name || ''} ${participant.last_name || ''}`.trim() || participant.email;
              } else {
                conversationTitle = 'Konversation';
              }
            }
          }

          // Count unread messages for current user - FIXED: Proper query structure
          // First get read message IDs
          const { data: readMessages } = await supabase
            .from('message_read_receipts')
            .select('message_id')
            .eq('user_id', user.id);

          const readMessageIds = readMessages?.map(r => r.message_id) || [];

          const { count: unreadCount } = await supabase
            .from('messages_v2')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .not('sender_id', 'eq', user.id)
            .not('id', 'in', `(${readMessageIds.map(id => `'${id}'`).join(',') || "'00000000-0000-0000-0000-000000000000'"})`);

          return {
            ...conv,
            title: conversationTitle,
            participants: (participants || []).filter((participant, index, array) => 
              array.findIndex(p => p.id === participant.id) === index
            ), // Remove duplicates from participants
            unread_count: unreadCount || 0,
            last_message: conv.last_message?.[0] || null
          };
        })
      );

      // Remove duplicate conversations by ID and participant combination
      const uniqueConversations = enrichedConversations.filter((conv, index, array) => {
        // First deduplication by ID
        const idIndex = array.findIndex(c => c.id === conv.id);
        if (idIndex !== index) return false;
        
        // Second deduplication by participant combination (for same participants)
        const participantKey = conv.participant_ids.sort().join(',');
        const participantIndex = array.findIndex(c => 
          c.participant_ids.sort().join(',') === participantKey &&
          c.conversation_type === conv.conversation_type
        );
        return participantIndex === index;
      });

      setConversations(uniqueConversations);
      logger.debug(`Loaded ${uniqueConversations.length} unique conversations`);
    } catch (error) {
      logger.error('Error fetching conversations:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta konversationer",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // 💬 Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      // Först hämta meddelanden utan nested selects
      const { data: messagesData, error } = await supabase
        .from('messages_v2')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check read status for each message
      const enrichedMessages = await Promise.all(
        (messagesData || []).map(async (msg: any) => {
          if (msg.sender_id === user.id) {
            return { ...msg, is_read: true };
          }

          const { data: readReceipt } = await supabase
            .from('message_read_receipts')
            .select('id')
            .eq('message_id', msg.id)
            .eq('user_id', user.id)
            .single();

          return { ...msg, is_read: !!readReceipt };
        })
      );

      setMessages(prev => ({
        ...prev,
        [conversationId]: enrichedMessages
      }));

    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    }
  }, [user]);

  // 📤 Send message
  const sendMessage = useCallback(async (
    conversationId: string, 
    content: string, 
    messageType: 'text' | 'emoji' | 'file' | 'voice' = 'text',
    parentMessageId?: string
  ) => {
    if (!user || !content.trim()) return false;

    try {
      

      
      
      // First verify user has access to this conversation
      const { data: conversationCheck } = await supabase
        .from('conversations')
        .select('id, participant_ids')
        .eq('id', conversationId)
        .contains('participant_ids', [user.id])
        .single();
        
      if (!conversationCheck) {
        throw new Error('Du har inte tillgång till denna konversation');
      }
      
      const { data: newMessage, error } = await supabase
        .from('messages_v2')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: messageType,
          parent_message_id: parentMessageId,
          metadata: {
            sent_from: 'web',
            user_agent: navigator.userAgent
          }
        })
        .select('*')
        .single();

      if (error) throw error;

      

      // Optimistically update local state (will be properly fetched on next refresh)
      await fetchMessages(conversationId);

      // Mark as read for sender
      await markMessageAsRead(newMessage.id);

      // Update presence (stop typing)
      await updateTypingStatus(conversationId, false);

      // Only show toast if it's not a Stefan AI conversation to avoid duplicates
      // (Stefan conversations handle their own feedback)
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelandet",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast]);

  // ✅ Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('message_read_receipts')
        .insert({
          message_id: messageId,
          user_id: user.id
        });
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  }, [user]);

  // ✅ Mark all messages in conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const conversationMessages = messages[conversationId] || [];
      const unreadMessages = conversationMessages.filter(
        msg => msg.sender_id !== user.id && !msg.is_read
      );

      if (unreadMessages.length === 0) return;

      const readReceipts = unreadMessages.map(msg => ({
        message_id: msg.id,
        user_id: user.id
      }));

      await supabase
        .from('message_read_receipts')
        .insert(readReceipts);

      // Update local state
      setMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId]?.map(msg => ({
          ...msg,
          is_read: msg.sender_id === user.id ? true : msg.is_read || unreadMessages.some(um => um.id === msg.id)
        })) || []
      }));

      await fetchConversations(); // Refresh unread counts
    } catch (error) {
      console.error('❌ Error marking conversation as read:', error);
    }
  }, [user, messages, fetchConversations]);

  // 👥 Create or get direct conversation
  const getOrCreateDirectConversation = useCallback(async (participantId: string) => {
    if (!user) return null;

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('conversation_type', 'direct')
        .contains('participant_ids', [user.id])
        .contains('participant_ids', [participantId])
        .eq('is_active', true)
        .single();

      if (existingConv) {
        return existingConv.id;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          created_by: user.id,
          participant_ids: [user.id, participantId],
          conversation_type: 'direct',
          metadata: {
            created_from: 'web'
          }
        })
        .select('id')
        .single();

      if (error) throw error;

      await fetchConversations(); // Refresh list
      return newConv.id;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      return null;
    }
  }, [user, fetchConversations]);

  // ⌨️ Update typing status
  const updateTypingStatus = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: 'online',
          typing_in_conversation: isTyping ? conversationId : null,
          last_seen: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Error updating typing status:', error);
    }
  }, [user]);

  // 😊 Add reaction to message
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      const message = Object.values(messages).flat().find(m => m.id === messageId);
      if (!message) return;

      const newReactions = {
        ...message.reactions,
        [user.id]: emoji
      };

      await supabase
        .from('messages_v2')
        .update({ reactions: newReactions })
        .eq('id', messageId);

    } catch (error) {
      console.error('❌ Error adding reaction:', error);
    }
  }, [user, messages]);

  // 🔔 Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPreferences({
          ...data,
          metadata: typeof data.metadata === 'object' && data.metadata !== null ? data.metadata as Record<string, any> : {}
        });
      } else {
        // Create default preferences if none exist
        const defaultPrefs = {
          user_id: user.id,
          email_notifications: true,
          push_notifications: true,
          desktop_notifications: true,
          sound_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          muted_conversations: [],
          metadata: {}
        };
        
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs)
          .select('*')
          .single();
          
        if (createError) {
          console.error('❌ Error creating default preferences:', createError);
        } else {
          setPreferences({
            ...newPrefs,
            metadata: typeof newPrefs.metadata === 'object' && newPrefs.metadata !== null ? newPrefs.metadata as Record<string, any> : {}
          });
        }
      }
    } catch (error) {
      console.error('❌ Error fetching preferences:', error);
    }
  }, [user]);

  // 🔔 Update notification preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    if (!user) return false;

    try {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...newPrefs
        });

      await fetchPreferences();
      toast({
        title: "Inställningar uppdaterade",
        description: "Dina notifieringsinställningar har sparats"
      });
      return true;
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera inställningar",
        variant: "destructive"
      });
      return false;
    }
  }, [user, fetchPreferences, toast]);

  // 🚀 Initialize and setup real-time subscriptions
  useEffect(() => {
    if (!user) return;

    
    
    // Load initial data
    fetchConversations();
    fetchPreferences();

    // Setup real-time subscriptions
    const setupRealtime = () => {
      setConnectionStatus('connecting');

      // Conversations channel
      const convChannel = supabase
        .channel('conversations-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_ids.cs.{${user.id}}`
        }, () => {
          
          fetchConversations();
        })
        .subscribe((status) => {
          
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          }
        });

      // Messages channel  
      const msgChannel = supabase
        .channel('messages-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public', 
          table: 'messages_v2'
        }, (payload) => {
          
          if (payload.new && 'conversation_id' in payload.new) {
            fetchMessages(payload.new.conversation_id as string);
            fetchConversations(); // Update last message
          }
        })
        .subscribe();

      // Presence channel
      const presenceChannel = supabase
        .channel('user-presence')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        }, () => {
          
          // Could fetch presence data here
        })
        .subscribe();

      setConversationsChannel(convChannel);
      setMessagesChannel(msgChannel);
      setPresenceChannel(presenceChannel);
    };

    setupRealtime();
    setLoading(false);

    // Cleanup
    return () => {
      
      if (conversationsChannel) supabase.removeChannel(conversationsChannel);
      if (messagesChannel) supabase.removeChannel(messagesChannel);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, [user]);

  // 🎯 Auto-load messages for active conversation
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
      markConversationAsRead(activeConversation);
    }
  }, [activeConversation, fetchMessages, markConversationAsRead]);

  return {
    // State
    conversations,
    activeConversation,
    messages: messages, // Return full messages object instead of filtering
    currentMessages: activeConversation ? messages[activeConversation] || [] : [], // Add current messages
    allMessages: messages,
    userPresence,
    typingUsers,
    preferences,
    loading,
    connectionStatus,
    totalUnreadCount,

    // Actions
    setActiveConversation,
    sendMessage,
    markMessageAsRead,
    markConversationAsRead,
    getOrCreateDirectConversation,
    updateTypingStatus,
    addReaction,
    updatePreferences,
    
    // Data fetchers
    fetchConversations,
    fetchMessages,
    refetch: fetchConversations
  };
};