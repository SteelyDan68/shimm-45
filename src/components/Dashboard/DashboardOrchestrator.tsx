/**
 * 🚀 ENTERPRISE-GRADE DASHBOARD ORCHESTRATOR  
 * Central controller för unified dashboard-arkitektur med rollbaserad widget-komposition
 */

import React, { useMemo } from 'react';
import { DashboardProvider, useDashboard } from './contexts/DashboardContext';
import { BaseDashboardLayout } from './layouts/BaseDashboardLayout';
import { DashboardGrid } from './components/DashboardGrid';
import { DynamicWidget } from './components/DynamicWidget';
import { DashboardStats, WidgetProps } from './types/dashboard-types';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUserPillars } from '@/hooks/useUserPillars';
import { useTasks } from '@/hooks/useTasks';
import { useRealCoachDashboard } from '@/hooks/useRealCoachDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface DashboardOrchestratorProps {
  userId?: string;
  className?: string;
  layout?: 'embedded' | 'full';
}

/**
 * 🎯 INTERNAL DASHBOARD CONTENT COMPONENT
 * Separerad för att använda useDashboard hook
 */
const DashboardContent: React.FC<{
  stats: DashboardStats;
  layout: 'embedded' | 'full';
  className: string;
}> = ({ stats, layout, className }) => {
  const { state } = useDashboard();
  
  // Filter visible widgets baserat på användaranpassningar
  const visibleWidgets = useMemo(() => {
    if (!state.config) return [];
    
    return state.config.widgets
      .filter(widget => {
        const customization = state.customizations.widgets?.[widget.id];
        return customization?.isVisible !== false; // Default till visible
      })
      .sort((a, b) => a.order - b.order);
  }, [state.config, state.customizations]);

  // Quick actions för användaren
  const quickActions = useMemo(() => {
    if (!state.currentRole) return [];
    
    // Generera rollspecifika quick actions
    const actions = [];
    
    if (state.currentRole === 'client') {
      actions.push(
        { id: 'start-assessment', label: 'Starta Assessment', permissions: ['complete-assessments'] },
        { id: 'view-tasks', label: 'Se Uppgifter', permissions: ['manage-own-tasks'] }
      );
    } else if (state.currentRole === 'coach') {
      actions.push(
        { id: 'create-task', label: 'Skapa Uppgift', permissions: ['create-tasks'] },
        { id: 'schedule-session', label: 'Boka Session', permissions: ['manage-coaching-sessions'] }
      );
    }
    
    return actions;
  }, [state.currentRole]);

  const handleWidgetAction = (widgetId: string, actionId: string) => {
    console.log(`Widget ${widgetId} action: ${actionId}`);
    // Implementera widget-specifika actions här
  };

  const handleWidgetConfigChange = (widgetId: string, config: Record<string, any>) => {
    // Update widget configuration
    // Detta kommer att kopplas till DashboardContext senare
    console.log(`Widget ${widgetId} config change:`, config);
  };

  if (!state.config) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Konfiguration saknas</h3>
        <p className="text-muted-foreground">
          Dashboard-konfiguration kunde inte laddas för din roll.
        </p>
      </Card>
    );
  }

  return (
    <DashboardGrid 
      layout={state.config.layout}
      gridCols={state.config.gridCols}
      className={className}
    >
      {visibleWidgets.map((widget) => {
        const widgetProps: WidgetProps = {
          widget: {
            ...widget,
            // Merge user customizations
            ...state.customizations.widgets?.[widget.id],
            config: {
              ...widget.config,
              ...state.customizations.widgets?.[widget.id]?.config
            }
          },
          stats,
          actions: quickActions,
          onAction: (actionId) => handleWidgetAction(widget.id, actionId),
          onConfigChange: (config) => handleWidgetConfigChange(widget.id, config)
        };

        return (
          <DynamicWidget
            key={widget.id}
            {...widgetProps}
          />
        );
      })}
    </DashboardGrid>
  );
};

/**
 * 🎯 HUVUDKOMPONENT - DASHBOARD ORCHESTRATOR
 */
export const DashboardOrchestrator: React.FC<DashboardOrchestratorProps> = ({
  userId,
  className = "",
  layout = 'full'
}) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  // 📊 DATA HOOKS - Ladda data baserat på användarroll och behörigheter
  const { 
    getCompletedPillars, 
    getActivatedPillars,
    loading: pillarLoading 
  } = useUserPillars(effectiveUserId || '');
  
  const { 
    tasks, 
    loading: tasksLoading 
  } = useTasks(effectiveUserId);
  
  const { 
    clients, 
    coachStats, 
    loading: coachLoading 
  } = useRealCoachDashboard();

  // Helper function to calculate velocity score
  const calculateVelocityScore = (completedPillars: number, activeTasks: number, completedTasks: number): number => {
    const baseScore = completedPillars * 15; // 15 points per completed pillar
    const taskEngagement = Math.min(activeTasks * 3, 15); // Up to 15 points for active tasks
    const completionBonus = Math.min(completedTasks * 2, 20); // Up to 20 points for completed tasks
    return Math.min(baseScore + taskEngagement + completionBonus, 100);
  };

  // 🧮 CALCULATE DASHBOARD STATS
  const dashboardStats: DashboardStats = useMemo(() => {
    const completedPillars = getCompletedPillars().length;
    const activePillars = getActivatedPillars().length;
    const activeTasks = tasks?.filter(task => task.status !== 'completed') || [];
    const completedTasks = tasks?.filter(task => task.status === 'completed') || [];
    
    return {
      // Client stats
      completedPillars,
      activeTasks: activeTasks.length,
      overallProgress: completedPillars > 0 ? (completedPillars / 6) * 100 : 0,
      velocityScore: calculateVelocityScore(completedPillars, activeTasks.length, completedTasks.length),
      
      // Coach stats  
      activeClients: clients?.length || 0,
      clientCount: clients?.length || 0,
      averageClientProgress: coachStats?.avgProgressAcrossClients || 0,
      
      // Admin stats
      totalUsers: coachStats?.totalActiveClients || 0,
      systemHealth: 98, // TODO: Calculate from real system metrics
      
      // General stats
      completedAssessments: completedPillars
    };
  }, [getCompletedPillars, getActivatedPillars, tasks, clients, coachStats]);

  // 🎨 RENDER LOGIC
  if (layout === 'embedded') {
    // Embedded mode - bara innehållet utan layout
    return (
      <DashboardProvider userId={effectiveUserId}>
        <DashboardContent 
          stats={dashboardStats}
          layout={layout}
          className={className}
        />
      </DashboardProvider>
    );
  }

  // Full mode - komplett layout med header och navigation
  return (
    <DashboardProvider userId={effectiveUserId}>
      <BaseDashboardLayout className={className}>
        <DashboardContent 
          stats={dashboardStats}
          layout={layout}
          className=""
        />
      </BaseDashboardLayout>
    </DashboardProvider>
  );
};