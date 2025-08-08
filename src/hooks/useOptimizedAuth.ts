/**
 * 🚀 OPTIMIZED AUTH HOOK
 * 
 * Prevents excessive role checking and auth loops
 * Single source of truth for auth state with memoization
 */

import { useMemo } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';

export const useOptimizedAuth = () => {
  const { user, hasRole, roles, signOut, isLoading } = useAuth();

  // Memoize expensive calculations
  const authState = useMemo(() => {
    if (isLoading || !user) {
      return {
        isAuthenticated: false,
        isSuperAdmin: false,
        isAdmin: false,
        isCoach: false,
        isClient: false,
        roles: [],
        user: null
      };
    }

    return {
      isAuthenticated: true,
      isSuperAdmin: hasRole('superadmin'),
      isAdmin: hasRole('admin'),
      isCoach: hasRole('coach'),
      isClient: hasRole('client'),
      roles: roles || [],
      user
    };
  }, [user, roles, hasRole, isLoading]);

  // Cached permission checker
  const hasPermission = useMemo(() => {
    return (permission: string): boolean => {
      switch (permission) {
        case 'broadcast':
          return authState.isSuperAdmin || authState.isAdmin;
        case 'manage_users':
          return authState.isSuperAdmin || authState.isAdmin;
        case 'view_analytics':
          return authState.isSuperAdmin || authState.isAdmin || authState.isCoach;
        case 'coach_clients':
          return authState.isCoach;
        default:
          return false;
      }
    };
  }, [authState]);

  return {
    ...authState,
    hasPermission,
    signOut,
    isLoading
  };
};