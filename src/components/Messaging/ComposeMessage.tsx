import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bot, Send } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface ComposeMessageProps {
  onClose: () => void;
  onSent: () => void;
  refreshMessages?: () => void;
  replyToMessage?: {
    id: string;
    sender_id: string;
    content: string;
    subject?: string;
  };
}

export const ComposeMessage = ({ onClose, onSent, replyToMessage, refreshMessages }: ComposeMessageProps) => {
  const [recipients, setRecipients] = useState<Profile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const { sendMessage, getAISuggestion } = useMessages();
  const { user } = useAuth();

  useEffect(() => {
    fetchRecipients();
    
    if (replyToMessage) {
      setSelectedRecipient(replyToMessage.sender_id);
      setSubject(replyToMessage.subject?.startsWith('Re: ') 
        ? replyToMessage.subject 
        : `Re: ${replyToMessage.subject || 'Inget ämne'}`
      );
    }
  }, [replyToMessage]);

  const fetchRecipients = async () => {
    if (!user) return;
    
    

    try {
      // Get user's roles first
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }

      const roles = userRoles?.map(r => r.role) || [];
      
      
      const isClient = roles.includes('client');
      const isCoach = roles.includes('coach');
      const isAdmin = roles.includes('admin');
      const isSuperAdmin = roles.includes('superadmin');

      let allowedRecipients: Profile[] = [];

      if (isSuperAdmin) {
        // Superadmins can message EVERYONE
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .neq('id', user.id);

        if (error) throw error;
        allowedRecipients = data || [];
        

      } else if (isAdmin) {
        // Admins can message anyone except superadmins
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id, 
            first_name, 
            last_name, 
            email
          `)
          .neq('id', user.id);

        if (error) throw error;

        // Filter out superadmins
        const { data: superAdminIds } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'superadmin');

        const superAdminUserIds = superAdminIds?.map(r => r.user_id) || [];
        allowedRecipients = (data || []).filter(profile => !superAdminUserIds.includes(profile.id));
        

      } else if (isCoach) {
        // Coaches can message their assigned clients + other coaches + admins
        
        // Get assigned clients
        const { data: clientRelationships, error: clientError } = await supabase
          .from('coach_client_assignments')
          .select('client_id')
          .eq('coach_id', user.id)
          .eq('is_active', true);

        if (clientError) {
          console.error('Error fetching client relationships:', clientError);
          throw clientError;
        }

        const clientIds = clientRelationships?.map(r => r.client_id) || [];
        let clients: Profile[] = [];
        
        if (clientIds.length > 0) {
          const { data: clientProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', clientIds);
          
          clients = clientProfiles || [];
        }
        

        // Get other coaches and admins
        const { data: coachAdminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['coach', 'admin'])
          .neq('user_id', user.id);

        const coachAdminIds = coachAdminRoles?.map(r => r.user_id) || [];
        
        if (coachAdminIds.length > 0) {
          const { data: coachAdminProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', coachAdminIds);

          const coachesAndAdmins = coachAdminProfiles || [];
          
          
          allowedRecipients = [...clients, ...coachesAndAdmins];
        } else {
          allowedRecipients = clients;
        }

      } else if (isClient) {
        // Clients can only message their assigned coaches
        const { data: coachRelationships, error: coachError } = await supabase
          .from('coach_client_assignments')
          .select('coach_id')
          .eq('client_id', user.id)
          .eq('is_active', true);

        if (coachError) {
          console.error('Error fetching coach relationships:', coachError);
          throw coachError;
        }

        const coachIds = coachRelationships?.map(r => r.coach_id) || [];
        
        if (coachIds.length > 0) {
          const { data: coachProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', coachIds);
          
          allowedRecipients = coachProfiles || [];
        } else {
          allowedRecipients = [];
        }
        console.log('🔍 Client: Found', allowedRecipients.length, 'assigned coaches');

        if (allowedRecipients.length === 0) {
          console.warn('🚨 Client has no assigned coaches!');
        }

      } else {
        // Default users (no specific role) can only message admins and coaches
        const { data: adminCoachRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['admin', 'coach']);

        const adminCoachIds = adminCoachRoles?.map(r => r.user_id) || [];
        
        if (adminCoachIds.length > 0) {
          const { data: adminCoachProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', adminCoachIds);

          allowedRecipients = adminCoachProfiles || [];
        }
        console.log('🔍 Default user: Found', allowedRecipients.length, 'admins/coaches');
      }

      // Remove duplicates and sort
      const uniqueRecipients = allowedRecipients.filter((recipient, index, self) => 
        index === self.findIndex(r => r.id === recipient.id)
      ).sort((a, b) => {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email || '';
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email || '';
        return nameA.localeCompare(nameB);
      });

      console.log('🔍 Final recipients:', uniqueRecipients.length);
      setRecipients(uniqueRecipients);

    } catch (error) {
      console.error('🚨 Error fetching recipients:', error);
      setRecipients([]);
    }
  };

  const handleGetAISuggestion = async () => {
    if (!replyToMessage || !selectedRecipient) return;

    setIsLoadingAI(true);
    try {
      const recipient = recipients.find(r => r.id === selectedRecipient);
      const senderName = recipient ? `${recipient.first_name} ${recipient.last_name}`.trim() : 'Klient';
      
      const suggestion = await getAISuggestion(
        replyToMessage.content,
        senderName,
        'Coaching-konversation'
      );
      
      if (suggestion) {
        setAiSuggestion(suggestion);
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSend = async () => {
    if (!selectedRecipient || !content.trim()) return;

    setIsLoading(true);
    try {
      const success = await sendMessage(
        selectedRecipient,
        content,
        subject || undefined,
        replyToMessage?.id
      );

      if (success) {
        // Refresh message lists immediately
        refreshMessages?.();
        onSent();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecipientName = (profile: Profile) => {
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return name || profile.email || 'Okänd användare';
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">
            {replyToMessage ? 'Svara på meddelande' : 'Nytt meddelande'}
          </h3>
          <HelpTooltip content={helpTexts.messages.composeMessage} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="recipient">Till</Label>
          <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
            <SelectTrigger>
              <SelectValue placeholder="Välj mottagare" />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((recipient) => (
                <SelectItem key={recipient.id} value={recipient.id}>
                  {getRecipientName(recipient)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subject">Ämne</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ange ämne"
          />
        </div>

        {replyToMessage && (
          <div className="bg-muted/50 p-3 rounded-lg border-l-4 border-muted">
            <p className="text-sm text-muted-foreground mb-1">Svarar på:</p>
            <p className="text-sm">{replyToMessage.content}</p>
          </div>
        )}

        {replyToMessage && (
          <div className="flex items-center space-x-2">
            <Switch
              id="use-ai"
              checked={useAI}
              onCheckedChange={setUseAI}
            />
            <div className="flex items-center gap-1">
              <Label htmlFor="use-ai">Använd AI-assistent för svar</Label>
              <HelpTooltip content={helpTexts.messages.aiAssisted} />
            </div>
            {useAI && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetAISuggestion}
                disabled={isLoadingAI}
              >
                <Bot className="h-4 w-4 mr-1" />
                {isLoadingAI ? 'Genererar...' : 'Få förslag'}
              </Button>
            )}
          </div>
        )}

        {aiSuggestion && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 mb-2">AI-förslag:</p>
            <p className="text-sm text-blue-700 mb-2">{aiSuggestion}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setContent(aiSuggestion)}
            >
              Använd detta förslag
            </Button>
          </div>
        )}

        <div>
          <Label htmlFor="content">Meddelande</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Skriv ditt meddelande här..."
            rows={6}
            className="resize-none"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSend}
            disabled={!selectedRecipient || !content.trim() || isLoading}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Skickar...' : 'Skicka'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
        </div>
      </div>
    </div>
  );
};