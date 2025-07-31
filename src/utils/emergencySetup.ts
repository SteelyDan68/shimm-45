import { supabase } from '@/integrations/supabase/client';

/**
 * Emergency function to give current user superadmin rights
 */
export async function emergencySuperadminSetup(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No active session');
    }

    // Get or create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Create profile if it doesn't exist
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          email: session.user.email,
          first_name: 'Super',
          last_name: 'Admin',
          status: 'active'
        });
      
      if (createError) throw createError;
    }

    // Remove existing roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', session.user.id);

    // Add superadmin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: session.user.id,
        role: 'superadmin'
      });

    if (roleError) throw roleError;

    console.log('✅ Superadmin setup complete for:', session.user.email);
    return true;
  } catch (error: any) {
    console.error('❌ Superadmin setup failed:', error);
    return false;
  }
}