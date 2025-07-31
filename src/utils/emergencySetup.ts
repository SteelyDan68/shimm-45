import { supabase } from '@/integrations/supabase/client';

/**
 * Emergency function to give current user superadmin rights via backend function
 */
export async function emergencySuperadminSetup(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No active session');
    }

    console.log('🚨 Calling emergency admin setup for:', session.user.email);

    // Call the backend function that can bypass RLS
    const { data, error } = await supabase.functions.invoke('emergency-admin-setup', {
      body: { userId: session.user.id }
    });

    if (error) {
      console.error('Emergency setup error:', error);
      throw error;
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Unknown error occurred');
    }

    console.log('✅ Emergency superadmin setup complete for:', session.user.email);
    return true;
  } catch (error: any) {
    console.error('❌ Emergency superadmin setup failed:', error);
    return false;
  }
}