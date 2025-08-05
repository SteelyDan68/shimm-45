import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserAttributes } from './useUserAttributes';

export interface UserRelationship {
  id: string;
  coach_id: string;
  client_id: string;
  assigned_at: string;
  assigned_by: string;
  is_active: boolean;
  deactivated_at?: string;
  metadata?: any;
}

export interface RelationshipStats {
  total_relationships: number;
  active_relationships: number;
  inactive_relationships: number;
  unique_coaches: number;
  unique_clients: number;
  avg_clients_per_coach: number;
  // Legacy compatibility
  total_coaches?: number;
  total_clients?: number;
}

export const useCoachClientRelationships = () => {
  const [relationships, setRelationships] = useState<UserRelationship[]>([]);
  const [stats, setStats] = useState<RelationshipStats>({
    total_relationships: 0,
    active_relationships: 0,
    inactive_relationships: 0,
    unique_coaches: 0,
    unique_clients: 0,
    avg_clients_per_coach: 0
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getUsersWithAttribute, setAttribute, getAttribute } = useUserAttributes();

  // Fetch all relationships from attributes
  const fetchRelationships = useCallback(async () => {
    setLoading(true);
    try {
      // Get all users to check for coaching relationships
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name');

      if (error) throw error;

      const allRelationships: UserRelationship[] = [];

      for (const profile of profiles || []) {
        // Check if this user has coaching relationships
        const coachingData = await getAttribute(profile.id, 'coaching_relationships');
        
        if (coachingData && Array.isArray(coachingData)) {
          const relationships = coachingData as any[];
          
          for (const rel of relationships) {
            if (rel.relationship_type === 'coaching' && rel.is_active) {
              allRelationships.push({
                id: rel.id || crypto.randomUUID(),
                coach_id: rel.coach_id || profile.id,
                client_id: rel.client_id || profile.id,
                assigned_at: rel.assigned_at || new Date().toISOString(),
                assigned_by: rel.assigned_by || '',
                is_active: rel.is_active,
                deactivated_at: rel.deactivated_at,
                metadata: rel.metadata || {}
              });
            }
          }
        }
      }

      setRelationships(allRelationships);

      // Calculate stats
      const activeRelationships = allRelationships.filter(r => r.is_active);
      const uniqueCoaches = new Set(activeRelationships.map(r => r.coach_id)).size;
      const uniqueClients = new Set(activeRelationships.map(r => r.client_id)).size;

      setStats({
        total_relationships: allRelationships.length,
        active_relationships: activeRelationships.length,
        inactive_relationships: allRelationships.length - activeRelationships.length,
        unique_coaches: uniqueCoaches,
        unique_clients: uniqueClients,
        avg_clients_per_coach: uniqueCoaches > 0 ? uniqueClients / uniqueCoaches : 0,
        // Legacy compatibility
        total_coaches: uniqueCoaches,
        total_clients: uniqueClients
      });

    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta coach-klient relationer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [getAttribute, toast]);

  // Create new coach-client relationship
  const createRelationship = useCallback(async (
    coachId: string,
    clientId: string,
    assignedBy?: string
  ) => {
    try {
      const relationshipId = crypto.randomUUID();
      const relationshipData = {
        id: relationshipId,
        coach_id: coachId,
        client_id: clientId,
        relationship_type: 'coaching',
        assigned_at: new Date().toISOString(),
        assigned_by: assignedBy || coachId,
        is_active: true,
        metadata: {}
      };

      // Set relationship for coach
      const coachRelationships = await getAttribute(coachId, 'coaching_relationships') || [];
      const updatedCoachRelationships = Array.isArray(coachRelationships) 
        ? [...coachRelationships, { ...relationshipData, client_id: clientId }]
        : [{ ...relationshipData, client_id: clientId }];

      await setAttribute(coachId, {
        attribute_key: 'coaching_relationships',
        attribute_value: updatedCoachRelationships,
        attribute_type: 'relationship'
      });

      // Set relationship for client
      const clientRelationships = await getAttribute(clientId, 'coaching_relationships') || [];
      const updatedClientRelationships = Array.isArray(clientRelationships)
        ? [...clientRelationships, { ...relationshipData, coach_id: coachId }]
        : [{ ...relationshipData, coach_id: coachId }];

      await setAttribute(clientId, {
        attribute_key: 'coaching_relationships', 
        attribute_value: updatedClientRelationships,
        attribute_type: 'relationship'
      });

      await fetchRelationships();

      toast({
        title: "Relation skapad",
        description: "Coach-klient relation har etablerats"
      });

      return true;
    } catch (error) {
      console.error('Error creating relationship:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa coach-klient relation",
        variant: "destructive"
      });
      return false;
    }
  }, [getAttribute, setAttribute, fetchRelationships, toast]);

  // Remove/deactivate relationship
  const removeRelationship = useCallback(async (
    coachId: string,
    clientId: string
  ) => {
    try {
      // Update coach relationships
      const coachRelationships = await getAttribute(coachId, 'coaching_relationships') || [];
      if (Array.isArray(coachRelationships)) {
        const updatedCoachRelationships = coachRelationships.map((rel: any) => 
          rel.client_id === clientId 
            ? { ...rel, is_active: false, deactivated_at: new Date().toISOString() }
            : rel
        );

        await setAttribute(coachId, {
          attribute_key: 'coaching_relationships',
          attribute_value: updatedCoachRelationships,
          attribute_type: 'relationship'
        });
      }

      // Update client relationships
      const clientRelationships = await getAttribute(clientId, 'coaching_relationships') || [];
      if (Array.isArray(clientRelationships)) {
        const updatedClientRelationships = clientRelationships.map((rel: any) =>
          rel.coach_id === coachId
            ? { ...rel, is_active: false, deactivated_at: new Date().toISOString() }
            : rel
        );

        await setAttribute(clientId, {
          attribute_key: 'coaching_relationships',
          attribute_value: updatedClientRelationships,
          attribute_type: 'relationship'
        });
      }

      await fetchRelationships();

      toast({
        title: "Relation avslutad",
        description: "Coach-klient relation har avslutats"
      });

      return true;
    } catch (error) {
      console.error('Error removing relationship:', error);
      toast({
        title: "Fel",
        description: "Kunde inte avsluta coach-klient relation",
        variant: "destructive"
      });
      return false;
    }
  }, [getAttribute, setAttribute, fetchRelationships, toast]);

  // Check if coach-client relationship exists
  const isCoachClient = useCallback(async (coachId: string, clientId: string) => {
    try {
      const coachRelationships = await getAttribute(coachId, 'coaching_relationships') || [];
      if (Array.isArray(coachRelationships)) {
        return coachRelationships.some((rel: any) => 
          rel.client_id === clientId && rel.is_active
        );
      }
      return false;
    } catch (error) {
      console.error('Error checking coach-client relationship:', error);
      return false;
    }
  }, [getAttribute]);

  // Get coach's clients
  const getCurrentUserClients = useCallback(async (coachId: string) => {
    try {
      const relationships = await getAttribute(coachId, 'coaching_relationships') || [];
      if (Array.isArray(relationships)) {
        return relationships
          .filter((rel: any) => rel.is_active && rel.client_id)
          .map((rel: any) => rel.client_id);
      }
      return [];
    } catch (error) {
      console.error('Error getting coach clients:', error);
      return [];
    }
  }, [getAttribute]);

  // Get client's coach
  const getCurrentUserCoach = useCallback(async (clientId: string) => {
    try {
      const relationships = await getAttribute(clientId, 'coaching_relationships') || [];
      if (Array.isArray(relationships)) {
        const activeCoaching = relationships.find((rel: any) => 
          rel.is_active && (rel as any).coach_id
        );
        return (activeCoaching as any)?.coach_id || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting client coach:', error);
      return null;
    }
  }, [getAttribute]);

  // Initialize
  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  return {
    relationships,
    stats,
    loading,
    createRelationship,
    removeRelationship,
    isCoachClient,
    getCurrentUserClients,
    getCurrentUserCoach,
    refetch: fetchRelationships
  };
};

// Main export with backwards compatibility
export const useUserRelationships = useCoachClientRelationships;