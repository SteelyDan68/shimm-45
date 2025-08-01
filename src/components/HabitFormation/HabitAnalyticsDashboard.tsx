import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Target, Calendar, Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { useHabitFormation } from '@/hooks/useHabitFormation';
import type { NeuroplasticityHabit, HabitAnalytics } from '@/types/habitFormation';
import { toast } from 'sonner';

interface HabitAnalyticsDashboardProps {
  clientId: string;
  selectedHabit?: NeuroplasticityHabit;
}

export const HabitAnalyticsDashboard: React.FC<HabitAnalyticsDashboardProps> = ({
  clientId,
  selectedHabit
}) => {
  const { habits, analytics, activeSetbacks } = useHabitFormation(clientId);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [neuroplasticProgress, setNeuroplasticProgress] = useState<Record<string, number>>({});

  // Calculate neuroplastic progress for each habit (0-100%)
  useEffect(() => {
    const progress: Record<string, number> = {};
    habits.forEach(habit => {
      // Neuroplasticity research: 66 days for automatic behavior
      const daysToAutomatic = 66;
      const progressPercentage = Math.min((habit.current_repetitions / daysToAutomatic) * 100, 100);
      progress[habit.id] = progressPercentage;
    });
    setNeuroplasticProgress(progress);
  }, [habits]);

  const triggerAnalysis = async (habitId: string) => {
    setIsAnalyzing(true);
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      // Trigger AI pattern analysis
      const response = await fetch('/api/analyze-habit-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_data: habit,
          analysis_type: 'optimization_suggestions',
          user_id: clientId
        })
      });

      if (response.ok) {
        toast.success('Analys genomförd! 🧠 Nya insikter tillgängliga.');
      }
    } catch (error) {
      toast.error('Kunde inte genomföra analys.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 75) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    if (progress >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHabitPhase = (progress: number): string => {
    if (progress >= 90) return 'Automatisk fas';
    if (progress >= 75) return 'Stabiliseringsfas';
    if (progress >= 50) return 'Integrationsfas';
    if (progress >= 25) return 'Etablersfas';
    return 'Initieringsfas';
  };

  const getDifficultyEmoji = (difficulty: string): string => {
    const emojis = {
      micro: '🟢',
      small: '🔵',
      medium: '🟡',
      large: '🟠',
      challenging: '🔴'
    };
    return emojis[difficulty as keyof typeof emojis] || '⚪';
  };

  const calculateTotalProgress = (): number => {
    if (habits.length === 0) return 0;
    const totalProgress = Object.values(neuroplasticProgress).reduce((sum, progress) => sum + progress, 0);
    return totalProgress / habits.length;
  };

  const getActiveHabits = () => habits.filter(h => h.status === 'active');
  const getCompletedHabits = () => habits.filter(h => h.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Vanor</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveHabits().length}</div>
            <p className="text-xs text-muted-foreground">
              {getCompletedHabits().length} genomförda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neuroplastisk Progress</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateTotalProgress().toFixed(0)}%</div>
            <Progress value={calculateTotalProgress()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Bakslag</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSetbacks.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeSetbacks.filter(s => s.severity === 'major').length} allvarliga
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Påminnelser</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Kommer snart</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="habits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="habits">Vanor</TabsTrigger>
          <TabsTrigger value="analytics">Neuroplastisk Analys</TabsTrigger>
          <TabsTrigger value="patterns">Mönster & Insikter</TabsTrigger>
          <TabsTrigger value="setbacks">Bakslag & Återhämtning</TabsTrigger>
        </TabsList>

        <TabsContent value="habits" className="space-y-4">
          <div className="grid gap-4">
            {getActiveHabits().map((habit) => (
              <Card key={habit.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getDifficultyEmoji(habit.difficulty)}
                      {habit.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{habit.frequency}</Badge>
                      <Badge variant="secondary">{getHabitPhase(neuroplasticProgress[habit.id] || 0)}</Badge>
                    </div>
                  </div>
                  <CardDescription>{habit.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{habit.streak_current}</div>
                      <div className="text-xs text-muted-foreground">Nuvarande streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{habit.streak_longest}</div>
                      <div className="text-xs text-muted-foreground">Längsta streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{habit.success_rate.toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground">Framgångsgrad</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{habit.current_repetitions}</div>
                      <div className="text-xs text-muted-foreground">av {habit.repetition_goal}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Neuroplastisk progress</span>
                      <span className={`text-sm font-medium ${getProgressColor(neuroplasticProgress[habit.id] || 0)}`}>
                        {(neuroplasticProgress[habit.id] || 0).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={neuroplasticProgress[habit.id] || 0} />
                    <p className="text-xs text-muted-foreground">
                      {neuroplasticProgress[habit.id] >= 100 
                        ? 'Vanan är neuroplastiskt etablerad! 🎉'
                        : `${Math.max(0, 66 - habit.current_repetitions)} dagar kvar till automatisk vana`
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => triggerAnalysis(habit.id)}
                      disabled={isAnalyzing}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      {isAnalyzing ? 'Analyserar...' : 'AI-Analys'}
                    </Button>
                    
                    {habit.ai_adjustments.length > 0 && (
                      <Badge variant="secondary">
                        {habit.ai_adjustments.length} AI-justeringar
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {getActiveHabits().length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Inga aktiva vanor</h3>
                  <p className="text-sm text-muted-foreground">
                    Skapa din första neuroplasticitet-baserade vana för att komma igång.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Neuroplasticitetsanalys
              </CardTitle>
              <CardDescription>
                Djupanalys baserad på hjärnforskning och beteendepsykologi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {analytics ? (
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{analytics.neuroplastic_progress}%</div>
                      <div className="text-sm text-muted-foreground">Neuroplastisk framsteg</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{analytics.consistency_score}%</div>
                      <div className="text-sm text-muted-foreground">Konsistenspoäng</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{analytics.habit_formation_eta}</div>
                      <div className="text-sm text-muted-foreground">Dagar till automatisering</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Bästa prestationstid</h4>
                      <Badge variant="outline">{analytics.best_performance_time}</Badge>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Mest framgångsrika kategori</h4>
                      <Badge variant="secondary">{analytics.most_successful_category}</Badge>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Optimal svårighetsgrad</h4>
                      <Badge variant="outline">{analytics.optimal_difficulty_level}</Badge>
                    </div>

                    {analytics.risk_factors.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Riskfaktorer
                        </h4>
                        <div className="space-y-1">
                          {analytics.risk_factors.map((risk, index) => (
                            <div key={index} className="text-sm text-orange-600">• {risk}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analytics.recommended_adjustments.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Rekommenderade justeringar
                        </h4>
                        <div className="space-y-1">
                          {analytics.recommended_adjustments.map((adjustment, index) => (
                            <div key={index} className="text-sm text-green-600">• {adjustment}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ingen analysdata tillgänglig</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Börja spåra vanor för att få neuroplasticitetsanalys.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI-genererade mönster & insikter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Mönsteranalys kommer snart</h3>
                <p className="text-sm text-muted-foreground">
                  AI-systemet analyserar dina vanmönster för att ge personliga insikter.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setbacks" className="space-y-4">
          <div className="grid gap-4">
            {activeSetbacks.map((setback) => (
              <Card key={setback.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Bakslag upptäckt
                    </CardTitle>
                    <Badge variant={setback.severity === 'major' ? 'destructive' : 'secondary'}>
                      {setback.severity}
                    </Badge>
                  </div>
                  <CardDescription>
                    {setback.setback_type} - {new Date(setback.detected_at).toLocaleDateString('sv-SE')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Kontext:</strong> {JSON.stringify(setback.context)}
                    </div>
                    {setback.recovery_plan && (
                      <div className="mt-4">
                        <Badge variant="outline" className="mb-2">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Återhämtningsplan aktiv
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {activeSetbacks.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Inga aktiva bakslag</h3>
                  <p className="text-sm text-muted-foreground">
                    Bra jobbat! Alla vanor är på rätt spår.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};