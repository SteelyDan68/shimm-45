/**
 * 🚀 ENTERPRISE-GRADE DASHBOARD CONFIGURATIONS
 * Rollbaserade konfigurationer för unified dashboard-arkitektur
 */

import { 
  Sparkles, Target, Clock, Trophy, Calendar, CheckSquare, Users, FileText,
  TrendingUp, Brain, Activity, Shield, BarChart3, Settings, MessageSquare,
  AlertTriangle, Globe, Download, RefreshCw, Star, Zap
} from 'lucide-react';

import { 
  DashboardConfig, 
  UserRole, 
  DashboardWidget,
  DashboardNavItem 
} from '../types/dashboard-types';

// 🎯 CLIENT DASHBOARD CONFIGURATION
const CLIENT_CONFIG: DashboardConfig = {
  role: 'client',
  layout: 'client-focused',
  gridCols: 12,
  permissions: [
    'read-own-data',
    'update-own-profile',
    'complete-assessments',
    'manage-own-tasks'
  ],
  features: [
    'pillar-assessments',
    'task-management', 
    'calendar-view',
    'progress-tracking',
    'ai-insights'
  ],
  widgets: [
    {
      id: 'welcome',
      type: 'welcome',
      title: 'Välkommen',
      description: 'Personlig översikt och välkomstmeddelande',
      icon: Sparkles,
      span: 12,
      minHeight: 200,
      order: 1,
      permissions: ['read-own-data'],
      isVisible: true,
      isConfigurable: false
    },
    {
      id: 'stefan-guidance',
      type: 'stefan-guidance',
      title: 'Stefan säger',
      description: 'Personliga råd och insikter från din AI-coach',
      icon: Sparkles,
      span: 12,
      minHeight: 200,
      order: 2,
      permissions: ['read-own-data'],
      isVisible: true,
      isConfigurable: true
    },
    {
      id: 'pillar-progress',
      type: 'pillar-progress', 
      title: 'Din Utvecklingsresa',
      description: 'Progress genom Six Pillars utvecklingsresan',
      icon: Target,
      span: 8,
      minHeight: 300,
      order: 3,
      permissions: ['read-own-data'],
      isVisible: true,
      isConfigurable: true,
      config: {
        showDetailed: true,
        showNextSteps: true
      }
    },
    {
      id: 'quick-stats',
      type: 'stats',
      title: 'Snabbstatistik',
      description: 'Översikt av din utvecklingsprogress',
      icon: TrendingUp,
      span: 4,
      minHeight: 300,
      order: 4,
      permissions: ['read-own-data'],
      isVisible: true,
      isConfigurable: true
    },
    {
      id: 'recent-achievements',
      type: 'activity-feed',
      title: 'Senaste prestationer',
      description: 'Dina senaste framsteg och milstolpar',
      icon: Trophy,
      span: 8,
      minHeight: 200,
      order: 5,
      permissions: ['read-own-data'],
      isVisible: true,
      isConfigurable: true
    },
    {
      id: 'upcoming-tasks',
      type: 'tasks',
      title: 'Kommande uppgifter',
      description: 'Dina nästa steg i utvecklingsresan',
      icon: CheckSquare,
      span: 4,
      minHeight: 200,
      order: 6,
      permissions: ['manage-own-tasks'],
      isVisible: true,
      isConfigurable: true
    },
  ],
  navigation: [
    {
      id: 'dashboard',
      label: 'Översikt',
      icon: BarChart3,
      path: '/client-dashboard',
      permissions: ['read-own-data']
    },
    {
      id: 'six-pillars',
      label: 'Six Pillars',
      icon: Target,
      path: '/six-pillars',
      permissions: ['complete-assessments']
    },
    {
      id: 'development-journey',
      label: 'Min utvecklingsresa',
      icon: TrendingUp,
      path: '/my-development',
      permissions: ['read-own-data']
    },
    {
      id: 'tasks',
      label: 'Uppgifter',
      icon: CheckSquare,
      path: '/tasks',
      permissions: ['manage-own-tasks']
    },
    {
      id: 'calendar',
      label: 'Kalender',
      icon: Calendar,
      path: '/calendar',
      permissions: ['read-own-data']
    }
  ]
};

