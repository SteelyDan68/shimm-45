/**
 * 🚀 PERFORMANCE OPTIMIZATION HOOK
 * Eliminerar N+1 queries och implementerar intelligent caching
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OptimizedQueryConfig {
  cacheTime?: number;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
  enabled?: boolean;
}

/**
 * 🎯 OPTIMIZED USER ROLES QUERY
 * Batch fetching och caching för roller
 */
export const useOptimizedUserRoles = (userId: string, config?: OptimizedQueryConfig) => {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data?.map(item => item.role) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - roller ändras sällan
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    enabled: !!userId,
    ...config,
  });
};

/**
 * 🎯 BATCH USER DATA QUERY  
 * Fetchar användardata + roller + profil i en optimerad batch
 */
export const useOptimizedUserData = (userId: string, config?: OptimizedQueryConfig) => {
  return useQuery({
    queryKey: ['user-complete-data', userId],
    queryFn: async () => {
      // Parallel fetching istället för sequential
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
      ]);

      if (profileResult.error) throw profileResult.error;
      if (rolesResult.error) throw rolesResult.error;

      return {
        profile: profileResult.data,
        roles: rolesResult.data?.map(item => item.role) || [],
        userId,
        fetchedAt: new Date().toISOString()
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes 
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: !!userId,
    ...config,
  });
};

/**
 * 🎯 PREFETCH HOOK för vanliga queries
 * Förhindrar loading states genom intelligent prefetching
 */
export const usePrefetchOptimization = () => {
  const queryClient = useQueryClient();

  const prefetchUserRoles = useCallback((userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['user-roles', userId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
        
        if (error) throw error;
        return data?.map(item => item.role) || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  const prefetchUserData = useCallback((userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['user-complete-data', userId],
      queryFn: async () => {
        const [profileResult, rolesResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          supabase.from('user_roles').select('role').eq('user_id', userId)
        ]);

        return {
          profile: profileResult.data,
          roles: rolesResult.data?.map(item => item.role) || [],
          userId,
          fetchedAt: new Date().toISOString()
        };
      },
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);

  return { prefetchUserRoles, prefetchUserData };
};

/**
 * 🎯 INVALIDATION HOOKS
 * Smart cache invalidation för data consistency
 */
export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateUserData = useCallback((userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['user-complete-data', userId] });
    queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
  }, [queryClient]);

  const invalidateAllUserData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['user-complete-data'] });
    queryClient.invalidateQueries({ queryKey: ['user-roles'] });
  }, [queryClient]);

  return { invalidateUserData, invalidateAllUserData };
};

export default useOptimizedQuery;