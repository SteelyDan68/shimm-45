import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientAccessData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  assigned_at: string;
  is_active: boolean;
}

export const useCoachClientAccess = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [assignedClients, setAssignedClients] = useState<ClientAccessData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignedClients = useCallback(async () => {
    if (!user?.id || !hasRole('coach')) {
      setAssignedClients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('coach_client_assignments')
        .select(`
          client_id,
          assigned_at,
          is_active,
          profiles!inner (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('coach_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const clientsData = data?.map((assignment: any) => ({
        id: assignment.client_id,
        email: assignment.profiles?.email || '',
        first_name: assignment.profiles?.first_name,
        last_name: assignment.profiles?.last_name,
        assigned_at: assignment.assigned_at,
        is_active: assignment.is_active
      })) || [];

      setAssignedClients(clientsData);
    } catch (error) {
      console.error('Error fetching assigned clients:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta tilldelade klienter",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, hasRole, toast]);

  useEffect(() => {
    fetchAssignedClients();
  }, [fetchAssignedClients]);

  const canAccessClient = useCallback((clientId: string): boolean => {
    if (!user?.id) return false;
    
    // Superadmin god mode
    if (hasRole('superadmin')) return true;
    
    // Admin access  
    if (hasRole('admin')) return true;
    
    // Self access
    if (user.id === clientId) return true;
    
    // Coach access to assigned clients
    if (hasRole('coach')) {
      return assignedClients.some(client => client.id === clientId && client.is_active);
    }
    
    return false;
  }, [user?.id, hasRole, assignedClients]);

  const getClientCalendarEvents = useCallback(async (clientId: string) => {
    if (!canAccessClient(clientId)) {
      throw new Error('Unauthorized access to client calendar');
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', clientId)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data;
  }, [canAccessClient]);

  const createClientCalendarEvent = useCallback(async (clientId: string, eventData: {
    title: string;
    description?: string;
    event_date: string;
    category: string;
    visible_to_client?: boolean;
  }) => {
    if (!canAccessClient(clientId)) {
      throw new Error('Unauthorized access to client calendar');
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...eventData,
        user_id: clientId,
        created_by: user?.id,
        created_by_role: 'coach',
        visible_to_client: eventData.visible_to_client ?? true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }, [canAccessClient, user?.id]);

  const getClientTasks = useCallback(async (clientId: string) => {
    if (!canAccessClient(clientId)) {
      throw new Error('Unauthorized access to client tasks');
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }, [canAccessClient]);

  const getClientJourneyState = useCallback(async (clientId: string) => {
    if (!canAccessClient(clientId)) {
      throw new Error('Unauthorized access to client journey');
    }

    const { data, error } = await supabase
      .from('user_journey_states')
      .select('*')
      .eq('user_id', clientId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }, [canAccessClient]);

  const getClientAnalytics = useCallback(async (clientId: string) => {
    if (!canAccessClient(clientId)) {
      throw new Error('Unauthorized access to client analytics');
    }

    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', clientId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data;
  }, [canAccessClient]);

  return {
    assignedClients,
    loading,
    canAccessClient,
    getClientCalendarEvents,
    createClientCalendarEvent,
    getClientTasks,
    getClientJourneyState,
    getClientAnalytics,
    refetch: fetchAssignedClients
  };
};