// 👨‍💼 COACH DASHBOARD CONFIGURATION
const COACH_CONFIG: DashboardConfig = {
  role: 'coach',
  layout: 'management-focused',
  gridCols: 12,
  permissions: [
    'read-client-data',
    'create-tasks',
    'manage-coaching-sessions',
    'view-analytics'
  ],
  features: [
    'client-management',
    'coaching-tools',
    'analytics-dashboard',
    'task-creation',
    'session-planning'
  ],
  widgets: [
    {
      id: 'coach-overview',
      type: 'welcome',
      title: 'Coach Dashboard',
      description: 'Översikt av din coaching-verksamhet',
      icon: Users,
      span: 12,
      minHeight: 180,
      order: 1,
      permissions: ['read-client-data'],
      isVisible: true,
      isConfigurable: false
    },
    {
      id: 'client-overview',
      type: 'client-overview',
      title: 'Klientöversikt',
      description: 'Status och progress för alla dina klienter',
      icon: Users,
      span: 8,
      minHeight: 400,
      order: 2,
      permissions: ['read-client-data'],
      isVisible: true,
      isConfigurable: true,
      config: {
        showProgress: true,
        showIssues: true,
        sortBy: 'last_activity'
      }
    },
    {
      id: 'coach-stats',
      type: 'stats',
      title: 'Coach Statistik',
      description: 'Din coaching-prestanda',
      icon: TrendingUp,
      span: 4,
      minHeight: 400,
      order: 3,
      permissions: ['view-analytics'],
      isVisible: true,
      isConfigurable: false
    },
    {
      id: 'coaching-tools',
      type: 'coaching-tools',
      title: 'Coaching-verktyg',
      description: 'AI-drivna coaching-verktyg och insights',
      icon: Brain,
      span: 6,
      minHeight: 300,
      order: 4,
      permissions: ['manage-coaching-sessions'],
      isVisible: true,
      isConfigurable: true
    },
    {
      id: 'activity-feed',
      type: 'activity-feed',
      title: 'Aktivitetsflöde',
      description: 'Senaste händelser från dina klienter',
      icon: Activity,
      span: 6,
      minHeight: 300,
      order: 5,
      permissions: ['read-client-data'],
      isVisible: true,
      isConfigurable: true,
      config: {
        maxItems: 10,
        showClientNames: true,
        realTimeUpdates: true
      }
    }
  ],
  navigation: [
    {
      id: 'dashboard',
      label: 'Översikt',
      icon: BarChart3,
      path: '/coach-dashboard',
      permissions: ['read-client-data']
    },
    {
      id: 'clients',
      label: 'Klienter',
      icon: Users,
      path: '/clients',
      permissions: ['read-client-data']
    },
    {
      id: 'coaching',
      label: 'AI Coaching',
      icon: Brain,
      path: '/ai-coaching',
      permissions: ['manage-coaching-sessions']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      permissions: ['view-analytics']
    }
  ]
};

