import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useAIPlanning } from '@/hooks/useAIPlanning';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useSixPillarsModular } from '@/hooks/useSixPillarsModular';
import { 
  Brain, 
  Target, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Calendar,
  Zap,
  Award,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';

interface AutonomousCoachingDashboardProps {
  userId: string;
  userName: string;
}

export const AutonomousCoachingDashboard = ({ userId, userName }: AutonomousCoachingDashboardProps) => {
  const { 
    autonomousTasks, 
    taskProgress, 
    completeTask, 
    getAutonomyMetrics,
    generateAutonomousPlan,
    isGeneratingPlan 
  } = useAIPlanning(userId);

  const { journeyState, getJourneyProgress } = useUserJourney();
  const { generateHeatmapData } = useSixPillarsModular(userId);

  const [showAllTasks, setShowAllTasks] = useState(false);

  const metrics = getAutonomyMetrics();
  const heatmapData = generateHeatmapData();

  // Group tasks by timeline
  const todayTasks = autonomousTasks.filter(task => 
    task.deadline && isToday(new Date(task.deadline))
  );
  
  const tomorrowTasks = autonomousTasks.filter(task => 
    task.deadline && isTomorrow(new Date(task.deadline))
  );
  
  const upcomingTasks = autonomousTasks.filter(task => 
    task.deadline && 
    !isToday(new Date(task.deadline)) && 
    !isTomorrow(new Date(task.deadline)) &&
    new Date(task.deadline) > addDays(new Date(), 1)
  ).slice(0, 5);

  const handleTaskComplete = async (taskId: string) => {
    await completeTask(taskId);
  };

  const generateNewPlan = async () => {
    const recommendation = "Baserat på dina senaste framsteg, skapa en personlig utvecklingsplan som bygger vidare på dina styrkor och adresserar dina utvecklingsområden.";
    await generateAutonomousPlan(recommendation, 2);
  };

  const TaskItem = ({ task, showDate = false }: { task: any, showDate?: boolean }) => {
    const isCompleted = taskProgress[task.id]?.completed;
    const deadline = task.deadline ? new Date(task.deadline) : null;

    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${
        isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
      } hover:shadow-sm transition-shadow`}>
        <Checkbox 
          checked={isCompleted}
          onCheckedChange={() => !isCompleted && handleTaskComplete(task.id)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </h4>
          {task.description && (
            <p className={`text-xs text-muted-foreground mt-1 ${isCompleted ? 'line-through' : ''}`}>
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {deadline && showDate && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {format(deadline, 'MMM d', { locale: sv })}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-genererad
            </Badge>
          </div>
        </div>
        {isCompleted && (
          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Autonomous Coaching Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-600 text-white">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Autonomt Coachningsystem</CardTitle>
                <p className="text-muted-foreground">
                  Stefan guidar dig genom personaliserade utvecklingsuppgifter
                </p>
              </div>
            </div>
            <Button 
              onClick={generateNewPlan}
              disabled={isGeneratingPlan}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isGeneratingPlan ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Genererar...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ny Plan
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Autonomy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{metrics.totalTasks}</div>
            <div className="text-sm text-muted-foreground">Totala uppgifter</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{metrics.completedTasks}</div>
            <div className="text-sm text-muted-foreground">Slutförda</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{Math.round(metrics.completionRate)}%</div>
            <div className="text-sm text-muted-foreground">Slutförandegrad</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{metrics.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Dagars streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Journey Progress Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Utvecklingsframsteg
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Total utvecklingsresa</span>
              <span>{getJourneyProgress()}%</span>
            </div>
            <Progress value={getJourneyProgress()} className="h-2" />
          </div>
          
          {metrics.totalTasks > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Autonoma uppgifter</span>
                <span>{Math.round(metrics.completionRate)}%</span>
              </div>
              <Progress value={metrics.completionRate} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Idag ({todayTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tomorrow's Tasks */}
      {tomorrowTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Imorgon ({tomorrowTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tomorrowTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5 text-gray-600" />
                Kommande uppgifter ({upcomingTasks.length})
              </CardTitle>
              {autonomousTasks.length > upcomingTasks.length && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAllTasks(!showAllTasks)}
                >
                  {showAllTasks ? 'Visa färre' : 'Visa alla'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(showAllTasks ? autonomousTasks.filter(task => !isToday(new Date(task.deadline || '')) && !isTomorrow(new Date(task.deadline || ''))) : upcomingTasks).map(task => (
              <TaskItem key={task.id} task={task} showDate={true} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Tasks State */}
      {autonomousTasks.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Redo för autonomt coaching</h3>
            <p className="text-muted-foreground mb-4">
              Genomför en bedömning för att få personaliserade utvecklingsuppgifter från Stefan.
            </p>
            <Button onClick={generateNewPlan} disabled={isGeneratingPlan}>
              <Sparkles className="h-4 w-4 mr-2" />
              Starta utvecklingsplan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};