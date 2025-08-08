/**
 * 🧠 TASK OPTIMIZATION SYSTEM - Neuroplastisk uppgiftshantering
 * SCRUM-TEAM IMPLEMENTATION: Balanserat actionables-system för optimal klientupplevelse
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Lightbulb,
  Settings,
  Filter
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TaskOptimizationProps {
  userId: string;
  onTasksOptimized?: (optimizedTasks: any[]) => void;
}

interface TaskMetrics {
  total: number;
  completed: number;
  overdue: number;
  highPriority: number;
  avgCompletionRate: number;
  neuroplasticityScore: number;
}

interface OptimizationRecommendation {
  type: 'reduce' | 'prioritize' | 'consolidate' | 'defer';
  reason: string;
  impact: string;
  action: string;
}

export const TaskOptimizationSystem: React.FC<TaskOptimizationProps> = ({ 
  userId, 
  onTasksOptimized 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const loadTaskMetrics = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Ladda alla uppgifter för användaren
      const { data: allTasks, error: tasksError } = await supabase
        .from('calendar_actionables')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const tasks = allTasks || [];
      const now = new Date();
      
      // Beräkna metrics
      const completedTasks = tasks.filter(t => t.completion_status === 'completed');
      const overdueTasks = tasks.filter(t => 
        t.created_at && 
        new Date(t.created_at) < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) && // 7 dagar gamla
        t.completion_status !== 'completed'
      );
      const highPriorityTasks = tasks.filter(t => t.priority === 'high');
      
      const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
      
      // Neuroplasticity Score - baserat på balans och framsteg
      const neuroplasticityScore = calculateNeuroplasticityScore(tasks, completionRate);

      const taskMetrics: TaskMetrics = {
        total: tasks.length,
        completed: completedTasks.length,
        overdue: overdueTasks.length,
        highPriority: highPriorityTasks.length,
        avgCompletionRate: completionRate,
        neuroplasticityScore
      };

      setMetrics(taskMetrics);
      
      // Generera rekommendationer
      const optimizationRecs = generateOptimizationRecommendations(taskMetrics, tasks);
      setRecommendations(optimizationRecs);

    } catch (error) {
      console.error('Error loading task metrics:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda uppgiftsstatistik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNeuroplasticityScore = (tasks: any[], completionRate: number): number => {
    // Neuroplastisk poäng baserat på:
    // 1. Balans mellan utmaning och framgång (50-80% completion rate är optimalt)
    // 2. Mångfald i uppgiftstyper
    // 3. Konsistent framsteg utan överbelastning

    let score = 0;

    // Optimal completion rate (60-75% ger högst poäng)
    if (completionRate >= 60 && completionRate <= 75) {
      score += 40;
    } else if (completionRate >= 50 && completionRate < 85) {
      score += 30;
    } else if (completionRate >= 40 && completionRate < 90) {
      score += 20;
    } else {
      score += 10;
    }

    // Balans mellan olika prioriteter
    const totalTasks = tasks.length;
    if (totalTasks > 0) {
      const highPriorityRatio = tasks.filter(t => t.priority === 'high').length / totalTasks;
      const mediumPriorityRatio = tasks.filter(t => t.priority === 'medium').length / totalTasks;
      
      // Optimal fördelning: 20-30% hög, 40-50% medium, resten låg
      if (highPriorityRatio >= 0.2 && highPriorityRatio <= 0.3 && 
          mediumPriorityRatio >= 0.4 && mediumPriorityRatio <= 0.5) {
        score += 30;
      } else {
        score += 15;
      }
    }

    // Undvik överbelastning (mer än 15 aktiva uppgifter är suboptimalt)
    const activeTasks = tasks.filter(t => t.completion_status !== 'completed').length;
    if (activeTasks <= 10) {
      score += 30;
    } else if (activeTasks <= 15) {
      score += 20;
    } else {
      score += 5;
    }

    return Math.min(score, 100);
  };

  const generateOptimizationRecommendations = (
    metrics: TaskMetrics, 
    tasks: any[]
  ): OptimizationRecommendation[] => {
    const recs: OptimizationRecommendation[] = [];

    // För många aktiva uppgifter
    const activeTasks = tasks.filter(t => t.completion_status !== 'completed').length;
    if (activeTasks > 15) {
      recs.push({
        type: 'reduce',
        reason: `${activeTasks} aktiva uppgifter kan orsaka kognitiv överbelastning`,
        impact: 'Förbättrad fokus och genomförandeförmåga',
        action: `Minska till max 12 aktiva uppgifter genom att skjuta upp ${activeTasks - 12} låg-prioritetsuppgifter`
      });
    }

    // För låg slutförandegrader
    if (metrics.avgCompletionRate < 50) {
      recs.push({
        type: 'prioritize',
        reason: `Slutförandegraden på ${Math.round(metrics.avgCompletionRate)}% indikerar för hög svårighetsgrad`,
        impact: 'Ökad motivation och självförtroende',
        action: 'Fokusera på 3-5 enkla uppgifter för att bygga momentum'
      });
    }

    // För många överdue uppgifter
    if (metrics.overdue > 5) {
      recs.push({
        type: 'consolidate',
        reason: `${metrics.overdue} förfallna uppgifter skapar stress och blockerar framsteg`,
        impact: 'Minskat mentalt brus och bättre planering',
        action: 'Omvärdera och slå samman liknande uppgifter eller sätt nya realistiska deadlines'
      });
    }

    // Neuroplasticity score för låg
    if (metrics.neuroplasticityScore < 60) {
      recs.push({
        type: 'defer',
        reason: 'Suboptimal balans mellan utmaning och framgång hindrar neuroplastisk utveckling',
        impact: 'Förbättrad inlärning och varaktig beteendeförändring',
        action: 'Implementera 60/40-regeln: 60% bekväma uppgifter, 40% utmanande'
      });
    }

    return recs;
  };

  const optimizeTasks = async () => {
    if (!userId || !metrics) return;

    setIsOptimizing(true);
    try {
      // Implementera optimeringsrekommendationer
      for (const rec of recommendations) {
        switch (rec.type) {
          case 'reduce':
            await reduceTasks();
            break;
          case 'prioritize':
            await reprioritizeTasks();
            break;
          case 'consolidate':
            await consolidateOverdueTasks();
            break;
          case 'defer':
            await implementNeuroplasticBalance();
            break;
        }
      }

      toast({
        title: "✅ Uppgifter optimerade!",
        description: "Dina uppgifter har optimerats för bättre neuroplastisk utveckling",
      });

      // Ladda om metrics
      await loadTaskMetrics();
      
      if (onTasksOptimized) {
        onTasksOptimized([]);
      }

    } catch (error) {
      console.error('Error optimizing tasks:', error);
      toast({
        title: "Fel",
        description: "Kunde inte optimera uppgifter",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const reduceTasks = async () => {
    // Skjut upp låg-prioritetsuppgifter som inte är deadline-kritiska
    const { data: lowPriorityTasks } = await supabase
      .from('calendar_actionables')
      .select('*')
      .eq('user_id', userId)
      .eq('priority', 'low')
      .eq('completion_status', 'pending')
      .limit(5);

    if (lowPriorityTasks) {
      for (const task of lowPriorityTasks) {
        await supabase
          .from('calendar_actionables')
          .update({ 
            completion_status: 'deferred',
            user_notes: `Automatiskt uppskjuten för bättre fokus - ${new Date().toLocaleDateString('sv-SE')}`
          })
          .eq('id', task.id);
      }
    }
  };

  const reprioritizeTasks = async () => {
    // Sänk prioriteten på några medium-uppgifter för att skapa bättre balans
    const { data: mediumTasks } = await supabase
      .from('calendar_actionables')
      .select('*')
      .eq('user_id', userId)
      .eq('priority', 'medium')
      .eq('completion_status', 'pending')
      .limit(3);

    if (mediumTasks) {
      for (const task of mediumTasks) {
        await supabase
          .from('calendar_actionables')
          .update({ 
            priority: 'low',
            user_notes: `Prioritet sänkt för bättre balans - ${new Date().toLocaleDateString('sv-SE')}`
          })
          .eq('id', task.id);
      }
    }
  };

  const consolidateOverdueTasks = async () => {
    // Markera gamla uppgifter som "under review"
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    await supabase
      .from('calendar_actionables')
      .update({ 
        completion_status: 'under_review',
        user_notes: `Automatisk granskning av gammal uppgift - ${new Date().toLocaleDateString('sv-SE')}`
      })
      .eq('user_id', userId)
      .lt('created_at', oneWeekAgo.toISOString())
      .eq('completion_status', 'pending');
  };

  const implementNeuroplasticBalance = async () => {
    // Säkerställ 60/40-balans mellan bekväma och utmanande uppgifter
    const { data: allActiveTasks } = await supabase
      .from('calendar_actionables')
      .select('*')
      .eq('user_id', userId)
      .eq('completion_status', 'pending');

    if (allActiveTasks && allActiveTasks.length > 0) {
      const targetComfortable = Math.ceil(allActiveTasks.length * 0.6);
      const comfortableTasks = allActiveTasks
        .filter(t => t.priority === 'low')
        .slice(0, targetComfortable);

      // Markera resten som "challenging" med notes
      const challengingTasks = allActiveTasks.filter(t => 
        !comfortableTasks.find(ct => ct.id === t.id)
      );

      for (const task of challengingTasks.slice(0, Math.floor(allActiveTasks.length * 0.4))) {
        await supabase
          .from('calendar_actionables')
          .update({ 
            user_notes: `Markerad som utmanande för neuroplastisk balans - ${new Date().toLocaleDateString('sv-SE')}`
          })
          .eq('id', task.id);
      }
    }
  };

  useEffect(() => {
    loadTaskMetrics();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Analyserar dina uppgifter...</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Ingen data tillgänglig</h3>
          <p className="text-muted-foreground">Skapa några uppgifter för att se optimeringsförslag</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{metrics.total}</div>
            <div className="text-sm text-muted-foreground">Totala uppgifter</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{Math.round(metrics.avgCompletionRate)}%</div>
            <div className="text-sm text-muted-foreground">Slutförandegrader</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{metrics.overdue}</div>
            <div className="text-sm text-muted-foreground">Förfallna</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Brain className={`w-8 h-8 mx-auto mb-2 ${getScoreColor(metrics.neuroplasticityScore)}`} />
            <div className={`text-2xl font-bold ${getScoreColor(metrics.neuroplasticityScore)}`}>
              {metrics.neuroplasticityScore}
            </div>
            <div className="text-sm text-muted-foreground">Neuroplasticity Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Neuroplasticity Score Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Neuroplastisk Optimering
            <Badge variant={getScoreBadgeVariant(metrics.neuroplasticityScore)}>
              {metrics.neuroplasticityScore}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Neuroplasticity Score mäter hur väl dina uppgifter stödjer hjärnans förmåga att förändras och lära. 
              Optimal poäng uppnås genom balans mellan utmaning och framgång.
            </p>
            
            {metrics.neuroplasticityScore < 70 && (
              <Alert>
                <Lightbulb className="w-4 h-4" />
                <AlertDescription>
                  <strong>Förbättringsområde:</strong> Din uppgiftsbalans kan optimeras för bättre neuroplastisk utveckling. 
                  Se rekommendationerna nedan för konkreta förbättringar.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Optimeringsrekommendationer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{rec.type}</Badge>
                  <span className="text-sm font-medium">{rec.reason}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Påverkan:</strong> {rec.impact}
                </p>
                <p className="text-sm text-blue-600">
                  <strong>Åtgärd:</strong> {rec.action}
                </p>
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <Button 
                onClick={optimizeTasks} 
                disabled={isOptimizing}
                className="w-full"
              >
                {isOptimizing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Optimerar...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Tillämpa alla optimeringar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {metrics.neuroplasticityScore >= 80 && recommendations.length === 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Perfekt neuroplastisk balans! 🧠✨
            </h3>
            <p className="text-green-700">
              Dina uppgifter är optimalt balanserade för maximal inlärning och utveckling. 
              Fortsätt med nuvarande approach för bästa resultat.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskOptimizationSystem;