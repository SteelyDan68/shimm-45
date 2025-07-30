import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Brain, Wand2, CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import { format, addDays, addWeeks } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CreateTaskData, TaskPriority } from '@/types/tasks';

interface AIToTaskConverterProps {
  aiRecommendation: string;
  clientId: string;
  sourcePathEntryId?: string;
  onCreateTasks: (tasks: CreateTaskData[]) => Promise<void>;
}

interface ParsedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  daysFromNow: number;
}

export function AIToTaskConverter({ 
  aiRecommendation, 
  clientId, 
  sourcePathEntryId,
  onCreateTasks 
}: AIToTaskConverterProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const parseAIRecommendation = (): ParsedTask[] => {
    // Simple AI parsing - in reality this could be more sophisticated
    const recommendations = aiRecommendation.split(/\d+\.|•|-/).filter(item => item.trim().length > 10);
    
    return recommendations.slice(0, 4).map((rec, index) => {
      const text = rec.trim();
      
      // Determine priority based on keywords
      let priority: TaskPriority = 'medium';
      if (text.toLowerCase().includes('omedelbart') || text.toLowerCase().includes('akut') || text.toLowerCase().includes('viktigt')) {
        priority = 'high';
      } else if (text.toLowerCase().includes('övning') || text.toLowerCase().includes('reflektion')) {
        priority = 'low';
      }

      // Extract title (first sentence or first 50 chars)
      const sentences = text.split(/[.!?]/);
      const title = sentences[0]?.trim().substring(0, 50) || `Åtgärd ${index + 1}`;
      
      // Use remaining text as description
      const description = sentences.length > 1 
        ? sentences.slice(1).join('. ').trim() 
        : text.substring(title.length).trim();

      // Schedule based on priority and index
      const daysFromNow = priority === 'high' ? 1 : 
                         priority === 'medium' ? 3 + (index * 2) : 
                         7 + (index * 3);

      return {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        description: description || text,
        priority,
        daysFromNow
      };
    });
  };

  const handleConvert = () => {
    setIsConverting(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const tasks = parseAIRecommendation();
      setParsedTasks(tasks);
      setIsConverting(false);
      setIsOpen(true);
    }, 1500);
  };

  const handleCreateTasks = async () => {
    const taskData: CreateTaskData[] = parsedTasks.map(task => ({
      client_id: clientId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: addDays(new Date(), task.daysFromNow).toISOString(),
      ai_generated: true,
      source_path_entry_id: sourcePathEntryId
    }));

    await onCreateTasks(taskData);
    setIsOpen(false);
    setParsedTasks([]);
  };

  const updateTaskDeadline = (index: number, days: number) => {
    setParsedTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, daysFromNow: days } : task
    ));
  };

  const updateTaskPriority = (index: number, priority: TaskPriority) => {
    setParsedTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, priority } : task
    ));
  };

  if (isOpen && parsedTasks.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI-genererade uppgifter
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Granska och justera uppgifterna innan de skapas
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {parsedTasks.map((task, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-medium">{task.title}</h4>
                <Badge variant="outline" className={
                  task.priority === 'high' ? 'text-red-600 bg-red-50' :
                  task.priority === 'medium' ? 'text-yellow-600 bg-yellow-50' :
                  'text-green-600 bg-green-50'
                }>
                  {task.priority === 'high' ? 'Hög' : task.priority === 'medium' ? 'Medium' : 'Låg'}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">{task.description}</p>
              
              <div className="grid grid-cols-2 gap-2">
                <Select 
                  value={task.priority} 
                  onValueChange={(value: TaskPriority) => updateTaskPriority(index, value)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md">
                    <SelectItem value="low">Låg prioritet</SelectItem>
                    <SelectItem value="medium">Medium prioritet</SelectItem>
                    <SelectItem value="high">Hög prioritet</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={task.daysFromNow.toString()} 
                  onValueChange={(value) => updateTaskDeadline(index, parseInt(value))}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md">
                    <SelectItem value="1">Imorgon</SelectItem>
                    <SelectItem value="3">3 dagar</SelectItem>
                    <SelectItem value="7">1 vecka</SelectItem>
                    <SelectItem value="14">2 veckor</SelectItem>
                    <SelectItem value="30">1 månad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Deadline: {format(addDays(new Date(), task.daysFromNow), 'PPP', { locale: sv })}
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateTasks}>
              <Wand2 className="h-4 w-4 mr-2" />
              Skapa {parsedTasks.length} uppgifter
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI-rekommendation till uppgifter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">AI-rekommendation:</h4>
          <p className="text-sm text-muted-foreground">
            {aiRecommendation.substring(0, 200)}...
          </p>
        </div>

        <Button 
          onClick={handleConvert}
          disabled={isConverting}
          className="w-full"
        >
          {isConverting ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-pulse" />
              Konverterar till uppgifter...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Konvertera till schemalagda uppgifter
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          AI:n kommer att analysera rekommendationen och föreslå 3-4 konkreta uppgifter med deadlines
        </p>
      </CardContent>
    </Card>
  );
}