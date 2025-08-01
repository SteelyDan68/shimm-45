import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings } from 'lucide-react';
import { ConversationList } from '@/components/Messaging/ConversationList';
import { ConversationView } from '@/components/Messaging/ConversationView';
import { ComposeMessage } from '@/components/Messaging/ComposeMessage';
import { MessagePreferences } from '@/components/Messaging/MessagePreferences';
import { useMessages } from '@/hooks/useMessages';

export function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const { refetch } = useMessages();

  const handleSelectConversation = (id: string, name: string, avatar?: string) => {
    setSelectedConversation({ id, name, avatar });
    setShowCompose(false);
  };

  const handleNewMessage = () => {
    setShowCompose(true);
    setSelectedConversation(null);
  };

  const handleCloseConversation = () => {
    setSelectedConversation(null);
  };

  const handleComposeClose = () => {
    setShowCompose(false);
  };

  const handleComposeSent = () => {
    setShowCompose(false);
    refetch();
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Meddelanden</h1>
        <p className="text-muted-foreground">
          Chatta med dina coaches och klienter
        </p>
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="messages">Meddelanden</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Inställningar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <Card className="h-[600px]">
            <div className="flex h-full">
              {/* Conversation List */}
              <div className="w-80 border-r flex-shrink-0">
                <ConversationList 
                  onSelectConversation={handleSelectConversation}
                  onNewMessage={handleNewMessage}
                  selectedConversationId={selectedConversation?.id}
                />
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                {showCompose ? (
                  <div className="h-full overflow-auto">
                    <ComposeMessage 
                      onClose={handleComposeClose}
                      onSent={handleComposeSent}
                      refreshMessages={refetch}
                    />
                  </div>
                ) : selectedConversation ? (
                  <ConversationView
                    recipientId={selectedConversation.id}
                    recipientName={selectedConversation.name}
                    recipientAvatar={selectedConversation.avatar}
                    onClose={handleCloseConversation}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Välj en konversation</h3>
                      <p className="text-muted-foreground mb-4">
                        Välj en konversation från listan eller starta en ny för att börja chatta.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <MessagePreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}