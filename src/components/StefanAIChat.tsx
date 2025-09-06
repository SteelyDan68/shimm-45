import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MessageCircle, X, Send, Minimize2, Maximize2, Brain, MapPin } from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { useContextAwareAI } from '@/hooks/useContextAwareAI';
import { useLocation } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface StefanAIChatProps {
  clientId?: string;
  className?: string;
}

/**
 * 🤖 CONTEXT-AWARE AI WIDGET
 * Transformerad till intelligent stöd genom hela användarresan
 * Ger kontextuell vägledning baserat på var användaren befinner sig
 */
const StefanAIChat: React.FC<StefanAIChatProps> = ({ clientId, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { getContextualHelp, getPageHelp, isLoading } = useContextAwareAI();
  const location = useLocation();

  // Context-aware welcome message
  const getWelcomeMessage = (): Message => {
    const routeMessages = {
      '/client-dashboard': 'Hej! Jag ser att du är på din dashboard. Vad kan jag hjälpa dig med för att ta nästa steg i din utveckling?',
      '/messages': 'Hej! Jag ser att du använder meddelandesystemet. Behöver du hjälp med kommunikation eller att navigera här?',
      '/assessments': 'Hej! Du tittar på bedömningar. Kan jag hjälpa dig förstå processen eller tolka dina resultat?',
      '/pillar-journey': 'Hej! Du utforskar pillar-systemet. Vill du veta mer om din personliga utvecklingsresa?',
      '/calendar': 'Hej! Du är i kalendern. Behöver du hjälp med att boka sessioner eller planera din tid?'
    };

    const welcomeText = routeMessages[location.pathname as keyof typeof routeMessages] || 
      'Hej! Jag är din AI-guide genom SHMMS och vet var du är i systemet. Vad kan jag hjälpa dig med just nu?';

    return {
      id: '1',
      content: welcomeText,
      isUser: false,
      timestamp: new Date()
    };
  };

  // Initialize with context-aware welcome
  useEffect(() => {
    setMessages([getWelcomeMessage()]);
  }, [location.pathname]);

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
    const currentMessage = inputMessage;
    setInputMessage('');

    try {
      // Get context-aware response
      const response = await getContextualHelp(currentMessage, {
        currentRoute: location.pathname,
        userRole: user?.user_metadata?.role || 'client',
        context: 'ai_widget',
        metadata: {
          previousMessages: messages.slice(-3),
          userEmail: user?.email
        }
      });

      if (response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          isUser: false,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Fallback-meddelande istället för att kasta fel
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Jag har tekniska utmaningar just nu, men är här för dig. Kan du försöka formulera om din fråga eller kontakta support för direkt hjälp?',
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelandet. Försök igen.",
        variant: "destructive",
      });
    }
  };

  // Quick help for current page
  const handleQuickHelp = async () => {
    try {
      const response = await getPageHelp();
      if (response) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          content: response,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Quick help error:', error);
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <div className="relative">
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg transition-all duration-300 hover:scale-105"
            size="icon"
          >
            <Brain className="h-6 w-6 text-white" />
          </Button>
          
          {/* Context indicator */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <MapPin className="h-2 w-2 text-white" />
          </div>
        </div>
      </div>
    );
  }

  // Get current page context for display
  const getCurrentPageContext = () => {
    const contexts = {
      '/client-dashboard': { title: 'Dashboard', icon: '📊' },
      '/messages': { title: 'Meddelanden', icon: '💬' },
      '/assessments': { title: 'Bedömningar', icon: '📝' },
      '/pillar-journey': { title: 'Pillar-resa', icon: '🎯' },
      '/calendar': { title: 'Kalender', icon: '📅' }
    };
    
    return contexts[location.pathname as keyof typeof contexts] || 
           { title: 'Systemet', icon: '🏠' };
  };

  const pageContext = getCurrentPageContext();

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className={`w-96 shadow-xl border-primary/20 bg-gradient-to-br from-background to-background/95 backdrop-blur ${isMinimized ? 'h-16' : 'h-[500px]'} transition-all duration-300`}>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 bg-gradient-to-r from-primary/10 to-accent/10 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Brain className="text-white text-sm" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                Stefan guidar dig där du är
              </h3>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleQuickHelp}
              disabled={isLoading}
              title="Snabbhjälp för denna sida"
            >
              <MapPin className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[420px]">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        message.isUser
                          ? 'bg-gradient-to-r from-primary to-accent text-white'
                          : 'bg-muted/80 backdrop-blur'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.isUser ? 'text-white/70' : 'text-muted-foreground'
                      }`}>
                        {message.timestamp.toLocaleTimeString('sv-SE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted/80 backdrop-blur p-3 rounded-2xl text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            <form onSubmit={sendMessage} className="p-4 border-t bg-gradient-to-r from-muted/50 to-muted/30">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Här finns jag, skriv en fråga"
                  disabled={isLoading}
                  className="flex-1 bg-background/80 backdrop-blur border-primary/20"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default StefanAIChat;