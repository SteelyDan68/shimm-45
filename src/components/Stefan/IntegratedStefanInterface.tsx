import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedAI } from '@/hooks/useUnifiedAI';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Send, 
  Lightbulb, 
  Target, 
  BookOpen,
  MessageSquare,
  Minimize2,
  Maximize2,
  X,
  Settings,
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  memoryFragmentsUsed?: number;
  coachingContext?: string;
  actionItems?: string[];
}

interface IntegratedStefanInterfaceProps {
  context?: 'coaching' | 'assessment' | 'planning' | 'general';
  clientId?: string;
  className?: string;
  onCoachingAction?: (action: string, data: any) => void;
}

export function IntegratedStefanInterface({ 
  context = 'general', 
  clientId,
  className = '',
  onCoachingAction 
}: IntegratedStefanInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: getWelcomeMessage(context),
      isUser: false,
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedTab, setSelectedTab] = useState('chat');
  const [quickActions, setQuickActions] = useState<string[]>([]);
  
  const { stefanChat, loading } = useUnifiedAI();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function getWelcomeMessage(context: string): string {
    switch (context) {
      case 'coaching':
        return 'Hej! Jag är Stefan och hjälper dig med coaching-strategier och klienthantering. Vad kan jag hjälpa dig med idag?';
      case 'assessment':
        return 'Hej! Jag är Stefan och kan hjälpa dig tolka och förstå bedömningsresultat. Vad vill du veta?';
      case 'planning':
        return 'Hej! Jag är Stefan och specialiserar mig på utvecklingsplanering. Låt oss skapa en effektiv plan tillsammans.';
      default:
        return 'Hej! Jag är Stefan och här för att hjälpa dig med coaching, utveckling och neuroplasticitet. Vad kan jag hjälpa dig med?';
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const contextData = {
        context: context,
        clientId: clientId,
        userRole: user?.email?.includes('coach') ? 'coach' : 'client',
        previousMessages: messages.slice(-3).map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.content }))
      };

      const response = await stefanChat({
        message: messageToSend,
        conversationHistory: messages.slice(-3).map(m => ({ 
          role: m.isUser ? 'user' : 'assistant', 
          content: m.content 
        }))
      });

      if (!response) {
        throw new Error('Stefan AI svarade inte');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message || 'Stefan AI svarade men svaret kunde inte visas.',
        isUser: false,
        timestamp: new Date(),
        memoryFragmentsUsed: 0,
        coachingContext: context,
        actionItems: []
      };

      setMessages(prev => [...prev, aiMessage]);

      // Note: Quick actions can be added in future versions

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelandet. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
        >
          <Brain className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={`shadow-xl border-purple-200 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">S</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Stefan AI</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {context === 'coaching' && 'Coaching Specialist'}
              {context === 'assessment' && 'Assessment Expert'}
              {context === 'planning' && 'Development Planner'}
              {context === 'general' && 'AI Coach'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <Badge variant="outline" className="bg-white text-xs">
              {messages.filter(m => !m.isUser).reduce((sum, m) => sum + (m.memoryFragmentsUsed || 0), 0)} minnesfragment
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full grid grid-cols-2 bg-gray-50">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Åtgärder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="m-0">
            <div className="h-80 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-lg text-sm ${
                          message.isUser
                            ? 'bg-primary text-white'
                            : 'bg-muted border'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        
                        {message.actionItems && message.actionItems.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-opacity-20">
                            <p className="text-xs font-medium mb-1">Föreslagna åtgärder:</p>
                            <div className="space-y-1">
                              {message.actionItems.map((action, index) => (
                                <div key={index} className="flex items-center gap-1 text-xs">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
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
                  
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg text-sm border max-w-[85%]">
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
              
              <div className="p-3 border-t bg-background">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Fråga Stefan om ${context === 'coaching' ? 'coaching-strategier' : context === 'assessment' ? 'bedömning' : context === 'planning' ? 'planering' : 'utveckling'}...`}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={loading || !inputMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="m-0">
            <div className="p-4 space-y-4 h-80">
              <div>
                <h4 className="font-medium text-sm mb-2">Snabbåtgärder</h4>
                <div className="grid gap-2">
                  {context === 'coaching' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleQuickAction('Ge mig coaching-tips för att hantera utmanande klienter')}>
                        <Target className="h-3 w-3 mr-2" />
                        Coaching-tips
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleQuickAction('Föreslå en utvecklingsplan för min klient')}>
                        <BookOpen className="h-3 w-3 mr-2" />
                        Utvecklingsplan
                      </Button>
                    </>
                  )}
                  
                  {context === 'assessment' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleQuickAction('Hjälp mig tolka bedömningsresultatet')}>
                        <Lightbulb className="h-3 w-3 mr-2" />
                        Tolka resultat
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleQuickAction('Vilka utvecklingsområden kan jag fokusera på?')}>
                        <Target className="h-3 w-3 mr-2" />
                        Utvecklingsområden
                      </Button>
                    </>
                  )}
                  
                  <Button variant="outline" size="sm" onClick={() => handleQuickAction('Ge mig neuroplasticitet-baserade tips')}>
                    <Brain className="h-3 w-3 mr-2" />
                    Neuroplasticitet
                  </Button>
                </div>
              </div>

              {quickActions.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">AI-förslag</h4>
                  <div className="space-y-2">
                    {quickActions.map((action, index) => (
                      <Button 
                        key={index} 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-left h-auto p-2"
                        onClick={() => handleQuickAction(action)}
                      >
                        <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="text-xs">{action}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}