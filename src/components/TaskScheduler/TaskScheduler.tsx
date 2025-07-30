import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIToTaskConverter } from './AIToTaskConverter';
import { ManualTaskForm } from './ManualTaskForm';
import { useTasks } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Brain, Plus, BarChart3 } from 'lucide-react';
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
  const { createTask, refreshTasks } = useTasks(clientId);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIRecommendations();
  }, [clientId]);

  const fetchAIRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('path_entries')
        .select('id, details, timestamp')
        .eq('client_id', clientId)
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{aiRecommendations.length}</div>
              <div className="text-sm text-muted-foreground">AI-rekommendationer</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                <BarChart3 className="h-8 w-8 mx-auto" />
              </div>
              <div className="text-sm text-muted-foreground">Redo att konvertera</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                <Plus className="h-8 w-8 mx-auto" />
              </div>
              <div className="text-sm text-muted-foreground">Manuella uppgifter</div>
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