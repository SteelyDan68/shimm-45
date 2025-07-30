import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAccessControl = () => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = () => {
    const accessGranted = localStorage.getItem('shimm_access_granted');
    const codeId = localStorage.getItem('shimm_access_code_id');
    
    if (accessGranted === 'true' && codeId) {
      setHasAccess(true);
    } else {
      setHasAccess(false);
    }
    setIsLoading(false);
  };

  const markCodeAsUsed = async (userId: string) => {
    const codeId = localStorage.getItem('shimm_access_code_id');
    if (!codeId) return;

    try {
      await supabase
        .from('access_codes')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          used_by: userId
        })
        .eq('id', codeId);

      // Clear access session after successful registration
      localStorage.removeItem('shimm_access_granted');
      localStorage.removeItem('shimm_access_code_id');
    } catch (error) {
      console.error('Error marking code as used:', error);
    }
  };

  const clearAccess = () => {
    localStorage.removeItem('shimm_access_granted');
    localStorage.removeItem('shimm_access_code_id');
    setHasAccess(false);
  };

  return {
    hasAccess,
    isLoading,
    markCodeAsUsed,
    clearAccess,
    checkAccess
  };
};