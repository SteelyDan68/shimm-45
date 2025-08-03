import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';

/**
 * Performance-optimized role caching hook
 * Prevents excessive hasRole() calls
 */
export const useRoleCache = () => {
  const { user, hasRole } = useAuth();
  const [roleCache, setRoleCache] = useState<Record<string, boolean>>({});
  const lastUserIdRef = useRef<string | null>(null);

  // Cache all roles when user changes
  useEffect(() => {
    if (!user?.id || user.id === lastUserIdRef.current) return;
    
    lastUserIdRef.current = user.id;
    
    // Cache all possible roles
    const roles = ['admin', 'superadmin', 'coach', 'client'];
    const cache: Record<string, boolean> = {};
    
    roles.forEach(role => {
      cache[role] = hasRole(role as any);
    });
    
    setRoleCache(cache);
  }, [user?.id, hasRole]);

  // Return cached role check function
  const getCachedRole = (role: string): boolean => {
    return roleCache[role] || false;
  };

  return {
    isAdmin: getCachedRole('admin'),
    isSuperAdmin: getCachedRole('superadmin'),
    isCoach: getCachedRole('coach'),
    isClient: getCachedRole('client'),
    hasRole: getCachedRole
  };
};