import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  CheckSquare, 
  Clock, 
  Target, 
  Brain, 
  Calendar,
  Filter,
  Search,
  Star,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  CalendarPlus,
  Edit
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedCalendarTasks } from '@/hooks/useUnifiedCalendarTasks';
import { TaskCalendarScheduler } from '@/components/Calendar/TaskCalendarScheduler';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { usePerformanceMonitoringV2, useMemoryOptimization } from '@/utils/performanceOptimizationV2';
import type { Task } from '@/types/tasks';

interface LiveTaskListProps {
  className?: string;
}

const LiveTaskListComponent: React.FC<LiveTaskListProps> = ({ className }) => {
  usePerformanceMonitoringV2('LiveTaskList');
  const { registerCleanup } = useMemoryOptimization();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [selectedTaskForScheduling, setSelectedTaskForScheduling] = useState<Task | null>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  
  const { 
    tasks, 
    loading, 
    completeTask, 
    updateTask, 
    refreshTasks
  } = useTasks(user?.id);

  const { 
    createUnifiedTaskEvent,
    moveItem,
    deleteUnifiedItem
  } = useUnifiedCalendarTasks(user?.id);

  // OPTIMIZED: Memoized task calculations to prevent unnecessary re-renders
  const taskCounts = useMemo(() => ({
    total: tasks.length,
    planned: tasks.filter(t => t.status === 'planned').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => 
      t.deadline && 
      new Date(t.deadline) < new Date() && 
      t.status !== 'completed'
    ).length
  }), [tasks]);

  const allFilteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterTab === 'pending') return ['planned', 'in_progress'].includes(task.status);
      if (filterTab === 'completed') return task.status === 'completed';
      if (filterTab === 'ai') return task.ai_generated;
      return true;
    });
  }, [tasks, filterTab]);

  // Listen for task updates - FIXED INFINITE LOOP
  useEffect(() => {
    const handleTasksUpdated = () => refreshTasks();
    window.addEventListener('tasks-updated', handleTasksUpdated);
    return () => window.removeEventListener('tasks-updated', handleTasksUpdated);
  }, []); // FIXED: Empty dependency array prevents infinite loops
  
  const filteredTasks = useMemo(() => {
    return allFilteredTasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allFilteredTasks, searchTerm]);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    await completeTask(taskId);
    toast({
      title: "Uppgift slutförd! 🎉",
      description: "Bra jobbat! Din framsteg registreras automatiskt.",
    });
  }, [completeTask, toast]);

  // FIXED: Use semantic design tokens instead of direct colors
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-primary" />;
      case 'planned': return <Target className="w-4 h-4 text-muted-foreground" />;
      default: return <AlertCircle className="w-4 h-4 text-warning" />;
    }
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Laddar uppgifter...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            Dina Utvecklingsuppgifter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{taskCounts.total}</div>
              <div className="text-sm text-muted-foreground">Totalt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{taskCounts.planned + taskCounts.in_progress}</div>
              <div className="text-sm text-muted-foreground">Pågående</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{taskCounts.completed}</div>
              <div className="text-sm text-muted-foreground">Slutförda</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{taskCounts.overdue}</div>
              <div className="text-sm text-muted-foreground">Försenade</div>
            </div>
          </div>

          {taskCounts.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Framsteg</span>
                <span>{Math.round((taskCounts.completed / taskCounts.total) * 100)}%</span>
              </div>
              <Progress value={(taskCounts.completed / taskCounts.total) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Sök bland uppgifter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={filterTab} onValueChange={setFilterTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Alla ({taskCounts.total})</TabsTrigger>
                <TabsTrigger value="pending">Pågående ({taskCounts.planned + taskCounts.in_progress})</TabsTrigger>
                <TabsTrigger value="completed">Slutförda ({taskCounts.completed})</TabsTrigger>
                <TabsTrigger value="ai">AI-genererade</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardContent className="pt-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {tasks.length === 0 ? 'Inga uppgifter än' : 'Inga matchande uppgifter'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {tasks.length === 0 
                  ? 'När du genomför alla pillars genererar AI Stefan automatiskt utvecklingsuppgifter för dig.'
                  : 'Försök ändra sökkriterier eller filter.'
                }
              </p>
              {tasks.length === 0 && (
                <Button onClick={() => window.location.href = '/pillar-journey'}>
                  <Target className="w-4 h-4 mr-2" />
                  Gå till Pillar-resan
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                    task.status === 'completed' ? 'bg-success/10 border-success/20' : 'bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(task.status)}
                        <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </h3>
                        {task.ai_generated && (
                          <Badge variant="secondary" className="text-xs">
                            <Brain className="w-3 h-3 mr-1" />
                            AI Stefan
                          </Badge>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority === 'high' ? 'Hög prioritet' : 
                           task.priority === 'medium' ? 'Medium prioritet' : 'Låg prioritet'}
                        </Badge>
                        
                        {task.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(new Date(task.deadline), 'MMM d', { locale: sv })}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(task.created_at), 'MMM d', { locale: sv })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTaskForScheduling(task);
                          setIsSchedulerOpen(true);
                        }}
                      >
                        <CalendarPlus className="w-4 h-4 mr-1" />
                        Till kalender
                      </Button>
                      
                      {task.status !== 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteTask(task.id)}
                          className="bg-success hover:bg-success/90 text-success-foreground"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Slutför
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Scheduler Dialog */}
      <TaskCalendarScheduler
        task={selectedTaskForScheduling}
        isOpen={isSchedulerOpen}
        onClose={() => {
          setIsSchedulerOpen(false);
          setSelectedTaskForScheduling(null);
        }}
        onScheduled={() => {
          // Refresh tasks after scheduling
          refreshTasks();
        }}
      />
    </div>
  );
};

// PERFORMANCE OPTIMIZATION: Memoized export
export const LiveTaskList = memo(LiveTaskListComponent);