import { supabase } from '@/integrations/supabase/client';

/**
 * Delete the specific user borje.sandhill@gmail.com and all their data
 */
export async function deleteBorjeSandhill(): Promise<void> {
  const email = 'borje.sandhill@gmail.com';
  
  try {
    console.log(`🔍 Looking for user: ${email}`);

    // 1. Find the user by email
    const { data: user, error: findError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .single();

    if (findError || !user) {
      console.log(`❌ User not found: ${email}`);
      throw new Error(`User not found: ${email}`);
    }

    const userId = user.id;
    const userName = `${user.first_name} ${user.last_name}`;
    
    console.log(`✅ Found user: ${userName} (${user.email}) - ID: ${userId}`);

    // 2. Delete all related data in sequence

    // Delete pillar assessments
    await supabase
      .from('pillar_assessments')
      .delete()
      .eq('client_id', userId);
    console.log(`🗑️ Deleted pillar assessments for ${userName}`);

    // Delete tasks
    await supabase
      .from('tasks')
      .delete()
      .eq('client_id', userId);
    console.log(`🗑️ Deleted tasks for ${userName}`);

    // Delete messages (as sender or receiver)
    await supabase
      .from('messages')
      .delete()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    console.log(`🗑️ Deleted messages for ${userName}`);

    // Delete invitations
    await supabase
      .from('invitations')
      .delete()
      .eq('invited_by', userId);
    console.log(`🗑️ Deleted invitations for ${userName}`);

    // Delete user roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    console.log(`🗑️ Deleted user roles for ${userName}`);

    // Delete from legacy clients table if exists
    await supabase
      .from('clients')
      .delete()
      .eq('email', user.email);
    console.log(`🗑️ Deleted legacy client data for ${userName}`);

    // 3. Finally, delete the profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    console.log(`🗑️ Deleted profile for ${userName}`);

    console.log(`🎉 Successfully deleted all data for ${userName} (${email})`);
    
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}