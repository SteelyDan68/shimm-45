/**
 * 🏗️ ENTERPRISE-GRADE DASHBOARD TYPE DEFINITIONS
 * Världsklass typedefinitioner för unified dashboard-arkitektur
 */

import { LucideIcon } from 'lucide-react';

export type UserRole = 'client' | 'coach' | 'admin' | 'superadmin';

export type DashboardLayout = 
  | 'client-focused'      // Personlig utveckling och progress
  | 'management-focused'  // Klienthantering och coaching-tools
  | 'full-control'       // Systemadministration och analytics
  | 'minimal';           // Begränsad åtkomst

export type WidgetType = 
  | 'welcome'
  | 'stats'
  | 'pillar-progress'
  | 'tasks'
  | 'calendar'
  | 'client-overview'
  | 'coaching-tools'
  | 'analytics'
  | 'system-health'
  | 'user-management'
  | 'activity-feed'
  | 'quick-actions';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  icon?: LucideIcon;
  span?: number;           // Grid span (1-4)
  minHeight?: number;      // Minimum height in pixels
  order: number;           // Display order
  permissions: string[];   // Required permissions
  config?: Record<string, any>; // Widget-specific configuration
  isVisible?: boolean;     // User can hide/show
  isConfigurable?: boolean; // User can configure
}

export interface DashboardConfig {
  role: UserRole;
  layout: DashboardLayout;
  gridCols: number;        // Number of grid columns
  widgets: DashboardWidget[];
  permissions: string[];
  features: string[];      // Available features for this role
  navigation?: DashboardNavItem[];
}

export interface DashboardNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  path: string;
  badge?: string | number;
  permissions: string[];
}

export interface DashboardContextState {
  currentRole: UserRole | null;
  config: DashboardConfig | null;
  isLoading: boolean;
  error: string | null;
  customizations: Record<string, any>;
}

export interface DashboardStats {
  totalUsers?: number;
  activeClients?: number;
  completedAssessments?: number;
  activeCoaches?: number;
  systemHealth?: number;
  // Client-specific stats
  completedPillars?: number;
  activeTasks?: number;
  overallProgress?: number;
  velocityScore?: number;
  // Coach-specific stats
  clientCount?: number;
  activeInterventions?: number;
  averageClientProgress?: number;
}

export interface DashboardMetrics {
  daily: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
  trends: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
}

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  permissions: string[];
}

export interface DashboardTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  borderColor: string;
}

export interface WidgetProps {
  widget: DashboardWidget;
  stats?: DashboardStats;
  metrics?: DashboardMetrics;
  actions?: QuickAction[];
  onAction?: (actionId: string) => void;
  onConfigChange?: (config: Record<string, any>) => void;
}

export interface DashboardProviderProps {
  children: React.ReactNode;
  userId?: string;
  role?: UserRole;
}