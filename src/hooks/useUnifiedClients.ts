import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  coach_id?: string; // Added to track coach relationship
}

export const useUnifiedClients = () => {
  const [clients, setClients] = useState<UnifiedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, hasRole } = useAuth();

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('🔍 useUnifiedClients: Starting fetch, user:', user?.email, 'admin:', hasRole('admin'), 'coach:', hasRole('coach'), 'client:', hasRole('client'));
      
      // If user is admin/superadmin, show all clients
      // If user is coach, only show their assigned clients
      // If user is client, show only themselves
      
      let clientUserIds: string[] = [];
      
      if (hasRole('superadmin') || hasRole('admin')) {
        // Admin sees all clients
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'client');

        if (rolesError) throw rolesError;
        clientUserIds = userRoles?.map(r => r.user_id) || [];
        console.log('🔍 Admin path: Found client user IDs:', clientUserIds);
        
      } else if (hasRole('coach')) {
        // Coach sees only their assigned clients
        const { data: relationships, error: relError } = await supabase
          .from('coach_client_assignments')
          .select('client_id')
          .eq('coach_id', user?.id)
          .eq('is_active', true);

        if (relError) throw relError;
        clientUserIds = relationships?.map(r => r.client_id) || [];
        console.log('🔍 Coach path: Found client user IDs:', clientUserIds);
        
      } else if (hasRole('client')) {
        // Client sees only themselves
        clientUserIds = user?.id ? [user.id] : [];
        
      } else {
        // No specific role - no access to clients
        setClients([]);
        return;
      }

      console.log('🔍 Final clientUserIds before profiles fetch:', clientUserIds);
      
      if (clientUserIds.length === 0) {
        console.log('🔍 No client user IDs found, setting empty clients list');
        setClients([]);
        return;
      }

      // Get profiles for authorized client users
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

      // Get coach relationships for these clients
      const { data: relationships, error: relError } = await supabase
        .from('coach_client_assignments')
        .select('client_id, coach_id')
        .in('client_id', clientUserIds)
        .eq('is_active', true);

      if (relError) throw relError;

      // Create a map of client_id to coach_id
      const clientCoachMap = new Map();
      relationships?.forEach(rel => {
        clientCoachMap.set(rel.client_id, rel.coach_id);
      });

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
        coach_id: clientCoachMap.get(profile.id) || null, // Add coach relationship
      }));

      console.log('🔍 Final unified clients:', unifiedClients);
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
    if (user) { // Only fetch when user is available
      fetchClients();
    }
  }, [user]);

  return {
    clients,
    loading,
    refetch: fetchClients,
  };
};