import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

export interface Permission {
  resource: string;
  action: string;
  condition?: (context?: any) => boolean;
}

export const usePermissions = () => {
  const { hasRole, user } = useAuth();

  const permissions = useMemo(() => ({
    // Data access permissions  
    canViewAllClients: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canManageUsers: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canCreateUsers: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canInviteUsers: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canAssignCoaches: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canViewIntelligence: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canManageSettings: hasRole('superadmin') || hasRole('admin'),
    
    // Client specific permissions
    canViewOwnData: hasRole('client'),
    canEditOwnProfile: true, // All users can edit their own profile
    canCreateTasks: hasRole('coach') || hasRole('admin') || hasRole('superadmin'),
    canManageClientTasks: hasRole('coach') || hasRole('admin') || hasRole('superadmin'),
    
    // Dashboard permissions
    canAccessAdminDashboard: hasRole('superadmin') || hasRole('admin'),
    canAccessCoachDashboard: hasRole('coach'),
    canAccessClientDashboard: hasRole('client'),
    
    // Feature permissions
    canUseStefanChat: true, // All users can chat with Stefan
    canViewSystemAnalytics: hasRole('superadmin') || hasRole('admin'),
    canManageOrganizations: hasRole('superadmin'),
    
    // Role hierarchy checks
    isHighestRole: (role: string) => {
      if (hasRole('superadmin')) return true;
      if (hasRole('admin') && role !== 'superadmin') return true;
      if (hasRole('coach') && !['superadmin', 'admin'].includes(role)) return true;
      return false;
    }
  }), [hasRole, user]);

  return permissions;
};