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
    // First, try to get clients from profiles (new system)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) throw rolesError;

    // Get users with client role from profiles
    const profileClients = profiles?.filter(profile => 
      userRoles?.some(role => role.user_id === profile.id && role.role === 'client')
    ) || [];

    // MIGRATION FIX: Also get clients from old clients table
    const { data: oldClients, error: oldClientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Profile clients:', profileClients.length, profileClients.map(c => `${c.first_name} ${c.last_name}`));
    console.log('Old clients table:', oldClients?.length || 0, oldClients?.map(c => c.name) || []);

    // Merge both sources - prioritize profiles over old clients
    const allClients: UnifiedClient[] = [];
    
    // Add profile-based clients
    profileClients.forEach(profile => {
      allClients.push({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unnamed User',
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        status: profile.status || 'active',
        created_at: profile.created_at,
        category: 'migrated-profile',
        user_id: profile.id
      });
    });

    // Add old clients that don't exist in profiles
    if (oldClients) {
      oldClients.forEach(oldClient => {
        const existsInProfiles = allClients.some(c => c.email === oldClient.email);
        if (!existsInProfiles) {
          allClients.push({
            id: oldClient.id,
            name: oldClient.name || oldClient.email || 'Unknown',
            email: oldClient.email,
            first_name: oldClient.name?.split(' ')[0] || null,
            last_name: oldClient.name?.split(' ').slice(1).join(' ') || null,
            status: oldClient.status || 'active',
            created_at: oldClient.created_at,
            category: 'legacy-client',
            user_id: oldClient.user_id || oldClient.id
          });
        }
      });
    }

    console.log('Unified clients loaded (with migration):', allClients.length, allClients.map(c => c.name));
    return allClients;
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