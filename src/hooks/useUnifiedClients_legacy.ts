// Legacy compatibility hook - redirects to new attribute-based system
// This ensures existing code continues to work while we transition

import { useUnifiedUsers } from './useUnifiedUsers';

export interface UnifiedClient {
  id: string;
  user_id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  logic_state?: any;
  client_category?: string;
  client_status?: string;
  coach_id?: string;
}

export const useUnifiedClients = () => {
  const { users, loading, getClients, refetch } = useUnifiedUsers();

  // Convert UnifiedUser to legacy UnifiedClient format
  const clients: UnifiedClient[] = getClients().map(user => ({
    id: user.id,
    user_id: user.id, // In the new system, these are the same
    email: user.email || '',
    name: user.name,
    first_name: user.first_name || undefined,
    last_name: user.last_name || undefined,
    created_at: user.created_at,
    logic_state: user.logic_state,
    client_category: user.client_category || undefined,
    client_status: user.client_status || undefined,
    coach_id: user.coach_id || undefined
  }));

  return {
    clients,
    loading,
    refetch
  };
};