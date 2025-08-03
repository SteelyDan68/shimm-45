import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CacheData {
  id: string;
  data_type: string;
  source: string;
  data: any;
  created_at: string;
  metadata?: any;
}

export interface UnifiedUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  roles?: string[];
  created_at?: string;
  updated_at?: string;
  phone?: string;
  organization?: string;
  department?: string;
  job_title?: string;
  bio?: string;
  date_of_birth?: string;
  status?: string;
}

export interface UserStats {
  total_users: number;
  total_admins: number;
  total_coaches: number;
  total_clients: number;
  active_users: number;
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

// Backwards compatibility export
export const useClientData = () => {
  return useUnifiedUserData();
};

export const useUnifiedUserData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    total_admins: 0,
    total_coaches: 0,
    total_clients: 0,
    active_users: 0,
    total: 0,
    active: 0,
    byRole: {
      admin: 0,
      coach: 0,
      client: 0,
      superadmin: 0
    },
    byOrganization: {}
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UnifiedUser[] = (profilesData || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        roles: rolesData?.filter(r => r.user_id === profile.id).map(r => r.role) || []
      }));

      setUsers(usersWithRoles);
      
      // Calculate stats
      const totalUsers = usersWithRoles.length;
      const admins = usersWithRoles.filter(u => u.roles?.includes('admin') || u.roles?.includes('superadmin')).length;
      const coaches = usersWithRoles.filter(u => u.roles?.includes('coach')).length;
      const clients = usersWithRoles.filter(u => u.roles?.includes('client')).length;

      setStats({
        total_users: totalUsers,
        total_admins: admins,
        total_coaches: coaches,
        total_clients: clients,
        active_users: totalUsers,
        total: totalUsers,
        active: totalUsers,
        byRole: {
          admin: admins,
          coach: coaches,
          client: clients,
          superadmin: usersWithRoles.filter(u => u.roles?.includes('superadmin')).length
        },
        byOrganization: {}
      });

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta användardata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getUserCacheData = async (userId: string): Promise<CacheData[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_data_cache')
        .select('*')
        .eq('user_id', userId)  // Now using user_id instead of client_id
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cache data:', error);
        toast({
          title: "Fel",
          description: "Kunde inte hämta användardata",
          variant: "destructive",
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserCacheData:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getNewsMentions = (cacheData: CacheData[]) => {
    return cacheData
      .filter(item => item.data_type === 'news')
      .slice(0, 5); // Latest 5 news items
  };

  const getSocialMetrics = (cacheData: CacheData[]) => {
    const socialData = cacheData.filter(item => item.data_type === 'social_metrics');
    // Return all social metrics, not just the first one
    return socialData.length > 0 ? socialData : [];
  };

  const getAIAnalysis = (cacheData: CacheData[]) => {
    return cacheData
      .filter(item => item.data_type === 'ai_analysis')
      .slice(0, 3); // Latest 3 AI analyses
  };

  return {
    getUserCacheData,
    // Backwards compatibility
    getClientCacheData: getUserCacheData,
    getNewsMentions,
    getSocialMetrics,
    getAIAnalysis,
    isLoading,
    // New unified user management
    users,
    allUsers: users, // alias for compatibility
    stats,
    loading,
    refetch: fetchUsers
  };
};