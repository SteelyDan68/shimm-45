/**
 * 🚀 OPTIMIZED PHASE EXECUTION MANAGER
 * SCRUM-TEAM PERFORMANCE-OPTIMIZED IMPLEMENTATION CONTROL CENTER
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Zap,
  Target,
  TrendingUp,
  FileText
} from 'lucide-react';
import { IMPLEMENTATION_PHASES, PhaseTracker, type Phase, type PhaseTask } from '@/utils/phaseTracker';
import { logger } from '@/utils/productionLogger';
import { 
  useOptimizedCallback, 
  useOptimizedMemo, 
  useRenderOptimization,
  useBatchedUpdates
} from '@/hooks/usePerformanceOptimization';
import { createOptimizedComparison } from '@/utils/memoizationHelpers';

// Memoized sub-components for better performance
const StatusIcon = React.memo<{ status: PhaseTask['status'] }>(({ status }) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'audited': return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default: return <Clock className="h-4 w-4 text-gray-400" />;
  }
});

const PriorityBadge = React.memo<{ priority: PhaseTask['priority'] }>(({ priority }) => {
  const variant = useMemo(() => {
    switch (priority) {
      case 'critical': return 'destructive' as const;
      case 'high': return 'default' as const;
      case 'medium': return 'secondary' as const;
      case 'low': return 'outline' as const;
    }
  }, [priority]);

  return <Badge variant={variant}>{priority}</Badge>;
});

const ProgressCard = React.memo<{
  label: string;
  value: number;
  color: string;
}>(({ label, value, color }) => (
  <div className="text-center">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
));

// Optimized task component with memoization
const TaskCard = React.memo<{
  task: PhaseTask;
  onComplete: (taskId: string) => void;
}>(({ task, onComplete }) => {
  const { trackRender } = useRenderOptimization('TaskCard');
  
  React.useEffect(() => {
    trackRender({ taskId: task.id, status: task.status });
  });

  const handleComplete = useOptimizedCallback(() => {
    onComplete(task.id);
  }, [task.id, onComplete], 'TaskCard.handleComplete');

  const auditDisplay = useOptimizedMemo(() => {
    if (!task.auditResults) return null;
    
    return (
      <div className="mt-2 p-2 bg-muted rounded">
        <div className="text-xs font-medium">
          Audit: {task.auditResults.passed ? '✅ PASSED' : '❌ FAILED'}
        </div>
        {task.auditResults.issues.length > 0 && (
          <div className="text-xs text-red-600 mt-1">
            Issues: {task.auditResults.issues.join(', ')}
          </div>
        )}
      </div>
    );
  }, [task.auditResults], 'TaskCard.auditDisplay');

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon status={task.status} />
            <h4 className="font-medium">{task.title}</h4>
            <PriorityBadge priority={task.priority} />
            <Badge variant="outline">{task.category}</Badge>
            <Badge variant="outline">{task.estimatedDays}d</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {task.description}
          </p>
          {auditDisplay}
        </div>
        <div className="flex gap-2 ml-4">
          {task.status === 'pending' && (
            <Button size="sm" onClick={handleComplete}>
              Complete
            </Button>
          )}
          {task.status === 'completed' && (
            <Button size="sm" variant="outline">
              Audit
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}, createOptimizedComparison<{
  task: PhaseTask;
  onComplete: (taskId: string) => void;
}>({
  deepCompare: ['task'],
  ignoreKeys: ['onComplete'] // Function references change but we compare by task.id
}));

// Optimized phase tab component
const PhaseTab = React.memo<{
  phase: Phase;
  onStartPhase: (phaseId: string) => void;
  onCompleteTask: (taskId: string) => void;
}>(({ phase, onStartPhase, onCompleteTask }) => {
  const { trackRender } = useRenderOptimization('PhaseTab');
  
  React.useEffect(() => {
    trackRender({ phaseId: phase.id, status: phase.status });
  });

  const phaseProgress = useOptimizedMemo(() => 
    PhaseTracker.getPhaseProgress(phase.id), 
    [phase.id, phase.tasks], 
    'PhaseTab.phaseProgress'
  );

  const handleStartPhase = useOptimizedCallback(() => {
    onStartPhase(phase.id);
  }, [phase.id, onStartPhase], 'PhaseTab.handleStartPhase');

  const statusIcon = useOptimizedMemo(() => {
    if (phase.status === 'in_progress') return <Clock className="h-5 w-5 text-yellow-500" />;
    if (phase.status === 'completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <Play className="h-5 w-5 text-gray-400" />;
  }, [phase.status], 'PhaseTab.statusIcon');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {statusIcon}
              {phase.name}
            </CardTitle>
            <CardDescription>{phase.description}</CardDescription>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">Timeline: {phase.timeline}</Badge>
              <Badge variant={phase.status === 'in_progress' ? 'default' : 'secondary'}>
                {phase.status}
              </Badge>
            </div>
          </div>
          {phase.status === 'pending' && (
            <Button onClick={handleStartPhase} className="ml-4">
              <Play className="h-4 w-4 mr-2" />
              Start Phase
            </Button>
          )}
        </div>
        <Progress value={phaseProgress} className="mt-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {phase.tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onComplete={onCompleteTask} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}, createOptimizedComparison<{
  phase: Phase;
  onStartPhase: (phaseId: string) => void;
  onCompleteTask: (taskId: string) => void;
}>({
  deepCompare: ['phase'],
  ignoreKeys: ['onStartPhase', 'onCompleteTask']
}));

// Main optimized component
export const OptimizedPhaseExecutionManager: React.FC = React.memo(() => {
  const { trackRender } = useRenderOptimization('OptimizedPhaseExecutionManager');
  const { batchUpdate } = useBatchedUpdates();
  
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [overallProgress, setOverallProgress] = useState(PhaseTracker.getOverallProgress());

  // Track renders for performance monitoring
  React.useEffect(() => {
    trackRender({ 
      currentPhaseId: currentPhase?.id, 
      overallProgress: overallProgress.progressPercent 
    });
  });

  // Optimized effect for initialization
  useEffect(() => {
    const initializeData = () => {
      const phase = PhaseTracker.getCurrentPhase();
      const progress = PhaseTracker.getOverallProgress();
      
      batchUpdate(() => {
        setCurrentPhase(phase);
        setOverallProgress(progress);
      });
    };

    initializeData();
  }, [batchUpdate]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleStartPhase = useOptimizedCallback((phaseId: string) => {
    PhaseTracker.startPhase(phaseId);
    const updatedPhase = PhaseTracker.getCurrentPhase();
    setCurrentPhase(updatedPhase);
    logger.info(`🚀 Started Phase: ${phaseId}`);
  }, [], 'handleStartPhase');

  const handleCompleteTask = useOptimizedCallback((taskId: string) => {
    PhaseTracker.completeTask(taskId);
    const updatedProgress = PhaseTracker.getOverallProgress();
    setOverallProgress(updatedProgress);
    logger.success(`✅ Task completed: ${taskId}`);
  }, [], 'handleCompleteTask');

  // Memoized progress cards data
  const progressCardsData = useOptimizedMemo(() => [
    { label: 'Total Tasks', value: overallProgress.totalTasks, color: 'text-primary' },
    { label: 'Completed', value: overallProgress.completedTasks, color: 'text-green-600' },
    { label: 'Audited', value: overallProgress.auditedTasks, color: 'text-blue-600' },
    { label: 'Overall Progress', value: overallProgress.progressPercent, color: 'text-purple-600' }
  ], [overallProgress], 'progressCardsData');

  // Memoized current phase alert
  const currentPhaseAlert = useOptimizedMemo(() => {
    if (!currentPhase) return null;
    
    return (
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertTitle>🎯 ACTIVE PHASE: {currentPhase.name}</AlertTitle>
        <AlertDescription>
          {currentPhase.description} | Timeline: {currentPhase.timeline}
        </AlertDescription>
      </Alert>
    );
  }, [currentPhase], 'currentPhaseAlert');

  return (
    <div className="space-y-6">
      {/* OVERALL STATUS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            SCRUM-TEAM Implementation Status
          </CardTitle>
          <CardDescription>
            Comprehensive system optimization execution progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {progressCardsData.map((card, index) => (
              <ProgressCard key={index} {...card} />
            ))}
          </div>
          <Progress value={overallProgress.progressPercent} className="w-full" />
        </CardContent>
      </Card>

      {/* CURRENT PHASE ALERT */}
      {currentPhaseAlert}

      {/* PHASE TABS */}
      <Tabs defaultValue="phase_1_critical" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {IMPLEMENTATION_PHASES.map((phase) => (
            <TabsTrigger key={phase.id} value={phase.id} className="text-xs">
              {phase.name.split(':')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {IMPLEMENTATION_PHASES.map((phase) => (
          <TabsContent key={phase.id} value={phase.id}>
            <PhaseTab 
              phase={phase}
              onStartPhase={handleStartPhase}
              onCompleteTask={handleCompleteTask}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
});

OptimizedPhaseExecutionManager.displayName = 'OptimizedPhaseExecutionManager';