// 🛡️ ADMIN DASHBOARD CONFIGURATION
const ADMIN_CONFIG: DashboardConfig = {
  role: 'admin',
  layout: 'full-control',
  gridCols: 12,
  permissions: [
    'admin-all',
    'manage-users',
    'view-system-health',
    'manage-settings',
    'export-data'
  ],
  features: [
    'user-management',
    'system-administration',
    'analytics-full',
    'security-monitoring',
    'configuration-management'
  ],
  widgets: [
    {
      id: 'admin-overview',
      type: 'welcome',
      title: 'Admin Dashboard',
      description: 'Systemadministration och övervakning',
      icon: Shield,
      span: 12,
      minHeight: 160,
      order: 1,
      permissions: ['admin-all'],
      isVisible: true,
      isConfigurable: false
    },
    {
      id: 'system-health',
      type: 'system-health',
      title: 'Systemhälsa',
      description: 'Övervakning av systemstatus och prestanda',
      icon: Activity,
      span: 4,
      minHeight: 300,
      order: 2,
      permissions: ['view-system-health'],
      isVisible: true,
      isConfigurable: false
    },
    {
      id: 'user-stats',
      type: 'stats',
      title: 'Användarstatistik',
      description: 'Översikt av alla användare i systemet',
      icon: Users,
      span: 4,
      minHeight: 300,
      order: 3,
      permissions: ['manage-users'],
      isVisible: true,
      isConfigurable: false
    },
    {
      id: 'system-stats',
      type: 'stats',
      title: 'Systemstatistik',
      description: 'Prestandamätningar och systemmetriker',
      icon: BarChart3,
      span: 4,
      minHeight: 300,
      order: 4,
      permissions: ['view-system-health'],
      isVisible: true,
      isConfigurable: false
    },
    {
      id: 'user-management',
      type: 'user-management',
      title: 'Användarhantering',
      description: 'Hantera användare, roller och behörigheter',
      icon: Settings,
      span: 8,
      minHeight: 400,
      order: 5,
      permissions: ['manage-users'],
      isVisible: true,
      isConfigurable: true
    },
    {
      id: 'system-alerts',
      type: 'activity-feed',
      title: 'Systemvarningar',
      description: 'Viktiga systemhändelser och varningar',
      icon: AlertTriangle,
      span: 4,
      minHeight: 400,
      order: 6,
      permissions: ['view-system-health'],
      isVisible: true,
      isConfigurable: false
    }
  ],
  navigation: [
    {
      id: 'dashboard',
      label: 'Översikt',
      icon: BarChart3,
      path: '/administration',
      permissions: ['admin-all']
    },
    {
      id: 'users',
      label: 'Användare',
      icon: Users,
      path: '/administration?tab=users',
      permissions: ['manage-users']
    },
    {
      id: 'system',
      label: 'System',
      icon: Settings,
      path: '/administration?tab=system',
      permissions: ['view-system-health']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      permissions: ['admin-all']
    }
  ]
};

// 🚀 SUPERADMIN CONFIGURATION
const SUPERADMIN_CONFIG: DashboardConfig = {
  ...ADMIN_CONFIG,
  role: 'superadmin',
  permissions: [
    'superadmin-all',
    'god-mode',
    'system-critical',
    'security-admin'
  ],
  features: [
    ...ADMIN_CONFIG.features,
    'god-mode-access',
    'security-administration',
    'system-critical-operations'
  ]
};

/**
 * 🎯 HUVUDFUNKTION - Hämta dashboard-konfiguration baserat på roll
 */
export function getDashboardConfig(role: UserRole, userId?: string): DashboardConfig {
  const baseConfig = getBaseConfigByRole(role);
  
  // Apply user-specific customizations here if needed
  // För framtida utvidgning: ladda anpassningar från databas
  
  return {
    ...baseConfig,
    // Lägg till user-specific metadata
    userId: userId
  } as DashboardConfig;
}

function getBaseConfigByRole(role: UserRole): DashboardConfig {
  switch (role) {
    case 'client':
      return CLIENT_CONFIG;
    case 'coach':
      return COACH_CONFIG;
    case 'admin':
      return ADMIN_CONFIG;
    case 'superadmin':
      return SUPERADMIN_CONFIG;
    default:
      // Fallback för okända roller
      return {
        ...CLIENT_CONFIG,
        role: role,
        permissions: ['read-own-data'],
        widgets: CLIENT_CONFIG.widgets.filter(w => w.permissions.includes('read-own-data'))
      };
  }
}

/**
 * 🔧 UTILITY FUNCTIONS
 */
export function getWidgetsByRole(role: UserRole): DashboardWidget[] {
  return getDashboardConfig(role).widgets;
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const config = getDashboardConfig(role);
  return config.permissions.includes(permission) || 
         config.permissions.includes('admin-all') ||
         config.permissions.includes('superadmin-all');
}

export function getNavigationForRole(role: UserRole): DashboardNavItem[] {
  return getDashboardConfig(role).navigation || [];
}