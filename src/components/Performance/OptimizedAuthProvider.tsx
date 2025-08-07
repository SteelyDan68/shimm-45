/**
 * 🚀 OPTIMIZED AUTH PROVIDER
 * Eliminerar performance bottlenecks i auth systemet
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
type AppRole = 'superadmin' | 'admin' | 'coach' | 'client';
import { useOptimizedUserData, useQueryInvalidation } from '@/hooks/useOptimizedQuery';

interface OptimizedAuthContextType {
  user: User | null;
  roles: AppRole[];
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  refreshUserData: () => void;
}

const OptimizedAuthContext = createContext<OptimizedAuthContextType | null>(null);

interface OptimizedAuthProviderProps {
  children: React.ReactNode;
  user: User | null;
}

/**
 * 🎯 PERFORMANCE-OPTIMIZED AUTH PROVIDER
 * Wrapper som optimerar auth queries och caching
 */
export const OptimizedAuthProvider: React.FC<OptimizedAuthProviderProps> = ({ 
  children, 
  user 
}) => {
  const { invalidateUserData } = useQueryInvalidation();
  
  // Använd optimized query hook istället för direkta supabase calls
  const { 
    data: userData, 
    isLoading,
    error 
  } = useOptimizedUserData(user?.id || '', {
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache för auth data
    cacheTime: 30 * 60 * 1000, // 30 minutes för background cache
  });

  // Memoized role checks för att undvika re-computation
  const roles = useMemo(() => {
    const userRoles = userData?.roles || [];
    // Filter to only include valid AppRoles
    return userRoles.filter((role: any): role is AppRole => 
      ['superadmin', 'admin', 'coach', 'client'].includes(role)
    );
  }, [userData?.roles]);

  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  const hasAnyRole = useCallback((checkRoles: AppRole[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  }, [roles]);

  const isAdmin = useCallback((): boolean => {
    return hasAnyRole(['superadmin', 'admin']);
  }, [hasAnyRole]);

  const isSuperAdmin = useCallback((): boolean => {
    return hasRole('superadmin');
  }, [hasRole]);

  const refreshUserData = useCallback(() => {
    if (user?.id) {
      invalidateUserData(user.id);
    }
  }, [user?.id, invalidateUserData]);

  // Memoized context value för att undvika re-renders
  const contextValue = useMemo(() => ({
    user,
    roles,
    isLoading,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    refreshUserData,
  }), [
    user,
    roles,
    isLoading,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    refreshUserData,
  ]);

  // Error boundary för robusthet
  if (error) {
    console.error('OptimizedAuthProvider error:', error);
    // Fallback till original auth provider eller error state
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Auth system temporarily unavailable</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <OptimizedAuthContext.Provider value={contextValue}>
      {children}
    </OptimizedAuthContext.Provider>
  );
};

/**
 * 🎯 OPTIMIZED AUTH HOOK
 * Drop-in replacement för useAuth med performance optimizations
 */
export const useOptimizedAuth = (): OptimizedAuthContextType => {
  const context = useContext(OptimizedAuthContext);
  
  if (!context) {
    throw new Error('useOptimizedAuth must be used within OptimizedAuthProvider');
  }
  
  return context;
};

export default OptimizedAuthProvider;