/**
 * 🧭 NAVIGATION UTILITIES
 * Centralized navigation helpers for consistent routing
 */

import { NavigationItem, NAVIGATION_ROUTES } from '@/config/navigation';

// Common navigation patterns
export const NAVIGATION_PATTERNS = {
  // Dashboard routes
  DASHBOARD: () => NAVIGATION_ROUTES.DASHBOARD,
  CLIENT_DASHBOARD: () => NAVIGATION_ROUTES.CLIENT_DASHBOARD,
  COACH_DASHBOARD: () => NAVIGATION_ROUTES.COACH_DASHBOARD,
  
  // User management
  USER_PROFILE: (userId: string, context?: string) => 
    NAVIGATION_ROUTES.USER_PROFILE(userId, context),
  UNIFIED_USERS: () => NAVIGATION_ROUTES.UNIFIED_USERS,
  EDIT_PROFILE: () => NAVIGATION_ROUTES.EDIT_PROFILE,
  
  // Features
  SIX_PILLARS: () => NAVIGATION_ROUTES.SIX_PILLARS,
  SIX_PILLARS_PILLAR: (pillarKey: string) => `/six-pillars/${pillarKey}`,
  TASKS: () => NAVIGATION_ROUTES.TASKS,
  CALENDAR: () => NAVIGATION_ROUTES.CALENDAR,
  MESSAGES: () => NAVIGATION_ROUTES.MESSAGES,
  
  // Assessment
  ONBOARDING: () => NAVIGATION_ROUTES.ONBOARDING,
  MY_ASSESSMENTS: () => '/my-assessments',
  MY_ANALYSES: () => '/my-analyses',
  MY_PROGRAM: () => '/my-program',
  GUIDED_ASSESSMENT: () => '/guided-assessment',
  USER_ANALYTICS: (tab?: string) => `/user-analytics${tab ? `?tab=${tab}` : ''}`,
  
  // Intelligence
  INTELLIGENCE: () => NAVIGATION_ROUTES.INTELLIGENCE,
  INTELLIGENCE_HUB: () => NAVIGATION_ROUTES.INTELLIGENCE_HUB,
  INTELLIGENCE_USER: (userId: string) => NAVIGATION_ROUTES.INTELLIGENCE_USER(userId),
  
  // Admin
  ADMINISTRATION: () => NAVIGATION_ROUTES.ADMINISTRATION,
  STEFAN_ADMIN: () => NAVIGATION_ROUTES.STEFAN_ADMIN,
  CLIENT_360: () => NAVIGATION_ROUTES.CLIENT_360,
  CLIENT_360_USER: (userId: string) => NAVIGATION_ROUTES.CLIENT_360_USER(userId),
  
  // Stefan AI
  STEFAN_CHAT: () => NAVIGATION_ROUTES.STEFAN_CHAT,
  STEFAN_HUB: () => '/stefan/*',
  STEFAN_COACHING: () => '/stefan/coaching',
  STEFAN_INTERVENTIONS: () => '/stefan/interventions',
  
  // Other
  AUTH: () => NAVIGATION_ROUTES.AUTH,
  MOBILE: () => NAVIGATION_ROUTES.MOBILE,
  HOME: () => '/',
} as const;

// Helper function to get navigation function by pattern name
export const getNavigationPattern = (pattern: keyof typeof NAVIGATION_PATTERNS) => {
  return NAVIGATION_PATTERNS[pattern];
};

// Navigation validation helpers
export const validateNavigationItem = (item: NavigationItem): boolean => {
  // Check required fields
  if (!item.title || !item.url || !item.roles?.length) {
    console.warn('Navigation item missing required fields:', item);
    return false;
  }
  
  return true;
};

// Role-based navigation filtering
export const filterNavigationByRole = (
  items: NavigationItem[], 
  userRoles: string[], 
  isBetaUser = false
): NavigationItem[] => {
  return items.filter(item => {
    // Beta feature check
    if (item.betaOnly && !isBetaUser) return false;
    
    // Role check
    return item.roles.some(role => userRoles.includes(role));
  });
};

// Feature flag validation (placeholder for future implementation)
export const isFeatureEnabled = (featureFlag?: string): boolean => {
  if (!featureFlag) return true;
  
  // TODO: Implement feature flag system
  // For now, all features are enabled
  return true;
};

// Database/function dependency validation (placeholder for future implementation)
export const validateDependencies = (
  requiredTables?: string[], 
  requiredFunctions?: string[]
): boolean => {
  // TODO: Implement dependency validation
  // For now, assume all dependencies are available
  return true;
};
