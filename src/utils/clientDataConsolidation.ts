import { supabase } from '@/integrations/supabase/client';

export interface UnifiedClient {
  id: string;
  name: string;
  email: string;
  category: string;
  status: string;
  created_at: string;
  // Profile fields
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  organization?: string;
  job_title?: string;
  bio?: string;
  // Client-specific fields from profile preferences
  client_category?: string;
  client_status?: string;
  velocity_score?: number;
  logic_state?: any;
  profile_metadata?: any;
  custom_fields?: any;
  // Social handles
  instagram_handle?: string;
  youtube_handle?: string;
  tiktok_handle?: string;
  snapchat_handle?: string;
  facebook_handle?: string;
  twitter_handle?: string;
  platforms?: string[];
  follower_counts?: any;
  // Additional metadata
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  preferences?: any;
  roles?: string[];
  user_id?: string; // For legacy compatibility
}

/**
 * Fetchs all unified clients from the profiles table
 * This is the primary data source - no more clients table dependency
 */
export const fetchUnifiedClients = async (): Promise<UnifiedClient[]> => {
  try {
    // Get all profiles with user roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;
    if (!profiles) return [];

    // Get user roles for each profile
    const unifiedClients: UnifiedClient[] = [];
    
    for (const profile of profiles) {
      // Fetch roles for this user
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id);

      const roles = userRoles?.map(r => r.role) || [];
      
      // Only include users with explicit client role
      const isClient = roles.includes('client');

      if (isClient) {
        const unifiedClient: UnifiedClient = {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown',
          email: profile.email || '',
          category: profile.client_category || profile.primary_role || 'general',
          status: profile.client_status || profile.status || 'active',
          created_at: profile.created_at,
          
          // Profile fields
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          organization: profile.organization,
          job_title: profile.job_title,
          bio: profile.bio,
          
          // Client-specific fields
          client_category: profile.client_category,
          client_status: profile.client_status,
          velocity_score: profile.velocity_score || 50,
          logic_state: profile.logic_state || {},
          profile_metadata: profile.profile_metadata || {},
          custom_fields: profile.custom_fields || {},
          
          // Social handles
          instagram_handle: profile.instagram_handle,
          youtube_handle: profile.youtube_handle,
          tiktok_handle: profile.tiktok_handle,
          snapchat_handle: profile.snapchat_handle,
          facebook_handle: profile.facebook_handle,
          twitter_handle: profile.twitter_handle,
          platforms: Array.isArray(profile.platforms) ? profile.platforms.map(p => String(p)) : [],
          follower_counts: profile.follower_counts || {},
          
          // Additional metadata
          onboarding_completed: profile.onboarding_completed,
          onboarding_completed_at: profile.onboarding_completed_at,
          preferences: profile.preferences,
          roles: roles,
          user_id: profile.id // For legacy compatibility
        };

        unifiedClients.push(unifiedClient);
      }
    }

    console.log(`Fetched ${unifiedClients.length} unified clients from profiles`);
    return unifiedClients;

  } catch (error) {
    console.error('Error fetching unified clients:', error);
    throw error;
  }
};

/**
 * Get a single unified client by ID
 */
export const fetchUnifiedClientById = async (clientId: string): Promise<UnifiedClient | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) throw error;
    if (!profile) return null;

    // Get roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.id);

    const roles = userRoles?.map(r => r.role) || [];

    return {
      id: profile.id,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown',
      email: profile.email || '',
      category: profile.client_category || profile.primary_role || 'general',
      status: profile.client_status || profile.status || 'active',
      created_at: profile.created_at,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      organization: profile.organization,
      job_title: profile.job_title,
      bio: profile.bio,
      client_category: profile.client_category,
      client_status: profile.client_status,
      velocity_score: profile.velocity_score || 50,
      logic_state: profile.logic_state || {},
      profile_metadata: profile.profile_metadata || {},
      custom_fields: profile.custom_fields || {},
      instagram_handle: profile.instagram_handle,
      youtube_handle: profile.youtube_handle,
      tiktok_handle: profile.tiktok_handle,
      snapchat_handle: profile.snapchat_handle,
      facebook_handle: profile.facebook_handle,
      twitter_handle: profile.twitter_handle,
      platforms: Array.isArray(profile.platforms) ? profile.platforms.map(p => String(p)) : [],
      follower_counts: profile.follower_counts || {},
      onboarding_completed: profile.onboarding_completed,
      onboarding_completed_at: profile.onboarding_completed_at,
      preferences: profile.preferences,
      roles: roles,
      user_id: profile.id
    };

  } catch (error) {
    console.error('Error fetching unified client by ID:', error);
    return null;
  }
};

/**
 * Fetch clients for a specific coach using the new unified user relationships
 */
export async function fetchClientsByCoach(coachId: string): Promise<UnifiedClient[]> {
  try {
    // Get coach-client relationships
    const { data: relationships, error: relationshipsError } = await supabase
      .from('user_relationships')
      .select('client_id')
      .eq('coach_id', coachId)
      .eq('relationship_type', 'coach_client')
      .eq('is_active', true);

    if (relationshipsError) throw relationshipsError;

    const clientIds = relationships?.map(rel => rel.client_id) || [];
    
    if (clientIds.length === 0) {
      // If no specific relationships, return all clients for now
      return await fetchUnifiedClients();
    }

    // Fetch profiles for these client IDs
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', clientIds)
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    // Map to unified client format
    const unifiedClients: UnifiedClient[] = [];
    
    for (const profile of profiles || []) {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id);

      const roles = userRoles?.map(r => r.role) || [];

      unifiedClients.push({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown',
        email: profile.email || '',
        category: profile.client_category || profile.primary_role || 'general',
        status: profile.client_status || profile.status || 'active',
        created_at: profile.created_at,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        organization: profile.organization,
        job_title: profile.job_title,
        bio: profile.bio,
        client_category: profile.client_category,
        client_status: profile.client_status,
        velocity_score: profile.velocity_score || 50,
        logic_state: profile.logic_state || {},
        profile_metadata: profile.profile_metadata || {},
        custom_fields: profile.custom_fields || {},
        instagram_handle: profile.instagram_handle,
        youtube_handle: profile.youtube_handle,
        tiktok_handle: profile.tiktok_handle,
        snapchat_handle: profile.snapchat_handle,
        facebook_handle: profile.facebook_handle,
        twitter_handle: profile.twitter_handle,
        platforms: Array.isArray(profile.platforms) ? profile.platforms.map(p => String(p)) : [],
        follower_counts: profile.follower_counts || {},
        onboarding_completed: profile.onboarding_completed,
        onboarding_completed_at: profile.onboarding_completed_at,
        preferences: profile.preferences,
        roles: roles,
        user_id: profile.id
      });
    }

    console.log(`Clients for coach ${coachId}:`, unifiedClients.length);
    return unifiedClients;
  } catch (error) {
    console.error('Error fetching clients by coach:', error);
    throw error;
  }
}