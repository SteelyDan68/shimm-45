import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  height: string | null;
  weight: string | null;
  physical_limitations: string | null;
  neurodiversity: string | null;
  primary_role: string | null;
  secondary_role: string | null;
  niche: string | null;
  creative_strengths: string | null;
  challenges: string | null;
  platforms: any[];
  social_links: any;
  profile_metadata: any;
  custom_fields: any;
  onboarding_completed: boolean | null;
  onboarding_completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Enterprise-grade additional properties
  velocity_score: number | null;
  client_category: string | null;
  status: string | null;
  logic_state: any;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

export const useUserData = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!targetUserId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          velocity_score,
          client_category,
          status,
          logic_state
        `)
        .eq('id', targetUserId)
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (!userId) { // Only show error for current user, not when viewing others
        toast({
          title: "Error",
          description: "Failed to fetch profile data",
          variant: "destructive",
        });
      }
    }
  };

  const fetchRoles = async () => {
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', targetUserId);

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchRoles()]);
    setLoading(false);
  };

  useEffect(() => {
    // Only fetch when targetUserId is available
    if (targetUserId) {
      console.log('useUserData: Triggering fetchData for targetUserId:', targetUserId);
      fetchData();
    } else {
      console.log('useUserData: Waiting for targetUserId');
    }
  }, [targetUserId]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!targetUserId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', targetUserId);

      if (error) throw error;

      await fetchProfile();
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const getDisplayName = () => {
    if (!profile) return 'Unknown User';
    
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.first_name) return profile.first_name;
    if (profile.email) return profile.email;
    return 'Unknown User';
  };

  const hasRole = (role: string) => {
    return roles.some(r => r.role === role);
  };

  const isClient = () => hasRole('client');
  const isCoach = () => hasRole('coach');
  const isAdmin = () => hasRole('admin') || hasRole('superadmin');

  const getClientId = async () => {
    // In the unified system, the user ID is the client ID for client users
    if (profile && hasRole('client')) {
      return targetUserId;
    }
    return null;
  };

  return {
    profile,
    roles,
    loading,
    updateProfile,
    getDisplayName,
    hasRole,
    isClient,
    isCoach,
    isAdmin,
    getClientId,
    refetch: fetchData,
  };
};