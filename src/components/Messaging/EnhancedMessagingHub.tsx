import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ModernMessageBubble } from './ModernMessageBubble';
import { ModernMessageInput } from './ModernMessageInput';
import { 
  MessageSquare, 
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
    currentMessages, // Use currentMessages instead of messages
    setActiveConversation,
    sendMessage,
    markConversationAsRead
  } = useMessagingV2();
  
  const [messageInput, setMessageInput] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom only when new messages arrive (not on conversation change)
  const previousMessageCount = useRef(0);
  useEffect(() => {
    const currentCount = currentMessages?.length || 0;
    // Only auto-scroll if we have new messages, not when switching conversations
    if (currentCount > previousMessageCount.current && previousMessageCount.current > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    previousMessageCount.current = currentCount;
  }, [currentMessages]);

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
            // Send AI response with Stefan's consistent format
            const success = await sendMessage(activeConversation, `🤖 Stefan: ${data.message}`);
            if (success) {
              toast.success("Stefan AI har svarat!");
              // Force scroll to bottom to show new message
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
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

  const conversation = conversations.find(c => c.id === activeConversation);

  return (
    <div className={cn("h-full flex bg-gradient-to-br from-background to-muted/20", className)}>
      {/* Main messaging area */}
      <div className="flex-1 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Meddelanden
              </h1>
              <p className="text-sm text-muted-foreground">
                Kommunikation och Stefan AI chat
              </p>
            </div>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          
          {/* Conversations Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full shadow-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Konversationer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-220px)]">
                  {conversations.length === 0 ? (
                    <div className="text-center py-12 px-4 space-y-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <MessageSquare className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Inga konversationer</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Konversationer skapas automatiskt när du chattar
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={cn(
                            "p-4 rounded-xl transition-all duration-200 hover:bg-muted/50 relative group cursor-pointer",
                            "border-l-4 border-transparent hover:border-primary/20",
                            activeConversation === conv.id && "bg-primary/5 border-primary shadow-sm"
                          )}
                        >
                          <div 
                            onClick={() => {
                              setActiveConversation(conv.id);
                              markConversationAsRead(conv.id);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary/20 to-accent/20">
                                  {conv.title?.charAt(0)?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-foreground">
                                  {conv.title || 'Okänd konversation'}
                                </p>
                                <p className="text-sm text-muted-foreground truncate mt-0.5">
                                  {conv.last_message?.content || 'Inga meddelanden än...'}
                                </p>
                              </div>
                              {(conv.unread_count || 0) > 0 && (
                                <Badge 
                                  variant="default" 
                                  className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full"
                                >
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-3 right-3 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
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

          {/* Modern Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-full shadow-sm border-border/50 bg-background/50 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-lg font-medium">
                  {conversation?.title || 'Välj en konversation'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-[calc(100vh-300px)] p-0">
                
                {activeConversation ? (
                  <>
                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
                      {(currentMessages || []).length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="h-10 w-10 text-primary" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">Börja konversationen</h3>
                          <p className="text-muted-foreground">
                            Skriv ditt första meddelande nedan
                          </p>
                        </div>
                      ) : (
                        <>
                          {(currentMessages || []).map((message, index) => {
                            const isOwn = message.sender_id === user?.id;
                            // Define Stefan AI constant UUID for consistent messaging
                            const STEFAN_AI_ID = '00000000-0000-0000-0000-000000000001';
                            const isStefanAI = message.content.includes('🤖 Stefan:') || message.sender_id === STEFAN_AI_ID;
                            const prevMessage = index > 0 ? currentMessages[index - 1] : null;
                            const showAvatar = !isOwn && (!prevMessage || prevMessage.sender_id !== message.sender_id);
                            
                            return (
                              <ModernMessageBubble
                                key={message.id}
                                message={message}
                                isOwn={isOwn}
                                showAvatar={showAvatar}
                                showTimestamp={true}
                                className="animate-fade-in"
                                isStefanAI={isStefanAI}
                              />
                            );
                          })}
                        </>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Modern Input Area */}
                    <div className="border-t border-border/50 p-6 bg-background/80 backdrop-blur-sm">
                      <ModernMessageInput
                        value={messageInput}
                        onChange={setMessageInput}
                        onSend={handleSendMessage}
                        placeholder="Skriv ditt meddelande här..."
                        disabled={false}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-6 p-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto">
                        <MessageSquare className="h-12 w-12 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Välj en konversation</h3>
                        <p className="text-muted-foreground">
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