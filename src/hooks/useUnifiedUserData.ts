/**
 * 🔄 MIGRATION COMPATIBILITY LAYER
 * 
 * This file now redirects to the new robust user data system
 * Maintains backwards compatibility while using safe database access
 */

import { useRobustUserData } from './useRobustUserData';

// Export the new robust implementation with old interface

export interface UnifiedUser {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  // Attribute-based fields
  roles: string[];
  primary_role: string;
  logic_state?: any;
  client_category?: string;
  client_status?: string;
  coach_id?: string;
  has_coaching_context?: boolean;
  // Legacy compatibility fields
  phone?: string;
  organization?: string;
  department?: string;
  job_title?: string;
  bio?: string;
  date_of_birth?: string;
  status?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  users_with_roles: number;
  coaches: number;
  clients: number;
  admins: number;
  // Legacy compatibility
  total_admins?: number;
  total_coaches?: number;
  total_clients?: number;
  total?: number;
  active?: number;
  byRole?: {
    admin: number;
    coach: number;
    client: number;
    superadmin: number;
  };
  byOrganization?: Record<string, number>;
}

// Main exports
export const useUnifiedUserData = useRobustUserData;

// Backwards compatibility - separate export to avoid redeclaration
export const useClientData = () => useRobustUserData();