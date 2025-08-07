import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Send, 
  Loader2, 
  User, 
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  confidence?: number;
}

interface LiveStefanChatProps {
  onMessageSent?: () => void;
}

export const LiveStefanChat: React.FC<LiveStefanChatProps> = ({ onMessageSent }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeConversation();
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    if (!user?.id) return;

    try {
      // Check for existing Stefan conversation
      const { data: existingConv, error: convError } = await (supabase as any)
        .from('conversations')
        .select('*')
        .eq('created_by', user.id)
        .eq('conversation_type', 'stefan_ai')
        .eq('is_active', true)
        .maybeSingle();

      if (convError) {
        console.error('Error checking conversation:', convError);
        return;
      }

      let convId = existingConv?.id;

      if (!existingConv) {
        // Create new Stefan conversation
        const { data: newConv, error: createError } = await (supabase as any)
          .from('conversations')
          .insert({
            created_by: user.id,
            conversation_type: 'stefan_ai',
            title: 'Chat med Stefan AI',
            is_active: true,
            participant_ids: [user.id, 'stefan_ai']
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating conversation:', createError);
          return;
        }

        convId = newConv.id;
      }

      setConversationId(convId);

      // Load existing messages
      if (convId) {
        await loadMessages(convId);
      }

    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data: messagesData, error } = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const formattedMessages: ChatMessage[] = (messagesData as any[]).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.sender_id === 'stefan_ai' ? 'assistant' : 'user',
        timestamp: msg.created_at,
        confidence: msg.metadata?.confidence
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || !user?.id || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    let userMsgId: string | null = null;
    try {
      // Add user message to UI immediately
      userMsgId = `user-${Date.now()}`;
      const newUserMessage: ChatMessage = {
        id: userMsgId!,
        content: userMessage,
        role: 'user',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newUserMessage]);

      // Save user message to database
      const { error: userMsgError } = await (supabase as any)
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: userMessage,
          message_type: 'text'
        });

      if (userMsgError) {
        console.error('Error saving user message:', userMsgError);
      }

      // Call Stefan AI
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('stefan-ai-chat', {
        body: {
          user_id: user.id,
          conversation_id: conversationId,
          message: userMessage,
          context_type: 'messaging'
        }
      });

      if (aiError) {
        throw new Error(aiError.message);
      }

      if (aiResponse?.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          content: aiResponse.response,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          confidence: aiResponse.confidence
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Save AI response to database
        await (supabase as any)
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: 'stefan_ai',
            content: aiResponse.response,
            message_type: 'text',
            metadata: {
              confidence: aiResponse.confidence,
              model_used: aiResponse.model_used
            }
          });

        onMessageSent?.();
      } else {
        throw new Error(aiResponse?.error || 'Stefan AI response failed');
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Meddelande misslyckades",
        description: error.message || "Kunde inte skicka meddelande till Stefan",
        variant: "destructive"
      });

      // Remove the user message if AI failed
      setMessages(prev => (userMsgId ? prev.filter(msg => msg.id !== userMsgId) : prev));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          Stefan AI Chat
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">Välkommen till Stefan AI</h3>
              <p className="text-sm text-muted-foreground">
                Ställ en fråga eller be om hjälp så svarar jag direkt!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'assistant' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Brain className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'assistant'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-600 text-white ml-auto'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    {message.confidence && (
                      <div className="text-xs opacity-70 mt-1">
                        Säkerhet: {(message.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Brain className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Stefan tänker...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Skriv ett meddelande till Stefan..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};