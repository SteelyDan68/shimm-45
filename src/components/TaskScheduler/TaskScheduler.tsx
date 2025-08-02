import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AIToTaskConverter } from './AIToTaskConverter';
import { ManualTaskForm } from './ManualTaskForm';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Brain, Plus, BarChart3, Zap, Target, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { CreateTaskData } from '@/types/tasks';

interface TaskSchedulerProps {
  clientId: string;
  clientName?: string;
}

interface AIRecommendation {
  id: string;
  details: string;
  timestamp: string;
}

export function TaskScheduler({ clientId, clientName }: TaskSchedulerProps) {
  const { createTask, refreshTasks, tasks } = useTasks(clientId);
  const { user, hasRole } = useAuth();
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    aiGenerated: 0,
    manual: 0
  });

  useEffect(() => {
    fetchAIRecommendations();
    calculateTaskStats();
  }, [clientId, tasks]);

  const calculateTaskStats = () => {
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'planned' || t.status === 'in_progress').length,
      overdue: tasks.filter(t => 
        t.deadline && 
        new Date(t.deadline) < new Date() && 
        t.status !== 'completed'
      ).length,
      aiGenerated: tasks.filter(t => t.ai_generated).length,
      manual: tasks.filter(t => !t.ai_generated).length
    };
    setTaskStats(stats);
  };

  const fetchAIRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('path_entries')
        .select('id, details, timestamp')
        .eq('user_id', clientId)
        .eq('type', 'recommendation')
        .eq('ai_generated', true)
        .order('timestamp', { ascending: false })
        .limit(3);

      if (error) throw error;

      setAiRecommendations((data || []).map(item => ({
        id: item.id,
        details: item.details || '',
        timestamp: item.timestamp
      })));
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: CreateTaskData) => {
    const result = await createTask(taskData);
    if (result) {
      refreshTasks();
    }
  };

  const handleCreateMultipleTasks = async (tasks: CreateTaskData[]) => {
    const promises = tasks.map(task => createTask(task));
    await Promise.all(promises);
    refreshTasks();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div>Laddar AI-rekommendationer...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Uppgiftsschemaläggare{clientName ? ` - ${clientName}` : ''}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Konvertera AI-rekommendationer till schemalagda uppgifter eller skapa manuella uppgifter
          </p>
        </CardHeader>
        <CardContent>
          {/* Enhanced Task Statistics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center mb-6">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{taskStats.total}</div>
              <div className="text-xs text-muted-foreground">Totala uppgifter</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-xs text-muted-foreground">Slutförda</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
              <div className="text-xs text-muted-foreground">Pågående</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
              <div className="text-xs text-muted-foreground">Försenade</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center text-2xl font-bold text-purple-600">
                <Zap className="h-6 w-6 mr-1" />
                {taskStats.aiGenerated}
              </div>
              <div className="text-xs text-muted-foreground">AI-genererade</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center text-2xl font-bold text-gray-600">
                <Target className="h-6 w-6 mr-1" />
                {taskStats.manual}
              </div>
              <div className="text-xs text-muted-foreground">Manuella</div>
            </div>
          </div>

          {/* Task Efficiency Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Slutförandegrad</span>
              </div>
              <Progress value={taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0} className="h-2" />
              <div className="text-sm text-muted-foreground mt-1">
                {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}% slutfört
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="font-medium">AI-automatisering</span>
              </div>
              <Progress value={taskStats.total > 0 ? (taskStats.aiGenerated / taskStats.total) * 100 : 0} className="h-2" />
              <div className="text-sm text-muted-foreground mt-1">
                {taskStats.total > 0 ? Math.round((taskStats.aiGenerated / taskStats.total) * 100) : 0}% AI-genererade
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Punktlighet</span>
              </div>
              <Progress value={taskStats.total > 0 ? Math.max(0, 100 - (taskStats.overdue / taskStats.total) * 100) : 100} className="h-2" />
              <div className="text-sm text-muted-foreground mt-1">
                {taskStats.overdue > 0 ? `${taskStats.overdue} försenade` : 'Inga förseningar!'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {aiRecommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI-rekommendationer att konvertera
          </h3>
          
          {aiRecommendations.map(recommendation => (
            <AIToTaskConverter
              key={recommendation.id}
              aiRecommendation={recommendation.details}
              clientId={clientId}
              sourcePathEntryId={recommendation.id}
              onCreateTasks={handleCreateMultipleTasks}
            />
          ))}
        </div>
      )}

      {/* Manual Task Form */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Plus className="h-5 w-5 text-primary" />
          Skapa manuell uppgift
        </h3>
        
        <ManualTaskForm
          clientId={clientId}
          onCreateTask={handleCreateTask}
        />
      </div>

      {/* No Recommendations State */}
      {aiRecommendations.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga AI-rekommendationer än</h3>
              <p className="text-muted-foreground">
                När klienten gör självskattningar kommer AI-rekommendationer att visas här 
                och du kan konvertera dem till uppgifter.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}