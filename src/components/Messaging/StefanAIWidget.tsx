import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { Brain, MessageSquare, Plus, User, Zap } from 'lucide-react';

interface StefanAIConversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  isOnline: boolean;
  isAI: true;
}

interface StefanAIWidgetProps {
  onSelectConversation: (id: string, name: string, avatar?: string) => void;
  selectedConversationId?: string;
}

export function StefanAIWidget({ onSelectConversation, selectedConversationId }: StefanAIWidgetProps) {
  const { user } = useAuth();
  const [aiConversations] = useState<StefanAIConversation[]>([
    {
      id: 'stefan-ai',
      name: 'Stefan AI Coach',
      lastMessage: 'Hej! Jag är här för att hjälpa dig med din utveckling. Vad kan jag hjälpa dig med idag?',
      isOnline: true,
      isAI: true
    }
  ]);

  const startStefanConversation = () => {
    onSelectConversation('stefan-ai', 'Stefan AI Coach');
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-blue-600" />
          AI Coach Stöd
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {aiConversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-2 ${
              selectedConversationId === conversation.id 
                ? 'bg-blue-50 border-blue-200' 
                : 'border-border hover:bg-muted/50'
            }`}
            onClick={() => onSelectConversation(conversation.id, conversation.name, conversation.avatar)}
          >
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-blue-100">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <Brain className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{conversation.name}</p>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  <Zap className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {conversation.lastMessage}
              </p>
            </div>
          </div>
        ))}
        
        <Button 
          onClick={startStefanConversation}
          className="w-full text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="sm"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chatta med Stefan AI
        </Button>
        
        <div className="text-xs text-muted-foreground text-center">
          <p>✨ 24/7 tillgänglig personlig coach</p>
          <p>🎯 Anpassad efter din utvecklingsresa</p>
        </div>
      </CardContent>
    </Card>
  );
}