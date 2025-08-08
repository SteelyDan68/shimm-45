import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Send, 
  MessageSquare, 
  Trash2,
  X
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
  
  const [messageInput, setMessageInput] = useState('');
  
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

    const userMessage = messageInput.trim();
    setMessageInput(''); // Clear immediately

    // Check if this is Stefan AI conversation
    const conversation = conversations.find(c => c.id === activeConversation);
    const isStefanConversation = conversation?.metadata?.stefan_ai === 'true' || 
                                conversation?.title?.toLowerCase().includes('stefan');

    try {
      // Send user message first (without showing duplicate toast)
      const success = await sendMessage(activeConversation, userMessage);
      
      if (!success) return;

      if (isStefanConversation) {
        // Show immediate feedback
        toast.success("Skickar till Stefan AI...");
        
        // Send message to Stefan Enhanced Chat and get response
        try {
          console.log('🚀 Calling Stefan Enhanced Chat for user:', user?.id);
          
          const { data, error } = await supabase.functions.invoke('stefan-enhanced-chat', {
            body: {
              message: userMessage,
              user_id: user?.id,
              interactionType: 'chat',
              includeAssessmentContext: true,
              generateRecommendations: false,
              forceModel: 'auto'
            }
          });

          console.log('Stefan AI response:', { data, error });

          if (!error && data?.message) {
            // Send AI response immediately 
            await sendMessage(activeConversation, `🤖 Stefan: ${data.message}`);
            toast.success("Stefan AI har svarat!");
          } else {
            console.error('Stefan AI error:', error);
            await sendMessage(activeConversation, `🤖 Stefan: Jag har tekniska utmaningar just nu, men är här för dig. Kan du formulera om din fråga så försöker jag igen?`);
            toast.error("Stefan AI hade problem - försök igen");
          }
        } catch (aiError) {
          console.error('Stefan AI network error:', aiError);
          await sendMessage(activeConversation, `🤖 Stefan: Teknisk störning upptäckt. Försöker igen...`);
          toast.error("Nätverksproblem - försök igen");
        }
      } else {
        toast.success("Meddelande skickat!");
      }
    } catch (error) {
      console.error('Message sending error:', error);
      setMessageInput(userMessage); // Restore message on error
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Är du säker på att du vill radera denna konversation?')) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_active: false })
        .eq('id', conversationId)
        .eq('created_by', user?.id);
      
      if (error) throw error;
      
      // Clear active conversation if it was deleted
      if (activeConversation === conversationId) {
        setActiveConversation(null);
      }
      
      toast.success("Konversation raderad");
    } catch (error) {
      toast.error("Kunde inte radera konversationen");
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
                Kommunikation och Stefan AI
              </p>
            </div>
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
                          className={cn(
                            "p-3 rounded-lg transition-colors hover:bg-muted/50 relative group",
                            activeConversation === conv.id && "bg-primary/10 border border-primary/20"
                          )}
                        >
                          <div 
                            className="cursor-pointer"
                            onClick={() => {
                              setActiveConversation(conv.id);
                              markConversationAsRead(conv.id);
                            }}
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
                          
                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conv.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
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
    </div>
  );
};