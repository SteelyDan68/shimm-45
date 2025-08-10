/**
 * 🎯 GUIDED ASSESSMENT FLOW - SIMPLIFIED CLIENT PATH
 * En tydlig, guidande väg från intention till assessment
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Target, 
  ArrowRight, 
  Clock, 
  CheckCircle,
  Heart, 
  Lightbulb, 
  Star, 
  Palette, 
  DollarSign,
  Route,
  Sparkles,
  Info
} from 'lucide-react';
import { generatePillarRecommendations, getRecommendationSummary, type RecommendationResult } from '@/utils/pillarRecommendations';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useWelcomeAssessment } from '@/hooks/useWelcomeAssessment';
import { IntentDiscovery, IntentData } from '@/components/Assessment/IntentDiscovery';
import { PillarEducation } from '@/components/Assessment/PillarEducation';
import type { OnboardingData } from '@/types/onboarding';

type FlowStep = 'welcome' | 'intent' | 'education' | 'recommendations' | 'select' | 'ready';

interface AssessmentOption {
  pillar: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

const PILLAR_OPTIONS: Record<string, Omit<AssessmentOption, 'priority' | 'reason'>> = {
  'self-care': {
    pillar: 'self-care',
    name: 'Self Care',
    icon: Heart,
    color: 'hsl(var(--self-care))',
    description: 'Din fysiska och mentala hälsa, energi och balans',
    estimatedTime: '8-12 min'
  },
  'skills': {
    pillar: 'skills', 
    name: 'Skills',
    icon: Lightbulb,
    color: 'hsl(var(--skills))',
    description: 'Dina kompetenser, färdigheter och kunskapsutveckling',
    estimatedTime: '10-15 min'
  },
  'talent': {
    pillar: 'talent',
    name: 'Talent', 
    icon: Star,
    color: 'hsl(var(--talent))',
    description: 'Dina naturliga styrkor och unika begåvningar',
    estimatedTime: '8-12 min'
  },
  'brand': {
    pillar: 'brand',
    name: 'Brand',
    icon: Palette, 
    color: 'hsl(var(--brand))',
    description: 'Din personliga varumärkesbyggnad och synlighet',
    estimatedTime: '10-15 min'
  },
  'economy': {
    pillar: 'economy',
    name: 'Economy',
    icon: DollarSign,
    color: 'hsl(var(--economy))', 
    description: 'Din ekonomiska utveckling och värdeskapande',
    estimatedTime: '8-12 min'
  },
  'open-track': {
    pillar: 'open-track',
    name: 'Open Track',
    icon: Route,
    color: 'hsl(var(--primary))',
    description: 'Din personliga utvecklingsresa med fria mål',
    estimatedTime: '12-18 min'
  }
};

export const GuidedAssessmentFlow: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getOnboardingData } = useOnboarding();
  const { hasCompletedWelcomeAssessment } = useWelcomeAssessment();
  
  const [currentStep, setCurrentStep] = useState<FlowStep>('welcome');
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isFirstAssessment, setIsFirstAssessment] = useState<boolean>(true);
  const [intentData, setIntentData] = useState<IntentData | null>(null);
  
  // Check if we should auto-start with specific pillar
  useEffect(() => {
    const pillarParam = searchParams.get('pillar');
    if (pillarParam) {
      setSelectedPillar(pillarParam);
      setCurrentStep('ready');
    }
  }, [searchParams]);

  // Load onboarding data and check assessment status
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user) return;
      
      try {
        // Check if user has completed any assessments
        const hasCompleted = await hasCompletedWelcomeAssessment();
        setIsFirstAssessment(!hasCompleted);
        
        const data = await getOnboardingData(user.id);
        setOnboardingData(data);
        
        if (data) {
          const recs = generatePillarRecommendations(data);
          setRecommendations(recs);
        }
      } catch (error) {
        console.error('Error loading onboarding data:', error);
      }
    };
    
    loadRecommendations();
  }, [user, getOnboardingData, hasCompletedWelcomeAssessment]);

  const generateAssessmentOptions = (): AssessmentOption[] => {
    if (!recommendations) {
      // Fallback to all pillars with medium priority
      return Object.values(PILLAR_OPTIONS).map(option => ({
        ...option,
        priority: 'medium' as const,
        reason: 'Grundläggande utvecklingsområde'
      }));
    }

    return recommendations.recommendations.map(rec => {
      const baseOption = PILLAR_OPTIONS[rec.pillar];
      return {
        ...baseOption,
        priority: rec.priority,
        reason: rec.reason
      };
    });
  };

  const handleStartAssessment = () => {
    if (selectedPillar) {
      // Navigate to the specific pillar assessment
      navigate(`/six-pillars/${selectedPillar}`);
    }
  };

  const renderWelcomeStep = () => (
    <Card className="max-w-2xl mx-auto text-center">
      <CardHeader>
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Dags för din självskattning!</CardTitle>
        <CardDescription className="text-base">
          Stefan hjälper dig hitta rätt självskattning baserat på dina mål och behov
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-900">Stefan säger:</h3>
          </div>
          <p className="text-blue-800 text-left">
            {isFirstAssessment ? (
              `"Hej! Välkommen till din utvecklingsresa! Jag är Stefan, din AI-coach. 
               Baserat på ditt onboarding kan jag föreslå vilken självskattning som passar dig bäst som start. 
               Varje självskattning tar 8-15 minuter och ger dig personliga insikter samt en handlingsplan."`
            ) : (
               `"Hej igen! Jag har analyserat dina tidigare självskattningar och kan rekommendera 
               vilka områden som skulle vara bra att utforska härnäst. Varje självskattning bygger 
               på det vi redan vet om dig och ger dig djupare insikter."`
            )}
          </p>
        </div>

         <div className="space-y-4">
           <h3 className="font-semibold">Vad händer efter din självskattning?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="font-medium">1. Formaterat resultat</span>
              <span className="text-muted-foreground text-center">
                Du får dina svar presenterade som en snygg rapport
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-blue-100 rounded-full">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <span className="font-medium">2. Stefan AI-analys</span>
              <span className="text-muted-foreground text-center">
                Personlig analys av dina styrkor och utvecklingsområden
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <span className="font-medium">3. Ditt program</span>
              <span className="text-muted-foreground text-center">
                Konkreta steg och aktiviteter för din utveckling
              </span>
            </div>
          </div>
        </div>

        <Button 
          size="lg" 
          className="w-full" 
           onClick={() => setCurrentStep(isFirstAssessment ? 'intent' : 'recommendations')}
         >
           {isFirstAssessment ? 'Berätta om dina mål' : 'Se Stefans rekommendationer'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderRecommendationsStep = () => {
    const assessmentOptions = generateAssessmentOptions();
    const highPriority = assessmentOptions.filter(a => a.priority === 'high');
    const others = assessmentOptions.filter(a => a.priority !== 'high');

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Stefans Rekommendationer
            </CardTitle>
            <CardDescription>
              {recommendations ? getRecommendationSummary(recommendations) : 
               'Här är självskattningar som passar dina mål bäst'}
            </CardDescription>
          </CardHeader>
        </Card>

        {highPriority.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600">
                Rekommenderade för dig
              </Badge>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {highPriority.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Card 
                    key={option.pillar}
                    className={`cursor-pointer border-2 transition-all duration-300 hover:shadow-lg ${
                      selectedPillar === option.pillar 
                        ? 'border-primary shadow-lg scale-105' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPillar(option.pillar)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-3 rounded-lg"
                          style={{ 
                            backgroundColor: `${option.color}15`,
                            color: option.color 
                          }}
                        >
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{option.name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {option.estimatedTime}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        <p className="text-xs text-green-800">
                          <strong>Stefan rekommenderar:</strong> {option.reason}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div className="space-y-4">
            <Badge variant="secondary">Andra självskattningar</Badge>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {others.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Card 
                    key={option.pillar}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                      selectedPillar === option.pillar 
                        ? 'border-primary shadow-lg' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPillar(option.pillar)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ 
                            backgroundColor: `${option.color}15`,
                            color: option.color 
                          }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-base">{option.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        {option.estimatedTime}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-center pt-6">
          <Button 
            size="lg" 
            disabled={!selectedPillar}
            onClick={() => setCurrentStep('ready')}
            className="px-8"
          >
            {selectedPillar ? `Fortsätt med ${PILLAR_OPTIONS[selectedPillar]?.name}` : 'Välj en självskattning'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderReadyStep = () => {
    if (!selectedPillar) return null;
    
    const option = PILLAR_OPTIONS[selectedPillar];
    const IconComponent = option.icon;

    return (
      <Card className="max-w-2xl mx-auto text-center">
        <CardHeader>
          <div 
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ 
              backgroundColor: `${option.color}15`,
              color: option.color 
            }}
          >
            <IconComponent className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl">Redo för {option.name} Självskattning</CardTitle>
          <CardDescription className="text-base">
            {option.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-900">Stefan säger:</h3>
            </div>
            <p className="text-blue-800 text-left">
              "Perfekt val! Denna assessment kommer hjälpa mig förstå dig bättre inom {option.name.toLowerCase()}. 
              Svara så ärligt som möjligt - det finns inga rätt eller fel svar. 
              Jag kommer analysera dina svar och skapa en personlig utvecklingsplan för dig."
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{option.estimatedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span>AI-analys inkluderad</span>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full"
            onClick={handleStartAssessment}
          >
            Starta {option.name} Självskattning
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('recommendations')}
          >
            Välj en annan självskattning
          </Button>
        </CardContent>
      </Card>
    );
  };

  const handleIntentComplete = (data: IntentData) => {
    setIntentData(data);
    setCurrentStep('education');
  };

  const handlePillarEducationSelect = (pillarKey: string) => {
    setSelectedPillar(pillarKey);
    setCurrentStep('ready');
  };

  const renderProgress = () => {
    const steps = isFirstAssessment 
      ? ['welcome', 'intent', 'education', 'ready']
      : ['welcome', 'recommendations', 'ready'];
    const currentIndex = steps.indexOf(currentStep);
    const progress = ((currentIndex + 1) / steps.length) * 100;

    return (
      <div className="max-w-md mx-auto mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Steg {currentIndex + 1} av {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {renderProgress()}
      
      {currentStep === 'welcome' && renderWelcomeStep()}
      {currentStep === 'intent' && (
        <IntentDiscovery 
          onComplete={handleIntentComplete}
          onSkip={() => setCurrentStep('education')}
        />
      )}
      {currentStep === 'education' && intentData && (
        <PillarEducation 
          intentData={intentData}
          onPillarSelect={handlePillarEducationSelect}
          onBack={() => setCurrentStep('intent')}
        />
      )}
      {currentStep === 'recommendations' && renderRecommendationsStep()}
      {currentStep === 'ready' && renderReadyStep()}
    </div>
  );
};