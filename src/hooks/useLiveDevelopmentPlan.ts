import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DevelopmentStrategy {
  id: string;
  type: 'habit' | 'action' | 'mindset' | 'skill';
  title: string;
  description: string;
  pillarKey: string;
  estimatedTime: number;
  difficultyLevel: number;
  neuroplasticPrinciple: string;
  isCompleted: boolean;
  scheduledFor?: Date;
  progressPercentage: number;
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

interface PersonalDevelopmentPlan {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'paused';
  progressPercentage: number;
  focusAreas: FocusArea[];
  aiAnalysis?: string;
  createdAt: string;
  updatedAt: string;
}

export const useLiveDevelopmentPlan = (userId: string, assessmentData: any[]) => {
  const [developmentPlan, setDevelopmentPlan] = useState<PersonalDevelopmentPlan | null>(null);
  const [strategies, setStrategies] = useState<DevelopmentStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const loadDevelopmentPlan = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      // Load existing development plan
      const { data: existingPlan, error: planError } = await supabase
        .from('personal_development_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (planError) throw planError;

      // Load development strategies
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('development_strategies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (strategiesError) throw strategiesError;

      if (existingPlan && strategiesData) {
        const formattedStrategies = strategiesData.map(strategy => ({
          id: strategy.id,
          type: strategy.type as 'habit' | 'action' | 'mindset' | 'skill',
          title: strategy.title,
          description: strategy.description,
          pillarKey: strategy.pillar_key,
          estimatedTime: strategy.estimated_time,
          difficultyLevel: strategy.difficulty_level,
          neuroplasticPrinciple: strategy.neuroplastic_principle,
          isCompleted: strategy.is_completed,
          scheduledFor: strategy.scheduled_for ? new Date(strategy.scheduled_for) : undefined,
          progressPercentage: strategy.progress_percentage
        }));

        setStrategies(formattedStrategies);

        // Group strategies by pillar for focus areas
        const focusAreasMap = formattedStrategies.reduce((acc, strategy) => {
          if (!acc[strategy.pillarKey]) {
            acc[strategy.pillarKey] = {
              pillarKey: strategy.pillarKey,
              pillarName: getPillarName(strategy.pillarKey),
              currentLevel: 0,
              targetLevel: 10,
              priority: 1 as 1 | 2 | 3,
              strategies: [],
              color: getPillarColor(strategy.pillarKey),
              icon: null
            };
          }
          acc[strategy.pillarKey].strategies.push(strategy);
          return acc;
        }, {} as Record<string, FocusArea>);

        const focusAreas = Object.values(focusAreasMap);

        const plan: PersonalDevelopmentPlan = {
          id: existingPlan.id,
          title: existingPlan.title,
          status: existingPlan.status as 'active' | 'completed' | 'paused',
          progressPercentage: existingPlan.progress_percentage,
          focusAreas,
          aiAnalysis: existingPlan.ai_analysis,
          createdAt: existingPlan.created_at,
          updatedAt: existingPlan.updated_at
        };

        setDevelopmentPlan(plan);
      } else if (assessmentData.length >= 2) {
        // Generate new plan if we have enough assessments
        await generateDevelopmentPlan();
      }
    } catch (error) {
      console.error('Error loading development plan:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda utvecklingsplanen",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateDevelopmentPlan = async () => {
    if (!userId || assessmentData.length < 2) return;

    try {
      setIsGenerating(true);

      // Create development plan based on assessments
      const prioritizedPillars = assessmentData
        .sort((a, b) => a.calculated_score - b.calculated_score)
        .slice(0, 3);

      const { data: newPlan, error: planError } = await supabase
        .from('personal_development_plans')
        .insert({
          user_id: userId,
          title: 'Min AI-genererade utvecklingsplan',
          status: 'active',
          progress_percentage: 0,
          focus_areas: prioritizedPillars.map(p => p.pillar_type),
          generated_from_assessments: assessmentData.map(a => a.id),
          ai_analysis: `Denna plan är genererad baserat på dina ${assessmentData.length} genomförda assessments. Fokusområdena har prioriterats baserat på utvecklingspotential.`
        })
        .select()
        .single();

      if (planError) throw planError;

      // Generate strategies for each pillar
      const strategiesToCreate = [];
      for (const [index, pillar] of prioritizedPillars.entries()) {
        const pillarStrategies = generateStrategiesForPillar(pillar.pillar_type, pillar.calculated_score, index + 1);
        strategiesToCreate.push(...pillarStrategies.map(strategy => ({
          ...strategy,
          user_id: userId
        })));
      }

      const { data: createdStrategies, error: strategiesError } = await supabase
        .from('development_strategies')
        .insert(strategiesToCreate)
        .select();

      if (strategiesError) throw strategiesError;

      toast({
        title: "🎉 Utvecklingsplan skapad!",
        description: `Ny personlig utvecklingsplan med ${createdStrategies?.length || 0} strategier`,
      });

      // Reload the plan
      await loadDevelopmentPlan();
    } catch (error) {
      console.error('Error generating development plan:', error);
      toast({
        title: "Fel vid generering",
        description: "Kunde inte skapa utvecklingsplanen",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStrategyCompletion = async (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;

    try {
      const newCompletedState = !strategy.isCompleted;
      const updateData = {
        is_completed: newCompletedState,
        completed_at: newCompletedState ? new Date().toISOString() : null,
        progress_percentage: newCompletedState ? 100 : 0,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('development_strategies')
        .update(updateData)
        .eq('id', strategyId);

      if (error) throw error;

      // Update local state
      setStrategies(prev => 
        prev.map(s => 
          s.id === strategyId 
            ? { ...s, isCompleted: newCompletedState, progressPercentage: newCompletedState ? 100 : 0 }
            : s
        )
      );

      // Update plan progress
      const totalStrategies = strategies.length;
      const completedStrategies = strategies.filter(s => s.isCompleted || s.id === strategyId && newCompletedState).length;
      const newProgress = Math.round((completedStrategies / totalStrategies) * 100);

      if (developmentPlan) {
        const { error: planError } = await supabase
          .from('personal_development_plans')
          .update({ progress_percentage: newProgress })
          .eq('id', developmentPlan.id);

        if (!planError) {
          setDevelopmentPlan(prev => prev ? { ...prev, progressPercentage: newProgress } : null);
        }
      }

      toast({
        title: newCompletedState ? "🎉 Bra jobbat!" : "📝 Markerat som väntande",
        description: strategy.title,
      });
    } catch (error) {
      console.error('Error updating strategy:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera strategin",
        variant: "destructive"
      });
    }
  };

  const scheduleStrategy = async (strategyId: string, date: Date) => {
    try {
      const { error } = await supabase
        .from('development_strategies')
        .update({ 
          scheduled_for: date.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', strategyId);

      if (error) throw error;

      setStrategies(prev => 
        prev.map(s => 
          s.id === strategyId 
            ? { ...s, scheduledFor: date }
            : s
        )
      );

      toast({
        title: "📅 Schemalagt!",
        description: `Strategin är nu schemalagd för ${date.toLocaleDateString('sv-SE')}`,
      });
    } catch (error) {
      console.error('Error scheduling strategy:', error);
      toast({
        title: "Fel",
        description: "Kunde inte schemalägga strategin",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadDevelopmentPlan();
  }, [userId, assessmentData]);

  return {
    developmentPlan,
    strategies,
    isLoading,
    isGenerating,
    generateDevelopmentPlan,
    toggleStrategyCompletion,
    scheduleStrategy,
    refetch: loadDevelopmentPlan
  };
};

// Helper functions
const getPillarName = (pillarKey: string) => {
  const names: Record<string, string> = {
    'talent': 'Talang',
    'mindset': 'Mindset',
    'skills': 'Kompetenser',
    'brand': 'Varumärke',
    'economy': 'Ekonomi',
    'self_care': 'Självomvårdnad',
    'open_track': 'Öppna spåret'
  };
  return names[pillarKey] || pillarKey;
};

const getPillarColor = (pillarKey: string) => {
  const colors: Record<string, string> = {
    'talent': 'text-purple-600',
    'mindset': 'text-blue-600',
    'skills': 'text-green-600',
    'brand': 'text-orange-600',
    'economy': 'text-emerald-600',
    'self_care': 'text-pink-600',
    'open_track': 'text-indigo-600'
  };
  return colors[pillarKey] || 'text-gray-600';
};

const generateStrategiesForPillar = (pillarType: string, score: number, priority: number) => {
  const baseStrategies: Record<string, any[]> = {
    'self_care': [
      {
        type: 'habit',
        title: 'Daglig mindfulness-practice',
        description: 'Börja dagen med 5 minuter meditation för att bygga mental klarhet och självmedvetenhet.',
        pillar_key: 'self_care',
        estimated_time: 5,
        difficulty_level: 2,
        neuroplastic_principle: 'Regelbunden meditation stärker prefrontal cortex och förbättrar emotionell reglering'
      },
      {
        type: 'action',
        title: 'Sömnhygien-audit',
        description: 'Analysera dina sömnvanor i en vecka och identifiera 2-3 konkreta förbättringar.',
        pillar_key: 'self_care',
        estimated_time: 30,
        difficulty_level: 2,
        neuroplastic_principle: 'Kvalitetssömn är avgörande för hjärnans återhämtning och minneskonsolidering'
      }
    ],
    'skills': [
      {
        type: 'skill',
        title: 'Micro-learning sessions',
        description: 'Dedicera 15 minuter per dag till att lära dig något nytt inom ditt expertområde.',
        pillar_key: 'skills',
        estimated_time: 15,
        difficulty_level: 3,
        neuroplastic_principle: 'Spaced repetition och kort, intensiv inlärning optimerar synaptic plasticity'
      }
    ],
    'mindset': [
      {
        type: 'mindset',
        title: 'Growth mindset reflection',
        description: 'Daglig reflektion över utmaningar som tillväxtmöjligheter istället för hot.',
        pillar_key: 'mindset',
        estimated_time: 10,
        difficulty_level: 3,
        neuroplastic_principle: 'Medveten omformulering av tankar stärker neural pathways för optimism'
      }
    ]
  };

  return baseStrategies[pillarType] || [];
};