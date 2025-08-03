import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';

interface GDPRRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'approved' | 'rejected';
  request_date: string;
  completed_date?: string;
  download_url?: string;
  expires_at?: string;
  error_message?: string;
  reason?: string;
}

interface ConsentRecord {
  id: string;
  consent_type: string;
  consent_given: boolean;
  consent_source: string;
  consent_timestamp: string;
}

export const useGDPR = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Logga GDPR-aktivitet
  const logGDPRActivity = async (action: string, details: Record<string, any> = {}) => {
    if (!user) return;

    try {
      await supabase.from('gdpr_audit_log').insert({
        user_id: user.id,
        action,
        details,
        ip_address: 'client_side', // I en riktig app skulle vi få detta från servern
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log GDPR activity:', error);
    }
  };

  // Begär dataexport
  const requestDataExport = async () => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att begära dataexport",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      await logGDPRActivity('export_requested', {
        request_id: data.id
      });

      toast({
        title: "Dataexport begärd",
        description: "Din begäran har skickats. Du får ett e-post när exporten är klar."
      });

      return data;
    } catch (error) {
      console.error('Error requesting data export:', error);
      toast({
        title: "Fel",
        description: "Kunde inte begära dataexport. Försök igen.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Begär dataradering
  const requestDataDeletion = async (reason: string) => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att begära dataradering",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: user.id,
          reason
        })
        .select()
        .single();

      if (error) throw error;

      await logGDPRActivity('deletion_requested', {
        request_id: data.id,
        reason
      });

      toast({
        title: "Raderingsförfrågan skickad",
        description: "Din förfrågan kommer att granskas av administratörer."
      });

      return data;
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka raderingsförfrågan. Försök igen.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Spara samtycke
  const saveConsent = async (
    consentType: string, 
    consentGiven: boolean, 
    source: string = 'settings_page'
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_consent_records')
        .insert({
          user_id: user.id,
          consent_type: consentType,
          consent_given: consentGiven,
          consent_source: source,
          ip_address: 'client_side',
          user_agent: navigator.userAgent
        })
        .select()
        .single();

      if (error) throw error;

      await logGDPRActivity(consentGiven ? 'consent_given' : 'consent_withdrawn', {
        consent_type: consentType,
        source
      });

      return data;
    } catch (error) {
      console.error('Error saving consent:', error);
      return null;
    }
  };

  // Hämta exportförfrågningar
  const getExportRequests = async (): Promise<GDPRRequest[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('data_export_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        status: item.status as GDPRRequest['status'],
        request_date: item.request_date,
        completed_date: item.completed_date,
        download_url: item.download_url,
        expires_at: item.expires_at,
        error_message: item.error_message
      }));
    } catch (error) {
      console.error('Error fetching export requests:', error);
      return [];
    }
  };

  // Hämta raderingsförfrågningar
  const getDeletionRequests = async (): Promise<GDPRRequest[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        status: item.status as GDPRRequest['status'],
        request_date: item.request_date,
        completed_date: item.completed_date,
        reason: item.reason
      }));
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
      return [];
    }
  };

  // Hämta samtycken
  const getConsentRecords = async (): Promise<ConsentRecord[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_consent_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching consent records:', error);
      return [];
    }
  };

  // Hämta GDPR audit logs för användaren
  const getAuditLogs = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('gdpr_audit_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  };

  return {
    loading,
    requestDataExport,
    requestDataDeletion,
    saveConsent,
    getExportRequests,
    getDeletionRequests,
    getConsentRecords,
    getAuditLogs,
    logGDPRActivity
  };
};