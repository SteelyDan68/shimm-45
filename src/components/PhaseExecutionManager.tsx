/**
 * 🎯 PHASE EXECUTION MANAGER
 * SCRUM-TEAM IMPLEMENTATION CONTROL CENTER
 */
import React, { useState, useEffect } from 'react';
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

export const PhaseExecutionManager: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [overallProgress, setOverallProgress] = useState(PhaseTracker.getOverallProgress());

  useEffect(() => {
    setCurrentPhase(PhaseTracker.getCurrentPhase());
    setOverallProgress(PhaseTracker.getOverallProgress());
  }, []);

  const handleStartPhase = (phaseId: string) => {
    PhaseTracker.startPhase(phaseId);
    setCurrentPhase(PhaseTracker.getCurrentPhase());
    logger.info(`🚀 Started Phase: ${phaseId}`);
  };

  const handleCompleteTask = (taskId: string) => {
    PhaseTracker.completeTask(taskId);
    setOverallProgress(PhaseTracker.getOverallProgress());
    logger.success(`✅ Task completed: ${taskId}`);
  };

  const getStatusIcon = (status: PhaseTask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'audited': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: PhaseTask['priority']) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
    }
  };

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
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{overallProgress.totalTasks}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{overallProgress.completedTasks}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overallProgress.auditedTasks}</div>
              <div className="text-sm text-muted-foreground">Audited</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{overallProgress.progressPercent}%</div>
              <div className="text-sm text-muted-foreground">Overall Progress</div>
            </div>
          </div>
          <Progress value={overallProgress.progressPercent} className="w-full" />
        </CardContent>
      </Card>

      {/* CURRENT PHASE ALERT */}
      {currentPhase && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertTitle>🎯 ACTIVE PHASE: {currentPhase.name}</AlertTitle>
          <AlertDescription>
            {currentPhase.description} | Timeline: {currentPhase.timeline}
          </AlertDescription>
        </Alert>
      )}

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
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {phase.status === 'in_progress' && <Clock className="h-5 w-5 text-yellow-500" />}
                      {phase.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {phase.status === 'pending' && <Play className="h-5 w-5 text-gray-400" />}
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
                    <Button 
                      onClick={() => handleStartPhase(phase.id)}
                      className="ml-4"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Phase
                    </Button>
                  )}
                </div>
                <Progress 
                  value={PhaseTracker.getPhaseProgress(phase.id)} 
                  className="mt-4" 
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phase.tasks.map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(task.status)}
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge variant={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline">{task.category}</Badge>
                            <Badge variant="outline">{task.estimatedDays}d</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {task.description}
                          </p>
                          {task.auditResults && (
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
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          {task.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleCompleteTask(task.id)}
                            >
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};