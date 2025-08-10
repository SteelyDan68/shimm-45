/**
 * ✅ TASKS WIDGET - Kommande uppgifter och handlingsplaner
 */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WidgetProps } from '../types/dashboard-types';
import { CheckSquare, Clock, ArrowRight, Target } from 'lucide-react';

const TasksWidget: React.FC<WidgetProps> = ({ widget }) => {
  // Mock tasks för demonstration
  const mockTasks = [
    {
      id: 1,
      title: 'Morgonrutin utveckling',
      category: 'Självomvårdnad',
      dueDate: 'Idag',
      priority: 'high',
      progress: 75
    },
    {
      id: 2,
      title: 'LinkedIn profil uppdatering',
      category: 'Varumärke',
      dueDate: 'Imorgon',
      priority: 'medium',
      progress: 25
    },
    {
      id: 3,
      title: 'Kursreflection',
      category: 'Kompetenser',
      dueDate: 'Nästa vecka',
      priority: 'low',
      progress: 0
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium">Pågående Uppgifter</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {mockTasks.length}
        </Badge>
      </div>

      {mockTasks.map((task) => (
        <Card key={task.id} className="p-3 hover:shadow-sm transition-shadow">
          <CardContent className="p-0">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{task.title}</h4>
                  <p className="text-xs text-muted-foreground">{task.category}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityColor(task.priority)}`}
                >
                  {task.priority}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {task.dueDate}
                </div>
                <span className="text-xs font-medium">{task.progress}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all" 
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" size="sm" className="w-full mt-3" asChild>
        <a href="/my-program">
          <Target className="w-3 h-3 mr-2" />
          Se alla uppgifter
          <ArrowRight className="w-3 h-3 ml-2" />
        </a>
      </Button>
    </div>
  );
};

export default TasksWidget;