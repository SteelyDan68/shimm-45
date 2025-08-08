import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ActionTooltip } from '@/components/ui/action-tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Zap,
  Brain,
  Heart,
  RefreshCw,
  ArrowRight,
  Star
} from 'lucide-react';

interface DevelopmentStrategy {
  id: string;
  type: 'habit' | 'action' | 'mindset' | 'skill';
  title: string;
  description: string;
  pillarKey: string;
  estimatedTime: number;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  neuroplasticPrinciple: string;
  isCompleted: boolean;
  scheduledFor?: Date;
}

interface FocusArea {
  pillarKey: string;
  pillarName: string;
  currentLevel: number;
  targetLevel: number;
  priority: 1 | 2 | 3;
  strategies: DevelopmentStrategy[];
  color: string;
  icon: React.ReactNode;
}

interface PersonalDevelopmentPlanProps {
  userId: string;
  assessmentData: any[];
}

export const PersonalDevelopmentPlanViewer: React.FC<PersonalDevelopmentPlanProps> = ({
  userId,
  assessmentData
}) => {
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [planProgress, setPlanProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadOrGeneratePlan();
  }, [userId, assessmentData]);

  const loadOrGeneratePlan = async () => {
    try {
      // För nu, hoppa över databas-ladning och generera direkt
      // const { data: existingPlan, error } = await supabase
      //   .from('personal_development_plans')
      //   .select('*')
      //   .eq('user_id', userId)
      //   .eq('status', 'active')
      //   .single();

      let existingPlan = null;
      let error = null;

      if (existingPlan && !error) {
        // Ladda befintlig plan
        await loadExistingPlan(existingPlan);
        setHasActivePlan(true);
      } else if (assessmentData.length > 0) {
        // Generera ny plan baserad på assessments
        await generateNewPlan();
        setHasActivePlan(true);
      }
    } catch (error) {
      console.error('Error loading/generating plan:', error);
    }
  };

  const loadExistingPlan = async (planData: any) => {
    // Implementera laddning av befintlig plan
    // För nu, generera en mock-plan
    generateMockFocusAreas();
  };

  const generateNewPlan = async () => {
    setIsGenerating(true);
    
    try {
      // Analysera assessments för att identifiera fokusområden
      const analyzedAreas = analyzeAssessmentData();
      
      // För demo, hoppa över AI-anrop och använd mock-data direkt
      // const { data: aiResponse, error } = await supabase.functions.invoke('generate-development-plan', {
      //   body: {
      //     userId,
      //     assessmentData,
      //     focusAreas: analyzedAreas
      //   }
      // });

      // Generera mock-plan baserat på analyserade områden
      generateMockFocusAreas();
      
      toast({
        title: "🎉 Din utvecklingsplan är klar!",
        description: `Utvecklingsplan skapad baserat på ${analyzedAreas.length} fokusområden.`,
      });
    } catch (error) {
      console.error('Error generating plan:', error);
      // Fallback till mock-data
      generateMockFocusAreas();
      
      toast({
        title: "Plan skapad (demo-läge)",
        description: "Vi har skapat en exempelplan baserad på dina assessments.",
        variant: "default"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeAssessmentData = () => {
    // Analysera assessments för att hitta de viktigaste utvecklingsområdena
    const pillarScores = assessmentData.reduce((acc, assessment) => {
      acc[assessment.pillar_type] = assessment.calculated_score;
      return acc;
    }, {} as Record<string, number>);

    // Identifiera de 2-3 viktigaste områdena att fokusera på
    const sortedPillars = Object.entries(pillarScores)
      .sort(([,a], [,b]) => (a as number) - (b as number)) // Sortera på lägsta poäng först
      .slice(0, 3);

    return sortedPillars.map(([pillarKey, score], index) => ({
      pillarKey,
      currentLevel: score as number,
      priority: (index + 1) as 1 | 2 | 3
    }));
  };

  const generateMockFocusAreas = () => {
    // Mock-data för demo
    const mockAreas: FocusArea[] = [
      {
        pillarKey: 'self_care',
        pillarName: 'Självomvårdnad',
        currentLevel: 4.2,
        targetLevel: 7.5,
        priority: 1,
        color: 'text-pink-600',
        icon: <Heart className="w-5 h-5" />,
        strategies: [
          {
            id: '1',
            type: 'habit',
            title: 'Daglig mindfulness-practice',
            description: 'Börja dagen med 5 minuter meditation för att bygga mental klarhet och självmedvetenhet.',
            pillarKey: 'self_care',
            estimatedTime: 5,
            difficultyLevel: 2,
            neuroplasticPrinciple: 'Regelbunden meditation stärker prefrontal cortex och förbättrar emotionell reglering',
            isCompleted: false,
            scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          {
            id: '2',
            type: 'action',
            title: 'Sömnhygien-audit',
            description: 'Analysera dina sömnvanor i en vecka och identifiera 2-3 konkreta förbättringar.',
            pillarKey: 'self_care',
            estimatedTime: 30,
            difficultyLevel: 2,
            neuroplasticPrinciple: 'Kvalitetssömn är avgörande för hjärnans återhämtning och minneskonsolidering',
            isCompleted: false
          }
        ]
      },
      {
        pillarKey: 'skills',
        pillarName: 'Kompetenser',
        currentLevel: 5.8,
        targetLevel: 8.0,
        priority: 2,
        color: 'text-green-600',
        icon: <Brain className="w-5 h-5" />,
        strategies: [
          {
            id: '3',
            type: 'skill',
            title: 'Micro-learning sessions',
            description: 'Dedicera 15 minuter per dag till att lära dig något nytt inom ditt expertområde.',
            pillarKey: 'skills',
            estimatedTime: 15,
            difficultyLevel: 3,
            neuroplasticPrinciple: 'Spaced repetition och kort, intensiv inlärning optimerar synaptic plasticity',
            isCompleted: false
          }
        ]
      }
    ];

    setFocusAreas(mockAreas);
    
    // Beräkna progress
    const totalStrategies = mockAreas.reduce((sum, area) => sum + area.strategies.length, 0);
    const completedStrategies = mockAreas.reduce((sum, area) => 
      sum + area.strategies.filter(s => s.isCompleted).length, 0);
    setPlanProgress((completedStrategies / totalStrategies) * 100);
  };

  const savePlanToDatabase = async (planData: any) => {
    // Spara planen till databasen (implementation när tabeller skapas)
    console.log('Saving plan to database:', planData);
  };

  const toggleStrategyCompletion = async (areaIndex: number, strategyIndex: number) => {
    const newFocusAreas = [...focusAreas];
    newFocusAreas[areaIndex].strategies[strategyIndex].isCompleted = 
      !newFocusAreas[areaIndex].strategies[strategyIndex].isCompleted;
    
    setFocusAreas(newFocusAreas);
    
    // Uppdatera progress
    const totalStrategies = newFocusAreas.reduce((sum, area) => sum + area.strategies.length, 0);
    const completedStrategies = newFocusAreas.reduce((sum, area) => 
      sum + area.strategies.filter(s => s.isCompleted).length, 0);
    setPlanProgress((completedStrategies / totalStrategies) * 100);

    toast({
      title: newFocusAreas[areaIndex].strategies[strategyIndex].isCompleted ? "🎉 Bra jobbat!" : "📝 Markerat som väntande",
      description: newFocusAreas[areaIndex].strategies[strategyIndex].title,
    });
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-700';
      case 2: return 'bg-blue-100 text-blue-700';
      case 3: return 'bg-yellow-100 text-yellow-700';
      case 4: return 'bg-orange-100 text-orange-700';
      case 5: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: DevelopmentStrategy['type']) => {
    switch (type) {
      case 'habit': return <Clock className="w-4 h-4" />;
      case 'action': return <Zap className="w-4 h-4" />;
      case 'mindset': return <Brain className="w-4 h-4" />;
      case 'skill': return <Star className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (isGenerating) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 animate-pulse text-blue-600" />
            AI skapar din personliga utvecklingsplan...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={66} className="h-3" />
            <p className="text-muted-foreground text-center">
              Analyserar dina assessments och identifierar optimala utvecklingsstrategier...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasActivePlan || focusAreas.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6" />
            Din Personliga Utvecklingsplan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Utvecklingsplan väntar på fler assessments</h3>
            <p className="text-muted-foreground mb-6">
              Genomför minst 2-3 pillar-bedömningar för att få en komplett utvecklingsplan
            </p>
            <Button onClick={() => window.location.href = '/six-pillars'}>
              Fortsätt med assessments
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Din Personliga Utvecklingsplan
            <ActionTooltip content="Baserad på dina pillar-assessments och AI-analys av dina utvecklingsområden">
              <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-xs text-blue-600 font-semibold cursor-help">i</div>
            </ActionTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{focusAreas.length}</div>
              <div className="text-sm text-muted-foreground">Fokusområden</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {focusAreas.reduce((sum, area) => sum + area.strategies.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Strategier</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{Math.round(planProgress)}%</div>
              <div className="text-sm text-muted-foreground">Genomfört</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Framsteg</span>
              <span>{Math.round(planProgress)}%</span>
            </div>
            <Progress value={planProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Focus Areas */}
      {focusAreas.map((area, areaIndex) => (
        <Card key={area.pillarKey} className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${area.color}`}>
              {area.icon}
              {area.pillarName}
              <Badge variant="secondary" className="ml-2">
                Prioritet {area.priority}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Nuvarande: {area.currentLevel}/10</span>
              <ArrowRight className="w-4 h-4" />
              <span>Mål: {area.targetLevel}/10</span>
            </div>
            <Progress 
              value={(area.currentLevel / 10) * 100} 
              className="h-2"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {area.strategies.map((strategy, strategyIndex) => (
                <div
                  key={strategy.id}
                  className={`p-4 border rounded-lg transition-all ${
                    strategy.isCompleted 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleStrategyCompletion(areaIndex, strategyIndex)}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        strategy.isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {strategy.isCompleted && <CheckCircle className="w-4 h-4" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className={`font-semibold ${strategy.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {strategy.title}
                        </h4>
                        <div className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(strategy.difficultyLevel)}`}>
                          {getTypeIcon(strategy.type)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {strategy.estimatedTime} min
                        </Badge>
                      </div>
                      
                      <p className={`text-sm mb-2 ${strategy.isCompleted ? 'text-muted-foreground' : ''}`}>
                        {strategy.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Brain className="w-3 h-3" />
                        <span>{strategy.neuroplasticPrinciple}</span>
                      </div>
                      
                      {strategy.scheduledFor && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                          <Calendar className="w-3 h-3" />
                          <span>Schemalagt: {strategy.scheduledFor.toLocaleDateString('sv-SE')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => generateNewPlan()}
              className="flex-1"
              disabled={isGenerating}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Förbättra planen med AI-coaching
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/calendar'}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Se i kalender
            </Button>
          </div>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Din plan anpassas automatiskt baserat på nya assessments och framsteg
          </div>
        </CardContent>
      </Card>
    </div>
  );
};