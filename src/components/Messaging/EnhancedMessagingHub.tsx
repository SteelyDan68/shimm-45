import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { useContextAwareAI } from '@/hooks/useContextAwareAI';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Send, 
  MessageSquare, 
  Sparkles, 
  Trash2,
  Brain,
  HelpCircle,
  Bot
} from 'lucide-react';

interface EnhancedMessagingHubProps {
  className?: string;
}

export const EnhancedMessagingHub: React.FC<EnhancedMessagingHubProps> = ({ className }) => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    setActiveConversation,
    sendMessage,
    markConversationAsRead
  } = useMessagingV2();
  
  const { getContextualHelp, isLoading: aiLoading } = useContextAwareAI();
  
  const [messageInput, setMessageInput] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [showAiHelper, setShowAiHelper] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversation]);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeConversation]);

  const handleSendMessage = async () => {
    if (!activeConversation || !messageInput.trim()) return;

    const success = await sendMessage(activeConversation, messageInput.trim());
    if (success) {
      setMessageInput('');
      toast.success("Meddelande skickat! ✅");
    } else {
      toast.error("Kunde inte skicka meddelandet");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages_v2')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', user?.id);
      
      if (error) throw error;
      toast.success("Meddelande raderat");
    } catch (error) {
      toast.error("Kunde inte radera meddelandet");
    }
  };

  const handleAiHelp = async () => {
    if (!aiQuestion.trim()) return;

    try {
      const response = await getContextualHelp(aiQuestion, {
        currentRoute: '/messages',
        userRole: user?.user_metadata?.role || 'client',
        context: 'messaging'
      });

      if (response) {
        toast.success("AI-svar genererat! ✨", {
          description: response.slice(0, 100) + '...'
        });
        
        // Optionally send AI response to active conversation
        if (activeConversation) {
          const shouldSend = confirm("Vill du skicka AI-svaret till konversationen?");
          if (shouldSend) {
            await sendMessage(activeConversation, `🤖 AI-förslag: ${response}`);
          }
        }
      }
      setAiQuestion('');
    } catch (error) {
      toast.error("AI-hjälp misslyckades");
    }
  };

  const currentMessages = messages[activeConversation || ''] || [];
  const conversation = conversations.find(c => c.id === activeConversation);

  return (
    <div className={cn("h-full flex", className)}>
      {/* Main messaging area */}
      <div className="flex-1 flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Meddelanden</h1>
              <p className="text-sm text-muted-foreground">
                Allmän kommunikation och AI-stöd
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAiHelper(!showAiHelper)}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              AI-hjälp
            </Button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          
          {/* Conversations */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Konversationer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {conversations.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Inga konversationer</h3>
                        <p className="text-xs text-muted-foreground">
                          Konversationer skapas automatiskt när du chattar
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setActiveConversation(conv.id);
                            markConversationAsRead(conv.id);
                          }}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                            activeConversation === conv.id && "bg-primary/10 border border-primary/20"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {conv.title?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {conv.title || 'Okänd konversation'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {conv.last_message?.content || 'Inga meddelanden än...'}
                              </p>
                            </div>
                            {(conv.unread_count || 0) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Messages */}
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">
                  {conversation?.title || 'Välj en konversation'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-[500px]">
                
                {activeConversation ? (
                  <>
                    {/* Messages area with proper scroll */}
                    <div className="flex-1 overflow-y-auto mb-4">
                      <div className="space-y-4 p-1">
                        {currentMessages.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Inga meddelanden än. Skriv det första!
                            </p>
                          </div>
                        ) : (
                          currentMessages.map((message) => {
                            const isOwn = message.sender_id === user?.id;
                            
                            return (
                              <div key={message.id} className={cn(
                                "flex gap-2 group",
                                isOwn && "justify-end"
                              )}>
                                {!isOwn && (
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {message.sender_profile?.first_name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                
                                <div className={cn(
                                  "max-w-[70%] p-3 rounded-lg text-sm relative",
                                  isOwn 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted"
                                )}>
                                  <p className="whitespace-pre-wrap">{message.content}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className={cn(
                                      "text-xs",
                                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                    )}>
                                      {new Date(message.created_at).toLocaleTimeString('sv-SE', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    {isOwn && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteMessage(message.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Input area */}
                    <div className="border-t pt-4">
                      <div className="flex gap-2">
                        <Input
                          ref={inputRef}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Skriv ditt meddelande här..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim()}
                          size="icon"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <MessageSquare className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Välj en konversation</h3>
                        <p className="text-sm text-muted-foreground">
                          Klicka på en konversation till vänster för att börja chatta
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Helper Panel */}
      {showAiHelper && (
        <div className="w-80 border-l bg-muted/5">
          <Card className="h-full rounded-l-none">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI-hjälp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ställ allmänna frågor eller få hjälp med systemet
                </p>
                
                <div className="space-y-3">
                  <Input
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Vad kan jag hjälpa dig med?"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAiHelp();
                      }
                    }}
                  />
                  
                  <Button 
                    onClick={handleAiHelp}
                    disabled={!aiQuestion.trim() || aiLoading}
                    className="w-full"
                    size="sm"
                  >
                    {aiLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Tänker...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Få AI-hjälp
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Snabba frågor:</h4>
                <div className="space-y-1">
                  {[
                    "Hur fungerar meddelandesystemet?",
                    "Vad kan jag göra här?",
                    "Hur kommer jag vidare i min coaching?",
                    "Vad betyder mina assessment-resultat?"
                  ].map((question) => (
                    <Button
                      key={question}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-auto p-2"
                      onClick={() => setAiQuestion(question)}
                    >
                      <HelpCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};