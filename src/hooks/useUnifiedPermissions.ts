import { useMemo } from 'react';
import { useAuth, type AppRole } from './useAuth';

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

// Define all system permissions
const PERMISSIONS: Record<AppRole, Permission[]> = {
  superadmin: [
    { action: '*', resource: '*' }, // Full access to everything
  ],
  admin: [
    { action: 'read', resource: 'users' },
    { action: 'create', resource: 'users' },
    { action: 'update', resource: 'users' },
    { action: 'delete', resource: 'users' },
    { action: 'read', resource: 'organizations' },
    { action: 'create', resource: 'organizations' },
    { action: 'update', resource: 'organizations' },
    { action: 'read', resource: 'assessments' },
    { action: 'create', resource: 'assessments' },
    { action: 'update', resource: 'assessments' },
    { action: 'read', resource: 'analytics' },
    { action: 'read', resource: 'invitations' },
    { action: 'create', resource: 'invitations' },
    { action: 'read', resource: 'gamification' },
    { action: 'update', resource: 'gamification' },
    { action: 'manage', resource: 'roles', conditions: { exclude: ['superadmin'] } },
  ],
  coach: [
    { action: 'read', resource: 'users', conditions: { role: 'client' } },
    { action: 'update', resource: 'users', conditions: { role: 'client', field: ['profile', 'notes'] } },
    { action: 'read', resource: 'assessments' },
    { action: 'create', resource: 'assessments', conditions: { type: 'pillar' } },
    { action: 'read', resource: 'analytics', conditions: { scope: 'assigned_clients' } },
    { action: 'read', resource: 'invitations' },
    { action: 'create', resource: 'invitations', conditions: { role: 'client' } },
    { action: 'read', resource: 'messages' },
    { action: 'create', resource: 'messages' },
    { action: 'read', resource: 'habits' },
    { action: 'create', resource: 'habits' },
    { action: 'update', resource: 'habits' },
  ],
  client: [
    { action: 'read', resource: 'profile', conditions: { own: true } },
    { action: 'update', resource: 'profile', conditions: { own: true } },
    { action: 'read', resource: 'assessments', conditions: { own: true } },
    { action: 'create', resource: 'assessments', conditions: { own: true } },
    { action: 'read', resource: 'analytics', conditions: { own: true } },
    { action: 'read', resource: 'messages', conditions: { own: true } },
    { action: 'create', resource: 'messages' },
    { action: 'read', resource: 'habits', conditions: { own: true } },
    { action: 'update', resource: 'habits', conditions: { own: true } },
    { action: 'read', resource: 'dashboard', conditions: { own: true } },
  ],
};

// Define page access rules
const PAGE_ACCESS: Record<string, AppRole[]> = {
  '/administration': ['superadmin', 'admin'],
  '/coach-dashboard': ['superadmin', 'admin', 'coach'],
  '/all-clients': ['superadmin', 'admin', 'coach'],
  '/client-dashboard': ['client'],
  '/messages': ['superadmin', 'admin', 'coach', 'client'],
  '/dashboard': ['client'],
  '/profile': ['superadmin', 'admin', 'coach', 'client'],
};

// Define feature flags
const FEATURE_FLAGS: Record<string, AppRole[]> = {
  'user-management': ['superadmin', 'admin'],
  'role-management': ['superadmin', 'admin'],
  'organization-management': ['superadmin', 'admin'],
  'gamification': ['superadmin', 'admin'],
  'advanced-analytics': ['superadmin', 'admin'],
  'system-settings': ['superadmin'],
  'data-export': ['superadmin', 'admin'],
  'gdpr-tools': ['superadmin', 'admin'],
  'automation': ['superadmin'],
  'stefan-data': ['superadmin'],
  'client-coaching': ['superadmin', 'admin', 'coach'],
  'assessment-creation': ['superadmin', 'admin'],
  'custom-pillars': ['superadmin', 'admin'],
};

