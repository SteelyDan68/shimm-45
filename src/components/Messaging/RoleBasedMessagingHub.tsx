/**
 * 🌟 ROLE-BASED MESSAGING HUB - VÄRLDSKLASS ENTERPRISE SYSTEM
 * 
 * Inspirerat av klientens designspråk från SixPillars men anpassat för alla roller:
 * - SUPERADMIN/ADMIN: Send till ALLA roller + individuella användare 
 * - COACH: Send till tilldelade klienter + Stefan AI
 * - CLIENT: Send till tilldelade coach + Stefan AI
 * 
 * Använder samma semantiska design och färgsystem som Six Pillars
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Send, 
  Users, 
  UserCheck, 
  Crown, 
  Shield,
  Brain,
  Heart,
  Plus,
  Search,
  Filter,
  Settings,
  ExternalLink
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id?: string;
  recipient_type: 'individual' | 'role' | 'all';
  created_at: string;
  sender_name?: string;
  sender_role?: string;
  is_read: boolean;
}

interface AvailableRecipient {
  id: string;
  name: string;
  email: string;
  roles: string[];
  avatar_url?: string;
  is_coach_assigned?: boolean;
}

interface MessageThread {
  recipient: AvailableRecipient;
  messages: Message[];
  unread_count: number;
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

export const RoleBasedMessagingHub: React.FC = () => {
  const { user, hasRole, roles } = useAuth();
  const { toast } = useToast();
  
  const [activeView, setActiveView] = useState<'overview' | 'compose' | 'thread'>('overview');
  const [availableRecipients, setAvailableRecipients] = useState<AvailableRecipient[]>([]);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Compose message states
  const [recipientType, setRecipientType] = useState<'individual' | 'role' | 'all'>('individual');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [messageContent, setMessageContent] = useState('');
  const [messageSubject, setMessageSubject] = useState('');

  // Permission checks
  const isSuperAdmin = hasRole('superadmin');
  const isAdmin = hasRole('admin');
  const isCoach = hasRole('coach');
  const isClient = hasRole('client');
  
  const canSendToAll = isSuperAdmin || isAdmin;
  const canSendToAllRoles = isSuperAdmin || isAdmin;

  // Load available recipients based on user role
  useEffect(() => {
    loadAvailableRecipients();
    loadMessageThreads();
  }, [user?.id, roles]);

  const loadAvailableRecipients = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Alla kan alltid skicka till Stefan AI
      const stefanAI: AvailableRecipient = {
        id: 'stefan_ai',
        name: 'Stefan AI',
        email: 'stefan@ai.coach',
        roles: ['stefan_ai'],
        avatar_url: undefined
      };

      let recipients: AvailableRecipient[] = [stefanAI];

      if (isClient) {
        // Klienter kan bara skicka till sin tilldelade coach (+ Stefan AI)
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
      } else if (canSendToAll) {
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
          // Hämta roller separat för varje användare
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
      toast({
        title: "Fel",
        description: "Kunde inte ladda mottagare",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessageThreads = async () => {
    // Implementera laddning av befintliga meddelandetrådar
    // För nu, visa tom lista
    setMessageThreads([]);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !user?.id) return;

    try {
      let recipientIds: string[] = [];
      
      if (recipientType === 'individual') {
        if (!selectedRecipient) {
          toast({
            title: "Välj mottagare",
            description: "Du måste välja en mottagare",
            variant: "destructive"
          });
          return;
        }
        
        if (selectedRecipient === 'stefan_ai') {
          // Hantera Stefan AI meddelande separat
          await handleStefanAIMessage();
          return;
        }
        
        recipientIds = [selectedRecipient];
      } else if (recipientType === 'role') {
        if (!selectedRole) {
          toast({
            title: "Välj roll",
            description: "Du måste välja en roll att skicka till",
            variant: "destructive"
          });
          return;
        }
        
        // Hämta alla användare med den valda rollen
        const { data: roleUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', selectedRole as any);
          
        recipientIds = roleUsers?.map(ru => ru.user_id) || [];
      } else if (recipientType === 'all') {
        // Skicka till alla användare
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_active', true)
          .neq('id', user.id);
          
        recipientIds = allUsers?.map(u => u.id) || [];
      }

      // Skicka meddelanden via edge function
      const { data, error } = await supabase.functions.invoke('send-message-notification', {
        body: {
          sender_id: user.id,
          recipient_ids: recipientIds,
          recipient_type: recipientType,
          subject: messageSubject,
          content: messageContent,
          notification_type: 'message'
        }
      });

      if (error) throw error;

      toast({
        title: "Meddelande skickat",
        description: `Meddelandet har skickats till ${recipientIds.length} mottagare`
      });

      // Rensa formulär
      setMessageContent('');
      setMessageSubject('');
      setSelectedRecipient('');
      setSelectedRole('');
      setActiveView('overview');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelandet",
        variant: "destructive"
      });
    }
  };

  const handleStefanAIMessage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stefan-enhanced-chat', {
        body: {
          message: messageContent,
          user_id: user?.id,
          interactionType: 'direct_message',
          includeAssessmentContext: true,
          generateRecommendations: false
        }
      });

      if (error) throw error;

      toast({
        title: "Meddelande skickat till Stefan AI",
        description: "Stefan kommer att svara snart"
      });

      // Här kan vi navigera till Stefan AI chat eller visa svaret
    } catch (error) {
      console.error('Error sending to Stefan AI:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka till Stefan AI",
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (roleName: string) => {
    const Icon = roleIcons[roleName as keyof typeof roleIcons] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const getPrimaryRole = (roles: string[]): string => {
    if (roles.includes('superadmin')) return 'superadmin';
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('coach')) return 'coach';
    if (roles.includes('client')) return 'client';
    return roles[0] || 'client';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <MessageSquare className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p>Laddar meddelandecenter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Inspirerat av SixPillars design */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <MessageSquare className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Meddelandecenter</h1>
          <HelpTooltip content="Kommunikationscentral för alla systemroller - skicka meddelanden enligt dina behörigheter." />
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Rollbaserat meddelandesystem med rätt behörigheter för varje användartyp
        </p>
      </div>

      {/* Permission info alert */}
      <Alert>
        <MessageSquare className="h-4 w-4" />
        <AlertDescription>
          {isClient && "Som klient kan du skicka meddelanden till din tilldelade coach och Stefan AI."}
          {isCoach && "Som coach kan du skicka meddelanden till dina tilldelade klienter och Stefan AI."}
          {(isSuperAdmin || isAdmin) && "Som admin kan du skicka meddelanden till alla användare, specifika roller eller individuella personer."}
        </AlertDescription>
      </Alert>

      {/* Action buttons */}
      <div className="flex gap-4 justify-center">
        <Button 
          onClick={() => setActiveView('overview')}
          variant={activeView === 'overview' ? 'default' : 'outline'}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Översikt
        </Button>
        <Button 
          onClick={() => setActiveView('compose')}
          variant={activeView === 'compose' ? 'default' : 'outline'}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Skriv meddelande
        </Button>
      </div>

      {/* Main content area */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tillgängliga mottagare ({availableRecipients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {availableRecipients.map((recipient) => {
                    const primaryRole = getPrimaryRole(recipient.roles);
                    const Icon = roleIcons[primaryRole as keyof typeof roleIcons] || MessageSquare;
                    
                    return (
                      <div 
                        key={recipient.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleColors[primaryRole as keyof typeof roleColors] || 'from-gray-400 to-gray-600'} flex items-center justify-center text-white`}>
                          {recipient.avatar_url ? (
                            <img src={recipient.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{recipient.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {roleLabels[primaryRole as keyof typeof roleLabels] || primaryRole}
                            </Badge>
                            {recipient.is_coach_assigned && (
                              <Badge variant="outline" className="text-xs">
                                Din coach
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedRecipient(recipient.id);
                            setRecipientType('individual');
                            setActiveView('compose');
                          }}
                        >
                          Skicka
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent threads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Senaste konversationer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Inga konversationer ännu</p>
                <p className="text-sm">Skicka ditt första meddelande för att komma igång</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'compose' && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Skriv nytt meddelande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recipient selection */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Mottagare</label>
              
              {/* Type selector - endast admin/superadmin ser alla alternativ */}
              <div className="flex gap-2">
                <Button 
                  variant={recipientType === 'individual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecipientType('individual')}
                >
                  Individ
                </Button>
                {canSendToAllRoles && (
                  <Button 
                    variant={recipientType === 'role' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRecipientType('role')}
                  >
                    Hela roller
                  </Button>
                )}
                {canSendToAll && (
                  <Button 
                    variant={recipientType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRecipientType('all')}
                  >
                    Alla användare
                  </Button>
                )}
              </div>

              {/* Individual recipient selector */}
              {recipientType === 'individual' && (
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj mottagare" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRecipients.map((recipient) => {
                      const primaryRole = getPrimaryRole(recipient.roles);
                      return (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(primaryRole)}
                            {recipient.name}
                            <Badge variant="outline" className="text-xs">
                              {roleLabels[primaryRole as keyof typeof roleLabels]}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}

              {/* Role selector */}
              {recipientType === 'role' && (
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj roll" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Alla klienter
                      </div>
                    </SelectItem>
                    <SelectItem value="coach">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Alla coaches
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Alla admins
                      </div>
                    </SelectItem>
                    <SelectItem value="superadmin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Alla superadmins
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* All users indicator */}
              {recipientType === 'all' && (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    Meddelandet kommer att skickas till alla aktiva användare i systemet.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ämne</label>
              <Input
                placeholder="Ämne för meddelandet"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
              />
            </div>

            {/* Message content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Meddelande</label>
              <Textarea
                placeholder="Skriv ditt meddelande här..."
                rows={8}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>

            {/* Send button */}
            <div className="flex gap-3">
              <Button 
                onClick={handleSendMessage}
                disabled={!messageContent.trim()}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Skicka meddelande
              </Button>
              <Button 
                variant="outline"
                onClick={() => setActiveView('overview')}
              >
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};