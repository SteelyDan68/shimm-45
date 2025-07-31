import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from './useAuth';

export interface UnifiedUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  organization: string | null;
  department: string | null;
  job_title: string | null;
  bio: string | null;
  date_of_birth: string | null;
  address: any;
  social_links: any;
  preferences: any;
  status: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  roles: AppRole[];
  // Extended data
  onboarding_completed?: boolean;
  assessment_completed?: boolean;
  habits_active?: number;
  pillar_scores?: any;
  progress_data?: any;
}

export interface UserFilters {
  search: string;
  role: string;
  status: string;
  organization: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<AppRole, number>;
  byOrganization: Record<string, number>;
}

export const useUnifiedUserData = () => {
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    organization: 'all'
  });
  const { toast } = useToast();

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch pillar assessments for progress data
      const { data: pillarData, error: pillarError } = await supabase
        .from('pillar_assessments')
        .select('client_id, pillar_key, calculated_score, created_at');

      // Create mock extended data since tables don't exist yet
      const unifiedUsers: UnifiedUser[] = profiles?.map(profile => {
        const userRolesList = userRoles?.filter(role => role.user_id === profile.id)
          .map(role => role.role)
          .filter(role => role !== 'user') as AppRole[] || [];

        const pillarScores = pillarData?.filter(p => p.client_id === profile.id) || [];

        return {
          ...profile,
          roles: userRolesList,
          onboarding_completed: Math.random() > 0.5, // Mock data
          assessment_completed: pillarScores.length > 0,
          habits_active: Math.floor(Math.random() * 5), // Mock data
          pillar_scores: pillarScores.reduce((acc, curr) => ({
            ...acc,
            [curr.pillar_key]: curr.calculated_score
          }), {}),
          progress_data: {
            last_assessment: pillarScores.length > 0 ? 
              Math.max(...pillarScores.map(p => new Date(p.created_at).getTime())) : null,
            total_habits: Math.floor(Math.random() * 10), // Mock data
            active_habits: Math.floor(Math.random() * 5) // Mock data
          }
        };
      }) || [];

      console.log('Unified users loaded:', unifiedUsers.length, unifiedUsers.map(u => `${u.first_name} ${u.last_name} (${u.roles.join(', ')})`));

      setUsers(unifiedUsers);
    } catch (error: any) {
      console.error('Error fetching unified user data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta användardata",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filteredUsers = users.filter(user => {
    const searchMatch = filters.search === '' || 
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.organization?.toLowerCase().includes(filters.search.toLowerCase());

    const roleMatch = filters.role === 'all' || 
      user.roles.includes(filters.role as AppRole) ||
      (filters.role === 'no-role' && user.roles.length === 0);

    const statusMatch = filters.status === 'all' || user.status === filters.status;

    const orgMatch = filters.organization === 'all' || user.organization === filters.organization;

    return searchMatch && roleMatch && statusMatch && orgMatch;
  });

  const stats: UserStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status !== 'active').length,
    byRole: {
      superadmin: users.filter(u => u.roles.includes('superadmin')).length,
      admin: users.filter(u => u.roles.includes('admin')).length,
      coach: users.filter(u => u.roles.includes('coach')).length,
      client: users.filter(u => u.roles.includes('client')).length,
    },
    byOrganization: users.reduce((acc, user) => {
      const org = user.organization || 'Ingen organisation';
      acc[org] = (acc[org] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const updateUser = useCallback(async (userId: string, updates: Partial<UnifiedUser>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      await fetchAllUsers(); // Refresh data
      
      toast({
        title: "Användare uppdaterad",
        description: "Användarinformationen har sparats"
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera användare",
        variant: "destructive"
      });
    }
  }, [fetchAllUsers, toast]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      // Find the user to get their identifier for deletion
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) {
        toast({
          title: "Fel",
          description: "Användare kunde inte hittas",
          variant: "destructive"
        });
        return;
      }

      const identifier = userToDelete.email || `${userToDelete.first_name} ${userToDelete.last_name}`;
      
      // Use the comprehensive deletion function
      const { deleteUserCompletely } = await import('@/utils/userDeletion');
      const result = await deleteUserCompletely(identifier);

      if (result.errors.length > 0) {
        console.error('Deletion errors:', result.errors);
        toast({
          title: "Delvis fel vid borttagning",
          description: `Vissa data kunde inte tas bort: ${result.errors.join(', ')}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Användare borttagen",
          description: `Användaren och all relaterad data har tagits bort från systemet`
        });
      }

      await fetchAllUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort användare",
        variant: "destructive"
      });
    }
  }, [fetchAllUsers, toast]);

  const updateUserRole = useCallback(async (userId: string, newRole: AppRole) => {
    try {
      // Remove existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Add new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: newRole as any }]);

      if (insertError) throw insertError;

      await fetchAllUsers(); // Refresh data
      
      toast({
        title: "Roll uppdaterad",
        description: `Användarens roll har ändrats`
      });
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera användarroll",
        variant: "destructive"
      });
    }
  }, [fetchAllUsers, toast]);

  const getUsersByRole = useCallback((role: AppRole) => {
    return users.filter(user => user.roles.includes(role));
  }, [users]);

  const getUsersWithoutRole = useCallback(() => {
    return users.filter(user => user.roles.length === 0);
  }, [users]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  return {
    users: filteredUsers,
    allUsers: users,
    loading,
    stats,
    filters,
    setFilters,
    updateUser,
    deleteUser,
    updateUserRole,
    getUsersByRole,
    getUsersWithoutRole,
    refetch: fetchAllUsers
  };
};