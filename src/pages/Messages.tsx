import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquare, Users, Brain, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ConversationList } from '@/components/Messaging/EnhancedConversationList';
import { ConversationView } from '@/components/Messaging/ConversationView';
import { ComposeMessage } from '@/components/Messaging/ComposeMessage';
import { MessagePreferences } from '@/components/Messaging/MessagePreferences';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/providers/UnifiedAuthProvider';

export function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const { refetch, unreadCount } = useMessages();

  // Handle URL actions (like ?action=compose)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'compose') {
      setShowCompose(true);
      setSelectedConversation(null);
    }
  }, [searchParams]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              Meddelanden
              {unreadCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {unreadCount} nya
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              {hasRole('coach') ? 'Kommunicera med dina klienter och kollegor' : 
               hasRole('client') ? 'Chatta med din coach och få stöd' :
               'Chatta med coaches och klienter'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {(hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
              <Button
                onClick={handleNewMessage}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nytt meddelande
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Meddelanden
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Inställningar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <Card className="h-[600px] shadow-lg border-2">
            <div className="flex h-full">
              {/* Enhanced Conversation List */}
              <div className="w-80 border-r flex-shrink-0 bg-gradient-to-b from-gray-50 to-white">
                <div className="p-4 border-b bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Konversationer</h3>
                    {(hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
                      <Button
                        size="sm"
                        onClick={handleNewMessage}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
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
                  <div className="flex-1 flex items-center justify-center text-center bg-gradient-to-br from-blue-50 to-purple-50">
                    <div className="max-w-md mx-auto p-8">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-12 h-12 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-800">Välj en konversation</h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {hasRole('coach') ? 'Starta en konversation med dina klienter för att ge personligt stöd och vägledning.' :
                         hasRole('client') ? 'Kontakta din coach för att få hjälp och diskutera din utveckling.' :
                         'Välj en konversation från listan eller starta en ny för att börja chatta.'}
                      </p>
                      
                      {(hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
                        <div className="space-y-3">
                          <Button
                            onClick={handleNewMessage}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Starta ny konversation
                          </Button>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Brain className="h-4 w-4" />
                            <span>AI-assistans tillgänglig för alla meddelanden</span>
                          </div>
                        </div>
                      )}
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