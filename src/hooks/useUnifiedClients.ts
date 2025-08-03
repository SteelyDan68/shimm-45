import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/UnifiedAuthProvider';

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
  const { user, hasRole, roles } = useAuth();

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      console.log('fetchClients: Starting with user:', user?.id, 'roles:', { hasRole });
      
      // If user is admin/superadmin, show all clients
      // If user is coach, only show their assigned clients
      // If user is client, show only themselves
      
      let clientUserIds: string[] = [];
      
      if (hasRole('superadmin') || hasRole('admin')) {
        console.log('fetchClients: User is admin/superadmin');
        // Admin sees all clients
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'client');

        if (rolesError) throw rolesError;
        clientUserIds = userRoles?.map(r => r.user_id) || [];
        console.log('fetchClients: Admin found client user IDs:', clientUserIds);
        
      } else if (hasRole('coach')) {
        console.log('fetchClients: User is coach, looking for assigned clients');
        // Coach sees only their assigned clients
        // NOTE: In unified system, client_id = user_id
        const { data: relationships, error: relError } = await supabase
          .from('coach_client_assignments')
          .select('client_id')
          .eq('coach_id', user?.id)
          .eq('is_active', true);

        if (relError) {
          console.error('fetchClients: Error fetching coach relationships:', relError);
          throw relError;
        }
        
        // client_id IS user_id in the unified system
        clientUserIds = relationships?.map(r => r.client_id) || [];
        console.log('fetchClients: Coach found assigned client user_ids:', clientUserIds, 'from relationships:', relationships);
        
      } else if (hasRole('client')) {
        console.log('fetchClients: User is client');
        // Client sees only themselves
        clientUserIds = user?.id ? [user.id] : [];
        
      } else {
        console.log('fetchClients: User has no recognized role');
        // No specific role - no access to clients
        setClients([]);
        return;
      }

      if (clientUserIds.length === 0) {
        console.log('fetchClients: No client user IDs found');
        setClients([]);
        return;
      }

      console.log('fetchClients: Getting profiles for client IDs:', clientUserIds);
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

      if (profilesError) {
        console.error('fetchClients: Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('fetchClients: Found profiles:', profiles);

      // Get coach relationships for these clients
      const { data: relationships, error: relError } = await supabase
        .from('coach_client_assignments')
        .select('client_id, coach_id')
        .in('client_id', clientUserIds)
        .eq('is_active', true);

      if (relError) throw relError;

      // Create a map of user_id to coach_id (since client_id = user_id in unified system)
      const userCoachMap = new Map();
      relationships?.forEach(rel => {
        userCoachMap.set(rel.client_id, rel.coach_id); // client_id IS user_id
      });

      // Map to unified client format
      const unifiedClients: UnifiedClient[] = (profiles || []).map(profile => ({
        id: profile.id,        // This is user_id (SINGLE SOURCE OF TRUTH)
        user_id: profile.id,   // Explicit user_id for clarity
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
        coach_id: userCoachMap.get(profile.id) || null, // Use user_id (profile.id)
      }));

      console.log('fetchClients: Final unified clients:', unifiedClients);
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
    // Only fetch when user is available AND roles have been loaded
    if (user && roles && roles.length > 0) {
      console.log('useUnifiedClients: Triggering fetchClients because user and roles are available');
      fetchClients();
    } else {
      console.log('useUnifiedClients: Waiting for user and roles', { user: !!user, roles });
    }
  }, [user, roles]); // Also depend on roles, not just user

  return {
    clients,
    loading,
    refetch: fetchClients,
  };
};