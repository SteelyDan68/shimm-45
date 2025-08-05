import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

/**
 * ⚠️ MIGRATED TO CENTRALIZED DATA SYSTEM
 * 
 * Nu använder path_entries istället för user_attributes för datahämtning
 */
export const useUnifiedClients = () => {
  const [clients, setClients] = useState<UnifiedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  console.log('⚠️ useUnifiedClients: Deprecated hook - migrating to path_entries system');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 useUnifiedClients: Migrated to simplified user fetching from profiles table');
      
      // Temporarily simplified: Get all profiles with basic client detection
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(50); // Basic limit for safety

      if (error) throw error;

      // Process profiles as clients for now
      const processedClients: UnifiedClient[] = (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.id,
        email: profile.email || '',
        name: profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile.email || 'Användare',
        first_name: profile.first_name,
        last_name: profile.last_name,
        category: 'standard',
        status: 'active',
        created_at: profile.created_at,
        coach_id: undefined,
        logic_state: null
      }));
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
  }, [toast]);

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