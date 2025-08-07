/**
 * Utility functions for user-specific operations
 */

import { User } from '@supabase/supabase-js';

/**
 * Check if a user is Anna Andersson (for beta testing features)
 */
export const isAnnaAndersson = (user: User | null): boolean => {
  if (!user) return false;
  
  // Check by email
  if (user.email === 'anna@andersson.se' || user.email === 'anna.andersson@example.com') {
    return true;
  }
  
  // Check by name in metadata
  const firstName = user.user_metadata?.first_name?.toLowerCase();
  const lastName = user.user_metadata?.last_name?.toLowerCase();
  
  if (firstName === 'anna' && lastName === 'andersson') {
    return true;
  }
  
  return false;
};

/**
 * Check if user should see beta testing features
 */
export const shouldShowBetaFeatures = (user: User | null): boolean => {
  return isAnnaAndersson(user);
};