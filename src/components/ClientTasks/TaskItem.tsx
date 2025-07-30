import { useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Brain,
  User
} from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '@/types/tasks';

interface TaskItemProps {
  task: Task;
  onComplete: (taskId: string) => Promise<boolean>;
  onUpdate?: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  readonly?: boolean;
}

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-green-600 bg-green-50 border-green-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'completed': return CheckCircle2;
    case 'in_progress': return Clock;
    case 'planned': return Calendar;
    case 'cancelled': return AlertTriangle;
    default: return Clock;
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-50';
    case 'in_progress': return 'text-blue-600 bg-blue-50';
    case 'planned': return 'text-gray-600 bg-gray-50';
    case 'cancelled': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const isOverdue = (deadline?: string) => {
  if (!deadline) return false;
  return new Date(deadline) < new Date() && new Date().getHours() > 0;
};

export function TaskItem({ task, onComplete, onUpdate, readonly = false }: TaskItemProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const StatusIcon = getStatusIcon(task.status);
  const overdue = isOverdue(task.deadline);

  const handleComplete = async () => {
    if (task.status === 'completed' || readonly) return;
    
    setIsCompleting(true);
    await onComplete(task.id);
    setIsCompleting(false);
  };

  const handleStatusChange = async (checked: boolean) => {
    if (readonly || !onUpdate) return;
    
    if (checked && task.status !== 'completed') {
      await handleComplete();
    }
  };

  return (
    <Card className={`transition-all ${
      task.status === 'completed' 
        ? 'opacity-75 bg-muted/30' 
        : overdue 
          ? 'border-red-200 bg-red-50/30' 
          : 'hover:shadow-sm'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="mt-1">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={handleStatusChange}
              disabled={isCompleting || readonly || task.status === 'completed'}
              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
            />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <h4 className={`font-medium ${
                task.status === 'completed' ? 'line-through text-muted-foreground' : ''
              }`}>
                {task.title}
              </h4>
              
              <div className="flex items-center gap-2 ml-2">
                {task.ai_generated && (
                  <Badge variant="secondary" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                )}
                <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>
              </div>
            </div>

            {task.description && (
              <p className={`text-sm text-muted-foreground ${
                task.status === 'completed' ? 'line-through' : ''
              }`}>
                {task.description}
              </p>
            )}

            {/* Meta information */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                <span className={`${getStatusColor(task.status)}`}>
                  {task.status === 'completed' ? 'Genomförd' :
                   task.status === 'in_progress' ? 'Pågår' :
                   task.status === 'planned' ? 'Planerad' : 'Avbruten'}
                </span>
              </div>

              {task.deadline && (
                <div className={`flex items-center gap-1 ${
                  overdue && task.status !== 'completed' ? 'text-red-600 font-medium' : ''
                }`}>
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(task.deadline), 'PPp', { locale: sv })}
                    {overdue && task.status !== 'completed' && ' (Försenad)'}
                  </span>
                </div>
              )}

              {task.completed_at && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>
                    Klar {format(new Date(task.completed_at), 'PPp', { locale: sv })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Complete Button for mobile/touch */}
        {!readonly && task.status !== 'completed' && (
          <div className="mt-3 pt-3 border-t">
            <Button 
              size="sm" 
              onClick={handleComplete}
              disabled={isCompleting}
              className="w-full sm:w-auto"
            >
              {isCompleting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Markerar som klar...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Markera som genomförd
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}