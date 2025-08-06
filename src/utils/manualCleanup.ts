/**
 * 🚨 EMERGENCY CLEANUP UTILITY
 * 
 * Manuell radering av användare som fastnat i GDPR-processen
 */

import { supabase } from '@/integrations/supabase/client';

export const emergencyUserCleanup = async (userIdOrEmail: string): Promise<boolean> => {
  try {
    console.log(`🚨 EMERGENCY: Starting cleanup for ${userIdOrEmail}`);
    
    // Call the edge function directly
    const { data, error } = await supabase.functions.invoke('user-deletion', {
      body: {
        identifier: userIdOrEmail,
        admin_user_id: (await supabase.auth.getUser()).data.user?.id
      }
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return false;
    }

    if (data?.success) {
      console.log('✅ Emergency cleanup successful:', data);
      
      // Trigger all global events to refresh components
      window.dispatchEvent(new CustomEvent('userDeleted'));
      window.dispatchEvent(new CustomEvent('userDataChanged'));
      window.dispatchEvent(new CustomEvent('gdprActionCompleted'));
      
      return true;
    } else {
      console.error('❌ Cleanup failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Emergency cleanup error:', error);
    return false;
  }
};

// Direct call för debugging
if (typeof window !== 'undefined') {
  (window as any).emergencyUserCleanup = emergencyUserCleanup;
}