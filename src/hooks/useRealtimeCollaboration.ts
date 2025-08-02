import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UserPresence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: string;
  currentPage?: string;
  metadata?: Record<string, any>;
}

export interface CollaborationEvent {
  id: string;
  type: 'document_edit' | 'assessment_update' | 'message' | 'cursor_move';
  userId: string;
  userName: string;
  data: any;
  timestamp: string;
}

export interface LiveDocument {
  id: string;
  type: 'assessment' | 'notes' | 'plan';
  content: any;
  collaborators: UserPresence[];
  lastModified: string;
  lastModifiedBy: string;
}

export const useRealtimeCollaboration = (roomId?: string) => {
  const { user } = useAuth();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [presence, setPresence] = useState<Record<string, UserPresence>>({});
  const [events, setEvents] = useState<CollaborationEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState<UserPresence[]>([]);

  // Join a collaboration room
  const joinRoom = useCallback(async (newRoomId: string, metadata?: Record<string, any>) => {
    if (!user) return;

    // Leave current room if any
    if (channel) {
      await channel.unsubscribe();
    }

    const newChannel = supabase.channel(`collaboration_${newRoomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track user presence
    const userPresence: UserPresence = {
      userId: user.id,
      userName: user.email || 'Unknown User',
      status: 'online',
      lastSeen: new Date().toISOString(),
      currentPage: window.location.pathname,
      metadata
    };

    // Set up presence tracking
    newChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = newChannel.presenceState();
        const presenceMap: Record<string, UserPresence> = {};
        
        Object.entries(newState).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            if (presence.userId) {
              presenceMap[key] = presence;
            }
          }
        });
        
        setPresence(presenceMap);
        setActiveCollaborators(Object.values(presenceMap));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .on('broadcast', { event: 'collaboration_event' }, (payload) => {
        const event = payload.payload as CollaborationEvent;
        setEvents(prev => [...prev.slice(-49), event]); // Keep last 50 events
      });

    // Subscribe and track presence
    newChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        await newChannel.track(userPresence);
      } else {
        setIsConnected(false);
      }
    });

    setChannel(newChannel);
  }, [user, channel]);

  // Leave current room
  const leaveRoom = useCallback(async () => {
    if (channel) {
      await channel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
      setPresence({});
      setActiveCollaborators([]);
    }
  }, [channel]);

  // Send collaboration event
  const sendEvent = useCallback(async (eventData: Omit<CollaborationEvent, 'id' | 'userId' | 'userName' | 'timestamp'>) => {
    if (!channel || !user) return;

    const event: CollaborationEvent = {
      id: `${Date.now()}_${Math.random()}`,
      userId: user.id,
      userName: user.email || 'Unknown User',
      timestamp: new Date().toISOString(),
      ...eventData
    };

    await channel.send({
      type: 'broadcast',
      event: 'collaboration_event',
      payload: event
    });
  }, [channel, user]);

  // Update user status
  const updateStatus = useCallback(async (status: UserPresence['status'], metadata?: Record<string, any>) => {
    if (!channel || !user) return;

    const updatedPresence: UserPresence = {
      userId: user.id,
      userName: user.email || 'Unknown User',
      status,
      lastSeen: new Date().toISOString(),
      currentPage: window.location.pathname,
      metadata
    };

    await channel.track(updatedPresence);
  }, [channel, user]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (isTyping: boolean, context?: string) => {
    await sendEvent({
      type: 'message',
      data: {
        typing: isTyping,
        context
      }
    });
  }, [sendEvent]);

  // Send document edit
  const sendDocumentEdit = useCallback(async (documentId: string, changes: any, cursor?: { line: number; column: number }) => {
    await sendEvent({
      type: 'document_edit',
      data: {
        documentId,
        changes,
        cursor
      }
    });
  }, [sendEvent]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [channel]);

  // Auto join room if roomId provided
  useEffect(() => {
    if (roomId && user) {
      joinRoom(roomId);
    }
  }, [roomId, user, joinRoom]);

  return {
    // State
    isConnected,
    presence,
    activeCollaborators,
    events,
    
    // Actions
    joinRoom,
    leaveRoom,
    sendEvent,
    updateStatus,
    sendTypingIndicator,
    sendDocumentEdit,
    
    // Computed
    collaboratorCount: activeCollaborators.length,
    isAlone: activeCollaborators.length <= 1
  };
};