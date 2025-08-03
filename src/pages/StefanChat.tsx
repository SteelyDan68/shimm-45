import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Minimize2, Maximize2, Brain, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  memoryFragmentsUsed?: number;
  aiAnalysis?: string;
}

export function StefanChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hej! Jag är Stefans digitala tvilling och specialiserad på coachning. Jag har tillgång till all Stefans kunskap och erfarenhet. Vad kan jag hjälpa dig med i ditt coacharbete idag?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const clientId = searchParams.get('clientId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('stefan-ai-chat', {
        body: {
          message: inputMessage,
          context: clientId ? `Coaching conversation about client ${clientId}` : 'General coaching consultation',
          user_id: user?.id,
          persona: 'mentor',
          interaction_type: 'coaching_consultation'
        }
      });

      if (error) throw error;

      console.log('Stefan AI response:', data);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || data.response || 'Stefan AI svarade men svaret kunde inte visas.',
        isUser: false,
        timestamp: new Date(),
        memoryFragmentsUsed: data.memoryFragmentsUsed || 0,
        aiAnalysis: data.debug?.memorySearch || ''
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelandet. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/coach')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till Coach
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-lg font-semibold">S</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Stefan AI-konsultation</h1>
            <p className="text-muted-foreground">Digital coaching-rådgivning med Stefans expertis</p>
          </div>
        </div>
      </div>

      {clientId && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100">
                Klient-fokuserad konsultation
              </Badge>
              <span className="text-sm text-muted-foreground">
                Konversationen är fokuserad på klient {clientId}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">S</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Stefan Hallgren</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Brain className="h-3 w-3" />
                AI Coaching Specialist
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-white">
            {messages.filter(m => !m.isUser).reduce((sum, m) => sum + (m.memoryFragmentsUsed || 0), 0)} minnesfragment använda
          </Badge>
        </CardHeader>
        
        <CardContent className="p-0 flex flex-col h-full">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg text-sm ${
                      message.isUser
                        ? 'bg-primary text-white'
                        : 'bg-muted border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-opacity-20">
                      <p className={`text-xs ${
                        message.isUser ? 'text-white/70' : 'text-muted-foreground'
                      }`}>
                        {message.timestamp.toLocaleTimeString('sv-SE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {!message.isUser && message.memoryFragmentsUsed && message.memoryFragmentsUsed > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {message.memoryFragmentsUsed} minnesfragment
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-4 rounded-lg text-sm border max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-muted-foreground ml-2">Stefan tänker...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <form onSubmit={sendMessage} className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Fråga Stefan om coaching-strategier, klienthantering, eller utvecklingsmetoder..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={isLoading || !inputMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Stefan AI har tillgång till omfattande coaching-kunskap och kan ge personaliserade råd
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}