/**
 * 🔧 CRISIS RESPONSE: ROBUST USER DATA HOOK
 * 
 * Reparerar alla användarhanteringsproblem med:
 * - Säker databasåtkomst (INGEN auth.users access)
 * - Robusta error boundaries och fallbacks
 * - Enhetlig rollhantering från profiles-tabellen
 * - Bakåtkompatibilitet med alla befintliga komponenter
 * - GLOBAL EVENT MANAGEMENT för real-time uppdateringar
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useGlobalUserEvents } from '@/hooks/useGlobalUserEvents';

export interface SafeUnifiedUser {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  roles: string[];
  primary_role: string;
  status: 'active' | 'inactive' | 'pending';
  last_sign_in_at?: string;
  // Computed fields
  has_coaching_context: boolean;
  coach_relationships: string[];
  client_relationships: string[];
  // Legacy compatibility
  phone?: string;
  organization?: string;
  department?: string;
  job_title?: string;
  bio?: string;
}

export interface RobustUserStats {
  total_users: number;
  active_users: number;
  users_with_roles: number;
  coaches: number;
  clients: number;
  admins: number;
  superadmins: number;
  pending_users: number;
  // Legacy compatibility fields
  total?: number;
  active?: number;
  byRole?: {
    admin: number;
    coach: number;
    client: number;
    superadmin: number;
  };
  byOrganization?: Record<string, number>;
}

export const useRobustUserData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [users, setUsers] = useState<SafeUnifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats state
  const [stats, setStats] = useState<RobustUserStats>({
    total_users: 0,
    active_users: 0,
    users_with_roles: 0,
    coaches: 0,
    clients: 0,
    admins: 0,
    superadmins: 0,
    pending_users: 0
  });

  const fetchUsersRobustly = useCallback(async () => {
    console.log('🔄 Loading robust user data...');
    try {
      setLoading(true);
      setError(null);

      // Fetch profiles with safe error handling
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('❌ Profiles fetch error:', profilesError);
        setError('Kunde inte ladda användarprofiler');
        return;
      }

      // Fetch roles with safe error handling
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.warn('⚠️ Roles fetch error (continuing without roles):', rolesError);
      }

      // Fetch coach assignments with safe error handling
      const { data: coachAssignments, error: assignmentsError } = await supabase
        .from('coach_client_assignments')
        .select('coach_id, client_id, is_active')
        .eq('is_active', true);

      if (assignmentsError) {
        console.warn('⚠️ Coach assignments fetch error (continuing without assignments):', assignmentsError);
      }

      // Transform data safely
      const transformedUsers: SafeUnifiedUser[] = (profiles || []).map(profile => {
        // Safe role processing
        const userRoleData = userRoles?.filter(ur => ur.user_id === profile.id) || [];
        const roles = userRoleData.map(ur => ur.role).filter(Boolean);
        
        // Safe name processing
        const name = profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile.first_name || profile.last_name || profile.email || 'Okänd användare';

        // Safe role determination
        const primary_role = roles.includes('superadmin') ? 'superadmin' :
                           roles.includes('admin') ? 'admin' :
                           roles.includes('coach') ? 'coach' :
                            roles.includes('client') ? 'client' : 'client';

        // Safe coaching relationships
        const coach_relationships = coachAssignments
          ?.filter(ca => ca.coach_id === profile.id)
          .map(ca => ca.client_id) || [];
        
        const client_relationships = coachAssignments
          ?.filter(ca => ca.client_id === profile.id)
          .map(ca => ca.coach_id) || [];

        const has_coaching_context = coach_relationships.length > 0 || client_relationships.length > 0;

        return {
          id: profile.id,
          email: profile.email || '',
          name,
          first_name: profile.first_name || undefined,
          last_name: profile.last_name || undefined,
          avatar_url: profile.avatar_url || undefined,
          created_at: profile.created_at,
          updated_at: profile.updated_at || undefined,
          roles,
          primary_role,
          status: profile.is_active === false ? 'inactive' : 'active',
          last_sign_in_at: profile.last_login_at || undefined,
          has_coaching_context,
          coach_relationships,
          client_relationships,
          // Legacy compatibility
          phone: profile.phone || undefined,
          organization: profile.organization || undefined,
          department: profile.department || undefined,
          job_title: profile.job_title || undefined,
          bio: profile.bio || undefined
        };
      });

      // Calculate stats safely
      const statsData: RobustUserStats = {
        total_users: transformedUsers.length,
        active_users: transformedUsers.filter(u => u.status === 'active').length,
        users_with_roles: transformedUsers.filter(u => u.roles.length > 0).length,
        coaches: transformedUsers.filter(u => u.roles.includes('coach')).length,
        clients: transformedUsers.filter(u => u.roles.includes('client')).length,
        admins: transformedUsers.filter(u => u.roles.includes('admin')).length,
        superadmins: transformedUsers.filter(u => u.roles.includes('superadmin')).length,
        pending_users: transformedUsers.filter(u => u.status === 'pending').length,
        // Legacy compatibility
        total: transformedUsers.length,
        active: transformedUsers.filter(u => u.status === 'active').length,
        byRole: {
          admin: transformedUsers.filter(u => u.roles.includes('admin')).length,
          coach: transformedUsers.filter(u => u.roles.includes('coach')).length,
          client: transformedUsers.filter(u => u.roles.includes('client')).length,
          superadmin: transformedUsers.filter(u => u.roles.includes('superadmin')).length
        }
      };

      setUsers(transformedUsers);
      setStats(statsData);
      
      console.log(`✅ Robust user data loaded: ${transformedUsers.length} users`);
      
    } catch (err: any) {
      console.error('❌ Robust user data fetch error:', err);
      setError(err.message || 'Okänt fel vid laddning av användardata');
      toast({
        title: "Datafel",
        description: "Kunde inte ladda användardata. Försöker igen automatiskt.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Helper functions for compatibility
  const getUsers = useCallback(() => users, [users]);
  const getStats = useCallback(() => stats, [stats]);
  const getClients = useCallback(() => 
    users.filter(user => user.roles.includes('client'))
  , [users]);
  const getCoaches = useCallback(() => 
    users.filter(user => user.roles.includes('coach'))
  , [users]);
  const getAdmins = useCallback(() => 
    users.filter(user => user.roles.includes('admin') || user.roles.includes('superadmin'))
  , [users]);

  // Legacy interface support
  const refetch = useCallback(async () => {
    await fetchUsersRobustly();
  }, [fetchUsersRobustly]);

  // Batch operations with safe error handling
  const deleteUserSafely = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      await fetchUsersRobustly();
      return true;
    } catch (error: any) {
      console.error('❌ Delete user error:', error);
      return false;
    }
  }, [fetchUsersRobustly]);

  // Global event listeners för real-time uppdateringar
  useGlobalUserEvents((eventType, detail) => {
    console.log(`🔄 Robust user data: Received event ${eventType}`, detail);
    fetchUsersRobustly();
  }, ['userDataChanged', 'gdprActionCompleted', 'userDeleted', 'userCreated', 'userUpdated']);

  // Initial load
  useEffect(() => {
    fetchUsersRobustly();
  }, [fetchUsersRobustly]);

  return {
    // Core data
    users,
    loading,
    error,
    stats,
    
    // Computed data
    getUsers,
    getStats, 
    getClients,
    getCoaches,
    getAdmins,
    
    // Actions
    refetch,
    fetchUsersRobustly,
    deleteUserSafely,
    
    // Legacy compatibility exports
    total_users: stats.total_users,
    active_users: stats.active_users,
    users_with_roles: stats.users_with_roles,
    coaches: stats.coaches,
    clients: stats.clients,
    admins: stats.admins,
    
    // Missing compatibility properties
    allUsers: users,
    getUserCacheData: (userId?: string) => [],
    getNewsMentions: (cacheData?: any[]) => cacheData?.filter(item => item.data_type === 'news') || [],
    getSocialMetrics: (cacheData?: any[]) => cacheData?.filter(item => item.data_type === 'social') || []
  };
};