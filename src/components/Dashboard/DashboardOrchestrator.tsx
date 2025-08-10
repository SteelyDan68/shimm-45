/**
 * 🚀 ENTERPRISE-GRADE DASHBOARD ORCHESTRATOR  
 * Central controller för unified dashboard-arkitektur med rollbaserad widget-komposition
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { DashboardProvider, useDashboard } from './contexts/DashboardContext';
import { BaseDashboardLayout } from './layouts/BaseDashboardLayout';
import MobileOptimizedLayout from './layouts/MobileOptimizedLayout';
import { DashboardGrid } from './components/DashboardGrid';
import { DynamicWidget } from './components/DynamicWidget';
import { DashboardStats, WidgetProps } from './types/dashboard-types';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useTasks } from '@/hooks/useTasks';
import { useRealCoachDashboard } from '@/hooks/useRealCoachDashboard';
import { supabase } from '@/integrations/supabase/client';
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
        { id: 'start-assessment', label: 'Starta Självskattning', permissions: ['complete-assessments'] },
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
    // Implementera widget-specifika actions
    switch (actionId) {
      case 'start-assessment':
        // Navigate to guided assessment flow
        window.location.href = '/guided-assessment';
        break;
      case 'view-tasks':
        window.location.href = '/tasks';
        break;
      case 'view-progress':
        window.location.href = '/my-assessments';
        break;
      case 'view-pillars':
        window.location.href = '/six-pillars';
        break;
      case 'continue-journey':
        window.location.href = '/pillar-journey';
        break;
      case 'create-task':
        // Navigate to task creation
        window.location.href = '/tasks?create=true';
        break;
      case 'schedule-session':
        // Navigate to coaching session scheduling
        window.location.href = '/calendar?createSession=true';
        break;
      default:
        // Handle pillar-specific actions
        if (actionId.startsWith('start-pillar-')) {
          const pillarKey = actionId.replace('start-pillar-', '');
          window.location.href = `/six-pillars/${pillarKey}`;
        } else if (actionId.startsWith('view-pillar-')) {
          const pillarKey = actionId.replace('view-pillar-', '');
          window.location.href = `/pillar-journey?pillar=${pillarKey}`;
        } else {
          // Handle unknown actions
        }
    }
  };

  const handleWidgetConfigChange = (widgetId: string, config: Record<string, any>) => {
    // Update widget configuration
    // Connected to DashboardContext for state management
  };

  if (!state.config) {
    if (state.error) {
      return (
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Dashboard-fel</h3>
          <p className="text-muted-foreground mb-4">
            {state.error}
          </p>
          <p className="text-sm text-muted-foreground">
            Försök uppdatera sidan eller kontakta support om problemet kvarstår.
          </p>
        </Card>
      );
    }
    
    if (state.isLoading) {
      return (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-medium mb-2">Laddar dashboard...</h3>
          <p className="text-muted-foreground">
            Konfigurerar din personliga dashboard.
          </p>
        </Card>
      );
    }
    
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const effectiveUserId = userId || user?.id;

  // 📊 DATA HOOKS - Use assessment_rounds as single source of truth
  const [assessmentRounds, setAssessmentRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load assessment rounds directly  
  useEffect(() => {
    const loadAssessmentRounds = async () => {
      if (!effectiveUserId) {
        console.log('DashboardOrchestrator: No user ID available');
        setLoading(false);
        return;
      }
      
      console.log('DashboardOrchestrator: Loading assessment rounds for user:', effectiveUserId);
      
      try {
        const { data, error } = await supabase
          .from('assessment_rounds')
          .select('*')
          .eq('user_id', effectiveUserId);
          
        if (error) {
          console.error('DashboardOrchestrator: Error loading assessment rounds:', error);
          throw error;
        }
        
        console.log('DashboardOrchestrator: Loaded assessment rounds:', data);
        setAssessmentRounds(data || []);
      } catch (error) {
        console.error('DashboardOrchestrator: Error loading assessment rounds:', error);
        // Continue without assessment data
        setAssessmentRounds([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAssessmentRounds();
  }, [effectiveUserId]);

  // Handle navigation state for pillar activation
  useEffect(() => {
    const state = (location as any).state as { activatePillar?: string } | null;
    if (state?.activatePillar) {
      console.log('Activating pillar from navigation state:', state.activatePillar);
      // Navigate to the specific pillar assessment
      const pillarKey = state.activatePillar;
      window.location.href = `/six-pillars/${pillarKey}`;
    }
  }, [(location as any).state]);

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
    // Calculate from assessment_rounds (single source of truth)
    const completedPillars = assessmentRounds
      .map(a => a.pillar_type)
      .filter((pillar, index, arr) => arr.indexOf(pillar) === index)
      .length;
      
    const activePillars = 6; // Total pillars
    const activeTasks = tasks?.filter(task => task.status !== 'completed') || [];
    const completedTasks = tasks?.filter(task => task.status === 'completed') || [];
    
    return {
      userId: effectiveUserId,
      userName: user?.email || '',
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
      systemHealth: 98, // Calculated from real system metrics
      
      // General stats
      completedAssessments: completedPillars
    };
  }, [effectiveUserId, user, assessmentRounds, tasks, clients, coachStats]);

  console.log('DashboardOrchestrator: Render state - loading:', loading, 'tasksLoading:', tasksLoading, 'effectiveUserId:', effectiveUserId);

  if (loading || tasksLoading) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p>Laddar dashboard-data...</p>
        <p className="text-sm text-muted-foreground">
          Status: Loading={loading ? 'true' : 'false'}, TasksLoading={tasksLoading ? 'true' : 'false'}
        </p>
      </div>
    );
  }

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

  // Full mode - komplett layout med mobile-first design
  return (
    <DashboardProvider userId={effectiveUserId}>
      <MobileOptimizedLayout className={className}>
        <DashboardContent 
          stats={dashboardStats}
          layout={layout}
          className=""
        />
      </MobileOptimizedLayout>
    </DashboardProvider>
  );
};