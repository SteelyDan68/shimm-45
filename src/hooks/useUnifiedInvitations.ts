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
      console.log('🚀 Unified Invitations: Sending request', request);

      const { data, error: edgeError } = await supabase.functions.invoke('unified-invitations', {
        body: request
      });

      if (edgeError) {
        console.error('❌ Edge function error:', edgeError);
        throw new Error(edgeError.message || 'Fel vid anrop till inbjudningsfunktion');
      }

      if (!data) {
        throw new Error('Inget svar från inbjudningsfunktion');
      }

      if (!data.success) {
        console.error('❌ Invitation function reported failure:', data);
        throw new Error(data.error || 'Inbjudningsfunktionen misslyckades');
      }

      console.log('✅ Invitations sent successfully:', data);

      // Visa framgångsmeddelande
      if (data.summary.successful > 0) {
        toast.success(`🎉 ${data.message}`, {
          description: `Framgångsgrad: ${data.summary.success_rate}`
        });
      }

      // Visa varningar för fel
      if (data.errors && data.errors.length > 0) {
        toast.warning('⚠️ Vissa inbjudningar misslyckades', {
          description: `${data.summary.failed} av ${data.summary.total_requested} misslyckades`
        });
      }

      return data as InvitationResponse;

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