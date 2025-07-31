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
    console.log('🚨 User ID:', session.user.id);

    // Call the backend function that can bypass RLS
    const { data, error } = await supabase.functions.invoke('emergency-admin-setup', {
      body: { userId: session.user.id }
    });

    console.log('🚨 Emergency setup response:', { data, error });

    if (error) {
      console.error('Emergency setup error:', error);
      throw error;
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Unknown error occurred');
    }

    console.log('✅ Emergency superadmin setup complete for:', session.user.email);
    console.log('✅ Setup result:', data);
    
    return true;
  } catch (error: any) {
    console.error('❌ Emergency superadmin setup failed:', error);
    return false;
  }
}

// Auto-run emergency setup for Stefan Hallgren (once per session)
let setupCompleted = false;

export async function autoSetupStefan(): Promise<void> {
  // Avoid running setup multiple times per session
  if (setupCompleted) {
    return;
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email === 'stefan.hallgren@gmail.com') {
      console.log('🚨 Auto-running emergency setup for Stefan Hallgren');
      const success = await emergencySuperadminSetup();
      if (success) {
        console.log('✅ Stefan Hallgren superadmin setup completed automatically');
        setupCompleted = true;
      }
    }
  } catch (error) {
    console.error('❌ Auto-setup failed:', error);
  }
}