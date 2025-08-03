import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface UserRelationship {
  id: string;
  coach_user_id: string;
  client_user_id: string;
  assigned_at: string;
  assigned_by: string | null;
  is_active: boolean;
  
  // Enriched data
  coach_name?: string;
  coach_email?: string;
  client_name?: string;
  client_email?: string;
}

export interface RelationshipStats {
  total_coaches: number;
  total_clients: number;
  assigned_clients: number;
  unassigned_clients: number;
  active_relationships: number;
}

export const useCoachClientRelationships = () => {
  const [relationships, setRelationships] = useState<UserRelationship[]>([]);
  const [stats, setStats] = useState<RelationshipStats>({
    total_coaches: 0,
    total_clients: 0,
    assigned_clients: 0,
    unassigned_clients: 0,
    active_relationships: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchRelationships = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all active relationships with basic data first
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('coach_client_assignments')
        .select('*')
        .eq('is_active', true);

      if (relationshipsError) throw relationshipsError;

      // Enrich the relationships data with proper typing
      const enrichedRelationships: UserRelationship[] = (relationshipsData || []).map(rel => ({
        id: rel.id,
        coach_user_id: rel.coach_id,
        client_user_id: rel.client_id,
        assigned_at: rel.assigned_at,
        assigned_by: rel.assigned_by,
        is_active: rel.is_active,
        coach_name: 'Okänd coach', // Will be set below
        coach_email: '',
        client_name: 'Okänd klient', // Will be set below
        client_email: ''
      }));

      setRelationships(enrichedRelationships);

      // Calculate stats
      const { data: coachCount } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'coach');

      const { data: clientCount } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'client');

      const assignedClientIds = new Set(relationshipsData?.map(rel => rel.client_id) || []);

      setStats({
        total_coaches: coachCount?.length || 0,
        total_clients: clientCount?.length || 0,
        assigned_clients: assignedClientIds.size,
        unassigned_clients: (clientCount?.length || 0) - assignedClientIds.size,
        active_relationships: relationshipsData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta coach-klient relationer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  const createRelationship = useCallback(async (coachId: string, clientId: string) => {
    try {
      // Check if relationship already exists
      const { data: existing } = await supabase
        .from('coach_client_assignments')
        .select('id')
        .eq('coach_id', coachId)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (existing) {
        toast({
          title: "Relation existerar redan",
          description: "Denna klient är redan tilldelad till denna coach",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('coach_client_assignments')
        .insert({
          coach_id: coachId,
          client_id: clientId,
          assigned_by: user?.id || coachId,
          is_active: true
        });

      if (error) throw error;

      await fetchRelationships();
      
      toast({
        title: "Relation skapad",
        description: "Klienten har tilldelats till coachen",
      });

      return true;
    } catch (error) {
      console.error('Error creating relationship:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa relation",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchRelationships, toast, user]);

  const removeRelationship = useCallback(async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('coach_client_assignments')
        .update({ is_active: false })
        .eq('id', relationshipId);

      if (error) throw error;

      await fetchRelationships();
      
      toast({
        title: "Relation borttagen",
        description: "Klient-coach relationen har inaktiverats",
      });

      return true;
    } catch (error) {
      console.error('Error removing relationship:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort relation",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchRelationships, toast]);

  const transferClient = useCallback(async (clientId: string, fromCoachId: string, toCoachId: string) => {
    try {
      // First, deactivate the current relationship
      const { data: currentRel } = await supabase
        .from('coach_client_assignments')
        .select('id')
        .eq('coach_id', fromCoachId)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (currentRel) {
        await supabase
          .from('coach_client_assignments')
          .update({ is_active: false })
          .eq('id', currentRel.id);
      }

      // Create new relationship
      const { error } = await supabase
        .from('coach_client_assignments')
        .insert({
          coach_id: toCoachId,
          client_id: clientId,
          assigned_by: user?.id || toCoachId,
          is_active: true
        });

      if (error) throw error;

      await fetchRelationships();
      
      toast({
        title: "Klient överförd",
        description: "Klienten har överförts till ny coach",
      });

      return true;
    } catch (error) {
      console.error('Error transferring client:', error);
      toast({
        title: "Fel",
        description: "Kunde inte överföra klient",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchRelationships, toast, user]);

  // Utility functions
  const getClientsByCoach = useCallback((coachId: string) => {
    return relationships.filter(rel => rel.coach_user_id === coachId);
  }, [relationships]);

  const getCoachForClient = useCallback((clientId: string) => {
    return relationships.find(rel => rel.client_user_id === clientId);
  }, [relationships]);

  const isCoachClient = useCallback((coachId: string, clientId: string) => {
    return relationships.some(rel => 
      rel.coach_user_id === coachId && 
      rel.client_user_id === clientId && 
      rel.is_active
    );
  }, [relationships]);

  // For current user context
  const getCurrentUserClients = useCallback(() => {
    if (!user?.id) return [];
    return getClientsByCoach(user.id);
  }, [user?.id, getClientsByCoach]);

  const getCurrentUserCoach = useCallback(() => {
    if (!user?.id) return null;
    return getCoachForClient(user.id);
  }, [user?.id, getCoachForClient]);

  return {
    relationships,
    stats,
    loading,
    createRelationship,
    removeRelationship,
    transferClient,
    getClientsByCoach,
    getCoachForClient,
    isCoachClient,
    getCurrentUserClients,
    getCurrentUserCoach,
    refetch: fetchRelationships
  };
};

// Main export with backwards compatibility
export const useUserRelationships = useCoachClientRelationships;