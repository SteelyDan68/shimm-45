import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============= ENTERPRISE AUTH TYPES =============
export type AppRole = 'superadmin' | 'admin' | 'coach' | 'client';

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  organization: string | null;
  department: string | null;
  job_title: string | null;
  bio: string | null;
  date_of_birth: string | null;
  address: any;
  social_links: any;
  preferences: any;
  status: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

// ============= UNIFIED AUTH CONTEXT =============
interface UnifiedAuthContextType {
  // Core Auth State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;

  // Auth Actions
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ data?: any; error?: any }>;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<{ error?: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: any }>;

  // Role Checks
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (checkRoles: AppRole[]) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  canManageUsers: () => boolean;

  // Unified Permissions
  hasPermission: (action: string, resource: string, context?: Record<string, any>) => PermissionCheck;
  canAccessPage: (path: string) => boolean;
  hasFeature: (feature: string) => boolean;
  getAvailableActions: (resource: string, context?: Record<string, any>) => string[];

  // Legacy Compatibility
  canViewAllClients: boolean;
  canManageUsersLegacy: boolean;
  canCreateUsers: boolean;
  canInviteUsers: boolean;
  canAssignCoaches: boolean;
  canViewIntelligence: boolean;
  canManageSettings: boolean;
  canViewOwnData: boolean;
  canEditOwnProfile: boolean;
  canCreateTasks: boolean;
  canManageClientTasks: boolean;
  canAccessAdminDashboard: boolean;
  canAccessCoachDashboard: boolean;
  canAccessClientDashboard: boolean;
  canUseStefanChat: boolean;
  canViewSystemAnalytics: boolean;
  canManageOrganizations: boolean;

  // Data Management
  fetchUserProfile: (userId: string) => Promise<void>;
  fetchUserRoles: (userId: string) => Promise<void>;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

// ============= ENTERPRISE PERMISSIONS MATRIX =============
const PERMISSIONS: Record<AppRole, Permission[]> = {
  superadmin: [
    { action: '*', resource: '*' }, // GOD MODE
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
  ],
  client: [
    { action: 'read', resource: 'profile', conditions: { own: true } },
    { action: 'update', resource: 'profile', conditions: { own: true } },
    { action: 'read', resource: 'assessments', conditions: { own: true } },
    { action: 'create', resource: 'assessments', conditions: { own: true } },
    { action: 'read', resource: 'analytics', conditions: { own: true } },
    { action: 'read', resource: 'messages', conditions: { own: true } },
    { action: 'create', resource: 'messages' },
  ],
};

const PAGE_ACCESS: Record<string, AppRole[]> = {
  '/administration': ['superadmin', 'admin'],
  '/coach-dashboard': ['superadmin', 'admin', 'coach'],
  '/all-clients': ['superadmin', 'admin', 'coach'],
  '/client-dashboard': ['client'],
  '/messages': ['superadmin', 'admin', 'coach', 'client'],
  '/dashboard': ['client'],
  '/profile': ['superadmin', 'admin', 'coach', 'client'],
  '/system-map': ['superadmin'],
};

const FEATURE_FLAGS: Record<string, AppRole[]> = {
  'user-management': ['superadmin', 'admin'],
  'role-management': ['superadmin', 'admin'],
  'organization-management': ['superadmin', 'admin'],
  'system-settings': ['superadmin'],
  'client-coaching': ['superadmin', 'admin', 'coach'],
};

