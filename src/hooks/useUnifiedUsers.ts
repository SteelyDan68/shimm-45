import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UnifiedUser {
  // Core user data from profiles
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  
  // Extended profile data
  age: number | null;
  gender: string | null;
  height: string | null;
  weight: string | null;
  physical_limitations: string | null;
  neurodiversity: string | null;
  
  // Public role data
  primary_role: string | null;
  secondary_role: string | null;
  niche: string | null;
  creative_strengths: string | null;
  platforms: any[] | null;
  challenges: string | null;
  
  // Social media handles
  instagram_handle: string | null;
  youtube_handle: string | null;
  tiktok_handle: string | null;
  snapchat_handle: string | null;
  facebook_handle: string | null;
  twitter_handle: string | null;
  
  // Life map data
  location: string | null;
  living_with: string | null;
  has_children: string | null;
  ongoing_changes: string | null;
  past_crises: string | null;
  
  // Client-specific data (when user is a client)
  client_category: string | null;
  client_status: string | null;
  follower_counts: any | null;
  custom_fields: any | null;
  profile_metadata: any | null;
  logic_state: any | null;
  velocity_score: number | null;
  notes: string | null;
  tags: string[] | null;
  manager_name: string | null;
  manager_email: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  
  // Onboarding status
  onboarding_completed: boolean | null;
  onboarding_completed_at: string | null;
  
  // System data
  status: string | null;
  created_at: string;
  updated_at: string | null;
  
  // Computed fields
  name: string;
  roles: string[];
  coach_id?: string | null; // ID of assigned coach (if user is a client)
  client_ids?: string[]; // IDs of assigned clients (if user is a coach)
}

export interface UserRelationship {
  id: string;
  coach_id: string;
  client_id: string;
  relationship_type: string;
  assigned_at: string;
  assigned_by: string | null;
  is_active: boolean;
}

export const useUnifiedUsers = () => {
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [relationships, setRelationships] = useState<UserRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all profiles with roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch user relationships
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('user_relationships')
        .select('*')
        .eq('is_active', true);

      if (relationshipsError) throw relationshipsError;

      setRelationships(relationshipsData || []);

      // Combine data into unified users
      const unifiedUsers: UnifiedUser[] = (profilesData || []).map(profile => {
        const userRoles = rolesData?.filter(role => role.user_id === profile.id).map(role => role.role) || [];
        
        // Find coach-client relationships
        const asClient = relationshipsData?.find(rel => rel.client_id === profile.id && rel.relationship_type === 'coach_client');
        const asCoach = relationshipsData?.filter(rel => rel.coach_id === profile.id && rel.relationship_type === 'coach_client').map(rel => rel.client_id) || [];

        return {
          ...profile,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unnamed User',
          roles: userRoles,
          coach_id: asClient?.coach_id || null,
          client_ids: asCoach,
          platforms: Array.isArray(profile.platforms) ? profile.platforms : []
        };
      });

      setUsers(unifiedUsers);
    } catch (error) {
      console.error('Error fetching unified users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = useCallback(async (userId: string, updates: Partial<UnifiedUser>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers(); // Refresh data
      
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  }, [fetchUsers, toast]);

  const createUserRelationship = useCallback(async (coachId: string, clientId: string) => {
    try {
      const { error } = await supabase
        .from('user_relationships')
        .insert({
          coach_id: coachId,
          client_id: clientId,
          relationship_type: 'coach_client',
          assigned_by: coachId
        });

      if (error) throw error;

      await fetchUsers(); // Refresh data
      
      toast({
        title: "Success",
        description: "Client assigned to coach successfully",
      });
    } catch (error) {
      console.error('Error creating relationship:', error);
      toast({
        title: "Error",
        description: "Failed to assign client to coach",
        variant: "destructive",
      });
    }
  }, [fetchUsers, toast]);

  const removeUserRelationship = useCallback(async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('user_relationships')
        .update({ is_active: false })
        .eq('id', relationshipId);

      if (error) throw error;

      await fetchUsers(); // Refresh data
      
      toast({
        title: "Success",
        description: "Client assignment removed successfully",
      });
    } catch (error) {
      console.error('Error removing relationship:', error);
      toast({
        title: "Error",
        description: "Failed to remove client assignment",
        variant: "destructive",
      });
    }
  }, [fetchUsers, toast]);

  // Utility functions
  const getUsersByRole = useCallback((role: string) => {
    return users.filter(user => user.roles.includes(role));
  }, [users]);

  const getClients = useCallback(() => {
    return users.filter(user => user.roles.includes('client') || user.client_category);
  }, [users]);

  const getCoaches = useCallback(() => {
    return users.filter(user => user.roles.includes('coach') || user.roles.includes('admin') || user.roles.includes('superadmin'));
  }, [users]);

  const getClientsByCoach = useCallback((coachId: string) => {
    const coach = users.find(user => user.id === coachId);
    if (!coach?.client_ids) return [];
    
    return users.filter(user => coach.client_ids?.includes(user.id));
  }, [users]);

  return {
    users,
    relationships,
    loading,
    updateUser,
    createUserRelationship,
    removeUserRelationship,
    getUsersByRole,
    getClients,
    getCoaches,
    getClientsByCoach,
    refetch: fetchUsers
  };
};