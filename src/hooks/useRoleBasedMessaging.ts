/**
 * 🎯 ROLE-BASED MESSAGING HOOK
 * 
 * Hanterar messaging-logik baserat på användarroller
 * Kopplar samman rolltilldelning med meddelandesynlighet
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';

interface MessageRecipient {
  id: string;
  name: string;
  email: string;
  roles: string[];
  avatar_url?: string;
  relationship?: 'coach' | 'client' | 'admin' | 'all';
}

interface MessageThread {
  id: string;
  participants: MessageRecipient[];
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_group: boolean;
}

interface SendMessageParams {
  recipients: string[];
  content: string;
  subject?: string;
  message_type: 'individual' | 'role_broadcast' | 'system_wide';
}

export const useRoleBasedMessaging = () => {
  const { user, hasRole, roles } = useAuth();
  const { toast } = useToast();
  
  const [availableRecipients, setAvailableRecipients] = useState<MessageRecipient[]>([]);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = hasRole('superadmin');
  const isAdmin = hasRole('admin');
  const isCoach = hasRole('coach');
  const isClient = hasRole('client');

  // Ladda tillgängliga mottagare baserat på användarens roll
  const loadAvailableRecipients = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      let recipients: MessageRecipient[] = [];

      // Stefan AI är alltid tillgänglig
      recipients.push({
        id: 'stefan_ai',
        name: 'Stefan AI',
        email: 'stefan@ai.coach',
        roles: ['ai_assistant'],
        relationship: 'all'
      });

      if (isClient) {
        // Klienter kan bara kontakta sin tilldelade coach
        const { data: coachAssignments, error: coachError } = await supabase
          .from('coach_client_assignments')
          .select(`
            coach_id,
            profiles!coach_id(
              id, 
              first_name, 
              last_name, 
              email, 
              avatar_url,
              user_roles(role)
            )
          `)
          .eq('client_id', user.id)
          .eq('is_active', true);

        if (coachError) throw coachError;

        if (coachAssignments) {
          coachAssignments.forEach(assignment => {
            const profile = assignment.profiles as any;
            if (profile) {
              recipients.push({
                id: profile.id,
                name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
                email: profile.email,
                roles: profile.user_roles?.map((ur: any) => ur.role) || ['coach'],
                avatar_url: profile.avatar_url,
                relationship: 'coach'
              });
            }
          });
        }

      } else if (isCoach) {
        // Coaches kan kontakta sina tilldelade klienter
        const { data: clientAssignments, error: clientError } = await supabase
          .from('coach_client_assignments')
          .select(`
            client_id,
            profiles!client_id(
              id, 
              first_name, 
              last_name, 
              email, 
              avatar_url,
              user_roles(role)
            )
          `)
          .eq('coach_id', user.id)
          .eq('is_active', true);

        if (clientError) throw clientError;

        if (clientAssignments) {
          clientAssignments.forEach(assignment => {
            const profile = assignment.profiles as any;
            if (profile) {
              recipients.push({
                id: profile.id,
                name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
                email: profile.email,
                roles: profile.user_roles?.map((ur: any) => ur.role) || ['client'],
                avatar_url: profile.avatar_url,
                relationship: 'client'
              });
            }
          });
        }

      } else if (isSuperAdmin || isAdmin) {
        // Admins och superadmins kan kontakta alla användare
        const { data: allUsers, error: allUsersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .eq('is_active', true)
          .neq('id', user.id);

        if (allUsersError) throw allUsersError;

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
              avatar_url: profile.avatar_url,
              relationship: 'all'
            });
          }
        }
      }

      setAvailableRecipients(recipients);

    } catch (error: any) {
      console.error('Error loading recipients:', error);
      setError('Kunde inte ladda mottagare');
      toast({
        title: "Fel",
        description: "Kunde inte ladda tillgängliga mottagare",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, isClient, isCoach, isAdmin, isSuperAdmin, toast]);

  // Skicka meddelande
  const sendMessage = useCallback(async (params: SendMessageParams) => {
    if (!user?.id) return false;

    try {
      // Validera behörigheter
      if (isClient && params.message_type !== 'individual') {
        throw new Error('Klienter kan bara skicka individuella meddelanden');
      }

      if (!isSuperAdmin && !isAdmin && params.message_type === 'system_wide') {
        throw new Error('Endast admins kan skicka systemomfattande meddelanden');
      }

      // Använd edge function för att skicka meddelandet
      const { data, error } = await supabase.functions.invoke('send-message-notification', {
        body: {
          sender_id: user.id,
          recipient_ids: params.recipients,
          content: params.content,
          subject: params.subject,
          message_type: params.message_type
        }
      });

      if (error) throw error;

      toast({
        title: "Meddelande skickat",
        description: `Skickat till ${params.recipients.length} mottagare`
      });

      return true;

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skicka meddelandet",
        variant: "destructive"
      });
      return false;
    }
  }, [user?.id, isClient, isAdmin, isSuperAdmin, toast]);

  // Skicka till Stefan AI
  const sendToStefanAI = useCallback(async (message: string) => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.functions.invoke('stefan-enhanced-chat', {
        body: {
          message,
          user_id: user.id,
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

      return true;

    } catch (error: any) {
      console.error('Error sending to Stefan AI:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka till Stefan AI",
        variant: "destructive"
      });
      return false;
    }
  }, [user?.id, toast]);

  // Broadcast till roll
  const broadcastToRole = useCallback(async (role: string, content: string, subject?: string) => {
    if (!isSuperAdmin && !isAdmin) {
      toast({
        title: "Otillräckliga behörigheter",
        description: "Endast admins kan skicka rollbroadcasts",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Hämta alla användare med denna roll
      const { data: roleUsers, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', role as any);

      if (error) throw error;

      const recipientIds = roleUsers?.map(ru => ru.user_id) || [];

      return await sendMessage({
        recipients: recipientIds,
        content,
        subject,
        message_type: 'role_broadcast'
      });

    } catch (error: any) {
      console.error('Error broadcasting to role:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka till rollen",
        variant: "destructive"
      });
      return false;
    }
  }, [isSuperAdmin, isAdmin, sendMessage, toast]);

  // Hämta tillgängliga roller för broadcast
  const getAvailableRolesForBroadcast = useCallback(() => {
    if (!isSuperAdmin && !isAdmin) return [];
    
    return [
      { value: 'client', label: 'Alla klienter' },
      { value: 'coach', label: 'Alla coaches' },
      { value: 'admin', label: 'Alla admins' },
      ...(isSuperAdmin ? [{ value: 'superadmin', label: 'Alla superadmins' }] : [])
    ];
  }, [isSuperAdmin, isAdmin]);

  // Ladda data vid komponentmount
  useEffect(() => {
    if (user?.id) {
      loadAvailableRecipients();
    }
  }, [user?.id, loadAvailableRecipients]);

  return {
    // Data
    availableRecipients,
    messageThreads,
    loading,
    error,

    // Permissions
    canSendToAll: isSuperAdmin || isAdmin,
    canBroadcastToRoles: isSuperAdmin || isAdmin,
    canSendIndividual: true,

    // Actions
    sendMessage,
    sendToStefanAI,
    broadcastToRole,
    loadAvailableRecipients,
    getAvailableRolesForBroadcast,

    // Helper functions
    getRecipientsByRole: (role: string) => 
      availableRecipients.filter(r => r.roles.includes(role)),
    
    getCoachAssignedClients: () => 
      availableRecipients.filter(r => r.relationship === 'client'),
    
    getAssignedCoach: () => 
      availableRecipients.find(r => r.relationship === 'coach')
  };
};