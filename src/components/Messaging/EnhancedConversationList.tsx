import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Plus, 
  MessageCircle, 
  Users, 
  Clock,
  Brain,
  Star,
  Filter
} from 'lucide-react';
import { useMessages, type Message } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useCoachClientRelationships } from '@/hooks/useCoachClientRelationships';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface ConversationListProps {
  onSelectConversation: (id: string, name: string, avatar?: string) => void;
  onNewMessage: () => void;
  selectedConversationId?: string;
}

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  client_category?: string;
}

export function ConversationList({ 
  onSelectConversation, 
  onNewMessage, 
  selectedConversationId 
}: ConversationListProps) {
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'clients' | 'coaches' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  
  const { messages } = useMessages();
  const { user, hasRole } = useAuth();
  const { isCoachClient, getCurrentUserClients, getCurrentUserCoach } = useCoachClientRelationships();

  // Get unique conversation partners
  const conversationPartners = React.useMemo(() => {
    const partners = new Map<string, {
      id: string;
      name: string;
      avatar?: string;
      lastMessage?: Message;
      unreadCount: number;
      isClient?: boolean;
      isCoach?: boolean;
      category?: string;
    }>();

    messages.forEach(message => {
      const partnerId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
      const profile = userProfiles[partnerId];
      
      if (!profile) return;

      const displayName = profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : profile.email;

      const existing = partners.get(partnerId);
      const isMessageUnread = !message.is_read && message.receiver_id === user?.id;
      
      if (!existing || new Date(message.created_at) > new Date(existing.lastMessage?.created_at || 0)) {
        partners.set(partnerId, {
          id: partnerId,
          name: displayName,
          lastMessage: message,
          unreadCount: (existing?.unreadCount || 0) + (isMessageUnread ? 1 : 0),
          isClient: profile.client_category !== undefined,
          isCoach: !profile.client_category,
          category: profile.client_category
        });
      } else if (isMessageUnread) {
        existing.unreadCount += 1;
      }
    });

    return Array.from(partners.values()).sort((a, b) => {
      const aTime = new Date(a.lastMessage?.created_at || 0).getTime();
      const bTime = new Date(b.lastMessage?.created_at || 0).getTime();
      return bTime - aTime;
    });
  }, [messages, userProfiles, user?.id]);

  // Filter conversations
  const filteredConversations = conversationPartners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'clients' && partner.isClient) ||
      (filterType === 'coaches' && partner.isCoach) ||
      (filterType === 'unread' && partner.unreadCount > 0);
    
    return matchesSearch && matchesFilter;
  });

  // Load user profiles
  useEffect(() => {
    const loadUserProfiles = async () => {
      setLoading(true);
      try {
        const userIds = Array.from(new Set(
          messages.flatMap(m => [m.sender_id, m.receiver_id])
        )).filter(id => id !== user?.id);

        if (userIds.length === 0) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, client_category')
          .in('id', userIds);

        if (error) throw error;

        const profilesMap = (data || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, UserProfile>);

        setUserProfiles(profilesMap);
      } catch (error) {
        console.error('Error loading user profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (messages.length > 0) {
      loadUserProfiles();
    }
  }, [messages, user?.id]);

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filters */}
      <div className="p-4 space-y-3 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök konversationer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {(hasRole('admin') || hasRole('superadmin') || hasRole('coach')) && (
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'all', label: 'Alla', icon: MessageCircle },
              { key: 'clients', label: 'Klienter', icon: Users },
              { key: 'coaches', label: 'Coaches', icon: Star },
              { key: 'unread', label: 'Olästa', icon: Filter }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={filterType === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(key as any)}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <Icon className="h-3 w-3" />
                {label}
                {key === 'unread' && conversationPartners.some(p => p.unreadCount > 0) && (
                  <Badge variant="destructive" className="h-4 w-4 rounded-full p-0 text-xs">
                    {conversationPartners.filter(p => p.unreadCount > 0).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Laddar konversationer...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Inga konversationer hittades' : 'Inga konversationer än'}
            </p>
            {!searchQuery && (hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNewMessage}
                className="mt-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Starta konversation
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map(partner => (
              <div
                key={partner.id}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50
                  ${selectedConversationId === partner.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                  ${partner.unreadCount > 0 ? 'bg-blue-25 font-medium' : ''}
                `}
                onClick={() => onSelectConversation(partner.id, partner.name, partner.avatar)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`
                        ${partner.isClient ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                      `}>
                        {partner.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {partner.unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                      >
                        {partner.unreadCount > 9 ? '9+' : partner.unreadCount}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {partner.name}
                        </span>
                        {partner.isClient && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            Klient
                          </Badge>
                        )}
                        {partner.isCoach && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                            Coach
                          </Badge>
                        )}
                      </div>
                      
                      {partner.lastMessage && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(partner.lastMessage.created_at), { 
                            addSuffix: true, 
                            locale: sv 
                          })}
                        </div>
                      )}
                    </div>
                    
                    {partner.lastMessage && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`
                          text-sm truncate
                          ${partner.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-muted-foreground'}
                        `}>
                          {partner.lastMessage.is_ai_assisted && (
                            <Brain className="inline h-3 w-3 mr-1 text-purple-500" />
                          )}
                          {partner.lastMessage.sender_id === user?.id ? 'Du: ' : ''}
                          {partner.lastMessage.subject || partner.lastMessage.content}
                        </p>
                      </div>
                    )}
                    
                    {partner.category && (
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {partner.category}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}