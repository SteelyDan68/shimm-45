/**
 * 🌟 ENHANCED MESSAGING HUB - BASERAT PÅ ANNAS KLIENTMODUL
 * 
 * Använder samma vackra bubbel-design som den ursprungliga klientmodulen
 * men utökar funktionaliteten för admin/coach/superadmin roller
 * 
 * BEHÅLLER:
 * - ModernMessageBubble med färgade bubblor 
 * - Samma designspråk och UX
 * - Stefan AI integration
 * 
 * LÄGGER TILL:
 * - Live meddelanden till andra roller
 * - Broadcast funktionalitet för admin
 * - Coach-klient direktkommunikation
 */

import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ModernMessageBubble } from './ModernMessageBubble';
import { ModernMessageInput } from './ModernMessageInput';
import { ActionTooltip } from '@/components/ui/action-tooltip';
import { usePerformanceMonitoringV2, useMemoryOptimization } from '@/utils/performanceOptimizationV2';
import { 
  MessageSquare, 
  X,
  Send,
  Users,
  Crown,
  Shield,
  UserCheck,
  Heart,
  Brain,
  Plus,
  Zap,
  Radio
} from 'lucide-react';

interface AvailableRecipient {
  id: string;
  name: string;
  email: string;
  roles: string[];
  avatar_url?: string;
  is_coach_assigned?: boolean;
}

const roleIcons = {
  superadmin: Crown,
  admin: Shield,
  coach: UserCheck,
  client: Heart,
  stefan_ai: Brain
};

const roleColors = {
  superadmin: 'from-purple-600 to-pink-600',
  admin: 'from-blue-600 to-indigo-600',
  coach: 'from-green-600 to-emerald-600',
  client: 'from-orange-500 to-red-500',
  stefan_ai: 'from-emerald-500 to-teal-500'
};

const roleLabels = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  coach: 'Coach',
  client: 'Klient',
  stefan_ai: 'Stefan AI'
};

interface EnhancedMessagingHubProps {
  className?: string;
}

