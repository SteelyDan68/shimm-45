/**
 * ✅ TASKS WIDGET - Uppgiftshantering
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const TasksWidget: React.FC<WidgetProps> = ({ widget, stats, onAction }) => {
  
  // Mock task data - detta kommer senare från useTasks
  const tasks = [
    {
      id: '1',
      title: 'Slutför Self Care assessment',
      description: 'Genomför den sista delen av Self Care bedömningen',
      priority: 'high',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 dagar
      category: 'assessment'
    },
    {
      id: '2', 
      title: 'Reflektion över personliga värderingar',
      description: 'Skriv ner dina viktigaste värderingar och hur de påverkar ditt liv',
      priority: 'medium',
      status: 'not_started',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dagar
      category: 'reflection'
    },
    {
      id: '3',
      title: 'Sätt upp daglig meditationsrutin',
      description: 'Börja med 5 minuter meditation varje morgon',
      priority: 'low',
      status: 'not_started',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dagar
      category: 'habit'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default'; 
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckSquare;
      case 'in_progress': return Clock;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const maxItems = widget.config?.maxItems || 5;
  const displayTasks = activeTasks.slice(0, maxItems);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Pågående Uppgifter</span>
          <Badge variant="secondary" className="text-xs">
            {activeTasks.length}
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction?.('create-task')}
          className="w-8 h-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {displayTasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Inga aktiva uppgifter</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => onAction?.('create-task')}
            >
              Skapa första uppgiften
            </Button>
          </div>
        ) : (
          displayTasks.map((task) => {
            const StatusIcon = getStatusIcon(task.status);
            
            return (
              <div 
                key={task.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <StatusIcon className={`w-4 h-4 mt-0.5 ${getStatusColor(task.status)}`} />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight">
                        {task.title}
                      </p>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={getPriorityColor(task.priority) as any} 
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                        
                        {widget.config?.showDueDate && task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(task.dueDate, { locale: sv, addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAction?.(`view-task-${task.id}`)}
                    className="w-8 h-8 p-0 ml-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      {activeTasks.length > 0 && (
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onAction?.('view-all-tasks')}
          >
            Se alla ({activeTasks.length})
          </Button>
          
          <Button 
            size="sm"
            onClick={() => onAction?.('create-task')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Ny
          </Button>
        </div>
      )}
    </div>
  );
};

export default TasksWidget;