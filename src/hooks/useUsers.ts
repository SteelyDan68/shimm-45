import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalUserEvents } from '@/hooks/useGlobalUserEvents';

export interface User {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  roles?: string[];
  primary_role?: string;
  coach_id?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  deactivated_at?: string;
  deactivated_by?: string;
  deactivation_reason?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    console.log('🔄 Fetching users from database...');
    try {
      setLoading(true);
      
      // Fetch profiles with user roles AND activity status
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          created_at,
          updated_at,
          is_active,
          deactivated_at,
          deactivated_by,
          deactivation_reason
        `);

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = profiles?.map(profile => {
        const userRoleData = userRoles?.filter(ur => ur.user_id === profile.id) || [];
        const roles = userRoleData.map(ur => ur.role);
        const primaryRole = roles.length > 0 ? roles[0] : 'user';

        return {
          id: profile.id,
          email: profile.email,
          name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile.first_name || profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          roles,
          primary_role: primaryRole,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          is_active: profile.is_active,
          deactivated_at: profile.deactivated_at,
          deactivated_by: profile.deactivated_by,
          deactivation_reason: profile.deactivation_reason
        } as User;
      }) || [];

      setUsers(usersWithRoles);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = () => {
    fetchUsers();
  };

  // Global event listeners för real-time uppdateringar
  useGlobalUserEvents((eventType, detail) => {
    console.log(`🔄 useUsers: Received event ${eventType}`, detail);
    fetchUsers();
  }, ['userDataChanged', 'gdprActionCompleted', 'userDeleted', 'userCreated', 'userUpdated']);

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers, refreshUsers: fetchUsers };
};