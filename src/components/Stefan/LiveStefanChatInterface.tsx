import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useStefanAI } from '@/hooks/useStefanAI';
import { supabase } from '@/integrations/supabase/client';
import { ensureStefanConversation, subscribeToStefanMessages } from '@/hooks/useStefanChatPersistence';
import { 
  Brain, 
  Send, 
  MessageSquare,
  Clock,
  Loader2,
  User,
  Bot
} from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  ai_model?: string;
}

interface LiveStefanChatInterfaceProps {
  context?: 'coaching' | 'assessment' | 'planning' | 'general';
  clientId?: string;
  onCoachingAction?: (action: string, data: any) => void;
}

export function LiveStefanChatInterface({ 
  context = 'general', 
  clientId,
  onCoachingAction 
}: LiveStefanChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { user } = useAuth();
  const { chat, loading, error } = useStefanAI();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Initialize conversation and load history
  useEffect(() => {
    const initializeChat = async () => {
      if (!user?.id) return;
      
      try {
        setIsInitializing(true);
        
        // Ensure conversation exists
        const conversation = await ensureStefanConversation(user.id);
        setConversationId(conversation.id);
        
        // Load existing messages
        const { data: existingMessages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (existingMessages) {
          const formattedMessages: ChatMessage[] = existingMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            role: msg.role as 'user' | 'assistant',
            timestamp: new Date(msg.created_at),
            ai_model: msg.ai_model
          }));
          setMessages(formattedMessages);
        }
        
      } catch (err) {
        console.error('Failed to initialize Stefan chat:', err);
        toast({
          title: "Fel",
          description: "Kunde inte initiera chat. Försök igen.",
          variant: "destructive"
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [user?.id, toast]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToStefanMessages(conversationId, (payload) => {
      const newMessage = payload.new;
      const formattedMessage: ChatMessage = {
        id: newMessage.id,
        content: newMessage.content,
        role: newMessage.role,
        timestamp: new Date(newMessage.created_at),
        ai_model: newMessage.ai_model
      };
      
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(msg => msg.id === formattedMessage.id)) {
          return prev;
        }
        return [...prev, formattedMessage];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading || !user?.id) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    try {
      // Send message through Stefan AI
      const response = await chat({
        message: userMessage,
        conversationId,
        conversationHistory: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      if (response) {
        toast({
          title: "Meddelande skickat",
          description: "Stefan AI har svarat på ditt meddelande.",
        });
      }

    } catch (err) {
      console.error('Failed to send message:', err);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelande. Försök igen.",
        variant: "destructive"
      });
    }
  };

  const getMessageIcon = (role: string) => {
    return role === 'user' ? (
      <User className="h-4 w-4" />
    ) : (
      <Bot className="h-4 w-4" />
    );
  };

  const getMessageStyles = (role: string) => {
    return role === 'user' 
      ? "bg-primary text-primary-foreground ml-12" 
      : "bg-muted mr-12";
  };

  if (isInitializing) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Initierar Stefan AI Chat...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Stefan AI Chat
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                Live Chat
              </Badge>
              {context !== 'general' && (
                <Badge variant="outline" className="text-xs">
                  {context}
                </Badge>
              )}
            </div>
          </div>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Välkommen till Stefan AI Chat!</p>
                <p className="text-sm">Ställ en fråga eller berätta vad du behöver hjälp med.</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col gap-2">
                <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {getMessageIcon(message.role)}
                  </div>
                  <div className={`rounded-lg p-3 max-w-[85%] ${getMessageStyles(message.role)}`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                      <Clock className="h-3 w-3" />
                      <span>{message.timestamp.toLocaleTimeString('sv-SE')}</span>
                      {message.ai_model && (
                        <Badge variant="outline" className="text-xs">
                          {message.ai_model}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg p-3 mr-12">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Stefan AI tänker...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Skriv ditt meddelande till Stefan AI..."
              disabled={loading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={loading || !inputMessage.trim()}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}