import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UnifiedClient {
  id: string;
  name: string;
  email: string;
  category: string;
  status: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  logic_state?: any;
  client_category?: string;
  client_status?: string;
}

export const useUnifiedClients = () => {
  const [clients, setClients] = useState<UnifiedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Get all users with client role
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'client');

      if (rolesError) throw rolesError;

      const clientUserIds = userRoles?.map(r => r.user_id) || [];

      if (clientUserIds.length === 0) {
        setClients([]);
        return;
      }

      // Get profiles for all client users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          created_at,
          updated_at,
          client_category,
          client_status,
          logic_state
        `)
        .in('id', clientUserIds);

      if (profilesError) throw profilesError;

      // Map to unified client format
      const unifiedClients: UnifiedClient[] = (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unnamed User',
        email: profile.email || '',
        first_name: profile.first_name,
        last_name: profile.last_name,
        category: profile.client_category || 'general',
        status: profile.client_status || 'active',
        created_at: profile.created_at,
        logic_state: profile.logic_state,
        client_category: profile.client_category,
        client_status: profile.client_status,
      }));

      setClients(unifiedClients);
    } catch (error: any) {
      console.error('Error fetching unified clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    refetch: fetchClients,
  };
};