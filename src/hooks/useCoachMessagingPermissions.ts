import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from './use-toast';

/**
 * 🎯 COACH MESSAGING PERMISSIONS HOOK
 * Hanterar tillstånd för human coach messaging
 */

export interface CoachMessagingPermission {
  id: string;
  client_id: string;
  coach_id: string;
  is_enabled: boolean;
  enabled_by?: string;
  enabled_at?: string;
  disabled_at?: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  coach_profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  client_profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface AvailableCoach {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_messaging_enabled?: boolean;
}

export const useCoachMessagingPermissions = () => {
  const [permissions, setPermissions] = useState<CoachMessagingPermission[]>([]);
  const [availableCoaches, setAvailableCoaches] = useState<AvailableCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Hämta tillgängliga coaches för en klient
  const fetchAvailableCoaches = useCallback(async (clientId?: string) => {
    if (!user) return [];

    try {
      const targetClientId = clientId || user.id;

      // Först hämta tilldelade coaches
      const { data: assignments, error: assignmentError } = await supabase
        .from('coach_client_assignments')
        .select(`
          coach_id,
          profiles!inner(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('client_id', targetClientId)
        .eq('is_active', true);

      if (assignmentError) throw assignmentError;

      if (!assignments || assignments.length === 0) {
        setAvailableCoaches([]);
        return [];
      }

      // Sen hämta messaging permissions för dessa coaches
      const coachIds = assignments.map(a => a.coach_id);
      const { data: messagingPerms, error: permsError } = await supabase
        .from('coach_messaging_permissions')
        .select('*')
        .eq('client_id', targetClientId)
        .in('coach_id', coachIds);

      if (permsError) throw permsError;

      const coaches = assignments.map(assignment => {
        const permission = messagingPerms?.find(p => p.coach_id === assignment.coach_id);
        const profile = assignment.profiles as any;
        return {
          id: profile?.id || assignment.coach_id,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          email: profile?.email,
          is_messaging_enabled: permission?.is_enabled || false
        };
      });

      setAvailableCoaches(coaches);
      return coaches;

    } catch (error) {
      console.error('Error fetching available coaches:', error);
      return [];
    }
  }, [user]);

  // Hämta alla permissions (för admin)
  const fetchPermissions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('coach_messaging_permissions')
        .select(`
          *,
          coach_profile:profiles!coach_messaging_permissions_coach_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          client_profile:profiles!coach_messaging_permissions_client_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedData = (data || []).map(item => ({
        ...item,
        metadata: (typeof item.metadata === 'object' && item.metadata !== null) 
          ? item.metadata as Record<string, any> 
          : {}
      }));

      setPermissions(enrichedData);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta messaging-behörigheter",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Aktivera/deaktivera messaging för en coach-klient relation
  const toggleCoachMessaging = useCallback(async (
    clientId: string,
    coachId: string,
    enabled: boolean
  ) => {
    if (!user) return false;

    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('coach_messaging_permissions')
        .upsert({
          client_id: clientId,
          coach_id: coachId,
          is_enabled: enabled,
          enabled_by: enabled ? user.id : undefined,
          enabled_at: enabled ? now : undefined,
          disabled_at: enabled ? undefined : now,
          metadata: {
            last_updated_by: user.id,
            last_updated_at: now
          }
        });

      if (error) throw error;

      toast({
        title: enabled ? "Messaging aktiverat" : "Messaging deaktiverat",
        description: `Human coach messaging har ${enabled ? 'aktiverats' : 'deaktiverats'} för denna klient.`
      });

      // Uppdatera lokala states
      await fetchPermissions();
      await fetchAvailableCoaches(clientId);

      return true;
    } catch (error) {
      console.error('Error toggling coach messaging:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera messaging-behörighet",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast, fetchPermissions, fetchAvailableCoaches]);

  // Kolla om en klient kan skicka meddelanden till en specifik coach
  const canMessageCoach = useCallback((clientId: string, coachId: string): boolean => {
    return availableCoaches.some(coach => 
      coach.id === coachId && coach.is_messaging_enabled
    );
  }, [availableCoaches]);

  // Hämta alla tillgängliga coaches för messaging (för klient-vy)
  const getMessagingEnabledCoaches = useCallback((): AvailableCoach[] => {
    return availableCoaches.filter(coach => coach.is_messaging_enabled);
  }, [availableCoaches]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchPermissions();
      fetchAvailableCoaches();
    }
  }, [user, fetchPermissions, fetchAvailableCoaches]);

  return {
    permissions,
    availableCoaches,
    loading,
    fetchPermissions,
    fetchAvailableCoaches,
    toggleCoachMessaging,
    canMessageCoach,
    getMessagingEnabledCoaches
  };
};