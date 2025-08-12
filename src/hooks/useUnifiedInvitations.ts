/**
 * 🎯 UNIFIED INVITATION HOOK
 * 
 * Centraliserad hook för all inbjudningsfunktionalitet
 * Ersätter alla fragmenterade invitation hooks och logic
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UnifiedInvitationRequest {
  emails: string | string[];
  role: string;
  invitedBy?: string;
  custom_message?: string;
  expires_in_days?: number;
  send_email?: boolean;
}

export interface InvitationResult {
  email: string;
  success: boolean;
  invitation_id?: string;
  invitation_token?: string;
  invitation_url?: string;
  email_id?: string;
  email_sent?: boolean;
  error?: string;
  dev_mode?: boolean;
}

export interface InvitationResponse {
  success: boolean;
  message: string;
  results: InvitationResult[];
  errors?: string[];
  summary: {
    total_requested: number;
    successful: number;
    failed: number;
    success_rate: string;
  };
}

export interface UseUnifiedInvitationsReturn {
  sendInvitations: (request: UnifiedInvitationRequest) => Promise<InvitationResponse>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useUnifiedInvitations = (): UseUnifiedInvitationsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendInvitations = useCallback(async (
    request: UnifiedInvitationRequest
  ): Promise<InvitationResponse> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Unified Invitations: Sending request to send-simple-invitation', request);

      // Transform request for simple invitation (single email only)
      const emailArray = Array.isArray(request.emails) ? request.emails : [request.emails];
      const firstEmail = emailArray[0];
      const simpleRequest = {
        email: firstEmail,
        role: request.role,
        custom_message: request.custom_message || ''
      };

      console.log('🔄 Använder fungerande send-invitation funktionen');
      
      const { data, error: edgeError } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: firstEmail,
          role: request.role,
          custom_message: request.custom_message || ''
        }
      });

      if (edgeError) {
        console.error('❌ Edge function error:', edgeError);
        throw new Error(edgeError.message || 'Fel vid anrop till inbjudningsfunktion');
      }

      if (!data) {
        throw new Error('Inget svar från inbjudningsfunktion');
      }

      // Normalize edge response (treat email_sent=false as failure to deliver)
      const emailSent = data.email_sent !== false;
      const overallSuccess = Boolean(data.success && emailSent);

      const unifiedResponse: InvitationResponse = {
        success: overallSuccess,
        message: data.message,
        results: [{
          email: firstEmail,
          success: overallSuccess,
          invitation_id: data.invitation_id,
          email_id: data.email_id,
          invitation_url: data.invitation_url,
          dev_mode: data.dev_mode,
          email_sent: emailSent,
          error: overallSuccess ? undefined : (data.email_error || data.error || (emailSent ? undefined : 'E-post kunde inte skickas'))
        }],
        errors: overallSuccess ? undefined : [data.email_error || data.error || 'E-post kunde inte skickas'],
        summary: {
          total_requested: 1,
          successful: overallSuccess ? 1 : 0,
          failed: overallSuccess ? 0 : 1,
          success_rate: overallSuccess ? '100%' : '0%'
        }
      };

      console.log('✅ Invitations sent successfully:', unifiedResponse);

      // Visa framgångsmeddelande
      if (unifiedResponse.summary.successful > 0) {
        toast.success(`✅ MAIL SKICKAT FRAMGÅNGSRIKT!`, {
          description: `Inbjudan till ${firstEmail} har skickats. ${data.dev_mode ? 'Dev-mode aktiv' : 'E-post levererad'}`,
          duration: 6000
        });
      }

      // Visa varningar för fel
      if (unifiedResponse.errors && unifiedResponse.errors.length > 0) {
        toast.error('❌ Inbjudning misslyckades', {
          description: unifiedResponse.errors[0],
          duration: 8000
        });
      }

      // Debug information
      console.log('📧 MAIL STATUS:', {
        email_sent: data.email_sent,
        email_id: data.email_id,
        dev_mode: data.dev_mode,
        success: data.success
      });

      return unifiedResponse;

    } catch (err: any) {
      console.error('❌ Unified Invitations error:', err);
      
      const errorMessage = err.message || 'Ett oväntat fel uppstod vid skickandet av inbjudningar';
      setError(errorMessage);
      
      toast.error('❌ Inbjudningsfel', {
        description: errorMessage
      });

      // Returnera ett fel-response
      return {
        success: false,
        message: errorMessage,
        results: [],
        errors: [errorMessage],
        summary: {
          total_requested: Array.isArray(request.emails) ? request.emails.length : 1,
          successful: 0,
          failed: Array.isArray(request.emails) ? request.emails.length : 1,
          success_rate: '0%'
        }
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sendInvitations,
    loading,
    error,
    clearError
  };
};

/**
 * 🎯 CONVENIENCE HOOKS
 * 
 * Enkla hooks för vanliga use cases
 */

// Hook för att skicka en enstaka inbjudan
export const useSingleInvitation = () => {
  const { sendInvitations, loading, error, clearError } = useUnifiedInvitations();

  const sendInvitation = useCallback(async (
    email: string, 
    role: string, 
    options?: Omit<UnifiedInvitationRequest, 'emails' | 'role'>
  ): Promise<InvitationResult | null> => {
    const response = await sendInvitations({
      emails: email,
      role,
      ...options
    });

    return response.results[0] || null;
  }, [sendInvitations]);

  return {
    sendInvitation,
    loading,
    error,
    clearError
  };
};

// Hook för bulk-inbjudningar
export const useBulkInvitations = () => {
  const { sendInvitations, loading, error, clearError } = useUnifiedInvitations();

  const sendBulkInvitations = useCallback(async (
    emails: string[], 
    role: string, 
    options?: Omit<UnifiedInvitationRequest, 'emails' | 'role'>
  ): Promise<InvitationResponse> => {
    return await sendInvitations({
      emails,
      role,
      ...options
    });
  }, [sendInvitations]);

  return {
    sendBulkInvitations,
    loading,
    error,
    clearError
  };
};