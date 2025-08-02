import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpTooltip } from '@/components/HelpTooltip';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle,
  ListTodo,
  Calendar,
  Target
} from 'lucide-react';

interface PillarJourney {
  id: string;
  pillarKey: string;
  pillarName: string;
  progress: number;
}

interface JourneyTask {
  id: string;
  journeyId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: number;
  dueDate?: string;
  completedAt?: string;
}

interface PillarTaskManagerProps {
  userId: string;
  activeJourneys: PillarJourney[];
  onTaskComplete: (taskId: string) => void;
}

// Huvudpolicy från UX Expert: Kognitiv belastning minimeras genom smart gruppering
export const PillarTaskManager = ({
  userId,
  activeJourneys,
  onTaskComplete
}: PillarTaskManagerProps) => {
  // Huvudpolicy från Frontend Dev: Optimistisk UI med local state
  const [tasks, setTasks] = useState<JourneyTask[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<string>('all');

  // Huvudpolicy från Product Manager: Prioritering baserat på business logic
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Hög';
      case 'medium': return 'Medium';
      case 'low': return 'Låg';
      default: return priority;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending': return <Circle className="h-4 w-4 text-gray-400" />;
      case 'skipped': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getFilteredTasks = () => {
    if (selectedJourney === 'all') return tasks;
    return tasks.filter(task => task.journeyId === selectedJourney);
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'completed' ? 'pending' : 'completed',
              completedAt: task.status === 'completed' ? undefined : new Date().toISOString()
            }
          : task
      )
    );
    onTaskComplete(taskId);
  };

  const groupTasksByStatus = (tasks: JourneyTask[]) => {
    return tasks.reduce((groups, task) => {
      const status = task.status;
      if (!groups[status]) groups[status] = [];
      groups[status].push(task);
      return groups;
    }, {} as Record<string, JourneyTask[]>);
  };

  const filteredTasks = getFilteredTasks();
  const groupedTasks = groupTasksByStatus(filteredTasks);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          Uppgifter och milstolpar
          <HelpTooltip content="Hantera dina uppgifter för varje utvecklingsområde. Märk av när du slutfört något för att följa ditt framsteg." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Huvudpolicy från UX Expert: Filtrering för fokus */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Filtrera efter utvecklingsområde:</label>
          <select
            value={selectedJourney}
            onChange={(e) => setSelectedJourney(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="all">Alla områden</option>
            {activeJourneys.map((journey) => (
              <option key={journey.id} value={journey.id}>
                {journey.pillarName}
              </option>
            ))}
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Inga uppgifter än</h3>
            <p className="text-sm">
              Uppgifter kommer att genereras automatiskt baserat på dina aktiva utvecklingsområden.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                Aktiva ({(groupedTasks.pending?.length || 0) + (groupedTasks.in_progress?.length || 0)})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Slutförda ({groupedTasks.completed?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="all">
                Alla ({filteredTasks.length})
              </TabsTrigger>
            </TabsList>

            {/* Aktiva uppgifter */}
            <TabsContent value="active" className="space-y-3">
              {[...(groupedTasks.pending || []), ...(groupedTasks.in_progress || [])]
                .sort((a, b) => {
                  // Huvudpolicy från Product Manager: Prioritera hög → medium → låg
                  const priorityOrder = { high: 3, medium: 2, low: 1 };
                  return priorityOrder[b.priority as keyof typeof priorityOrder] - 
                         priorityOrder[a.priority as keyof typeof priorityOrder];
                })
                .map((task) => (
                  <div key={task.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleTaskToggle(task.id)}
                        className="mt-1 hover:scale-110 transition-transform"
                      >
                        {getStatusIcon(task.status)}
                      </button>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{task.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                            {task.estimatedTime && (
                              <Badge variant="outline" className="text-xs">
                                {task.estimatedTime} min
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Deadline: {new Date(task.dueDate).toLocaleDateString('sv-SE')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              
              {(groupedTasks.pending?.length || 0) + (groupedTasks.in_progress?.length || 0) === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">Inga aktiva uppgifter</h3>
                  <p className="text-sm">Bra jobbat! Alla uppgifter är slutförda.</p>
                </div>
              )}
            </TabsContent>

            {/* Slutförda uppgifter */}
            <TabsContent value="completed" className="space-y-3">
              {(groupedTasks.completed || []).map((task) => (
                <div key={task.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium line-through text-muted-foreground">{task.title}</h4>
                        {task.completedAt && (
                          <span className="text-xs text-green-600">
                            Slutförd {new Date(task.completedAt).toLocaleDateString('sv-SE')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Alla uppgifter */}
            <TabsContent value="all" className="space-y-3">
              {filteredTasks.map((task) => (
                <div key={task.id} className={`p-4 border rounded-lg transition-colors ${
                  task.status === 'completed' ? 'bg-green-50 border-green-200' : 'hover:bg-muted/50'
                }`}>
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleTaskToggle(task.id)}
                      className="mt-1 hover:scale-110 transition-transform"
                    >
                      {getStatusIcon(task.status)}
                    </button>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {getPriorityLabel(task.priority)}
                          </Badge>
                          {task.completedAt && (
                            <span className="text-xs text-green-600">
                              {new Date(task.completedAt).toLocaleDateString('sv-SE')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};