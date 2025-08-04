import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { useMessages, type Message } from '@/hooks/useMessages';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUserRelationships } from '@/hooks/useUserRelationships';
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
  const { isCoachClient, getCurrentUserClients, getCurrentUserCoach } = useUserRelationships();

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
      console.log('🔍 Building conversations for user:', user.email);
      console.log('🔍 User roles:', { 
        hasCoach: hasRole('coach'), 
        hasClient: hasRole('client'), 
        hasAdmin: hasRole('admin'),
        hasSuperAdmin: hasRole('superadmin')
      });
      
      // Get user's roles from database for more reliable checks
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }

      const roles = userRoles?.map(r => r.role) || [];
      const isClient = roles.includes('client');
      const isCoach = roles.includes('coach');
      const isAdmin = roles.includes('admin');
      const isSuperAdmin = roles.includes('superadmin');

      console.log('🔍 Database roles:', roles);

      // Group messages by conversation partner with role-based filtering
      const conversationMap = new Map<string, Message[]>();
      let allowedPartnerIds = new Set<string>();

      // Determine allowed conversation partners based on role
      if (isSuperAdmin || isAdmin) {
        // Admins and superadmins can message anyone
        console.log('🔍 Admin/SuperAdmin: No restrictions on conversations');
        
      } else if (isCoach) {
        // Coaches can message their assigned clients and other coaches/admins
        const { data: clientAssignments, error: clientError } = await supabase
          .from('coach_client_assignments')
          .select('client_id')
          .eq('coach_id', user.id)
          .eq('is_active', true);

        if (clientError) {
          console.error('Error fetching client assignments:', clientError);
          throw clientError;
        }

        const clientIds = clientAssignments?.map(r => r.client_id) || [];
        
        // Get other coaches and admins
        const { data: coachAdminRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['coach', 'admin'])
          .neq('user_id', user.id);

        if (roleError) {
          console.error('Error fetching coach/admin roles:', roleError);
          throw roleError;
        }

        const coachAdminIds = coachAdminRoles?.map(r => r.user_id) || [];
        allowedPartnerIds = new Set([...clientIds, ...coachAdminIds]);
        
        console.log('🔍 Coach: Can message', clientIds.length, 'clients and', coachAdminIds.length, 'coaches/admins');
        
      } else if (isClient) {
        // Clients can only message their assigned coaches
        const { data: coachAssignments, error: coachError } = await supabase
          .from('coach_client_assignments')
          .select('coach_id')
          .eq('client_id', user.id)
          .eq('is_active', true);

        if (coachError) {
          console.error('Error fetching coach assignments:', coachError);
          throw coachError;
        }

        const coachIds = coachAssignments?.map(r => r.coach_id) || [];
        allowedPartnerIds = new Set(coachIds);
        
        console.log('🔍 Client: Can message', coachIds.length, 'assigned coaches');
        
        // Pre-populate coach conversations even if no messages yet
        coachIds.forEach(coachId => {
          conversationMap.set(coachId, []);
        });
        
      } else {
        // Default users can message coaches and admins
        const { data: coachAdminRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['coach', 'admin']);

        if (roleError) {
          console.error('Error fetching coach/admin roles:', roleError);
          throw roleError;
        }

        const coachAdminIds = coachAdminRoles?.map(r => r.user_id) || [];
        allowedPartnerIds = new Set(coachAdminIds);
        
        console.log('🔍 Default user: Can message', coachAdminIds.length, 'coaches/admins');
      }

      // Filter and group messages by conversation partner
      const filteredMessages = messages.filter(message => {
        const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        
        // Admin/SuperAdmin can see all conversations
        if (isSuperAdmin || isAdmin) {
          return true;
        }
        
        // For other roles, check if partner is allowed
        return allowedPartnerIds.has(partnerId);
      });
      
      console.log('🔍 Filtered messages:', filteredMessages.length, 'out of', messages.length);
      
      filteredMessages.forEach(message => {
        const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, []);
        }
        conversationMap.get(partnerId)!.push(message);
      });

      // Get participant profiles
      const participantIds = Array.from(conversationMap.keys());
      console.log('🔍 Participant IDs to fetch:', participantIds.length);
      
      if (participantIds.length === 0) {
        console.log('🔍 No conversation participants found');
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', participantIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        throw profileError;
      }

      console.log('🔍 Fetched profiles:', profiles?.length || 0);

      // Build conversation objects
      const convs: Conversation[] = [];
      
      conversationMap.forEach((msgs, participantId) => {
        const profile = profiles?.find(p => p.id === participantId);
        if (!profile) {
          console.warn('🚨 Profile not found for participant:', participantId);
          return;
        }

        const displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
          profile.email || 'Okänd användare';

        let participantName = displayName;
        
        // Add role indicators for better UX
        if (isClient) {
          participantName = `${displayName} (Coach)`;
        }

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
          // No messages yet - create placeholder conversation (especially for coach-client relationships)
          convs.push({
            participantId,
            participantName,
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

      // Sort conversations by last message time (with unread prioritized)
      convs.sort((a, b) => {
        // Prioritize unread conversations
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
        
        // Then sort by time
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      });

      console.log('🔍 Built', convs.length, 'conversations');
      setConversations(convs);

    } catch (error) {
      console.error('🚨 Error building conversations:', error);
      setConversations([]);
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