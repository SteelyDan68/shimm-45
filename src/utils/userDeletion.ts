import { supabase } from '@/integrations/supabase/client';

export interface UserDeletionResult {
  user_found: boolean;
  deleted_profile: boolean;
  deleted_roles: number;
  deleted_assessments: number;
  deleted_tasks: number;
  deleted_messages: number;
  deleted_other_data: number;
  errors: string[];
}

/**
 * Delete a specific user and all their data from the system
 */
export async function deleteUserCompletely(identifier: string): Promise<UserDeletionResult> {
  const result: UserDeletionResult = {
    user_found: false,
    deleted_profile: false,
    deleted_roles: 0,
    deleted_assessments: 0,
    deleted_tasks: 0,
    deleted_messages: 0,
    deleted_other_data: 0,
    errors: []
  };

  try {
    console.log(`🔍 Looking for user: ${identifier}`);

    // 1. Find the user by name or email
    const { data: user, error: findError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .or(`email.ilike.%${identifier}%, first_name.ilike.%${identifier}%, last_name.ilike.%${identifier}%`)
      .single();

    if (findError || !user) {
      console.log(`❌ User not found: ${identifier}`);
      result.errors.push(`User not found: ${identifier}`);
      return result;
    }

    result.user_found = true;
    const userId = user.id;
    const userName = `${user.first_name} ${user.last_name}`;
    
    console.log(`✅ Found user: ${userName} (${user.email}) - ID: ${userId}`);

    // 2. Delete all related data

    // Delete pillar assessments
    const { error: assessmentsError } = await supabase
      .from('pillar_assessments')
      .delete()
      .eq('client_id', userId);
    
    if (assessmentsError) {
      result.errors.push(`Failed to delete assessments: ${assessmentsError.message}`);
    } else {
      result.deleted_assessments++;
      console.log(`🗑️ Deleted pillar assessments for ${userName}`);
    }

    // Delete tasks
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('client_id', userId);
    
    if (tasksError) {
      result.errors.push(`Failed to delete tasks: ${tasksError.message}`);
    } else {
      result.deleted_tasks++;
      console.log(`🗑️ Deleted tasks for ${userName}`);
    }

    // Delete messages (as sender or receiver)
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    
    if (messagesError) {
      result.errors.push(`Failed to delete messages: ${messagesError.message}`);
    } else {
      result.deleted_messages++;
      console.log(`🗑️ Deleted messages for ${userName}`);
    }

    // Delete invitations
    const { error: invitationsError } = await supabase
      .from('invitations')
      .delete()
      .eq('invited_by', userId);
    
    if (invitationsError) {
      result.errors.push(`Failed to delete invitations: ${invitationsError.message}`);
    } else {
      result.deleted_other_data++;
      console.log(`🗑️ Deleted invitations for ${userName}`);
    }

    // Delete user roles
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (rolesError) {
      result.errors.push(`Failed to delete user roles: ${rolesError.message}`);
    } else {
      result.deleted_roles++;
      console.log(`🗑️ Deleted user roles for ${userName}`);
    }

    // Delete from legacy clients table if exists
    const { error: legacyError } = await supabase
      .from('clients')
      .delete()
      .eq('email', user.email);
    
    if (legacyError) {
      // Don't count as error - table might not exist or user might not be there
      console.log(`ℹ️ No legacy client data found for ${userName}`);
    } else {
      result.deleted_other_data++;
      console.log(`🗑️ Deleted legacy client data for ${userName}`);
    }

    // 3. Finally, delete the profile
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (deleteProfileError) {
      result.errors.push(`Failed to delete profile: ${deleteProfileError.message}`);
    } else {
      result.deleted_profile = true;
      console.log(`🗑️ Deleted profile for ${userName}`);
    }

    console.log(`🎉 Successfully deleted all data for ${userName}`);
    
    if (result.errors.length > 0) {
      console.error('❌ Some deletion errors occurred:', result.errors);
    }

    return result;

  } catch (error: any) {
    result.errors.push(`Deletion failed: ${error.message}`);
    console.error('User deletion failed:', error);
    return result;
  }
}