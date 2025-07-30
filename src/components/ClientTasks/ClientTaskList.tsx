import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TaskItem } from './TaskItem';
import { useTasks } from '@/hooks/useTasks';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Filter,
  Calendar
} from 'lucide-react';
import type { TaskStatus } from '@/types/tasks';

interface ClientTaskListProps {
  clientId: string;
  clientName?: string;
  readonly?: boolean;
}

export function ClientTaskList({ clientId, clientName, readonly = false }: ClientTaskListProps) {
  const { tasks, loading, completeTask, updateTask } = useTasks(clientId);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  const filteredTasks = tasks.filter(task => 
    statusFilter === 'all' || task.status === statusFilter
  );

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const overdueTasks = tasks.filter(task => 
    task.deadline && 
    new Date(task.deadline) < new Date() && 
    task.status !== 'completed'
  ).length;

  const upcomingTasks = tasks.filter(task => 
    task.deadline && 
    new Date(task.deadline) > new Date() && 
    task.status !== 'completed'
  ).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div>Laddar uppgifter...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Mina uppgifter{clientName ? ` - ${clientName}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalTasks}</div>
              <div className="text-sm text-muted-foreground">Totalt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              <div className="text-sm text-muted-foreground">Genomförda</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overdueTasks}</div>
              <div className="text-sm text-muted-foreground">Försenade</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{upcomingTasks}</div>
              <div className="text-sm text-muted-foreground">Kommande</div>
            </div>
          </div>

          {/* Completion Progress */}
          {totalTasks > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Genomförande</span>
                <span className="text-sm text-muted-foreground">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
            >
              Alla ({tasks.length})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'planned' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('planned')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Planerade ({tasks.filter(t => t.status === 'planned').length})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('in_progress')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Pågående ({tasks.filter(t => t.status === 'in_progress').length})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('completed')}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              Genomförda ({tasks.filter(t => t.status === 'completed').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {statusFilter === 'all' 
                  ? 'Inga uppgifter än' 
                  : `Inga ${statusFilter === 'planned' ? 'planerade' : 
                           statusFilter === 'in_progress' ? 'pågående' : 'genomförda'} uppgifter`
                }
              </h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all' 
                  ? 'Dina uppgifter kommer att visas här när de läggs till.'
                  : 'Ändra filter för att se andra uppgifter.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={completeTask}
              onUpdate={updateTask}
              readonly={readonly}
            />
          ))}
        </div>
      )}

      {/* Motivational Message */}
      {!readonly && completedTasks > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Bra jobbat! 🎉</h4>
                <p className="text-sm text-green-700">
                  Du har genomfört {completedTasks} uppgift{completedTasks !== 1 ? 'er' : ''}. 
                  Din velocity-poäng fortsätter att öka!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}