// ============= UNIFIED AUTH PROVIDER =============
export const UnifiedAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // DEBUG: Monitor roles changes
  useEffect(() => {
    console.log('🔥🔥🔥 UnifiedAuth: ROLES CHANGED:', {
      roles,
      roleCount: roles.length,
      user: user?.id,
      userEmail: user?.email
    });
  }, [roles, user?.id, user?.email]);

  // ============= DATA FETCHING =============
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  }, []);

  // FIXED: Fetch user roles from user_roles table (not user_attributes)
  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      console.log('🔥 UnifiedAuth: Fetching roles for user:', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      console.log('🔥 UnifiedAuth: Raw role data:', { data, error });

      if (error) {
        console.error('🔥 UnifiedAuth: Error fetching roles:', error);
        setRoles([]); // Set empty array on error
        return;
      }

      const userRoles = data?.map(item => item.role) as AppRole[] || [];
      console.log('🔥 UnifiedAuth: Found roles:', userRoles, 'Setting roles state...');
      
      // Force update roles state
      setRoles([]);
      setTimeout(() => {
        setRoles(userRoles);
        console.log('🔥 UnifiedAuth: Roles state forcefully updated:', userRoles);
      }, 50);
      
    } catch (error) {
      console.error('🔥 UnifiedAuth: Error in fetchUserRoles:', error);
      // Fallback: assign client role if none found
      setRoles(['client'] as AppRole[]);
      console.log('🔥 UnifiedAuth: Fallback - assigned client role');
    }
  }, []);

  // ============= AUTH STATE MANAGEMENT =============
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔥🔥🔥 UnifiedAuth: Auth state change:', { event, sessionExists: !!session, userId: session?.user?.id, userEmail: session?.user?.email });
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('🔥 UnifiedAuth: Valid session found, fetching profile and roles for:', session.user.id);
          // CRITICAL: Use setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          console.log('🔥 UnifiedAuth: No session/user, clearing profile and roles');
          setProfile(null);
          setRoles([]);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
          fetchUserRoles(session.user.id);
        }, 0);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, fetchUserRoles]);

  // ============= AUTH ACTIONS =============
  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        toast({
          title: "Registreringsfel",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      if (data.user && !data.session) {
        toast({
          title: "Bekräfta din e-post",
          description: "Vi har skickat en bekräftelselänk till din e-post.",
        });
      }

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Registreringsfel",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Inloggningsfel",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Update last login
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      toast({
        title: "Välkommen!",
        description: "Du är nu inloggad.",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Inloggningsfel", 
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔥 signOut: Starting logout process...', {
        currentUser: user?.id,
        currentSession: session?.access_token ? 'exists' : 'missing',
        roles: roles
      });

      // Check if we already have a valid session
      const { data: currentSession, error: sessionError } = await supabase.auth.getSession();
      console.log('🔥 signOut: Current session check:', {
        sessionExists: !!currentSession.session,
        sessionId: currentSession.session?.access_token ? 'exists' : 'missing',
        sessionError: sessionError?.message
      });

      // Force clear session from localStorage first
      localStorage.removeItem('sb-gcoorbcglxczmukzcmqs-auth-token');
      
      // Try to sign out with different scope options
      let signOutError = null;
      
      try {
        // Try global sign out first (signs out from all devices)
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        signOutError = error;
      } catch (globalError) {
        console.log('🔥 signOut: Global signout failed, trying local...', globalError);
        // Fallback to local sign out
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        signOutError = error;
      }
      
      if (signOutError) {
        console.error('🔥 signOut: Supabase signOut error:', signOutError);
        
        // Force clear state even if signOut fails
        setUser(null);
        setSession(null);
        setProfile(null);
        setRoles([]);
        
        toast({
          title: "Utloggad",
          description: "Session rensad (även med varning).",
        });
        return { error: null };
      }

      console.log('🔥 signOut: Successfully signed out, clearing state...');
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);

      toast({
        title: "Utloggad",
        description: "Du har loggats ut från alla enheter.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('🔥 signOut: Unexpected error:', error);
      
      // Force clear state on any error
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
      
      toast({
        title: "Utloggad", 
        description: "Session rensad (med varningar).",
      });
      return { error: null };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Ingen användare inloggad') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Uppdateringsfel",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Refresh profile
      await fetchUserProfile(user.id);

      toast({
        title: "Profil uppdaterad",
        description: "Din profil har uppdaterats.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Uppdateringsfel",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  // ============= ROLE CHECKS =============
  const hasRole = useCallback((role: AppRole): boolean => {
    const result = roles.includes(role);
    if (roles.length > 0) {
      console.log(`hasRole(${role}): ${result}, current roles:`, roles);
    }
    return result;
  }, [roles]);

  const hasAnyRole = useCallback((checkRoles: AppRole[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  }, [roles]);

  const isAdmin = useCallback((): boolean => {
    return hasAnyRole(['superadmin', 'admin']);
  }, [hasAnyRole]);

  const isSuperAdmin = useCallback((): boolean => {
    return hasRole('superadmin');
  }, [hasRole]);

  const canManageUsers = useCallback((): boolean => {
    return hasAnyRole(['superadmin', 'admin', 'coach']);
  }, [hasAnyRole]);

  // ============= UNIFIED PERMISSIONS =============
  const checkConditions = useCallback((conditions: Record<string, any>, context: Record<string, any>, userRole: AppRole): boolean => {
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
  }, []);

  const hasPermission = useCallback((action: string, resource: string, context?: Record<string, any>): PermissionCheck => {
    if (!user || roles.length === 0) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    for (const role of roles) {
      const rolePermissions = PERMISSIONS[role] || [];
      
      for (const permission of rolePermissions) {
        // Superadmin wildcard check
        if (permission.action === '*' && permission.resource === '*') {
          return { allowed: true };
        }

        // Exact match check
        if (permission.action === action && permission.resource === resource) {
          if (permission.conditions && context) {
            const conditionsMet = checkConditions(permission.conditions, context, role);
            if (!conditionsMet) continue;
          }
          return { allowed: true };
        }

        // Wildcard checks
        if ((permission.action === '*' && permission.resource === resource) ||
            (permission.action === action && permission.resource === '*')) {
          if (permission.conditions && context) {
            const conditionsMet = checkConditions(permission.conditions, context, role);
            if (!conditionsMet) continue;
          }
          return { allowed: true };
        }
      }
    }

    return { allowed: false, reason: 'Insufficient permissions' };
  }, [roles, user, checkConditions]);

  const canAccessPage = useCallback((path: string): boolean => {
    if (!user || roles.length === 0) return false;
    
    const allowedRoles = PAGE_ACCESS[path];
    if (!allowedRoles) return true;
    
    return roles.some(role => allowedRoles.includes(role));
  }, [roles, user]);

  const hasFeature = useCallback((feature: string): boolean => {
    if (!user || roles.length === 0) return false;
    
    const allowedRoles = FEATURE_FLAGS[feature];
    if (!allowedRoles) return false;
    
    return roles.some(role => allowedRoles.includes(role));
  }, [roles, user]);

  const getAvailableActions = useCallback((resource: string, context?: Record<string, any>): string[] => {
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
  }, [roles, user, checkConditions]);

  // ============= LEGACY COMPATIBILITY PERMISSIONS =============
  const legacyPermissions = useMemo(() => ({
    canViewAllClients: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canManageUsersLegacy: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canCreateUsers: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canInviteUsers: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canAssignCoaches: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canViewIntelligence: hasRole('superadmin') || hasRole('admin') || hasRole('coach'),
    canManageSettings: hasRole('superadmin') || hasRole('admin'),
    canViewOwnData: hasRole('client'),
    canEditOwnProfile: true,
    canCreateTasks: hasRole('coach') || hasRole('admin') || hasRole('superadmin'),
    canManageClientTasks: hasRole('coach') || hasRole('admin') || hasRole('superadmin'),
    canAccessAdminDashboard: hasRole('superadmin') || hasRole('admin'),
    canAccessCoachDashboard: hasRole('coach'),
    canAccessClientDashboard: hasRole('client'),
    canUseStefanChat: true,
    canViewSystemAnalytics: hasRole('superadmin') || hasRole('admin'),
    canManageOrganizations: hasRole('superadmin'),
  }), [hasRole]);

  const value: UnifiedAuthContextType = {
    // Core State
    user,
    session,
    profile,
    roles,
    isLoading,

    // Auth Actions
    signUp,
    signIn,
    signOut,
    updateProfile,

    // Role Checks
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    canManageUsers,

    // Unified Permissions
    hasPermission,
    canAccessPage,
    hasFeature,
    getAvailableActions,

    // Legacy Compatibility
    ...legacyPermissions,

    // Data Management
    fetchUserProfile,
    fetchUserRoles,
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

// ============= UNIFIED AUTH HOOK =============
export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

// ============= LEGACY COMPATIBILITY EXPORTS =============
export const useAuth = useUnifiedAuth;
export const usePermissions = () => {
  const auth = useUnifiedAuth();
  return {
    canViewAllClients: auth.canViewAllClients,
    canManageUsers: auth.canManageUsersLegacy,
    canCreateUsers: auth.canCreateUsers,
    canInviteUsers: auth.canInviteUsers,
    canAssignCoaches: auth.canAssignCoaches,
    canViewIntelligence: auth.canViewIntelligence,
    canManageSettings: auth.canManageSettings,
    canViewOwnData: auth.canViewOwnData,
    canEditOwnProfile: auth.canEditOwnProfile,
    canCreateTasks: auth.canCreateTasks,
    canManageClientTasks: auth.canManageClientTasks,
    canAccessAdminDashboard: auth.canAccessAdminDashboard,
    canAccessCoachDashboard: auth.canAccessCoachDashboard,
    canAccessClientDashboard: auth.canAccessClientDashboard,
    canUseStefanChat: auth.canUseStefanChat,
    canViewSystemAnalytics: auth.canViewSystemAnalytics,
    canManageOrganizations: auth.canManageOrganizations,
  };
};

export const useUnifiedPermissions = () => {
  const auth = useUnifiedAuth();
  return {
    hasPermission: auth.hasPermission,
    canAccessPage: auth.canAccessPage,
    hasFeature: auth.hasFeature,
    getAvailableActions: auth.getAvailableActions,
    canManageUsers: auth.canManageUsers,
    canManageRoles: auth.hasFeature('role-management'),
    canManageOrganizations: auth.canManageOrganizations,
    canAccessGamification: auth.hasFeature('gamification'),
    canAccessAdvancedAnalytics: auth.hasFeature('advanced-analytics'),
    canAccessSystemSettings: auth.hasFeature('system-settings'),
    isAdmin: auth.isAdmin(),
    isSuperAdmin: auth.hasRole('superadmin'),
    isCoach: auth.hasRole('coach'),
    isClient: auth.hasRole('client'),
    roles: auth.roles
  };
};