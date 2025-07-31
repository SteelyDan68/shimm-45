import { supabase } from '@/integrations/supabase/client';

export interface CleanupResult {
  deleted_profiles: number;
  deleted_roles: number;
  deleted_assessments: number;
  deleted_tasks: number;
  deleted_messages: number;
  deleted_invitations: number;
  errors: string[];
}

/**
 * Comprehensive cleanup: Remove all users except Superadmin and ALL their data
 */
export async function cleanupAllUsersExceptSuperadmin(): Promise<CleanupResult> {
  const result: CleanupResult = {
    deleted_profiles: 0,
    deleted_roles: 0,
    deleted_assessments: 0,
    deleted_tasks: 0,
    deleted_messages: 0,
    deleted_invitations: 0,
    errors: []
  };

  try {
    console.log('🧹 Starting comprehensive cleanup - keeping only Superadmin...');

    // 1. Identify Superadmin (stefan.hallgren@gmail.com)
    const SUPERADMIN_EMAIL = 'stefan.hallgren@gmail.com';
    const SUPERADMIN_ID = '9065f42b-b9cc-4252-b73f-4374c6286b5e';

    console.log(`🔒 Protecting Superadmin: ${SUPERADMIN_EMAIL} (${SUPERADMIN_ID})`);

    // 2. Get all profiles except Superadmin
    const { data: profilesToDelete, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .neq('email', SUPERADMIN_EMAIL)
      .neq('id', SUPERADMIN_ID);

    if (profilesError) {
      result.errors.push(`Failed to fetch profiles: ${profilesError.message}`);
      return result;
    }

    if (!profilesToDelete || profilesToDelete.length === 0) {
      console.log('✅ No profiles to delete - only Superadmin exists');
      return result;
    }

    const userIdsToDelete = profilesToDelete.map(p => p.id);
    console.log(`📋 Found ${profilesToDelete.length} profiles to delete:`, profilesToDelete.map(p => `${p.first_name} ${p.last_name} (${p.email})`));

    // 3. Delete all related data for these users
    
    // Delete pillar assessments
    const { error: assessmentsError } = await supabase
      .from('pillar_assessments')
      .delete()
      .in('client_id', userIdsToDelete);
    
    if (assessmentsError) {
      result.errors.push(`Failed to delete assessments: ${assessmentsError.message}`);
    } else {
      console.log(`🗑️ Deleted pillar assessments`);
      result.deleted_assessments++;
    }

    // Delete tasks
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .in('client_id', userIdsToDelete);
    
    if (tasksError) {
      result.errors.push(`Failed to delete tasks: ${tasksError.message}`);
    } else {
      console.log(`🗑️ Deleted tasks`);
      result.deleted_tasks++;
    }

    // Delete messages
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .or(`sender_id.in.(${userIdsToDelete.join(',')}),receiver_id.in.(${userIdsToDelete.join(',')})`);
    
    if (messagesError) {
      result.errors.push(`Failed to delete messages: ${messagesError.message}`);
    } else {
      console.log(`🗑️ Deleted messages`);
      result.deleted_messages++;
    }

    // Delete invitations
    const { error: invitationsError } = await supabase
      .from('invitations')
      .delete()
      .in('invited_by', userIdsToDelete);
    
    if (invitationsError) {
      result.errors.push(`Failed to delete invitations: ${invitationsError.message}`);
    } else {
      console.log(`🗑️ Deleted invitations`);
      result.deleted_invitations++;
    }

    // Delete user roles
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .in('user_id', userIdsToDelete);
    
    if (rolesError) {
      result.errors.push(`Failed to delete user roles: ${rolesError.message}`);
    } else {
      result.deleted_roles = userIdsToDelete.length;
      console.log(`🗑️ Deleted ${result.deleted_roles} user roles`);
    }

    // 4. Finally, delete the profiles themselves
    const { error: deleteProfilesError } = await supabase
      .from('profiles')
      .delete()
      .in('id', userIdsToDelete);
    
    if (deleteProfilesError) {
      result.errors.push(`Failed to delete profiles: ${deleteProfilesError.message}`);
    } else {
      result.deleted_profiles = userIdsToDelete.length;
      console.log(`🗑️ Deleted ${result.deleted_profiles} profiles`);
    }

    // 5. Clean up legacy clients table
    const { error: legacyError } = await supabase
      .from('clients')
      .delete()
      .neq('email', SUPERADMIN_EMAIL);
    
    if (legacyError) {
      result.errors.push(`Failed to delete legacy clients: ${legacyError.message}`);
    } else {
      console.log(`🗑️ Cleaned up legacy clients table`);
    }

    console.log(`🎉 Cleanup complete! System reset to Superadmin only.`);
    
    if (result.errors.length > 0) {
      console.error('❌ Cleanup errors:', result.errors);
    }

    return result;

  } catch (error: any) {
    result.errors.push(`Cleanup failed: ${error.message}`);
    console.error('Cleanup failed:', error);
    return result;
  }
}

/**
 * Verify cleanup by checking remaining data
 */
export async function verifyCleanup(): Promise<{ 
  remaining_profiles: number; 
  remaining_roles: number; 
  superadmin_exists: boolean;
}> {
  const { data: profiles } = await supabase.from('profiles').select('id, email');
  const { data: roles } = await supabase.from('user_roles').select('user_id');
  
  const superadminExists = profiles?.some(p => p.email === 'stefan.hallgren@gmail.com') || false;

  return {
    remaining_profiles: profiles?.length || 0,
    remaining_roles: roles?.length || 0,
    superadmin_exists: superadminExists
  };
}