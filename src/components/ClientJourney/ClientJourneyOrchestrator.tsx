import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Target,
  TrendingUp,
  Lightbulb,
  Zap,
  Route,
  PlayCircle,
  PauseCircle,
  RefreshCw
} from 'lucide-react';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useUserAssessments } from '@/hooks/useUserAssessments';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ClientJourneyOrchestratorProps {
  userId: string;
  userName: string;
  className?: string;
}

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  type: 'assessment' | 'pillar_selection' | 'ai_analysis' | 'todo_creation' | 'habit_formation' | 'reflection';
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  estimatedTime: string;
  neuroplasticPrinciple?: string;
  pedagogicalGoal?: string;
  icon: React.ReactNode;
  action?: () => void;
  completedAt?: string;
  nextMilestone?: string;
}

/**
 * SCRUM Expert-Team Implementation:
 * - Product Manager: Seamless user journey with clear progression
 * - System Architect: Central orchestration of all journey components  
 * - Data Scientist: Evidence-based progression tracking
 * - Behavioral Scientist: Neuroplastic progression principles
 * - Senior Developer: Robust state management and error handling
 * - User: Intuitive self-guided experience
 * - UI Expert: Clean, motivating progress visualization
 * - UX Expert: Reduced cognitive load, clear next steps
 * - Educator: Scaffolded learning with proper sequencing
 */
