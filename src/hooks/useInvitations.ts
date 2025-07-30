import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Invitation {
  id: string;
  email: string;
  token: string;
  invited_role: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

interface InvitationValidation {
  invitation_id: string;
  email: string;
  invited_role: string;
  expires_at: string;
  is_valid: boolean;
}

export const useInvitations = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadInvitations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error loading invitations:', error);
      toast.error('Kunde inte ladda inbjudningar');
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitation = async (email: string, role: string = 'client', inviterName?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: { email, role, inviterName }
      });

      if (error) throw error;

      toast.success(`Inbjudan skickad till ${email}`);
      await loadInvitations(); // Reload invitations
      return data;
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || 'Ett fel uppstod när inbjudan skulle skickas');
      throw error;
    }
  };

  const validateInvitation = async (token: string): Promise<InvitationValidation | null> => {
    try {
      const { data, error } = await supabase
        .rpc('validate_invitation_token', { invitation_token: token });

      if (error) throw error;

      return data?.[0] || null;
    } catch (error: any) {
      console.error('Error validating invitation:', error);
      return null;
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Inbjudan avbruten');
      await loadInvitations();
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      toast.error('Kunde inte avbryta inbjudan');
      throw error;
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  return {
    invitations,
    isLoading,
    loadInvitations,
    sendInvitation,
    validateInvitation,
    acceptInvitation,
    cancelInvitation,
  };
};