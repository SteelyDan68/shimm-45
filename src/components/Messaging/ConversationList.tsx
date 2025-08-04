import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { useMessages, type Message } from '@/hooks/useMessages';
import { useAuth } from '@/providers/UnifiedAuthProvider';
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
    if (user) {
      buildConversations();
    } else {
      setLoading(false); // Don't show loading if no user
    }
  }, [messages, user]);

  const buildConversations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Building conversations for user:', user.id);
      console.log('🔍 User roles:', { hasCoach: hasRole('coach'), hasClient: hasRole('client'), hasAdmin: hasRole('admin') });
      
      // Group messages by conversation partner, but only allow authorized conversations
      const conversationMap = new Map<string, Message[]>();
      
      // For clients - automatically add their coach even if no messages yet
      if (hasRole('client')) {
        try {
          // Fetch coach assignments directly from database
          const { data: coachAssignments, error } = await supabase
            .from('coach_client_assignments')
            .select('coach_id')
            .eq('client_id', user.id)
            .eq('is_active', true);
            
          if (error) {
            console.error('Error fetching coach assignments:', error);
          } else if (coachAssignments && coachAssignments.length > 0) {
            const coachId = coachAssignments[0].coach_id;
            // Initialize conversation with coach even if no messages
            if (!conversationMap.has(coachId)) {
              conversationMap.set(coachId, []);
            }
          }
        } catch (error) {
          console.error('Failed to fetch coach assignments:', error);
        }
      }
      
      // First, get coach assignments for client validation
      let clientCoachAssignments: any[] = [];
      if (hasRole('client')) {
        const { data: assignments } = await supabase
          .from('coach_client_assignments')
          .select('coach_id')
          .eq('client_id', user.id)
          .eq('is_active', true);
        clientCoachAssignments = assignments || [];
      }
      
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
          return clientCoachAssignments.some(assignment => assignment.coach_id === partnerId);
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
      console.log('Participant IDs to fetch:', participantIds);
      
      if (participantIds.length === 0) {
        console.log('🔍 No conversation participants found');
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', participantIds);

      if (error) throw error;
      console.log('Fetched profiles:', profiles);

      // Build conversation objects
      const convs: Conversation[] = [];
      
      conversationMap.forEach((msgs, participantId) => {
        const profile = profiles?.find(p => p.id === participantId);
        if (!profile) {
          console.log('Profile not found for participant:', participantId);
          return;
        }

        const participantName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
          profile.email || 'Okänd användare';

        // If there are messages, use the latest one
        if (msgs.length > 0) {
          // Sort messages by date (newest first)
          const sortedMsgs = msgs.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          const lastMessage = sortedMsgs[0];
          const unreadCount = msgs.filter(m => 
            m.receiver_id === user.id && !m.is_read
          ).length;

          convs.push({
            participantId,
            participantName,
            participantAvatar: profile.avatar_url,
            lastMessage,
            unreadCount,
            isOnline: Math.random() > 0.5 // Mock online status
          });
        } else {
          // No messages yet - create placeholder conversation (for coach-client without messages)
          convs.push({
            participantId,
            participantName: hasRole('client') ? `${participantName} (Coach)` : participantName,
            participantAvatar: profile.avatar_url,
            lastMessage: {
              id: 'placeholder',
              sender_id: participantId,
              receiver_id: user.id,
              content: 'Ingen konversation ännu - skriv ditt första meddelande!',
              created_at: new Date().toISOString(),
              is_read: true,
              updated_at: new Date().toISOString(),
              is_ai_assisted: false
            },
            unreadCount: 0,
            isOnline: Math.random() > 0.5 // Mock online status
          });
        }
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
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Laddar konversationer...</p>
          {hasRole('client') && (
            <p className="text-xs text-muted-foreground mt-2">
              Hämtar din coach-relation...
            </p>
          )}
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
              {searchQuery ? 
                'Inga konversationer hittades' : 
                hasRole('client') ? 
                  'Din coach kommer att visas här. Kontakta support om du inte ser din coach.' : 
                  'Inga konversationer ännu'
              }
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