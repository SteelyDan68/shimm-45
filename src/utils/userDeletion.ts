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
      triggerUserEvent('userDeleted', { 
        userId: identifier,
        action: 'gdpr_complete_deletion',
        email: identifier.includes('@') ? identifier : undefined
      });
      
      return {
        user_found: true,
        deleted_profile: true,
        deleted_roles: data.total_deleted || 0,
        deleted_assessments: 0,
        deleted_tasks: 0,
        deleted_messages: 0,
        deleted_other_data: data.total_deleted || 0,
        errors: []
      };
    } else {
      // Check if it's a successful message but without success flag
      const isActuallySuccessful = data?.message && 
        (data.message.includes('completely deleted') || data.message.includes('Results:'));
      
      if (isActuallySuccessful) {
        console.log('✅ Deletion successful (legacy format):', data);
        
        // Parse the results from the message
        const messageText = data.message;
        const totalDeleted = messageText.split(', ').length - 1; // Rough estimate
        
        // Trigger comprehensive global refresh events
        triggerUserEvent('userDeleted', { 
          userId: identifier,
          action: 'gdpr_complete_deletion',
          email: identifier.includes('@') ? identifier : undefined
        });
        
        return {
          user_found: true,
          deleted_profile: true,
          deleted_roles: totalDeleted,
          deleted_assessments: 0,
          deleted_tasks: 0,
          deleted_messages: 0,
          deleted_other_data: totalDeleted,
          errors: []
        };
      }
      
      // Handle failure case
      const errorMessage = data?.message || 'Unknown deletion error';
      console.error('❌ Deletion failed:', errorMessage);
      
      return {
        user_found: errorMessage.includes('not found') ? false : true,
        deleted_profile: false,
        deleted_roles: 0,
        deleted_assessments: 0,
        deleted_tasks: 0,
        deleted_messages: 0,
        deleted_other_data: 0,
        errors: [errorMessage]
      };
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