import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Send, 
  Brain, 
  MessageSquare, 
  Sparkles, 
  ArrowLeft, 
  Plus,
  Search,
  Phone,
  Video,
  MoreVertical,
  Loader2,
  CheckCircle,
  Clock,
  Users,
  Star,
  TrendingUp,
  Zap
} from 'lucide-react';

/**
 * 🚀 UNIFIED MESSAGING HUB - ENTERPRISE GRADE
 * Consolidates all messaging functionality into one world-class interface
 * Follows globalUXPolicies.ts for self-instructing, neuroplastic UX
 * Single source of truth - eliminates fragmentation
 */

interface UnifiedMessagingHubProps {
  className?: string;
  mode?: 'full' | 'compact';
  showAIAssistant?: boolean;
}

type ViewMode = 'conversations' | 'active-chat' | 'ai-assistant';

export const UnifiedMessagingHub: React.FC<UnifiedMessagingHubProps> = ({ 
  className,
  mode = 'full',
  showAIAssistant = true
}) => {
  const { user, hasRole } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    connectionStatus,
    totalUnreadCount,
    setActiveConversation,
    sendMessage,
    markConversationAsRead,
    getOrCreateDirectConversation,
    updateTypingStatus,
  } = useMessagingV2();

  // 🎯 UX STATE MANAGEMENT
  const [viewMode, setViewMode] = useState<ViewMode>('conversations');
  const [messageInput, setMessageInput] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [progressStep, setProgressStep] = useState(0);
  const [celebrationMoment, setCelebrationMoment] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🎯 SELF-INSTRUCTING UX: Guide user through messaging journey
  const getInstructionalMessage = () => {
    if (conversations.length === 0) {
      return {
        title: "Välkommen till ditt meddelandecenter! 🎉",
        description: "Här kan du chatta med coaches och Stefan AI. Börja genom att klicka på + ovan.",
        action: "Starta din första konversation",
        progress: 10
      };
    }
    
    if (!activeConversation) {
      return {
        title: "Välj en konversation att fortsätta 💬",
        description: `Du har ${conversations.length} konversation${conversations.length !== 1 ? 'er' : ''} tillgängliga.`,
        action: "Klicka på en konversation",
        progress: 30
      };
    }

    if (messages[activeConversation]?.length === 0) {
      return {
        title: "Dags att säga hej! 👋",
        description: "Skriv ditt första meddelande nedan och tryck Enter för att skicka.",
        action: "Skriv ditt meddelande",
        progress: 60
      };
    }

    return {
      title: "Du behärskar meddelanden! ⭐",
      description: "Fortsätt konversationen eller utforska AI-hjälp till höger.",
      action: "Fortsätt chatta",
      progress: 100
    };
  };

  const instruction = getInstructionalMessage();

  // 🚀 AUTO-SCROLL WITH SMOOTH ANIMATION
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages, activeConversation]);

  // ⌨️ TYPING INDICATORS & REAL-TIME FEEDBACK
  useEffect(() => {
    if (activeConversation && messageInput.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        updateTypingStatus(activeConversation, true);
      }
    } else if (isTyping) {
      setIsTyping(false);
      updateTypingStatus(activeConversation || '', false);
    }
  }, [messageInput, activeConversation, isTyping, updateTypingStatus]);

  // 🎯 PROGRESS TRACKING & NEUROPLASTIC FEEDBACK
  useEffect(() => {
    setProgressStep(instruction.progress);
    
    if (instruction.progress === 100 && !celebrationMoment) {
      setCelebrationMoment(true);
      toast.success("Fantastiskt! Du behärskar meddelandesystemet! 🎉", {
        description: "Du har lärt dig att navigera, chatta och använda AI-hjälp."
      });
      setTimeout(() => setCelebrationMoment(false), 3000);
    }
  }, [instruction.progress, celebrationMoment]);

  // 💬 ENHANCED MESSAGE SENDING WITH FEEDBACK
  const handleSendMessage = async () => {
    if (!activeConversation || !messageInput.trim()) return;

    const success = await sendMessage(activeConversation, messageInput.trim());
    if (success) {
      setMessageInput('');
      setIsTyping(false);
      
      // 🎯 NEUROPLASTIC FEEDBACK
      toast.success("Meddelande skickat! ✅", {
        description: "Ditt meddelande har levererats."
      });
    }
  };

  // 🤖 AI ASSISTANT FUNCTIONALITY (Coach/Admin only)
  const generateAISuggestion = async () => {
    if (!aiInput.trim() || !hasRole('coach') && !hasRole('admin') && !hasRole('superadmin')) return;
    
    setAiLoading(true);
    setAiSuggestion('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-message-assistant', {
        body: {
          messageContent: aiInput,
          senderName: user?.email || 'Coach',
          context: aiContext,
        },
      });

      if (error) throw error;
      setAiSuggestion(data?.aiSuggestion || '');
      
      toast.success("AI-förslag genererat! ✨", {
        description: "Granska förslaget och anpassa efter behov."
      });
    } catch (error) {
      console.error('AI assistant error:', error);
      toast.error("AI-hjälp misslyckades", {
        description: "Försök igen om en stund."
      });
    } finally {
      setAiLoading(false);
    }
  };

  // 📱 RESPONSIVE VIEW MANAGEMENT
  const handleConversationSelect = (conversationId: string) => {
    setActiveConversation(conversationId);
    markConversationAsRead(conversationId);
    
    if (mode === 'compact') {
      setViewMode('active-chat');
    }
  };

  const handleBackToConversations = () => {
    setActiveConversation(null);
    setViewMode('conversations');
  };

  // 🎨 HELPER FUNCTIONS
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const currentConversation = conversations.find(c => c.id === activeConversation);
  const conversationTitle = currentConversation?.title || 
    currentConversation?.participants
      ?.filter(p => p.id !== user?.id)
      .map(p => `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email)
      .join(', ') || 'Konversation';

  const currentMessages = messages[activeConversation || ''] || [];

  // 🎯 COMPACT MODE FOR MOBILE/SIDEBAR
  if (mode === 'compact') {
    return (
      <Card className={cn("w-full max-w-sm", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Meddelanden
            </CardTitle>
            {totalUnreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalUnreadCount}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {conversations.slice(0, 3).map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleConversationSelect(conv.id)}
                className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(conv.title)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.last_message?.content || 'Ingen meddelanden än...'}
                    </p>
                  </div>
                  {(conv.unread_count || 0) > 0 && (
                    <Badge variant="destructive" className="text-xs h-4 w-4 flex items-center justify-center">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.location.href = '/messages'}
            >
              Visa alla
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 🚀 FULL MODE - COMPLETE MESSAGING INTERFACE
  return (
    <div className={cn("flex h-full bg-background rounded-lg border overflow-hidden", className)}>
      
      {/* 📱 CONVERSATION LIST */}
      <div className={cn(
        "flex flex-col w-full md:w-80 border-r bg-muted/5",
        activeConversation && "hidden md:flex"
      )}>
        
        {/* 🎯 INSTRUCTIONAL HEADER */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Meddelanden</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Search className="h-4 w-4" />
                </Button>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  connectionStatus === 'connected' && "bg-green-500",
                  connectionStatus === 'connecting' && "bg-yellow-500 animate-pulse",
                  connectionStatus === 'disconnected' && "bg-red-500"
                )} />
              </div>
            </div>
            
            {/* 🎯 PROGRESS & INSTRUCTION */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{instruction.title}</span>
                <span className="text-muted-foreground">{instruction.progress}%</span>
              </div>
              <Progress value={instruction.progress} className="h-1" />
              <p className="text-xs text-muted-foreground">{instruction.description}</p>
            </div>
          </div>
        </div>

        {/* 📋 CONVERSATIONS */}
        <ScrollArea className="flex-1">
          <div className="p-1">
            {conversations.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Inga konversationer än</h3>
                  <p className="text-sm text-muted-foreground">Klicka på + ovan för att börja</p>
                </div>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {instruction.action}
                </Button>
              </div>
            ) : (
              conversations.map((conversation) => {
                const otherParticipant = conversation.participants?.find(p => p.id !== user?.id);
                const displayName = otherParticipant ? 
                  `${otherParticipant.first_name || ''} ${otherParticipant.last_name || ''}`.trim() || otherParticipant.email :
                  conversation.title || 'Okänd användare';

                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 m-1 rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                      activeConversation === conversation.id && "bg-primary/10 border border-primary/20"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherParticipant?.avatar_url} />
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">{displayName}</h3>
                        {conversation.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message?.content || 'Ingen meddelanden än...'}
                        </p>
                        {(conversation.unread_count || 0) > 0 && (
                          <Badge variant="destructive" className="text-xs h-5 min-w-[20px]">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 💬 ACTIVE CONVERSATION */}
      {activeConversation ? (
        <div className="flex flex-col flex-1">
          
          {/* 📱 CONVERSATION HEADER */}
          <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToConversations}
                className="md:hidden h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(conversationTitle)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-medium text-sm">{conversationTitle}</h3>
                <p className="text-xs text-muted-foreground">Online för 2 min sedan</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 📨 MESSAGES AREA */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {currentMessages.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{instruction.title}</h3>
                    <p className="text-sm text-muted-foreground">{instruction.description}</p>
                  </div>
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
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(message.sender_profile?.first_name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "flex flex-col max-w-[70%]",
                        isOwn && "items-end"
                      )}>
                        <div className={cn(
                          "relative px-4 py-2 rounded-2xl break-words",
                          isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                          "hover:shadow-md transition-shadow duration-200"
                        )}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.created_at)}
                          </span>
                          {isOwn && message.is_read && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* ⌨️ MESSAGE INPUT */}
          <div className="p-4 border-t bg-background/50">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Skriv till ${conversationTitle}...`}
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
            
            {isTyping && (
              <p className="text-xs text-muted-foreground mt-1">Du skriver...</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md">
            <div className={cn(
              "w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto",
              celebrationMoment && "animate-pulse"
            )}>
              {celebrationMoment ? (
                <Star className="h-12 w-12 text-primary" />
              ) : (
                <MessageSquare className="h-12 w-12 text-primary" />
              )}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">{instruction.title}</h2>
              <p className="text-muted-foreground">{instruction.description}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Din framsteg</span>
                <span>{instruction.progress}%</span>
              </div>
              <Progress value={instruction.progress} />
            </div>

            {conversations.length === 0 && (
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {instruction.action}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 🤖 AI ASSISTANT SIDEBAR (Coach/Admin only) */}
      {showAIAssistant && (hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
        <div className="w-80 border-l bg-muted/5 p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-sm">AI-svarshjälp</h3>
                <p className="text-xs text-muted-foreground">För coaches och admins</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Innehåll från klient</label>
              <Textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Klistra in meddelandet här..."
                className="min-h-[80px] text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Kontext (frivilligt)</label>
              <Input
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="T.ex. tema, mål, känsloläge..."
                className="text-sm"
              />
            </div>

            <Button 
              onClick={generateAISuggestion}
              disabled={aiLoading || !aiInput.trim()}
              className="w-full"
              size="sm"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Föreslå svar
            </Button>

            {aiSuggestion && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">AI-förslag</label>
                <Textarea 
                  value={aiSuggestion}
                  onChange={(e) => setAiSuggestion(e.target.value)}
                  className="min-h-[100px] text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => navigator.clipboard.writeText(aiSuggestion)}
                  >
                    Kopiera
                  </Button>
                  {activeConversation && (
                    <Button 
                      size="sm"
                      className="flex-1"
                      onClick={async () => {
                        const success = await sendMessage(activeConversation, aiSuggestion);
                        if (success) {
                          setAiSuggestion('');
                          setAiInput('');
                        }
                      }}
                    >
                      Skicka
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};