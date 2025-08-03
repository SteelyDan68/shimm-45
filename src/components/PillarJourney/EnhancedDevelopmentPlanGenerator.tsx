import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Target, CheckCircle, Clock, Zap, Trophy } from 'lucide-react';
import { PillarKey } from '@/types/sixPillarsModular';
import { IntensityLevel, DurationLevel } from './IntensityCalibrationDialog';

interface DevelopmentActivity {
  id: string;
  title: string;
  description: string;
  category: 'reflection' | 'action' | 'habit' | 'experiment';
  estimatedMinutes: number;
  neuroplasticPrinciple: string;
  scheduledDate: Date;
  isCompleted: boolean;
  aiReasoning: string;
  pillarKey: PillarKey;
}

interface EnhancedDevelopmentPlanGeneratorProps {
  userId: string;
  pillarKey: PillarKey;
  assessmentData: Record<string, any>;
  intensity: IntensityLevel;
  duration: DurationLevel;
  onPlanGenerated: (activities: DevelopmentActivity[]) => void;
}

const EnhancedDevelopmentPlanGenerator: React.FC<EnhancedDevelopmentPlanGeneratorProps> = ({
  userId,
  pillarKey,
  assessmentData,
  intensity,
  duration,
  onPlanGenerated
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [activities, setActivities] = useState<DevelopmentActivity[]>([]);
  const [stefanPersonalization, setStefanPersonalization] = useState<any>(null);

  useEffect(() => {
    generateDevelopmentPlan();
  }, [pillarKey, assessmentData, intensity, duration]);

  const generateDevelopmentPlan = async () => {
    setIsGenerating(true);
    
    try {
      // Step 1: Fetch Stefan's memories for personalization
      setGenerationStep('Hämtar personliga insikter från Stefan...');
      const stefanMemories = await fetchStefanMemories();
      setStefanPersonalization(stefanMemories);

      // Step 2: Generate AI analysis and plan
      setGenerationStep('AI analyserar din assessment...');
      const aiAnalysis = await generateAIAnalysis();

      // Step 3: Create specific activities
      setGenerationStep('Skapar personliga aktiviteter...');
      const generatedActivities = await generateActivities(aiAnalysis);

      // Step 4: Schedule activities over time
      setGenerationStep('Planerar aktiviteter över tid...');
      const scheduledActivities = scheduleActivities(generatedActivities);

      // Step 5: Save to database
      setGenerationStep('Sparar din utvecklingsplan...');
      await saveActivitiesToDatabase(scheduledActivities);

      setActivities(scheduledActivities);
      onPlanGenerated(scheduledActivities);

      toast({
        title: "🎉 Din utvecklingsplan är klar!",
        description: `${scheduledActivities.length} personliga aktiviteter skapade för ${duration.weeks} veckor.`,
      });

    } catch (error) {
      console.error('Error generating development plan:', error);
      toast({
        title: "Fel vid planering",
        description: "Kunde inte skapa utvecklingsplan. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const fetchStefanMemories = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-stefan-memories', {
        body: { 
          userId,
          context: `pillar_assessment_${pillarKey}`,
          limit: 10
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching Stefan memories:', error);
      return null;
    }
  };

  const generateAIAnalysis = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('advanced-ai-coaching', {
        body: {
          userId,
          pillarKey,
          assessmentData,
          intensity,
          duration,
          stefanContext: stefanPersonalization,
          analysisType: 'development_plan_generation'
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      throw error;
    }
  };

  const generateActivities = async (aiAnalysis: any): Promise<DevelopmentActivity[]> => {
    const totalActivities = intensity.activitiesPerWeek * duration.weeks;
    
    // Generate activities based on AI analysis and neuroplastic principles
    const baseActivities = [
      // Reflection activities (20%)
      ...generateReflectionActivities(Math.ceil(totalActivities * 0.2), aiAnalysis),
      // Action activities (40%)
      ...generateActionActivities(Math.ceil(totalActivities * 0.4), aiAnalysis),
      // Habit formation (25%)
      ...generateHabitActivities(Math.ceil(totalActivities * 0.25), aiAnalysis),
      // Experiments (15%)
      ...generateExperimentActivities(Math.ceil(totalActivities * 0.15), aiAnalysis)
    ];

    return baseActivities.slice(0, totalActivities);
  };

  const generateReflectionActivities = (count: number, aiAnalysis: any): DevelopmentActivity[] => {
    const templates = [
      {
        title: "Reflektion: Nulägesanalys",
        description: "Ta 10 minuter att reflektera över var du står just nu inom {pillar}. Skriv ner 3 styrkor och 3 utvecklingsområden.",
        neuroplasticPrinciple: "Medvetenhet och självreflektion stärker neurala banor för självinsikt",
        category: 'reflection' as const
      },
      {
        title: "Daglig framstegskoll",
        description: "Evaluera dagen: Vad gick bra? Vad kunde varit annorlunda? En snabb check-in med dig själv.",
        neuroplasticPrinciple: "Daglig reflektion skapar starka neurala mönster för självutveckling",
        category: 'reflection' as const
      }
    ];

    return templates.slice(0, count).map((template, index) => ({
      id: `reflection_${index}`,
      title: template.title,
      description: template.description.replace('{pillar}', pillarKey),
      category: template.category,
      estimatedMinutes: Math.min(intensity.minutesPerDay, 15),
      neuroplasticPrinciple: template.neuroplasticPrinciple,
      scheduledDate: new Date(),
      isCompleted: false,
      aiReasoning: `Baserat på din assessment behöver du stärka självinsikten inom ${pillarKey}`,
      pillarKey
    }));
  };

  const generateActionActivities = (count: number, aiAnalysis: any): DevelopmentActivity[] => {
    const templates = [
      {
        title: "Konkret handling: Första steget",
        description: "Genomför en specifik handling som direkt påverkar din utveckling inom {pillar}. Börja smått men börja idag!",
        neuroplasticPrinciple: "Handling förstärker neurala banor genom repetition och belöning",
        category: 'action' as const
      },
      {
        title: "Utmaning: Comfort zone-utvidgning",
        description: "Gör något inom {pillar} som känns lite utmanande men genomförbart. Utvidga din bekvämlighetszon gradvis.",
        neuroplasticPrinciple: "Måttlig stress aktiverar neuroplasticitet och tillväxt",
        category: 'action' as const
      }
    ];

    return templates.slice(0, count).map((template, index) => ({
      id: `action_${index}`,
      title: template.title,
      description: template.description.replace('{pillar}', pillarKey),
      category: template.category,
      estimatedMinutes: intensity.minutesPerDay,
      neuroplasticPrinciple: template.neuroplasticPrinciple,
      scheduledDate: new Date(),
      isCompleted: false,
      aiReasoning: `Din assessment visar att du behöver mer praktisk handling inom ${pillarKey}`,
      pillarKey
    }));
  };

  const generateHabitActivities = (count: number, aiAnalysis: any): DevelopmentActivity[] => {
    const templates = [
      {
        title: "Microhabit: Daglig rutin",
        description: "Etablera en liten men konsekvent daglig vana inom {pillar}. 2-3 minuter räcker för att starta.",
        neuroplasticPrinciple: "Mikrovanor bygger starka neurala banor genom konsekvent repetition",
        category: 'habit' as const
      }
    ];

    return templates.slice(0, count).map((template, index) => ({
      id: `habit_${index}`,
      title: template.title,
      description: template.description.replace('{pillar}', pillarKey),
      category: template.category,
      estimatedMinutes: Math.min(intensity.minutesPerDay / 2, 10),
      neuroplasticPrinciple: template.neuroplasticPrinciple,
      scheduledDate: new Date(),
      isCompleted: false,
      aiReasoning: `Dina svar indikerar att små, konsekventa vanor skulle stärka din ${pillarKey}`,
      pillarKey
    }));
  };

  const generateExperimentActivities = (count: number, aiAnalysis: any): DevelopmentActivity[] => {
    const templates = [
      {
        title: "Experiment: Testa något nytt",
        description: "Prova en helt ny approach eller metod inom {pillar}. Var nyfiken på resultatet utan press att lyckas.",
        neuroplasticPrinciple: "Nyfikenhet och experiment aktiverar belöningscentrum och lärande",
        category: 'experiment' as const
      }
    ];

    return templates.slice(0, count).map((template, index) => ({
      id: `experiment_${index}`,
      title: template.title,
      description: template.description.replace('{pillar}', pillarKey),
      category: template.category,
      estimatedMinutes: intensity.minutesPerDay,
      neuroplasticPrinciple: template.neuroplasticPrinciple,
      scheduledDate: new Date(),
      isCompleted: false,
      aiReasoning: `Baserat på din profil skulle experimentella metoder passa din lärstil inom ${pillarKey}`,
      pillarKey
    }));
  };

  const scheduleActivities = (activities: DevelopmentActivity[]): DevelopmentActivity[] => {
    const startDate = new Date();
    const activitiesPerWeek = intensity.activitiesPerWeek;
    const daysPerWeek = 7;
    
    return activities.map((activity, index) => {
      const weekNumber = Math.floor(index / activitiesPerWeek);
      const dayInWeek = index % activitiesPerWeek;
      const daySpacing = Math.floor(daysPerWeek / activitiesPerWeek);
      
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(startDate.getDate() + (weekNumber * 7) + (dayInWeek * daySpacing));
      
      return {
        ...activity,
        scheduledDate
      };
    });
  };

  const saveActivitiesToDatabase = async (activities: DevelopmentActivity[]) => {
    // Save to calendar_events
    const calendarEvents = activities.map(activity => ({
      user_id: userId,
      title: activity.title,
      description: activity.description,
      event_date: activity.scheduledDate.toISOString(),
      category: 'development_activity',
      created_by: userId,
      created_by_role: 'ai_generated',
      visible_to_client: true
    }));

    const { error: calendarError } = await supabase
      .from('calendar_events')
      .insert(calendarEvents);

    if (calendarError) {
      console.error('Error saving calendar events:', calendarError);
      throw calendarError;
    }

    const tasks = activities.map(activity => ({
      user_id: userId,
      title: activity.title,
      description: activity.description,
      priority: 'medium',
      deadline: activity.scheduledDate.toISOString(),
      status: 'pending',
      created_by: userId
    }));

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks);

    if (tasksError) {
      console.error('Error saving tasks:', tasksError);
      throw tasksError;
    }
  };

  const getCategoryIcon = (category: DevelopmentActivity['category']) => {
    switch (category) {
      case 'reflection': return <Target className="w-4 h-4" />;
      case 'action': return <Zap className="w-4 h-4" />;
      case 'habit': return <Clock className="w-4 h-4" />;
      case 'experiment': return <Trophy className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: DevelopmentActivity['category']) => {
    switch (category) {
      case 'reflection': return 'bg-blue-100 text-blue-700';
      case 'action': return 'bg-green-100 text-green-700';
      case 'habit': return 'bg-purple-100 text-purple-700';
      case 'experiment': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isGenerating) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 animate-spin" />
              🧠 AI skapar din personliga utvecklingsplan...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={66} className="h-3" />
              <p className="text-muted-foreground text-center">
                {generationStep}
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {intensity.activitiesPerWeek * duration.weeks}
                  </div>
                  <p className="text-xs text-muted-foreground">Aktiviteter planeras</p>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {duration.weeks}
                  </div>
                  <p className="text-xs text-muted-foreground">Veckor framåt</p>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-purple-600">
                    {intensity.minutesPerDay}
                  </div>
                  <p className="text-xs text-muted-foreground">Min per dag</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-green-600" />
            🎉 Din personliga utvecklingsplan är klar!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{activities.length}</p>
              <p className="text-xs text-muted-foreground">Totalt aktiviteter</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {activities.filter(a => a.category === 'action').length}
              </p>
              <p className="text-xs text-muted-foreground">Handlings-aktiviteter</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {activities.filter(a => a.category === 'habit').length}
              </p>
              <p className="text-xs text-muted-foreground">Vanor att bygga</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {activities.filter(a => a.category === 'experiment').length}
              </p>
              <p className="text-xs text-muted-foreground">Experiment att testa</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample of upcoming activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Nästa aktiviteter i din plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity, index) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${getCategoryColor(activity.category)}`}>
                  {getCategoryIcon(activity.category)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">
                    {activity.scheduledDate.toLocaleDateString('sv-SE')}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {activity.estimatedMinutes} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={() => window.location.href = '/calendar'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Se full plan i kalendern
        </Button>
      </div>
    </div>
  );
};

export default EnhancedDevelopmentPlanGenerator;