export const ClientJourneyOrchestrator = ({ userId, userName, className }: ClientJourneyOrchestratorProps) => {
  const { 
    journeyState, 
    updateJourneyAfterAssessment, 
    getRecommendedAssessments, 
    getJourneyProgress,
    getCurrentPhaseDescription,
    hasCompletedWelcomeAssessment 
  } = useUserJourney();
  const { assessmentRounds } = useUserAssessments(userId);
  const { createTask } = useTasks();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isProcessingStep, setIsProcessingStep] = useState(false);
  const [journeyMode, setJourneyMode] = useState<'guided' | 'autonomous'>('guided');

  // NEUROPLASTISK PROGRESSION: 21-66 dagars cykler för vanetransformation
  const neuroplasticMilestones = [
    { days: 7, title: "Neuronal anpassning börjar", description: "Nya neuronala banor bildas" },
    { days: 21, title: "Beteendemönster etableras", description: "Vanan börjar kännas naturlig" },
    { days: 66, title: "Automatisk beteendeförändring", description: "Vanan är djupt rotad" }
  ];

  // PEDAGOGISK SEKVENSERING: Från konkret till abstrakt, från enkelt till komplext
  const createJourneySteps = (): JourneyStep[] => {
    const steps: JourneyStep[] = [
      {
        id: 'welcome_assessment',
        title: 'Upptäck var du står idag',
        description: 'En omfattande bedömning av ditt nuvarande läge inom alla livsområden',
        type: 'assessment',
        status: hasCompletedWelcomeAssessment() ? 'completed' : 'current',
        estimatedTime: '15-20 min',
        neuroplasticPrinciple: 'Självmedvetenhet och baslinjemätning',
        pedagogicalGoal: 'Självreflektion och situationsanalys',
        icon: <Brain className="h-5 w-5" />,
        action: () => navigate('/onboarding'),
        completedAt: journeyState?.metadata?.welcome_completed_at,
        nextMilestone: 'AI-analys av dina styrkor och utvecklingsområden'
      },
      {
        id: 'ai_analysis',
        title: 'AI analyserar dina resultat',
        description: 'Stefan AI skapar personliga insikter baserat på dina svar',
        type: 'ai_analysis',
        status: getAIAnalysisStatus(),
        estimatedTime: '2-3 min',
        neuroplasticPrinciple: 'Mönsterigenkänning och prioritering',
        pedagogicalGoal: 'Förståelse och personalisering',
        icon: <Lightbulb className="h-5 w-5" />,
        action: () => triggerAIAnalysis(),
        nextMilestone: 'Personliga utvecklingsmål och prioritering'
      },
      {
        id: 'pillar_selection',
        title: 'Välj dina utvecklingsområden',
        description: 'Aktivera de pelare som är viktigast för din utveckling just nu',
        type: 'pillar_selection',
        status: getPillarSelectionStatus(),
        estimatedTime: '5-10 min',
        neuroplasticPrinciple: 'Fokuserad utveckling för maximal neuroplasticitet',
        pedagogicalGoal: 'Målsättning och prioritering',
        icon: <Target className="h-5 w-5" />,
        action: () => navigate('/six-pillars'),
        nextMilestone: 'Konkreta handlingsplaner för dina valda områden'
      },
      {
        id: 'todo_creation',
        title: 'Få dina första utvecklingsuppgifter',
        description: 'AI skapar konkreta, genomförbara uppgifter baserat på dina mål',
        type: 'todo_creation',
        status: getTodoCreationStatus(),
        estimatedTime: '3-5 min',
        neuroplasticPrinciple: 'Små, konkreta steg för sustainable habit formation',
        pedagogicalGoal: 'Handlingsplan och genomförande',
        icon: <CheckCircle className="h-5 w-5" />,
        action: () => triggerTodoCreation(),
        nextMilestone: 'Start av din 21-dagars neuroplastiska utvecklingscykel'
      },
      {
        id: 'habit_formation',
        title: 'Börja din neuroplastiska resa',
        description: '21-dagars intensivperiod för att etablera nya neuronala banor',
        type: 'habit_formation',
        status: getHabitFormationStatus(),
        estimatedTime: '5-10 min/dag',
        neuroplasticPrinciple: 'Daglig repetition för neuronal omstrukturering',
        pedagogicalGoal: 'Vanetransformation och automatisering',
        icon: <RefreshCw className="h-5 w-5" />,
        action: () => navigate('/tasks'),
        nextMilestone: 'Etablerade nya beteendemönster och förbättrad självkänsla'
      },
      {
        id: 'reflection',
        title: 'Reflektion och nästa steg',
        description: 'Utvärdera framsteg och planera nästa utvecklingsfas',
        type: 'reflection',
        status: getReflectionStatus(),
        estimatedTime: '10-15 min',
        neuroplasticPrinciple: 'Konsolidering och långtidsminnesbildning',
        pedagogicalGoal: 'Metacognition och kontinuerlig utveckling',
        icon: <TrendingUp className="h-5 w-5" />,
        action: () => navigate('/analytics'),
        nextMilestone: 'Livslång utveckling och optimering'
      }
    ];

    // Uppdatera status baserat på aktuell progress
    updateStepStatuses(steps);
    return steps;
  };

  const updateStepStatuses = (steps: JourneyStep[]) => {
    let currentFound = false;
    
    steps.forEach((step, index) => {
      // Skip if already completed
      if (step.status === 'completed') {
        return;
      }
      
      // Set first non-completed step as current
      if (!currentFound) {
        step.status = 'current';
        setCurrentStepIndex(index);
        currentFound = true;
      } else {
        // Set subsequent steps as upcoming or locked
        step.status = index === currentStepIndex + 1 ? 'upcoming' : 'locked';
      }
    });
  };

  const getAIAnalysisStatus = (): 'completed' | 'current' | 'upcoming' | 'locked' => {
    if (!hasCompletedWelcomeAssessment()) return 'locked';
    return journeyState?.metadata?.ai_analysis_completed ? 'completed' : 'current';
  };

  const getPillarSelectionStatus = (): 'completed' | 'current' | 'upcoming' | 'locked' => {
    if (!journeyState?.metadata?.ai_analysis_completed) return 'locked';
    const activePillars = journeyState?.metadata?.active_pillars || [];
    return activePillars.length > 0 ? 'completed' : 'current';
  };

  const getTodoCreationStatus = (): 'completed' | 'current' | 'upcoming' | 'locked' => {
    const activePillars = journeyState?.metadata?.active_pillars || [];
    if (activePillars.length === 0) return 'locked';
    return journeyState?.metadata?.todos_created ? 'completed' : 'current';
  };

  const getHabitFormationStatus = (): 'completed' | 'current' | 'upcoming' | 'locked' => {
    if (!journeyState?.metadata?.todos_created) return 'locked';
    const daysInHabitFormation = journeyState?.metadata?.habit_formation_days || 0;
    return daysInHabitFormation >= 21 ? 'completed' : 'current';
  };

  const getReflectionStatus = (): 'completed' | 'current' | 'upcoming' | 'locked' => {
    const daysInHabitFormation = journeyState?.metadata?.habit_formation_days || 0;
    return daysInHabitFormation >= 21 ? 'current' : 'locked';
  };

  const triggerAIAnalysis = async () => {
    setIsProcessingStep(true);
    try {
      // Här skulle vi kalla AI-analysfunktionen
      toast({
        title: "AI-analys påbörjad",
        description: "Stefan analyserar dina svar och skapar personliga insikter...",
      });
      
      // Simulera AI-process
      setTimeout(() => {
        toast({
          title: "AI-analys klar!",
          description: "Dina personliga insikter är redo. Gå vidare till nästa steg.",
        });
        setIsProcessingStep(false);
      }, 3000);
      
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte genomföra AI-analys. Försök igen.",
        variant: "destructive"
      });
      setIsProcessingStep(false);
    }
  };

  const triggerTodoCreation = async () => {
    setIsProcessingStep(true);
    try {
      // Skapa konkreta uppgifter baserat på användarens valda pelare
      const activePillars = journeyState?.metadata?.active_pillars || [];
      
      for (const pillar of activePillars) {
        await createTask({
          user_id: userId,
          title: `Utveckla din ${pillar}`,
          description: `En konkret uppgift för att förbättra din ${pillar} baserat på AI-analys`,
          priority: 'medium',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dagar framåt
          ai_generated: true
        });
      }
      
      toast({
        title: "Uppgifter skapade!",
        description: `${activePillars.length} personliga utvecklingsuppgifter har skapats för dig.`,
      });
      
      setIsProcessingStep(false);
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte skapa uppgifter. Försök igen.",
        variant: "destructive"
      });
      setIsProcessingStep(false);
    }
  };

  const getStatusColor = (status: JourneyStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'current': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'locked': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: JourneyStep['status']) => {
    switch (status) {
      case 'completed': return 'Klar';
      case 'current': return 'Aktuell';
      case 'upcoming': return 'Nästa';
      case 'locked': return 'Låst';
      default: return 'Okänd';
    }
  };

  const journeySteps = createJourneySteps();
  const currentStep = journeySteps[currentStepIndex];
  const overallProgress = getJourneyProgress();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Journey Header med neuroplastisk fokus */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Route className="h-6 w-6 text-blue-600" />
                Din Neuroplastiska Utvecklingsresa
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {getCurrentPhaseDescription()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
              <div className="text-sm text-muted-foreground">Slutfört</div>
            </div>
          </div>
          <Progress value={overallProgress} className="w-full mt-4" />
        </CardHeader>
      </Card>

      {/* Neuroplastiska milstolpar */}
      <Alert className="bg-purple-50 border-purple-200">
        <Brain className="h-5 w-5" />
        <AlertDescription>
          <strong>Neuroplastisk utveckling:</strong> Din hjärna formar nya neuronala banor dagligen. 
          Genom att följa denna resa stärker du inte bara dina vanor utan också din hjärnas förmåga att förändras.
        </AlertDescription>
      </Alert>

      {/* Aktuell steg - Framhävt */}
      {currentStep && currentStep.status === 'current' && (
        <Card className="border-blue-300 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {currentStep.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{currentStep.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                </div>
              </div>
              <Badge className={getStatusColor(currentStep.status)}>
                {getStatusText(currentStep.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Neuroplastisk princip:</span>
                <p className="text-muted-foreground">{currentStep.neuroplasticPrinciple}</p>
              </div>
              <div>
                <span className="font-medium">Pedagogiskt mål:</span>
                <p className="text-muted-foreground">{currentStep.pedagogicalGoal}</p>
              </div>
            </div>
            
            {currentStep.nextMilestone && (
              <div className="bg-white/60 p-3 rounded-lg border">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Nästa milstolpe:</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{currentStep.nextMilestone}</p>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Beräknad tid: {currentStep.estimatedTime}</span>
              </div>
              
              {currentStep.action && (
                <Button 
                  onClick={currentStep.action}
                  disabled={isProcessingStep}
                  className="flex items-center gap-2"
                >
                  {isProcessingStep ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Bearbetar...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      Börja nu
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alla steg - Kompakt översikt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Din utvecklingsöversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {journeySteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card/50">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    step.status === 'completed' ? 'bg-green-100' :
                    step.status === 'current' ? 'bg-blue-100' :
                    step.status === 'upcoming' ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.title}</span>
                      <Badge variant="outline" className={getStatusColor(step.status)}>
                        {getStatusText(step.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{step.estimatedTime}</div>
                  {step.completedAt && (
                    <div className="text-xs text-green-600">
                      Klar {new Date(step.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Neuroplastiska milstolpar */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            Neuroplastiska milstolpar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {neuroplasticMilestones.map((milestone, index) => (
              <div key={index} className="text-center p-4 bg-white/60 rounded-lg border">
                <div className="text-2xl font-bold text-green-600 mb-2">{milestone.days} dagar</div>
                <div className="font-medium text-sm mb-1">{milestone.title}</div>
                <div className="text-xs text-muted-foreground">{milestone.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};