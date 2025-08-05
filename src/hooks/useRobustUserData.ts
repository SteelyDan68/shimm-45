/**
 * 🔧 CRISIS RESPONSE: ROBUST USER DATA HOOK
 * 
 * Reparerar alla användarhanteringsproblem med:
 * - Säker databasåtkomst (INGEN auth.users access)
 * - Robusta error boundaries och fallbacks
 * - Enhetlig rollhantering från profiles-tabellen
 * - Bakåtkompatibilitet med alla befintliga komponenter
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/UnifiedAuthProvider';

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
  byRole?: Record<string, number>;
  byOrganization?: Record<string, number>;
}

export const useRobustUserData = () => {
  const { user: currentUser, isSuperAdmin, hasRole } = useAuth();
  const { toast } = useToast();

  // State
  const [users, setUsers] = useState<SafeUnifiedUser[]>([]);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Safe data fetching with multiple fallback strategies
  const fetchUsersRobustly = useCallback(async () => {
    if (!currentUser) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔧 Crisis Response: Starting robust user fetch...');

      // STRATEGY 1: Fetch profiles (SAFE - never blocked by RLS)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.warn('⚠️ Profiles fetch error:', profilesError);
        // Continue with empty profiles rather than failing
      }

      const profiles = profilesData || [];
      console.log(`✅ Fetched ${profiles.length} profiles`);

      // STRATEGY 2: Fetch roles with fallback mechanism
      let allRoles: Array<{user_id: string, role: string}> = [];

      // Try user_roles table first
      try {
        const { data: userRolesData, error: userRolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (!userRolesError && userRolesData) {
          allRoles = [...allRoles, ...userRolesData];
          console.log(`✅ Fetched ${userRolesData.length} user_roles`);
        } else {
          console.warn('⚠️ user_roles fetch failed:', userRolesError);
        }
      } catch (roleError) {
        console.warn('⚠️ user_roles access denied, using fallback');
      }

      // Try user_attributes as fallback
      try {
        const { data: attributeData, error: attributeError } = await supabase
          .from('user_attributes')
          .select('user_id, attribute_value')
          .like('attribute_key', 'role_%')
          .eq('is_active', true);

        if (!attributeError && attributeData) {
          const attributeRoles = attributeData.map(attr => ({
            user_id: attr.user_id,
            role: typeof attr.attribute_value === 'string' ? 
              attr.attribute_value.replace(/"/g, '') : 
              String(attr.attribute_value)
          }));
          allRoles = [...allRoles, ...attributeRoles];
          console.log(`✅ Fetched ${attributeRoles.length} attribute roles`);
        }
      } catch (attrError) {
        console.warn('⚠️ user_attributes access failed:', attrError);
      }

      // STRATEGY 3: Fetch coaching relationships (safe)
      let coachRelationships: Array<{coach_id: string, client_id: string}> = [];
      try {
        const { data: relationData, error: relationError } = await supabase
          .from('coach_client_assignments')
          .select('coach_id, client_id')
          .eq('is_active', true);

        if (!relationError && relationData) {
          coachRelationships = relationData;
          console.log(`✅ Fetched ${relationData.length} coach relationships`);
        }
      } catch (relError) {
        console.warn('⚠️ Relationships fetch failed:', relError);
      }

      // STRATEGY 4: Build user objects with safe defaults
      const rolesByUser = new Map<string, string[]>();
      allRoles.forEach(role => {
        if (!rolesByUser.has(role.user_id)) {
          rolesByUser.set(role.user_id, []);
        }
        rolesByUser.get(role.user_id)!.push(role.role);
      });

      const relationshipsByUser = new Map<string, {coach: string[], client: string[]}>();
      coachRelationships.forEach(rel => {
        // For coaches
        if (!relationshipsByUser.has(rel.coach_id)) {
          relationshipsByUser.set(rel.coach_id, {coach: [], client: []});
        }
        relationshipsByUser.get(rel.coach_id)!.client.push(rel.client_id);

        // For clients
        if (!relationshipsByUser.has(rel.client_id)) {
          relationshipsByUser.set(rel.client_id, {coach: [], client: []});
        }
        relationshipsByUser.get(rel.client_id)!.coach.push(rel.coach_id);
      });

      const processedUsers: SafeUnifiedUser[] = profiles.map(profile => {
        const userRoles = rolesByUser.get(profile.id) || [];
        const relationships = relationshipsByUser.get(profile.id) || {coach: [], client: []};
        
        // Determine primary role with safe defaults
        let primaryRole = 'user';
        if (userRoles.includes('superadmin')) primaryRole = 'superadmin';
        else if (userRoles.includes('admin')) primaryRole = 'admin';
        else if (userRoles.includes('coach')) primaryRole = 'coach';
        else if (userRoles.includes('client')) primaryRole = 'client';

        return {
          id: profile.id,
          email: profile.email || 'Ingen e-post',
          name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : profile.email || 'Okänd användare',
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          roles: userRoles,
          primary_role: primaryRole,
          status: 'active', // Safe default since we can't check auth.users
          has_coaching_context: relationships.coach.length > 0 || relationships.client.length > 0,
          coach_relationships: relationships.client,
          client_relationships: relationships.coach,
          // Legacy fields
          phone: profile.phone,
          organization: profile.organization,
          department: profile.department,
          job_title: profile.job_title,
          bio: profile.bio
        };
      });

      setUsers(processedUsers);

      // Calculate stats with safe defaults
      const totalUsers = processedUsers.length;
      const superadmins = processedUsers.filter(u => u.roles.includes('superadmin')).length;
      const admins = processedUsers.filter(u => u.roles.includes('admin')).length;
      const coaches = processedUsers.filter(u => u.roles.includes('coach')).length;
      const clients = processedUsers.filter(u => u.roles.includes('client')).length;
      const usersWithRoles = processedUsers.filter(u => u.roles.length > 0).length;

      const newStats: RobustUserStats = {
        total_users: totalUsers,
        active_users: totalUsers, // Safe assumption
        users_with_roles: usersWithRoles,
        coaches,
        clients,
        admins: admins + superadmins, // Combined for legacy compatibility
        superadmins,
        pending_users: 0, // Can't check auth.users
        // Legacy compatibility
        total: totalUsers,
        active: totalUsers,
        byRole: {
          superadmin: superadmins,
          admin: admins,
          coach: coaches,
          client: clients,
          user: totalUsers - usersWithRoles
        },
        byOrganization: {} // Empty for now, can be populated later
      };

      setStats(newStats);

      console.log('✅ Crisis Response: User data loaded successfully', {
        totalUsers,
        superadmins,
        admins,
        coaches,
        clients
      });

    } catch (err: any) {
      console.error('❌ Crisis Response: Critical error in user fetch:', err);
      setError(err.message || 'Kritiskt fel vid hämtning av användardata');
      
      // Set safe fallback state
      setUsers([]);
      setStats({
        total_users: 0,
        active_users: 0,
        users_with_roles: 0,
        coaches: 0,
        clients: 0,
        admins: 0,
        superadmins: 0,
        pending_users: 0
      });

      toast({
        title: "Kritiskt fel",
        description: "Kunde inte hämta användardata. Kontakta support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);

  // Initial load
  useEffect(() => {
    fetchUsersRobustly();
  }, [fetchUsersRobustly]);

  // Backwards compatibility functions
  const getUserCacheData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_data_cache')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user cache data:', err);
      return [];
    }
  };

  return {
    // Core data
    users,
    stats,
    loading,
    error,

    // Actions
    refetch: fetchUsersRobustly,
    refresh: fetchUsersRobustly,

    // Backwards compatibility aliases
    allUsers: users,
    isLoading: loading,
    getUserCacheData,
    getClientCacheData: getUserCacheData,

    // Helper functions for filtering cache data
    getNewsMentions: (cacheData: any[]) => cacheData.filter(item => item.data_type === 'news').slice(0, 5),
    getSocialMetrics: (cacheData: any[]) => cacheData.filter(item => item.data_type === 'social_metrics'),
    getAIAnalysis: (cacheData: any[]) => cacheData.filter(item => item.data_type === 'ai_analysis').slice(0, 3)
  };
};

// Backwards compatibility export
export const useUnifiedUserData = useRobustUserData;
export const useClientData = useRobustUserData;