export const useUnifiedPermissions = () => {
  const { roles, user } = useAuth();

  const hasPermission = useMemo(() => {
    return (action: string, resource: string, context?: Record<string, any>): PermissionCheck => {
      // No user = no permissions
      if (!user || roles.length === 0) {
        return { allowed: false, reason: 'Not authenticated' };
      }

      // Check each role for permissions
      for (const role of roles) {
        const rolePermissions = PERMISSIONS[role] || [];
        
        for (const permission of rolePermissions) {
          // Superadmin wildcard check
          if (permission.action === '*' && permission.resource === '*') {
            return { allowed: true };
          }

          // Exact match check
          if (permission.action === action && permission.resource === resource) {
            // Check conditions if they exist
            if (permission.conditions && context) {
              const conditionsMet = checkConditions(permission.conditions, context, role);
              if (!conditionsMet) {
                continue; // Try next permission
              }
            }
            return { allowed: true };
          }

          // Wildcard action check
          if (permission.action === '*' && permission.resource === resource) {
            if (permission.conditions && context) {
              const conditionsMet = checkConditions(permission.conditions, context, role);
              if (!conditionsMet) continue;
            }
            return { allowed: true };
          }

          // Wildcard resource check
          if (permission.action === action && permission.resource === '*') {
            if (permission.conditions && context) {
              const conditionsMet = checkConditions(permission.conditions, context, role);
              if (!conditionsMet) continue;
            }
            return { allowed: true };
          }
        }
      }

      return { allowed: false, reason: 'Insufficient permissions' };
    };
  }, [roles, user]);

  const canAccessPage = useMemo(() => {
    return (path: string): boolean => {
      if (!user || roles.length === 0) return false;
      
      const allowedRoles = PAGE_ACCESS[path];
      if (!allowedRoles) return true; // No restrictions = accessible
      
      return roles.some(role => allowedRoles.includes(role));
    };
  }, [roles, user]);

  const hasFeature = useMemo(() => {
    return (feature: string): boolean => {
      if (!user || roles.length === 0) return false;
      
      const allowedRoles = FEATURE_FLAGS[feature];
      if (!allowedRoles) return false; // Feature not defined = not accessible
      
      return roles.some(role => allowedRoles.includes(role));
    };
  }, [roles, user]);

  const getAvailableActions = useMemo(() => {
    return (resource: string, context?: Record<string, any>): string[] => {
      if (!user || roles.length === 0) return [];
      
      const actions = new Set<string>();
      
      for (const role of roles) {
        const rolePermissions = PERMISSIONS[role] || [];
        
        for (const permission of rolePermissions) {
          if (permission.resource === resource || permission.resource === '*') {
            if (permission.conditions && context) {
              const conditionsMet = checkConditions(permission.conditions, context, role);
              if (!conditionsMet) continue;
            }
            
            if (permission.action === '*') {
              actions.add('read');
              actions.add('create');
              actions.add('update');
              actions.add('delete');
              actions.add('manage');
            } else {
              actions.add(permission.action);
            }
          }
        }
      }
      
      return Array.from(actions);
    };
  }, [roles, user]);

  const checkConditions = (conditions: Record<string, any>, context: Record<string, any>, userRole: AppRole): boolean => {
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'own':
          if (value && !context.isOwnResource) return false;
          break;
        case 'role':
          if (Array.isArray(value) && !value.includes(context.targetRole)) return false;
          if (typeof value === 'string' && context.targetRole !== value) return false;
          break;
        case 'exclude':
          if (Array.isArray(value) && value.includes(context.targetRole)) return false;
          break;
        case 'field':
          if (Array.isArray(value) && context.field && !value.includes(context.field)) return false;
          break;
        case 'scope':
          if (context.scope !== value) return false;
          break;
        case 'type':
          if (Array.isArray(value) && !value.includes(context.type)) return false;
          if (typeof value === 'string' && context.type !== value) return false;
          break;
      }
    }
    return true;
  };

  // Convenience helpers
  const canManageUsers = hasFeature('user-management');
  const canManageRoles = hasFeature('role-management');
  const canManageOrganizations = hasFeature('organization-management');
  const canAccessGamification = hasFeature('gamification');
  const canAccessAdvancedAnalytics = hasFeature('advanced-analytics');
  const canAccessSystemSettings = hasFeature('system-settings');
  const isAdmin = roles.includes('admin') || roles.includes('superadmin');
  const isSuperAdmin = roles.includes('superadmin');
  const isCoach = roles.includes('coach');
  const isClient = roles.includes('client');

  return {
    hasPermission,
    canAccessPage,
    hasFeature,
    getAvailableActions,
    // Convenience helpers
    canManageUsers,
    canManageRoles,
    canManageOrganizations,
    canAccessGamification,
    canAccessAdvancedAnalytics,
    canAccessSystemSettings,
    isAdmin,
    isSuperAdmin,
    isCoach,
    isClient,
    roles
  };
};