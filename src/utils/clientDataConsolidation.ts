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
 * Fetch all users with client role from profiles table
 * This is the consolidated way to get clients across the app
 */
export async function fetchUnifiedClients(): Promise<UnifiedClient[]> {
  try {
    // Fetch all users with client role from profiles table (the correct, unified way)
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

    // Filter users with client role and map to unified format
    const unifiedClients = profiles?.filter(profile => 
      userRoles?.some(role => role.user_id === profile.id && role.role === 'client')
    ).map(profile => ({
      id: profile.id,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unnamed User',
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      status: profile.status || 'active',
      created_at: profile.created_at,
      category: 'unified', // Mark as coming from unified source
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
 * Fetch clients for a specific coach/user (legacy compatibility)
 */
export async function fetchClientsByCoach(coachId: string): Promise<UnifiedClient[]> {
  // For now, return all clients since we don't have coach assignments implemented
  // In the future, this could filter based on coach-client relationships
  return fetchUnifiedClients();
}