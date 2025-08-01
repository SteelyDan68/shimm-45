import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { useMessages, type Message } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useCoachClientRelationships } from '@/hooks/useCoachClientRelationships';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface Conversation {
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: Message;
  unreadCount: number;
  isOnline: boolean;
}

interface ConversationListProps {
  onSelectConversation: (participantId: string, participantName: string, participantAvatar?: string) => void;
  onNewMessage: () => void;
  selectedConversationId?: string;
}

export const ConversationList = ({ 
  onSelectConversation, 
  onNewMessage, 
  selectedConversationId 
}: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { messages } = useMessages();
  const { user, hasRole } = useAuth();
  const { isCoachClient, getCurrentUserClients, getCurrentUserCoach } = useCoachClientRelationships();

  useEffect(() => {
    if (user && messages.length > 0) {
      buildConversations();
    }
  }, [messages, user]);

  const buildConversations = async () => {
    if (!user) return;

    try {
      // Group messages by conversation partner, but only allow authorized conversations
      const conversationMap = new Map<string, Message[]>();
      
      // Filter messages based on coach-client relationships
      const filteredMessages = messages.filter(message => {
        const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        
        // Admins can message anyone
        if (hasRole('admin') || hasRole('superadmin')) {
          return true;
        }
        
        // Coaches can only message their assigned clients
        if (hasRole('coach')) {
          return isCoachClient(user.id, partnerId);
        }
        
        // Clients can only message their assigned coach
        if (hasRole('client')) {
          const userCoach = getCurrentUserCoach();
          return userCoach?.coach_id === partnerId;
        }
        
        return false; // Default: no access
      });
      
      filteredMessages.forEach(message => {
        const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, []);
        }
        conversationMap.get(partnerId)!.push(message);
      });

      // Get participant profiles
      const participantIds = Array.from(conversationMap.keys());
      if (participantIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', participantIds);

      if (error) throw error;

      // Build conversation objects
      const convs: Conversation[] = [];
      
      conversationMap.forEach((msgs, participantId) => {
        const profile = profiles?.find(p => p.id === participantId);
        if (!profile) return;

        // Sort messages by date (newest first)
        const sortedMsgs = msgs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        const lastMessage = sortedMsgs[0];
        const unreadCount = msgs.filter(m => 
          m.receiver_id === user.id && !m.is_read
        ).length;

        const participantName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
          profile.email || 'Okänd användare';

        convs.push({
          participantId,
          participantName,
          participantAvatar: profile.avatar_url,
          lastMessage,
          unreadCount,
          isOnline: Math.random() > 0.5 // Mock online status
        });
      });

      // Sort conversations by last message time
      convs.sort((a, b) => 
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      );

      setConversations(convs);
    } catch (error) {
      console.error('Error building conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const truncateMessage = (content: string, maxLength: number = 50) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Meddelanden</h2>
          <Button size="sm" onClick={onNewMessage}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök konversationer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery ? 'Inga konversationer hittades' : 'Inga konversationer ännu'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.participantId}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedConversationId === conversation.participantId 
                    ? 'bg-muted' 
                    : ''
                }`}
                onClick={() => onSelectConversation(
                  conversation.participantId, 
                  conversation.participantName,
                  conversation.participantAvatar
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.participantAvatar} />
                    <AvatarFallback>
                      {getUserInitials(conversation.participantName)}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{conversation.participantName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { 
                          addSuffix: false, 
                          locale: sv 
                        })}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="px-2 py-0 text-xs">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-sm truncate ${
                      conversation.unreadCount > 0 ? 'font-medium' : 'text-muted-foreground'
                    }`}>
                      {conversation.lastMessage.sender_id === user?.id && (
                        <span className="text-muted-foreground">Du: </span>
                      )}
                      {truncateMessage(conversation.lastMessage.content)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};