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
import { useAuth } from '@/hooks/useAuth';
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

      if (rolesError) throw rolesError;

      const roles = userRoles?.map(r => r.role) || [];
      const isClient = roles.includes('client') || (!roles.includes('admin') && !roles.includes('superadmin') && !roles.includes('coach'));
      const isCoach = roles.includes('coach');
      const isAdmin = roles.includes('admin');
      const isSuperAdmin = roles.includes('superadmin');

      let recipientQuery = supabase
        .from('profiles')
        .select(`
          id, 
          first_name, 
          last_name, 
          email,
          user_roles:user_roles!inner(role)
        `)
        .neq('id', user.id);

      if (isClient) {
        // Clients can only message their coaches
        const { data: relationships } = await supabase
          .from('coach_client_assignments')
          .select('coach_id')
          .eq('client_id', user.id)
          .eq('is_active', true);

        const coachIds = relationships?.map(r => r.coach_id) || [];
        if (coachIds.length > 0) {
          recipientQuery = recipientQuery.in('id', coachIds);
        } else {
          setRecipients([]);
          return;
        }
      } else if (isCoach) {
        // Coaches can message their clients and other coaches/admins
        const { data: relationships } = await supabase
          .from('coach_client_assignments')
          .select('client_id')
          .eq('coach_id', user.id)
          .eq('is_active', true);

        const clientIds = relationships?.map(r => r.client_id) || [];
        
        // Get all coaches and admins
        const { data: coachesAndAdmins } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['coach', 'admin']);

        const coachAndAdminIds = coachesAndAdmins?.map(r => r.user_id) || [];
        const allowedIds = [...clientIds, ...coachAndAdminIds];
        
        if (allowedIds.length > 0) {
          recipientQuery = recipientQuery.in('id', allowedIds);
        } else {
          setRecipients([]);
          return;
        }
      } else if (isAdmin) {
        // Admins can message anyone except superadmins
        recipientQuery = recipientQuery.not('user_roles.role', 'eq', 'superadmin');
      } else if (isSuperAdmin) {
        // Superadmins can only message other superadmins
        recipientQuery = recipientQuery.eq('user_roles.role', 'superadmin');
      }

      const { data, error } = await recipientQuery;

      if (error) throw error;
      setRecipients(data || []);
    } catch (error) {
      console.error('Error fetching recipients:', error);
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