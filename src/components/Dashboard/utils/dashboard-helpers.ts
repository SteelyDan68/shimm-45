/**
 * 🔧 DASHBOARD HELPER UTILITIES
 * Enterprise-grade hjälpfunktioner för dashboard-systemet
 */

import { DashboardStats, DashboardWidget, UserRole } from '../types/dashboard-types';
import { getDashboardConfig } from '../configs/dashboard-configs';

/**
 * 📊 Beräkna dashboard statistik baserat på användardata
 */
export function calculateDashboardStats(
  userRole: UserRole,
  userData: {
    completedPillars?: number;
    activeTasks?: number;
    totalTasks?: number;
    clients?: any[];
    coachStats?: any;
  }
): DashboardStats {
  const { completedPillars = 0, activeTasks = 0, totalTasks = 0, clients = [], coachStats } = userData;
  
  const baseStats: DashboardStats = {
    completedPillars,
    activeTasks,
    overallProgress: completedPillars > 0 ? (completedPillars / 6) * 100 : 0,
    velocityScore: calculateVelocityScore(completedPillars, activeTasks),
    completedAssessments: completedPillars
  };

  // Role-specific stats
  switch (userRole) {
    case 'coach':
      return {
        ...baseStats,
        activeClients: clients.length,
        clientCount: clients.length,
        averageClientProgress: coachStats?.avgProgressAcrossClients || 0
      };
    
    case 'admin':
    case 'superadmin':
      return {
        ...baseStats,
        totalUsers: coachStats?.totalActiveClients || 0,
        systemHealth: 98, // TODO: Calculate from real metrics
        activeClients: clients.length
      };
    
    default: // client
      return baseStats;
  }
}

/**
 * ⚡ Beräkna velocity score baserat på framsteg
 */
function calculateVelocityScore(completedPillars: number, activeTasks: number): number {
  // Simple algorithm: completed pillars * 20 + active tasks engagement
  const baseScore = completedPillars * 20;
  const engagementBonus = Math.min(activeTasks * 5, 25); // Max 25 bonus points
  return Math.min(baseScore + engagementBonus, 100);
}

/**
 * 🎯 Filtrera widgets baserat på behörigheter och synlighet
 */
export function filterVisibleWidgets(
  widgets: DashboardWidget[],
  userPermissions: string[],
  customizations?: Record<string, any>
): DashboardWidget[] {
  return widgets
    .filter(widget => {
      // Check permissions
      const hasRequiredPermissions = widget.permissions.every(permission =>
        userPermissions.includes(permission) ||
        userPermissions.includes('admin-all') ||
        userPermissions.includes('superadmin-all')
      );
      
      if (!hasRequiredPermissions) return false;
      
      // Check user customizations
      const customization = customizations?.[widget.id];
      if (customization?.isVisible === false) return false;
      
      return widget.isVisible !== false; // Default to visible
    })
    .sort((a, b) => {
      // Sort by custom order if available, otherwise by default order
      const aOrder = customizations?.[a.id]?.order ?? a.order;
      const bOrder = customizations?.[b.id]?.order ?? b.order;
      return aOrder - bOrder;
    });
}

/**
 * 📐 Beräkna grid layout för widgets
 */
export function calculateGridLayout(
  widgets: DashboardWidget[],
  gridCols: number = 12
): DashboardWidget[] {
  return widgets.map(widget => ({
    ...widget,
    span: Math.min(widget.span || 6, gridCols)
  }));
}

/**
 * 🎨 Generera widget CSS classes baserat på konfiguration
 */
export function getWidgetClasses(widget: DashboardWidget, baseClasses: string = ''): string {
  const classes = [baseClasses];
  
  // Grid span
  if (widget.span) {
    classes.push(`col-span-${Math.min(widget.span, 12)}`);
  }
  
  // Minimum height
  if (widget.minHeight) {
    classes.push(`min-h-[${widget.minHeight}px]`);
  }
  
  return classes.filter(Boolean).join(' ');
}

/**
 * 🔄 Uppdatera widget konfiguration
 */
export function updateWidgetConfig(
  currentConfig: Record<string, any>,
  widgetId: string,
  newConfig: Record<string, any>
): Record<string, any> {
  return {
    ...currentConfig,
    [widgetId]: {
      ...currentConfig[widgetId],
      ...newConfig
    }
  };
}

/**
 * 📊 Validera dashboard konfiguration
 */
export function validateDashboardConfig(
  role: UserRole,
  customizations?: Record<string, any>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = getDashboardConfig(role);
  
  if (!config) {
    errors.push(`No configuration found for role: ${role}`);
    return { isValid: false, errors };
  }
  
  if (!config.widgets || config.widgets.length === 0) {
    errors.push('Dashboard configuration must have at least one widget');
  }
  
  // Validate widget configurations
  config.widgets.forEach(widget => {
    if (!widget.id || !widget.type) {
      errors.push(`Widget missing required id or type: ${JSON.stringify(widget)}`);
    }
    
    if (widget.span && (widget.span < 1 || widget.span > 12)) {
      errors.push(`Widget ${widget.id} has invalid span: ${widget.span}`);
    }
  });
  
  // Validate customizations
  if (customizations) {
    Object.entries(customizations).forEach(([widgetId, customization]) => {
      const widget = config.widgets.find(w => w.id === widgetId);
      if (!widget) {
        errors.push(`Customization found for non-existent widget: ${widgetId}`);
      }
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * 🚀 Export all utilities
 */
export const DashboardHelpers = {
  calculateDashboardStats,
  filterVisibleWidgets,
  calculateGridLayout,
  getWidgetClasses,
  updateWidgetConfig,
  validateDashboardConfig
};