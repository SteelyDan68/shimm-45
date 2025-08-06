import { supabase } from '@/integrations/supabase/client';
import { triggerUserEvent } from '@/hooks/useGlobalUserEvents';

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
 * Uses the edge function for complete deletion with Service Role Key
 */
export async function deleteUserCompletely(identifier: string): Promise<UserDeletionResult> {
  console.log(`🔍 Starting COMPLETE user deletion for: ${identifier}`);
  try {
    console.log(`🔍 Initiating complete user deletion for: ${identifier}`);
    
    // Get current user for admin verification
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    // Call the edge function for comprehensive deletion
    const { data, error } = await supabase.functions.invoke('user-deletion', {
      body: {
        identifier: identifier,
        admin_user_id: currentUser.id
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Deletion service error: ${error.message}`);
    }

    console.log('Deletion result:', data);
    
    // Handle the new response format
    if (data?.success) {
      console.log('✅ Deletion successful:', data);
      
      // Trigger comprehensive global refresh events
      triggerUserEvent('userDeleted', { action: 'gdpr_deletion', userId: identifier });
      triggerUserEvent('gdprActionCompleted', { action: 'deletion', userId: identifier });
      triggerUserEvent('userDataChanged', { action: 'deletion_completed' });
      
      return {
        user_found: true,
        deleted_profile: true,
        deleted_roles: 0,
        deleted_assessments: 0,
        deleted_tasks: 0,
        deleted_messages: 0,
        deleted_other_data: 0,
        errors: []
      };
    } else {
      console.error('❌ Deletion failed:', data?.error);
      throw new Error(data?.error || 'Unknown deletion error');
    }

  } catch (error: any) {
    console.error('User deletion failed:', error);
    return {
      user_found: false,
      deleted_profile: false,
      deleted_roles: 0,
      deleted_assessments: 0,
      deleted_tasks: 0,
      deleted_messages: 0,
      deleted_other_data: 0,
      errors: [`Deletion failed: ${error.message}`]
    };
  }
}