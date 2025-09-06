/**
 * 🚩 FEATURE FLAGS SYSTEM
 * Environment-driven toggles for uncertain/experimental routes
 */

// Environment variable helper with fallbacks
const getEnvFlag = (key: string, defaultValue: boolean = false): boolean => {
  if (typeof window === 'undefined') return defaultValue;
  
  // Check various sources for environment variables
  const sources = [];
  
  // Vite environment variables (primary source for frontend)
  try {
    const viteEnv = import.meta?.env?.[`VITE_${key}`];
    if (viteEnv !== undefined) sources.push(viteEnv);
  } catch (e) {
    // Ignore if import.meta is not available
  }
  
  // Process env fallback (only if process exists - Node.js environments)
  try {
    if (typeof process !== 'undefined' && process?.env) {
      const processEnv = process.env[key];
      if (processEnv !== undefined) sources.push(processEnv);
    }
  } catch (e) {
    // Ignore if process is not available (browser environment)
  }
  
  // Local storage override for runtime testing
  try {
    const storageValue = localStorage?.getItem(`feature_flag_${key}`);
    if (storageValue !== null) sources.push(storageValue);
  } catch (e) {
    // Ignore if localStorage is not available
  }

  for (const source of sources) {
    if (source !== undefined && source !== null) {
      return source === 'true' || source === true;
    }
  }
  
  return defaultValue;
};

/**
 * Feature flags for routes marked as "unknown" in UI audit
 * These can be toggled via environment variables or admin panel
 */
export const FEATURE_FLAGS = {
  // Unknown routes from UI_AUDIT.json
  DEVELOPMENT_OVERVIEW: getEnvFlag('ENABLE_DEVELOPMENT_OVERVIEW', false),
  AI_INSIGHTS: getEnvFlag('ENABLE_AI_INSIGHTS', false), 
  SYSTEM_MAP: getEnvFlag('ENABLE_SYSTEM_MAP', true), // Keep enabled - superadmin docs

  // Experimental features
  BETA_FEATURES: getEnvFlag('ENABLE_BETA_FEATURES', false),
  COLLABORATION_FEATURES: getEnvFlag('ENABLE_COLLABORATION', false),
  
  // Testing and development
  TESTING_ROUTES: getEnvFlag('ENABLE_TESTING_ROUTES', true), // Keep for dev
  DEBUG_TOOLS: getEnvFlag('ENABLE_DEBUG_TOOLS', false),
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature flag is enabled
 */
export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  return FEATURE_FLAGS[flag];
};

/**
 * Get all feature flags with their current status
 */
export const getAllFeatureFlags = (): Record<FeatureFlagKey, boolean> => {
  return { ...FEATURE_FLAGS };
};

/**
 * Toggle a feature flag at runtime (persists in localStorage)
 */
export const toggleFeatureFlag = (flag: FeatureFlagKey, enabled?: boolean): boolean => {
  const key = `feature_flag_${flag}`;
  const newValue = enabled !== undefined ? enabled : !FEATURE_FLAGS[flag];
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, newValue.toString());
  }
  
  // Force reload to apply changes
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
  
  return newValue;
};

/**
 * Reset all feature flags to environment defaults
 */
export const resetFeatureFlags = (): void => {
  if (typeof window === 'undefined') return;
  
  Object.keys(FEATURE_FLAGS).forEach(flag => {
    localStorage.removeItem(`feature_flag_${flag}`);
  });
  
  window.location.reload();
};

/**
 * Feature flag metadata for admin interface
 */
export const FEATURE_FLAG_METADATA: Record<FeatureFlagKey, {
  name: string;
  description: string;
  category: 'uncertain' | 'experimental' | 'development';
  risk: 'low' | 'medium' | 'high';
  route?: string;
}> = {
  DEVELOPMENT_OVERVIEW: {
    name: 'Development Overview',
    description: 'Shows development progress and insights page',
    category: 'uncertain',
    risk: 'medium',
    route: '/development-overview'
  },
  AI_INSIGHTS: {
    name: 'AI Insights Page', 
    description: 'AI-generated insights and recommendations page',
    category: 'uncertain',
    risk: 'medium',
    route: '/ai-insights'
  },
  SYSTEM_MAP: {
    name: 'System Documentation',
    description: 'Internal system architecture documentation',
    category: 'development',
    risk: 'low',
    route: '/system-map'
  },
  BETA_FEATURES: {
    name: 'Beta Features',
    description: 'Experimental features for select users',
    category: 'experimental', 
    risk: 'medium'
  },
  COLLABORATION_FEATURES: {
    name: 'Collaboration Tools',
    description: 'Team collaboration and sharing features',
    category: 'experimental',
    risk: 'high',
    route: '/collaboration'
  },
  TESTING_ROUTES: {
    name: 'Testing Routes',
    description: 'Internal testing and QA tools',
    category: 'development',
    risk: 'low',
    route: '/testing'
  },
  DEBUG_TOOLS: {
    name: 'Debug Tools',
    description: 'Developer debugging and diagnostic tools',
    category: 'development',
    risk: 'low'
  }
};

// Helper function to check if user should see feature
export const canAccessFeature = (
  flag: FeatureFlagKey,
  userRoles: string[] = [],
  isSuperAdmin: boolean = false
): boolean => {
  if (!isFeatureEnabled(flag)) return false;
  
  // Some features require special permissions
  const metadata = FEATURE_FLAG_METADATA[flag];
  
  if (metadata.category === 'development') {
    return isSuperAdmin;
  }
  
  if (metadata.risk === 'high') {
    return isSuperAdmin || userRoles.includes('admin');
  }
  
  return true;
};