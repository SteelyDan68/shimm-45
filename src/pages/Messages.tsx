import { useState, useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ConversationList } from '@/components/Messaging/ConversationList';
import { ConversationView } from '@/components/Messaging/ConversationView';
import { ComposeMessage } from '@/components/Messaging/ComposeMessage';
import { MessagePreferences } from '@/components/Messaging/MessagePreferences';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, MessageSquare } from 'lucide-react';
import { Message } from '@/hooks/useMessages';

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: Message;
  unreadCount: number;
  isOnline?: boolean;
  lastSeen?: string;
}

export function Messages() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { messages, sendMessage, markAsRead, refetch } = useMessages();
  const { user } = useAuth();

  useEffect(() => {
    if (messages.length > 0) {
      buildConversations();
    }
  }, [messages, user]);

  const buildConversations = async () => {
    if (!user) return;

    const conversationMap = new Map<string, Conversation>();

    // Group messages by conversation partner
    for (const message of messages) {
      const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
      
      if (!conversationMap.has(partnerId)) {
        // Get partner profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, avatar_url')
          .eq('id', partnerId)
          .single();

        const name = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
          : 'Okänd användare';

        conversationMap.set(partnerId, {
          id: partnerId,
          name,
          avatar: profile?.avatar_url,
          lastMessage: message,
          unreadCount: 0,
          isOnline: false // Could be enhanced with real-time presence
        });
      } else {
        // Update with latest message if this one is newer
        const existing = conversationMap.get(partnerId)!;
        if (new Date(message.created_at) > new Date(existing.lastMessage?.created_at || '')) {
          existing.lastMessage = message;
        }
      }

      // Count unread messages for this conversation
      if (message.receiver_id === user.id && !message.is_read) {
        const conversation = conversationMap.get(partnerId)!;
        conversation.unreadCount++;
      }
    }

    // Sort by last message timestamp
    const sortedConversations = Array.from(conversationMap.values()).sort((a, b) => {
      const aTime = a.lastMessage?.created_at || '';
      const bTime = b.lastMessage?.created_at || '';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setConversations(sortedConversations);
    setLoading(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    
    // Get messages for this conversation
    const conversationMsgs = messages.filter(msg => 
      (msg.sender_id === user?.id && msg.receiver_id === conversationId) ||
      (msg.sender_id === conversationId && msg.receiver_id === user?.id)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    setConversationMessages(conversationMsgs);

    // Mark unread messages as read
    conversationMsgs
      .filter(msg => msg.receiver_id === user?.id && !msg.is_read)
      .forEach(msg => markAsRead(msg.id));
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;
    
    const success = await sendMessage(selectedConversationId, content);
    if (success) {
      refetch();
    }
  };

  const handleNewMessage = () => {
    setShowCompose(true);
    setSelectedConversationId(null);
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  if (showCompose) {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <ComposeMessage 
          onClose={() => setShowCompose(false)}
          onSent={() => {
            setShowCompose(false);
            refetch();
          }}
          refreshMessages={refetch}
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Tabs defaultValue="messages" className="h-full flex flex-col">
        <div className="px-6 pt-4 border-b">
          <TabsList>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Meddelanden
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Inställningar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="messages" className="flex-1 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
            {/* Conversation List */}
            <div className={`border-r ${selectedConversationId ? 'hidden lg:block' : 'block'}`}>
              <ConversationList
                conversations={conversations}
                selectedConversationId={selectedConversationId || undefined}
                onSelectConversation={handleSelectConversation}
                onNewMessage={handleNewMessage}
                loading={loading}
              />
            </div>

            {/* Conversation View */}
            <div className={`lg:col-span-2 ${selectedConversationId ? 'block' : 'hidden lg:flex lg:items-center lg:justify-center'}`}>
              {selectedConversation ? (
                <ConversationView
                  conversation={selectedConversation}
                  messages={conversationMessages}
                  onSendMessage={handleSendMessage}
                  onBack={() => setSelectedConversationId(null)}
                />
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Välj en konversation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Välj en konversation från listan för att börja chatta
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 mt-0 p-6">
          <MessagePreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}