const EnhancedMessagingHubComponent: React.FC<EnhancedMessagingHubProps> = ({ className }) => {
  usePerformanceMonitoringV2('EnhancedMessagingHub');
  const { registerCleanup } = useMemoryOptimization();
  
  const { user, hasRole } = useAuth();
  const {
    conversations,
    activeConversation,
    currentMessages,
    setActiveConversation,
    sendMessage,
    markConversationAsRead
  } = useMessagingV2();
  
  const [messageInput, setMessageInput] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [availableRecipients, setAvailableRecipients] = useState<AvailableRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Permission checks
  const isSuperAdmin = hasRole('superadmin');
  const isAdmin = hasRole('admin');
  const isCoach = hasRole('coach');
  const isClient = hasRole('client');
  
  const canBroadcast = isSuperAdmin || isAdmin;

  // Auto-scroll to bottom only when new messages arrive
  const previousMessageCount = useRef(0);
  useEffect(() => {
    const currentCount = currentMessages?.length || 0;
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

  // Load available recipients and auto-create Stefan conversation
  useEffect(() => {
    loadAvailableRecipients();
    
    // Auto-create Stefan AI conversation if none exists
    if (conversations.length === 0 && user?.id) {
      createStefanConversation();
    }
  }, [user?.id, hasRole, conversations.length]);

  const loadAvailableRecipients = async () => {
    if (!user?.id) return;

    try {
      // Stefan AI är alltid tillgänglig
      const stefanAI: AvailableRecipient = {
        id: 'stefan_ai',
        name: 'Stefan AI',
        email: 'stefan@ai.coach',
        roles: ['stefan_ai'],
        avatar_url: undefined
      };

      let recipients: AvailableRecipient[] = [stefanAI];

      if (isClient) {
        // Klienter kan bara skicka till sin tilldelade coach
        const { data: assignments } = await supabase
          .from('coach_client_assignments')
          .select(`
            coach_id,
            profiles!coach_id(id, first_name, last_name, email, avatar_url)
          `)
          .eq('client_id', user.id)
          .eq('is_active', true);

        if (assignments) {
          assignments.forEach(assignment => {
            if (assignment.profiles) {
              const profile = assignment.profiles as any;
              recipients.push({
                id: profile.id,
                name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
                email: profile.email,
                roles: ['coach'],
                avatar_url: profile.avatar_url,
                is_coach_assigned: true
              });
            }
          });
        }
      } else if (isCoach) {
        // Coaches kan skicka till sina tilldelade klienter
        const { data: assignments } = await supabase
          .from('coach_client_assignments')
          .select(`
            client_id,
            profiles!client_id(id, first_name, last_name, email, avatar_url)
          `)
          .eq('coach_id', user.id)
          .eq('is_active', true);

        if (assignments) {
          assignments.forEach(assignment => {
            if (assignment.profiles) {
              const profile = assignment.profiles as any;
              recipients.push({
                id: profile.id,
                name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
                email: profile.email,
                roles: ['client'],
                avatar_url: profile.avatar_url
              });
            }
          });
        }
      } else if (canBroadcast) {
        // Superadmin och Admin kan skicka till alla
        const { data: allUsers, error: usersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .eq('is_active', true)
          .neq('id', user.id);

        if (usersError) {
          console.error('Error fetching users:', usersError);
          return;
        }

        if (allUsers) {
          for (const profile of allUsers) {
            const { data: userRoles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id);

            recipients.push({
              id: profile.id,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
              email: profile.email,
              roles: userRoles?.map(ur => ur.role) || [],
              avatar_url: profile.avatar_url
            });
          }
        }
      }

      setAvailableRecipients(recipients);
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast.error("Kunde inte ladda mottagare");
    }
  };

  // Auto-create Stefan AI conversation for immediate access
  const createStefanConversation = async () => {
    if (!user?.id) return;

    try {
      const { data: existingStefan } = await supabase
        .from('conversations')
        .select('id')
        .eq('created_by', user.id)
        .eq('conversation_type', 'support')
        .contains('metadata', { stefan_ai: 'true' })
        .eq('is_active', true)
        .maybeSingle();

      if (!existingStefan) {
        const { data: newConversation, error } = await supabase
          .from('conversations')
          .insert({
            created_by: user.id,
            participant_ids: [user.id, 'stefan_ai'],
            conversation_type: 'support',
            title: '🤖 Stefan AI Chat',
            metadata: {
              stefan_ai: 'true',
              ai_model: 'auto',
              created_from: 'web'
            }
          })
          .select('id')
          .single();

        if (!error && newConversation) {
          await sendMessage(newConversation.id, '🤖 Stefan: Hej! Jag är Stefan, din AI-coach. Hur kan jag hjälpa dig idag?');
          setActiveConversation(newConversation.id);
        }
      }
    } catch (error) {
      console.error('Error creating Stefan conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!activeConversation || !messageInput.trim()) return;

    const userMessage = messageInput.trim();
    setMessageInput(''); // Clear immediately

    // Check if this is Stefan AI conversation
    const conversation = conversations.find(c => c.id === activeConversation);
    const isStefanConversation = conversation?.metadata?.stefan_ai === 'true' || 
                                conversation?.title?.toLowerCase().includes('stefan');

    try {
      // Send user message first
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

          if (!error && data?.message) {
            // Send AI response with Stefan's consistent format
            const success = await sendMessage(activeConversation, `🤖 Stefan: ${data.message}`);
            if (success) {
              toast.success("Stefan AI har svarat!");
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

  const handleBroadcastMessage = async () => {
    if (!broadcastMessage.trim() || selectedRecipients.length === 0) {
      toast.error("Välj mottagare och skriv ett meddelande");
      return;
    }

    try {
      // Send broadcast message via edge function
      const { data, error } = await supabase.functions.invoke('live-message-sender', {
        body: {
          sender_id: user?.id,
          recipient_ids: selectedRecipients,
          recipient_type: 'multiple',
          subject: broadcastSubject,
          content: broadcastMessage,
          notification_type: 'broadcast',
          is_broadcast: true
        }
      });

      if (error) throw error;

      toast.success(`Meddelande skickat till ${selectedRecipients.length} mottagare`);
      
      // Clear form
      setBroadcastMessage('');
      setBroadcastSubject('');
      setSelectedRecipients([]);
      setShowCompose(false);
      
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error("Kunde inte skicka meddelandet");
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
      
      if (activeConversation === conversationId) {
        setActiveConversation(null);
      }
      
      toast.success("Konversation raderad");
    } catch (error) {
      toast.error("Kunde inte radera konversationen");
    }
  };

  const getPrimaryRole = (roles: string[]): string => {
    if (roles.includes('superadmin')) return 'superadmin';
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('coach')) return 'coach';
    if (roles.includes('client')) return 'client';
    return roles[0] || 'client';
  };

  const conversation = conversations.find(c => c.id === activeConversation);

  return (
    <div className={cn("h-full flex bg-gradient-to-br from-background to-muted/20", className)}>
      {/* Main messaging area */}
      <div className="flex-1 flex flex-col">
        
        {/* Header med ny funktionalitet */}
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
            
            {/* Admin broadcast button */}
            {canBroadcast && (
              <Button
                onClick={() => setShowCompose(!showCompose)}
                className="flex items-center gap-2"
                variant={showCompose ? "default" : "outline"}
              >
                {showCompose ? <X className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
                {showCompose ? "Stäng" : "Broadcast"}
              </Button>
            )}
          </div>
        </div>

        {/* Broadcast compose area */}
        {showCompose && canBroadcast && (
          <div className="border-b bg-muted/30 p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Skicka till flera mottagare
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Ämne (valfritt)</label>
                  <Input
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder="Ämne för meddelandet..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Meddelande</label>
                  <Textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Skriv ditt meddelande här..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Mottagare ({selectedRecipients.length} valda)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                    {availableRecipients.filter(r => r.id !== 'stefan_ai').map((recipient) => {
                      const primaryRole = getPrimaryRole(recipient.roles);
                      const Icon = roleIcons[primaryRole as keyof typeof roleIcons] || MessageSquare;
                      const isSelected = selectedRecipients.includes(recipient.id);
                      
                      return (
                        <div
                          key={recipient.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          )}
                          onClick={() => {
                            setSelectedRecipients(prev => 
                              isSelected 
                                ? prev.filter(id => id !== recipient.id)
                                : [...prev, recipient.id]
                            );
                          }}
                        >
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${roleColors[primaryRole as keyof typeof roleColors]} flex items-center justify-center text-white text-xs`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <span className="text-xs truncate">{recipient.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleBroadcastMessage}
                    disabled={!broadcastMessage.trim() || selectedRecipients.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Skicka till {selectedRecipients.length} mottagare
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRecipients(availableRecipients.filter(r => r.id !== 'stefan_ai').map(r => r.id));
                    }}
                  >
                    Välj alla
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRecipients([])}
                  >
                    Rensa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conversation list och chat interface - SAMMA SOM ORIGINALET */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          
          {/* Conversations Sidebar - EXAKT SAMMA SOM ANNA's MODUL */}
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
                          <ActionTooltip content="Radera konversation">
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
                          </ActionTooltip>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Modern Chat Interface - EXAKT SAMMA SOM ANNA's MODUL MED BUBBLOR */}
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
                    {/* Messages Container med samma design som Anna's modul */}
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

                    {/* Modern Input Area - SAMMA SOM ANNA's MODUL */}
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

// PERFORMANCE OPTIMIZATION: Memoized export
export const EnhancedMessagingHub = memo(EnhancedMessagingHubComponent);