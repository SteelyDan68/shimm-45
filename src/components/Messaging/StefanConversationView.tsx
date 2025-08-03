import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Send, Loader2, ArrowLeft, Star, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface StefanMessage {
  id: string;
  content: string;
  sender: 'user' | 'stefan';
  timestamp: string;
  type?: 'text' | 'insight' | 'recommendation';
}

interface StefanConversationViewProps {
  onClose: () => void;
}

export function StefanConversationView({ onClose }: StefanConversationViewProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<StefanMessage[]>([
    {
      id: '1',
      content: 'Hej! Jag är Stefan, din personliga AI-coach. Jag är här för att hjälpa dig med din utvecklingsresa inom de sex grundpelarna. Vad kan jag hjälpa dig med idag?',
      sender: 'stefan',
      timestamp: new Date().toISOString(),
      type: 'text'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const userMessage: StefanMessage = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setSending(true);

    try {
      // Anropa Stefan AI edge function
      const { data, error } = await supabase.functions.invoke('stefan-ai-chat', {
        body: {
          user_id: user?.id,
          message: userMessage.content,
          conversation_context: messages.slice(-5) // Senaste 5 meddelanden för kontext
        }
      });

      if (error) throw error;

      const stefanResponse: StefanMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message || 'Ursäkta, jag hade lite svårt att förstå det. Kan du försöka igen?',
        sender: 'stefan',
        timestamp: new Date().toISOString(),
        type: data.type || 'text'
      };

      setMessages(prev => [...prev, stefanResponse]);

      // Logga konversationen för coaching insights
      if (data.insights && data.insights.length > 0) {
        console.log('Stefan generated insights:', data.insights);
      }
    } catch (error) {
      console.error('Error sending message to Stefan:', error);
      
      const errorResponse: StefanMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Ursäkta, jag har lite tekniska problem just nu. Försök igen om en stund eller kontakta din mänskliga coach om det är brådskande.',
        sender: 'stefan',
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Avatar className="h-10 w-10 ring-2 ring-blue-200">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Brain className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              Stefan AI Coach
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                <Zap className="h-3 w-3 mr-1" />
                AI
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground">
              Din personliga utvecklingscoach
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Online</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender === 'stefan' && (
                <Avatar className="h-8 w-8 ring-1 ring-blue-200">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    <Brain className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'insight'
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : message.type === 'recommendation'
                    ? 'bg-green-50 border border-green-200 text-green-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.type === 'insight' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-600">INSIKT</span>
                  </div>
                )}
                
                {message.type === 'recommendation' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-600">REKOMMENDATION</span>
                  </div>
                )}
                
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${
                    message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {formatDistanceToNow(new Date(message.timestamp), { 
                      addSuffix: true, 
                      locale: sv 
                    })}
                  </span>
                </div>
              </div>
              
              {message.sender === 'user' && (
                <Avatar className="h-8 w-8 ring-1 ring-gray-200">
                  <AvatarFallback className="bg-gray-600 text-white text-xs">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {sending && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 ring-1 ring-blue-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                  <Brain className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Stefan tänker...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-3">
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Skriv ditt meddelande till Stefan..."
              rows={2}
              className="resize-none"
              disabled={sending}
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Stefan analyserar dina svar för att ge personliga coaching-insikter
        </div>
      </div>
    </div>
  );
}