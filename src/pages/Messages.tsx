import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquare, Users, Brain, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { EnhancedMessageSystem } from '@/components/Messaging/EnhancedMessageSystem';
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
      <EnhancedMessageSystem
        selectedConversation={selectedConversation}
        onConversationSelect={handleSelectConversation}
      />
    </div>
  );
}