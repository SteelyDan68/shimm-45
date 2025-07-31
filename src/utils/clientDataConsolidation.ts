import { supabase } from '@/integrations/supabase/client';

export interface UnifiedClient {
  id: string;
  name: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string;
  created_at: string;
  category?: string;
  user_id?: string;
}

/**
 * Fetch all users with client role or client_category from unified profiles table
 * This is the consolidated way to get clients across the app using the new unified architecture
 */
export async function fetchUnifiedClients(): Promise<UnifiedClient[]> {
  try {
    // Fetch all profiles with client indicators
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    // Fetch user roles to filter clients
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) throw rolesError;

    // Filter users with client role OR client_category (unified approach)
    const unifiedClients = profiles?.filter(profile => 
      userRoles?.some(role => role.user_id === profile.id && role.role === 'client') ||
      profile.client_category // Users with client data from legacy clients table
    ).map(profile => ({
      id: profile.id,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unnamed User',
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      status: profile.client_status || profile.status || 'active',
      created_at: profile.created_at,
      category: profile.client_category || 'unified',
      user_id: profile.id // For compatibility with legacy code
    })) || [];

    console.log('Unified clients loaded:', unifiedClients.length, unifiedClients.map(c => c.name));
    return unifiedClients;
  } catch (error) {
    console.error('Error fetching unified clients:', error);
    throw error;
  }
}

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
      return [];
    }

    // Fetch profiles for these client IDs
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', clientIds)
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    // Map to unified client format
    const unifiedClients = profiles?.map(profile => ({
      id: profile.id,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unnamed User',
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      status: profile.client_status || profile.status || 'active',
      created_at: profile.created_at,
      category: profile.client_category || 'unified',
      user_id: profile.id
    })) || [];

    console.log(`Clients for coach ${coachId}:`, unifiedClients.length);
    return unifiedClients;
  } catch (error) {
    console.error('Error fetching clients by coach:', error);
    throw error;
  }
}