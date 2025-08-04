import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Settings, 
  Users, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useMessages } from '@/hooks/useMessages';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
import { ComposeMessage } from './ComposeMessage';
import { MessagePreferences } from './MessagePreferences';

interface EnhancedMessageSystemProps {
  selectedConversation?: { id: string; name: string; avatar?: string } | null;
  onConversationSelect?: (id: string, name: string, avatar?: string) => void;
}

export const EnhancedMessageSystem: React.FC<EnhancedMessageSystemProps> = ({
  selectedConversation,
  onConversationSelect
}) => {
  const { user, hasRole } = useAuth();
  const { unreadCount, loading } = useMessages();
  const [activeTab, setActiveTab] = useState('messages');
  const [showCompose, setShowCompose] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('connected');
    const handleOffline = () => setConnectionStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNewMessage = () => {
    setShowCompose(true);
  };

  const handleComposeClose = () => {
    setShowCompose(false);
  };

  const handleComposeSent = () => {
    setShowCompose(false);
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'reconnecting': return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
  };

  const getRoleBasedDescription = () => {
    if (hasRole('coach')) return 'Kommunicera med dina klienter och ge personligt stöd';
    if (hasRole('client')) return 'Håll kontakten med din coach för utveckling och vägledning';
    if (hasRole('admin') || hasRole('superadmin')) return 'Hantera kommunikation mellan coaches och klienter';
    return 'Säker meddelandeplattform för alla användare';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-muted-foreground">Laddar meddelanden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Meddelanden</h1>
              <p className="text-muted-foreground">{getRoleBasedDescription()}</p>
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {unreadCount} nya
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {getConnectionIcon()}
            <span className="text-xs text-muted-foreground capitalize">
              {connectionStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Connection status alerts */}
      {connectionStatus === 'disconnected' && (
        <Alert className="mb-4 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Du är offline. Meddelanden kommer att skickas när anslutningen återställs.
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'reconnecting' && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Återansluter till meddelandetjänsten...
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
              {/* Conversation List */}
              <div className="w-80 border-r flex-shrink-0 bg-gradient-to-b from-gray-50 to-white">
                <div className="p-4 border-b bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Konversationer</h3>
                    {(hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
                      <Button
                        size="sm"
                        onClick={handleNewMessage}
                        variant="outline"
                        disabled={connectionStatus === 'disconnected'}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <ConversationList 
                  onSelectConversation={onConversationSelect || (() => {})}
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
                    />
                  </div>
                ) : selectedConversation ? (
                  <ConversationView
                    recipientId={selectedConversation.id}
                    recipientName={selectedConversation.name}
                    recipientAvatar={selectedConversation.avatar}
                    onClose={() => onConversationSelect?.('', '', '')}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center bg-gradient-to-br from-blue-50 to-purple-50">
                    <div className="max-w-md mx-auto p-8">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-12 h-12 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-800">
                        Välj en konversation
                      </h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {getRoleBasedDescription()}
                      </p>
                      
                      {(hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
                        <Button
                          onClick={handleNewMessage}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          disabled={connectionStatus === 'disconnected'}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Starta ny konversation
                        </Button>
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
};