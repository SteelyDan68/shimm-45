/**
 * 🚀 STABLE MESSAGING HUB - VÄRLDSKLASS ENTERPRISE SOLUTION
 * 
 * SINGLE SOURCE OF TRUTH för all meddelandehantering
 * Konsoliderar all funktionalitet i en stabil, optimerad komponent
 * 
 * ✅ MODERNA BUBBLOR (från Anna's modul)
 * ✅ STEFAN AI INTEGRATION som persisterar
 * ✅ ROLLBASERAD FUNKTIONALITET
 * ✅ BROADCAST för admins
 * ✅ LIVE REALTIME UPDATES
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ModernMessageBubble } from './ModernMessageBubble';
import { ModernMessageInput } from './ModernMessageInput';
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
  Radio,
  Trash2
} from 'lucide-react';

interface AvailableRecipient {
  id: string;
  name: string;
  email: string;
  roles: string[];
  avatar_url?: string;
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

export const StableMessagingHub: React.FC = () => {
  const { user, hasRole } = useAuth();
  const {
    conversations,
    activeConversation,
    currentMessages,
    setActiveConversation,
    sendMessage,
    markConversationAsRead,
    getOrCreateDirectConversation,
    fetchConversations
  } = useMessagingV2();
  
  const [messageInput, setMessageInput] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [availableRecipients, setAvailableRecipients] = useState<AvailableRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [stefanConversationId, setStefanConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Permission checks
  const isSuperAdmin = hasRole('superadmin');
  const isAdmin = hasRole('admin');
  const isCoach = hasRole('coach');
  const isClient = hasRole('client');
  const canBroadcast = isSuperAdmin || isAdmin;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeConversation]);

  // Initialize messaging system
  useEffect(() => {
    if (!user?.id) return;

    const initializeMessaging = async () => {
      await loadAvailableRecipients();
      await fetchConversations(); // Load conversations first
      await ensureStefanConversation(); // Then ensure Stefan exists
    };

    initializeMessaging();
  }, [user?.id, fetchConversations]);

  // Ensure Stefan AI conversation exists and persists
  const ensureStefanConversation = async () => {
    if (!user?.id) return;

    try {
      // Check if Stefan conversation already exists
      const existingStefan = conversations.find(conv => 
        conv.metadata?.stefan_ai === 'true' || 
        conv.title?.includes('Stefan AI')
      );

      if (existingStefan) {
        setStefanConversationId(existingStefan.id);
        if (!activeConversation) {
          setActiveConversation(existingStefan.id);
        }
        return;
      }

      // Create Stefan AI conversation
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          created_by: user.id,
          participant_ids: [user.id],
          conversation_type: 'support',
          title: '🤖 Stefan AI Chat',
          metadata: {
            stefan_ai: 'true',
            ai_model: 'auto',
            persistent: true,
            created_from: 'stable_hub'
          }
        })
        .select('id')
        .single();

      if (!error && newConversation) {
        setStefanConversationId(newConversation.id);
        
        // Send welcome message
        await sendMessage(newConversation.id, '🤖 Stefan: Hej! Jag är Stefan, din AI-coach. Hur kan jag hjälpa dig idag?');
        
        // Set as active conversation if no other is active
        if (!activeConversation) {
          setActiveConversation(newConversation.id);
        }
        
        // Refresh conversations to show the new one
        await fetchConversations();
        
        console.log('✅ Stefan AI conversation created:', newConversation.id);
      }
    } catch (error) {
      console.error('❌ Error ensuring Stefan conversation:', error);
    }
  };

  const loadAvailableRecipients = async () => {
    if (!user?.id) return;

    try {
      let recipients: AvailableRecipient[] = [];

      if (canBroadcast) {
        // Superadmin och Admin kan skicka till alla
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .eq('is_active', true)
          .neq('id', user.id);

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
      } else if (isClient) {
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
                avatar_url: profile.avatar_url
              });
            }
          });
        }
      }

      setAvailableRecipients(recipients);
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast.error("Kunde inte ladda mottagare");
    }
  };

  const handleSendMessage = async () => {
    if (!activeConversation || !messageInput.trim()) return;

    const userMessage = messageInput.trim();
    setMessageInput(''); // Clear immediately

    // Check if this is Stefan AI conversation
    const conversation = conversations.find(c => c.id === activeConversation);
    const isStefanConversation = conversation?.metadata?.stefan_ai === 'true' || 
                                stefanConversationId === activeConversation;

    try {
      // Send user message first
      const success = await sendMessage(activeConversation, userMessage);
      
      if (!success) return;

      if (isStefanConversation) {
        // Show immediate feedback
        toast.success("Skickar till Stefan AI...");
        
        // Send message to Stefan Enhanced Chat and get response
        try {
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
            await sendMessage(activeConversation, `🤖 Stefan: ${data.message}`);
            toast.success("Stefan AI har svarat!");
            
            // Ensure conversation persists
            setStefanConversationId(activeConversation);
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
    if (conversationId === stefanConversationId) {
      toast.error("Kan inte radera Stefan AI-konversationen");
      return;
    }

    if (!confirm('Är du säker på att du vill radera denna konversation?')) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_active: false })
        .eq('id', conversationId)
        .eq('created_by', user?.id);
      
      if (error) throw error;
      
      if (activeConversation === conversationId) {
        setActiveConversation(stefanConversationId); // Fall back to Stefan
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
    <div className="h-full flex bg-gradient-to-br from-background to-muted/20">
      {/* Sidebar med konversationer */}
      <div className="w-80 border-r border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Konversationer</h2>
            {canBroadcast && (
              <Button
                onClick={() => setShowCompose(!showCompose)}
                size="sm"
                variant={showCompose ? "default" : "outline"}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {conversations.map((conv) => {
              const isStefan = conv.metadata?.stefan_ai === 'true';
              const isActive = activeConversation === conv.id;
              
              return (
                <div
                  key={conv.id}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-colors relative group",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                  )}
                  onClick={() => setActiveConversation(conv.id)}
                >
                  <div className="flex items-center gap-3">
                    {isStefan ? (
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {conv.title?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                     <div className="flex-1 min-w-0">
                       <p className={cn(
                         "font-medium truncate",
                         conv.unread_count && conv.unread_count > 0 && "font-bold"
                       )}>
                         {conv.title || 'Utan titel'}
                       </p>
                       <p className="text-xs opacity-70 truncate">
                         {conv.last_message?.content || 'Ingen meddelanden än'}
                       </p>
                     </div>
                     <div className="flex items-center gap-2">
                       {conv.unread_count && conv.unread_count > 0 && (
                         <div className="flex items-center gap-1">
                           <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                           <Badge variant="destructive" className="text-xs animate-pulse">
                             {conv.unread_count}
                           </Badge>
                         </div>
                       )}
                     </div>
                  </div>
                  
                  {!isStefan && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Meddelanden
              </h1>
              <p className="text-sm text-muted-foreground">
                {conversation?.title || 'Välj en konversation'}
              </p>
            </div>
            
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
                    {availableRecipients.map((recipient) => {
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
                      setSelectedRecipients(availableRecipients.map(r => r.id));
                    }}
                  >
                    Välj alla
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-hidden">
          {activeConversation ? (
            <div className="h-full flex flex-col">
              {/* Messages Container med vacker bubbel-design */}
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

              {/* Modern Input Area */}
              <div className="border-t border-border/50 p-6 bg-background/80 backdrop-blur-sm">
                <ModernMessageInput
                  ref={inputRef}
                  value={messageInput}
                  onChange={setMessageInput}
                  onSend={handleSendMessage}
                  placeholder="Skriv ditt meddelande här..."
                  disabled={false}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Välj en konversation</h3>
                <p className="text-muted-foreground">
                  Välj en konversation från listan för att börja chatta
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};