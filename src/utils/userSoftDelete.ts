import { supabase } from '@/integrations/supabase/client';

export interface UserSoftDeleteResult {
  success: boolean;
  message: string;
  user_id?: string;
  email?: string;
}

/**
 * Soft delete a user (inactivate them) - standard delete function
 * User remains in database but is marked as inactive
 */
export async function softDeleteUser(userId: string, reason: string = 'admin_action'): Promise<UserSoftDeleteResult> {
  try {
    console.log(`🔄 Initiating soft delete for user: ${userId}`);
    
    // Get current user for admin verification
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    // Call the edge function for soft deletion
    const { data, error } = await supabase.functions.invoke('user-soft-delete', {
      body: {
        user_id: userId,
        reason: reason,
        admin_user_id: currentUser.id
      }
    });

    if (error) {
      console.error('Soft delete error:', error);
      throw new Error(`Soft delete service error: ${error.message}`);
    }

    console.log('Soft delete result:', data);
    return {
      success: true,
      message: data.message || 'User deactivated successfully',
      user_id: userId,
      email: data.email
    };

  } catch (error: any) {
    console.error('Soft delete failed:', error);
    return {
      success: false,
      message: `Soft delete failed: ${error.message}`,
      user_id: userId
    };
  }
}

/**
 * Reactivate a previously soft-deleted user
 */
export async function reactivateUser(userId: string): Promise<UserSoftDeleteResult> {
  try {
    console.log(`🔄 Initiating reactivation for user: ${userId}`);
    
    // Get current user for admin verification
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    // Call the edge function for reactivation
    const { data, error } = await supabase.functions.invoke('user-reactivate', {
      body: {
        user_id: userId,
        admin_user_id: currentUser.id
      }
    });

    if (error) {
      console.error('Reactivation error:', error);
      throw new Error(`Reactivation service error: ${error.message}`);
    }

    console.log('Reactivation result:', data);
    return {
      success: true,
      message: data.message || 'User reactivated successfully',
      user_id: userId,
      email: data.email
    };

  } catch (error: any) {
    console.error('Reactivation failed:', error);
    return {
      success: false,
      message: `Reactivation failed: ${error.message}`,
      user_id: userId
    };
  }
}