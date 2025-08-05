import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserAttributes } from './useUserAttributes';

export interface UnifiedClient {
  id: string;
  user_id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  category?: string;
  status?: string;
  created_at: string;
  coach_id?: string;
  logic_state?: any;
}

export const useUnifiedClients = () => {
  const [clients, setClients] = useState<UnifiedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getUsersWithAttribute, getAttribute } = useUserAttributes();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      // Get all users with client role from attributes
      const clientUserIds = await getUsersWithAttribute('role_client', true);
      
      if (clientUserIds.length === 0) {
        setClients([]);
        return;
      }

      // Get profile data for these users
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', clientUserIds);

      if (error) throw error;

      // Process each client profile
      const processedClients: UnifiedClient[] = [];
      
      for (const profile of profiles || []) {
        // Get client-specific attributes
        const clientCategory = await getAttribute(profile.id, 'client_category');
        const clientStatus = await getAttribute(profile.id, 'client_status');
        const logicState = await getAttribute(profile.id, 'logic_state');
        
        // Get coach relationship
        const coachRelationships = await getAttribute(profile.id, 'coaching_relationships');
        let coachId = undefined;
        
        if (coachRelationships && Array.isArray(coachRelationships)) {
          const activeCoach = coachRelationships.find((rel: any) => 
            rel.is_active && (rel as any).coach_id
          );
          coachId = (activeCoach as any)?.coach_id;
        }

        const client: UnifiedClient = {
          id: profile.id,
          user_id: profile.id,
          email: profile.email || '',
          name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : profile.email || 'Klient',
          first_name: profile.first_name,
          last_name: profile.last_name,
          category: clientCategory as string || 'standard',
          status: clientStatus as string || 'active',
          created_at: profile.created_at,
          coach_id: coachId,
          logic_state: logicState
        };

        processedClients.push(client);
      }

      setClients(processedClients);

    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta klientdata",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [getUsersWithAttribute, getAttribute, toast]);

  // Initialize
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    refetch: fetchClients
  };
};