import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquare, Users, Brain, Plus, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSearchParams } from 'react-router-dom';
import { ConversationList } from '@/components/Messaging/ConversationList';
import { ConversationView } from '@/components/Messaging/ConversationView';
import { ComposeMessage } from '@/components/Messaging/ComposeMessage';
import { MessagePreferences } from '@/components/Messaging/MessagePreferences';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/providers/UnifiedAuthProvider';

export function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasRole } = useAuth();
  const { unreadCount, refetch } = useMessages();
  
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'reconnecting'>('online');

  // Handle URL actions (like ?action=compose)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'compose') {
      setShowCompose(true);
      setSelectedConversation(null);
    }
  }, [searchParams]);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'online': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'reconnecting': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Wifi className="h-4 w-4" />;
    }
  };

  const getRoleBasedDescription = () => {
    if (hasRole('client')) {
      return 'Kommunicera säkert med din coach och få stöd i din utveckling.';
    }
    if (hasRole('coach')) {
      return 'Håll kontakten med dina klienter och stöd deras utvecklingsresa.';
    }
    if (hasRole('admin') || hasRole('superadmin')) {
      return 'Administrera meddelanden och kommunikation i systemet.';
    }
    return 'Skicka och ta emot meddelanden på ett säkert sätt.';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar meddelanden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Meddelanden</h1>
              <p className="text-muted-foreground">{getRoleBasedDescription()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getConnectionIcon()}
              <span className="capitalize">{connectionStatus}</span>
            </div>
            {unreadCount > 0 && (
              <Badge variant="default" className="px-2 py-1">
                {unreadCount > 99 ? '99+' : unreadCount} nya
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Connection Status Alerts */}
      {connectionStatus === 'offline' && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Du är offline. Meddelanden kommer att skickas när anslutningen återupprättas.
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'reconnecting' && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Återansluter... Dina meddelanden kan vara försenade.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Meddelanden
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 px-2 py-0 text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Inställningar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          <Card className="h-[700px]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Konversationer
                </CardTitle>
                {(hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
                  <Button size="sm" onClick={handleNewMessage} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nytt meddelande
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-5rem)]">
              <div className="flex h-full">
                {/* Conversation List */}
                <div className="w-1/3 border-r">
                  <ConversationList
                    onSelectConversation={handleSelectConversation}
                    onNewMessage={handleNewMessage}
                    selectedConversationId={selectedConversation?.id}
                  />
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                  {showCompose ? (
                    <ComposeMessage
                      onClose={handleComposeClose}
                      onSent={handleComposeSent}
                      refreshMessages={refetch}
                    />
                  ) : selectedConversation ? (
                    <ConversationView
                      recipientId={selectedConversation.id}
                      recipientName={selectedConversation.name}
                      recipientAvatar={selectedConversation.avatar}
                      onClose={handleCloseConversation}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Välj en konversation</h3>
                        <p className="text-muted-foreground mb-4">
                          Välj en konversation från listan eller starta en ny
                        </p>
                        {(hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
                          <Button onClick={handleNewMessage} className="flex items-center gap-2 mx-auto">
                            <Plus className="h-4 w-4" />
                            Nytt meddelande
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <MessagePreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}