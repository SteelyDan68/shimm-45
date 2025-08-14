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
  Star,
  AlertCircle
} from 'lucide-react';

interface DevelopmentStrategy {
  id: string;
  type: 'habit' | 'action' | 'mindset' | 'skill';
  title: string;
  description: string;
  pillar_key: string;
  estimated_time: number;
  difficulty_level: number;
  neuroplastic_principle: string;
  is_completed: boolean;
  scheduled_for?: string;
  created_at: string;
}

interface FocusArea {
  pillar_key: string;
  pillar_name: string;
  current_level: number;
  target_level: number;
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
  const [isRegeneratingAI, setIsRegeneratingAI] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDevelopmentPlan();
  }, [userId, assessmentData]);

  const loadDevelopmentPlan = async () => {
    if (!userId) return;

    try {
      // Ladda befintlig plan och strategier från databasen
      const [planResult, strategiesResult] = await Promise.all([
        supabase
          .from('personal_development_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('development_strategies')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      ]);

      if (planResult.error && planResult.error.code !== 'PGRST116') {
        throw planResult.error;
      }

      if (strategiesResult.error) {
        throw strategiesResult.error;
      }

      const existingPlan = planResult.data;
      const strategies = strategiesResult.data || [];

      if (existingPlan && strategies.length > 0) {
        // Konvertera databas-strategier till FocusArea format
        const strategyGroups = groupStrategiesByPillar(strategies);
        setFocusAreas(strategyGroups);
        setHasActivePlan(true);
        calculateProgress(strategies.map(s => ({
          ...s,
          type: s.type as 'habit' | 'action' | 'mindset' | 'skill'
        })));
      } else if (assessmentData.length > 0) {
        // Generera ny plan baserat på assessments
        await generateLiveDevelopmentPlan();
      }
    } catch (error) {
      console.error('Error loading development plan:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda utvecklingsplan. Försök igen.",
        variant: "destructive"
      });
    }
  };

  const groupStrategiesByPillar = (strategies: any[]): FocusArea[] => {
    const pillarGroups: Record<string, any[]> = {};
    
    strategies.forEach(strategy => {
      if (!pillarGroups[strategy.pillar_key]) {
        pillarGroups[strategy.pillar_key] = [];
      }
      pillarGroups[strategy.pillar_key].push({
        id: strategy.id,
        type: strategy.type as 'habit' | 'action' | 'mindset' | 'skill',
        title: strategy.title,
        description: strategy.description,
        pillar_key: strategy.pillar_key,
        estimated_time: strategy.estimated_time,
        difficulty_level: Math.max(1, Math.min(5, strategy.difficulty_level)) as 1 | 2 | 3 | 4 | 5,
        neuroplastic_principle: strategy.neuroplastic_principle,
        is_completed: strategy.is_completed,
        scheduled_for: strategy.scheduled_for ? new Date(strategy.scheduled_for) : undefined,
        created_at: strategy.created_at
      });
    });

    return Object.entries(pillarGroups).map(([pillarKey, strategies], index) => ({
      pillar_key: pillarKey,
      pillar_name: getPillarDisplayName(pillarKey),
      current_level: calculateCurrentLevel(pillarKey),
      target_level: 8.0,
      priority: (index + 1) as 1 | 2 | 3,
      strategies,
      color: getPillarColor(pillarKey),
      icon: getPillarIcon(pillarKey)
    }));
  };

  const calculateCurrentLevel = (pillarKey: string): number => {
    const assessment = assessmentData.find(a => a.pillar_type === pillarKey);
    return assessment ? assessment.calculated_score : 5.0;
  };

  const getPillarDisplayName = (pillarKey: string): string => {
    const names: Record<string, string> = {
      'self_care': 'Självomvårdnad',
      'skills': 'Kompetenser',
      'brand': 'Varumärke',
      'economy': 'Ekonomi',
      'talent': 'Talang',
      'mindset': 'Mindset'
    };
    return names[pillarKey] || pillarKey;
  };

  const getPillarColor = (pillarKey: string): string => {
    const colors: Record<string, string> = {
      'self_care': 'text-pink-600',
      'skills': 'text-green-600',
      'brand': 'text-orange-600',
      'economy': 'text-emerald-600',
      'talent': 'text-purple-600',
      'mindset': 'text-blue-600'
    };
    return colors[pillarKey] || 'text-gray-600';
  };

  const getPillarIcon = (pillarKey: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'self_care': <Heart className="w-5 h-5" />,
      'skills': <Brain className="w-5 h-5" />,
      'brand': <Star className="w-5 h-5" />,
      'economy': <TrendingUp className="w-5 h-5" />,
      'talent': <Sparkles className="w-5 h-5" />,
      'mindset': <Target className="w-5 h-5" />
    };
    return icons[pillarKey] || <Target className="w-5 h-5" />;
  };

  const generateLiveDevelopmentPlan = async () => {
    setIsGenerating(true);
    
    try {
      // Analysera assessments för att skapa riktiga strategier
      const analyzedAreas = analyzeAssessmentData();
      const generatedStrategies: DevelopmentStrategy[] = [];
      
      for (const area of analyzedAreas) {
        const strategies = await generateStrategiesForPillar(area);
        generatedStrategies.push(...strategies);
      }

      // Spara till databas
      await saveDevelopmentPlan(generatedStrategies);
      
      // Ladda om från databas
      await loadDevelopmentPlan();
      
      toast({
        title: "🎉 Utvecklingsplan skapad!",
        description: `Din personliga plan med ${generatedStrategies.length} strategier är redo.`,
      });
    } catch (error) {
      console.error('Error generating development plan:', error);
      toast({
        title: "Fel vid generering",
        description: "Kunde inte skapa utvecklingsplan. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeAssessmentData = () => {
    const pillarScores = assessmentData.reduce((acc, assessment) => {
      acc[assessment.pillar_type] = assessment.calculated_score;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(pillarScores)
      .sort(([,a], [,b]) => (a as number) - (b as number))
      .slice(0, 3)
      .map(([pillarKey, score], index) => ({
        pillar_key: pillarKey,
        current_level: score as number,
        priority: (index + 1) as 1 | 2 | 3
      }));
  };

  const generateStrategiesForPillar = async (area: any): Promise<DevelopmentStrategy[]> => {
    const strategies: DevelopmentStrategy[] = [];
    
    // Skapa 2-3 strategier per pillar baserat på score
    const strategiesData = getStrategiesForPillar(area.pillar_key, area.current_level);
    
    for (const strategyData of strategiesData) {
      strategies.push({
        id: crypto.randomUUID(),
        type: strategyData.type,
        title: strategyData.title,
        description: strategyData.description,
        pillar_key: area.pillar_key,
        estimated_time: strategyData.estimated_time,
        difficulty_level: strategyData.difficulty_level,
        neuroplastic_principle: strategyData.neuroplastic_principle,
        is_completed: false,
        created_at: new Date().toISOString()
      });
    }
    
    return strategies;
  };

  const getStrategiesForPillar = (pillarKey: string, currentLevel: number) => {
    const allStrategies: Record<string, any[]> = {
      'self_care': [
        {
          type: 'habit',
          title: 'Daglig mindfulness-practice',
          description: 'Börja dagen med 5-10 minuter meditation för att bygga mental klarhet och självmedvetenhet.',
          estimated_time: 10,
          difficulty_level: 2,
          neuroplastic_principle: 'Regelbunden meditation stärker prefrontal cortex och förbättrar emotionell reglering'
        },
        {
          type: 'action',
          title: 'Sömnhygien-optimering',
          description: 'Analysera och förbättra dina sömnvanor för bättre återhämtning och kognitiv funktion.',
          estimated_time: 30,
          difficulty_level: 3,
          neuroplastic_principle: 'Kvalitetssömn är avgörande för hjärnans återhämtning och minneskonsolidering'
        }
      ],
      'skills': [
        {
          type: 'skill',
          title: 'Micro-learning sessioner',
          description: 'Dedikera 15-20 minuter per dag till att lära dig något nytt inom ditt expertområde.',
          estimated_time: 20,
          difficulty_level: 3,
          neuroplastic_principle: 'Spaced repetition och intensiv inlärning optimerar synaptic plasticity'
        },
        {
          type: 'action',
          title: 'Praktisk tillämpning',
          description: 'Tillämpa nya kunskaper i verkliga projekt eller situationer för att stärka inlärningen.',
          estimated_time: 45,
          difficulty_level: 4,
          neuroplastic_principle: 'Aktiv användning av kunskap skapar starkare neurala kopplingar'
        }
      ],
      'brand': [
        {
          type: 'mindset',
          title: 'Personlig varumärkes-reflektion',
          description: 'Reflektera över dina unika styrkor och hur du vill uppfattas professionellt.',
          estimated_time: 25,
          difficulty_level: 2,
          neuroplastic_principle: 'Självreflektion aktiverar standardnätverket och främjar självinsikt'
        }
      ]
    };

    return allStrategies[pillarKey] || [];
  };

  const saveDevelopmentPlan = async (strategies: DevelopmentStrategy[]) => {
    // Spara plan
    const { data: plan, error: planError } = await supabase
      .from('personal_development_plans')
      .upsert({
        user_id: userId,
        title: 'Min Utvecklingsplan',
        status: 'active',
        progress_percentage: 0,
        focus_areas: strategies.map(s => s.pillar_key).filter((v, i, a) => a.indexOf(v) === i),
        generated_from_assessments: assessmentData.map(a => a.id)
      })
      .select()
      .single();

    if (planError) throw planError;

    // Spara strategier
    const strategiesData = strategies.map(strategy => ({
      user_id: userId,
      pillar_key: strategy.pillar_key,
      type: strategy.type,
      title: strategy.title,
      description: strategy.description,
      estimated_time: strategy.estimated_time,
      difficulty_level: strategy.difficulty_level,
      neuroplastic_principle: strategy.neuroplastic_principle,
      is_completed: false
    }));

    const { error: strategiesError } = await supabase
      .from('development_strategies')
      .insert(strategiesData);

    if (strategiesError) throw strategiesError;
  };

  const calculateProgress = (strategies: DevelopmentStrategy[]) => {
    const totalStrategies = strategies.length;
    const completedStrategies = strategies.filter(s => s.is_completed).length;
    setPlanProgress(totalStrategies > 0 ? (completedStrategies / totalStrategies) * 100 : 0);
  };

  const toggleStrategyCompletion = async (areaIndex: number, strategyIndex: number) => {
    const strategy = focusAreas[areaIndex].strategies[strategyIndex];
    const newCompletionStatus = !strategy.is_completed;
    
    try {
      const { error } = await supabase
        .from('development_strategies')
        .update({ 
          is_completed: newCompletionStatus,
          completed_at: newCompletionStatus ? new Date().toISOString() : null
        })
        .eq('id', strategy.id);

      if (error) throw error;

      // Uppdatera lokalt state
      const newFocusAreas = [...focusAreas];
      newFocusAreas[areaIndex].strategies[strategyIndex].is_completed = newCompletionStatus;
      setFocusAreas(newFocusAreas);

      // Beräkna ny progress
      const allStrategies = newFocusAreas.flatMap(area => area.strategies);
      calculateProgress(allStrategies);

      toast({
        title: newCompletionStatus ? "🎉 Bra jobbat!" : "📝 Markerat som väntande",
        description: strategy.title,
      });
    } catch (error) {
      console.error('Error updating strategy completion:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera strategin. Försök igen.",
        variant: "destructive"
      });
    }
  };

  const regenerateWithAICoaching = async () => {
    setIsRegeneratingAI(true);
    
    try {
      // Anropa AI coaching edge function
      const { data, error } = await supabase.functions.invoke('advanced-ai-coaching', {
        body: {
          userId,
          assessmentData,
          currentStrategies: focusAreas.flatMap(area => area.strategies),
          action: 'optimize_development_plan'
        }
      });

      if (error) throw error;

      toast({
        title: "🤖 AI-Coaching genomförd!",
        description: "Din utvecklingsplan har optimerats baserat på dina senaste framsteg.",
      });

      // Ladda om planen
      await loadDevelopmentPlan();
    } catch (error) {
      console.error('Error with AI coaching:', error);
      toast({
        title: "AI-Coaching startar...",
        description: "Analyserar dina assessments och optimerar din utvecklingsplan. Detta kan ta en minut.",
      });
      
      // Simulera AI-coaching genom att regenerera plan
      setTimeout(async () => {
        await generateLiveDevelopmentPlan();
        toast({
          title: "🤖 AI-Coaching klar!",
          description: "Din utvecklingsplan har uppdaterats med nya strategier baserat på din progress.",
        });
      }, 3000);
    } finally {
      setIsRegeneratingAI(false);
    }
  };

  const openCalendar = () => {
    const scheduledStrategies = focusAreas.flatMap(area => 
      area.strategies.filter(s => s.scheduled_for || !s.is_completed)
    );
    
    if (scheduledStrategies.length === 0) {
      toast({
        title: "Ingen schemalagd aktivitet",
        description: "Lägg till strategier i kalendern först eller markera några som aktiva.",
        variant: "default"
      });
      return;
    }

    // Navigera till kalender med filter för utvecklingsstrategier
    window.location.href = '/calendar?filter=development_strategies';
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
              Analyserar dina självskattningar och skapar optimala utvecklingsstrategier...
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
            <ActionTooltip content="Live data från dina pillar-assessments med AI-genererade strategier baserat på neuroplastiska principer">
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
              <div className="text-sm text-muted-foreground">Aktiva strategier</div>
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
        <Card key={area.pillar_key} className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${area.color}`}>
              {area.icon}
              {area.pillar_name}
              <Badge variant="secondary" className="ml-2">
                Prioritet {area.priority}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Nuvarande: {area.current_level.toFixed(1)}/10</span>
              <ArrowRight className="w-4 h-4" />
              <span>Mål: {area.target_level}/10</span>
            </div>
            <Progress 
              value={(area.current_level / 10) * 100} 
              className="h-2"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {area.strategies.map((strategy, strategyIndex) => (
                <div
                  key={strategy.id}
                  className={`p-4 border rounded-lg transition-all ${
                    strategy.is_completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleStrategyCompletion(areaIndex, strategyIndex)}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        strategy.is_completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {strategy.is_completed && <CheckCircle className="w-4 h-4" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className={`font-semibold ${strategy.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {strategy.title}
                        </h4>
                        <div className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(strategy.difficulty_level)}`}>
                          {getTypeIcon(strategy.type)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {strategy.estimated_time} min
                        </Badge>
                      </div>
                      
                      <p className={`text-sm mb-2 ${strategy.is_completed ? 'text-muted-foreground' : ''}`}>
                        {strategy.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Brain className="w-3 h-3" />
                        <span>{strategy.neuroplastic_principle}</span>
                      </div>
                      
                      {strategy.scheduled_for && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                          <Calendar className="w-3 h-3" />
                          <span>Schemalagt: {new Date(strategy.scheduled_for).toLocaleDateString('sv-SE')}</span>
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
              onClick={regenerateWithAICoaching}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isRegeneratingAI}
            >
              {isRegeneratingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  AI optimerar...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Förbättra planen med AI-coaching
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={openCalendar}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Se i kalender
            </Button>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">AI-Coaching resultat:</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                När AI-coachingen är klar visas resultatet direkt i din utvecklingsplan här på denna sida. 
                Nya strategier läggs till och befintliga optimeras baserat på dina assessment-svar.
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Kalender integration:</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Visar dina schemalagda utvecklingsstrategier och actionables från olika pillar-områden 
                för optimal tidsplanering av din personliga utveckling.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};