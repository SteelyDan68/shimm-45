import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UniversalAssessmentForm } from '@/components/UniversalAssessment/UniversalAssessmentForm';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, User, Target, Brain } from 'lucide-react';

type OnboardingStep = 'welcome' | 'basic_info' | 'deep_assessment' | 'profile_creation' | 'complete';

interface EnhancedOnboardingFlowProps {
  onComplete: () => void;
}

export const EnhancedOnboardingFlow: React.FC<EnhancedOnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const { user } = useAuth();
  const { saveOnboardingData } = useOnboarding();
  const { toast } = useToast();

  const steps = [
    { id: 'welcome', title: 'Välkommen', icon: User },
    { id: 'basic_info', title: 'Grundinfo', icon: User },
    { id: 'deep_assessment', title: 'Djupanalys', icon: Brain },
    { id: 'profile_creation', title: 'Profilskapande', icon: Target },
    { id: 'complete', title: 'Klar', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleAssessmentComplete = (result: any) => {
    setAssessmentResult(result);
    setCurrentStep('profile_creation');
  };

  const handleProfileCreation = async () => {
    if (!user || !assessmentResult) return;

    try {
      // Create enhanced profile based on assessment
      const profileData = {
        generalInfo: {
          name: user.email || 'Användare',
          age: '',
          gender: '',
          height: '',
          weight: '',
          physicalLimitations: '',
          neurodiversity: ''
        },
        publicRole: {
          primaryRole: extractRoleFromAssessment(assessmentResult),
          secondaryRole: '',
          niche: extractDescriptionFromAssessment(assessmentResult),
          creativeStrengths: '',
          platforms: [],
          challenges: assessmentResult.answers?.main_challenge || '',
          instagramHandle: '',
          youtubeHandle: '',
          tiktokHandle: '',
          snapchatHandle: '',
          facebookHandle: '',
          twitterHandle: ''
        },
        lifeMap: {
          location: '',
          livingWith: '',
          hasChildren: '',
          ongoingChanges: assessmentResult.answers?.primary_goal || '',
          pastCrises: ''
        },
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString()
      };

      const result = await saveOnboardingData(user.id, profileData);
      
      if (result.success) {
        setCurrentStep('complete');
        toast({
          title: "Profil skapad!",
          description: "Din personliga utvecklingsprofil är nu klar. Stefan kommer att skapa din första utvecklingsplan.",
        });
        setTimeout(onComplete, 2000);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa din profil. Försök igen.",
        variant: "destructive"
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Välkommen till din utvecklingsresa!</CardTitle>
              <CardDescription>
                Vi kommer att skapa en personlig utvecklingsprofil baserad på våra fem universella pelare:
                Self Care, Skills, Talent, Brand och Economy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-self-care/10 border border-self-care/20">
                  <div className="font-semibold text-self-care">Self Care</div>
                  <div className="text-xs text-muted-foreground mt-1">Hälsa & balans</div>
                </div>
                <div className="p-3 rounded-lg bg-skills/10 border border-skills/20">
                  <div className="font-semibold text-skills">Skills</div>
                  <div className="text-xs text-muted-foreground mt-1">Kompetenser</div>
                </div>
                <div className="p-3 rounded-lg bg-talent/10 border border-talent/20">
                  <div className="font-semibold text-talent">Talent</div>
                  <div className="text-xs text-muted-foreground mt-1">Naturliga gåvor</div>
                </div>
                <div className="p-3 rounded-lg bg-brand/10 border border-brand/20">
                  <div className="font-semibold text-brand">Brand</div>
                  <div className="text-xs text-muted-foreground mt-1">Hur du uppfattas</div>
                </div>
                <div className="p-3 rounded-lg bg-economy/10 border border-economy/20">
                  <div className="font-semibold text-economy">Economy</div>
                  <div className="text-xs text-muted-foreground mt-1">Ekonomisk stabilitet</div>
                </div>
              </div>
              
              <div className="space-y-3 text-left">
                <h3 className="font-semibold">Vad händer nu?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Vi ställer några djupa frågor om din situation och mål</li>
                  <li>• Stefan (vår AI-coach) analyserar dina svar</li>
                  <li>• Du får en personlig utvecklingsplan baserad på neuroplasticitetsprinciper</li>
                  <li>• Vi börjar din resa mot förändring genom små, konsekventa steg</li>
                </ul>
              </div>

              <Button onClick={() => setCurrentStep('deep_assessment')} className="w-full">
                Börja min utvecklingsresa
              </Button>
            </CardContent>
          </Card>
        );

      case 'deep_assessment':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Djup personlighetsbedömning</CardTitle>
                <CardDescription>
                  Stefan kommer att analysera dina svar och skapa en personlig utvecklingsprofil.
                  Var ärlig och specifik - ju mer information du ger, desto bättre blir din plan.
                </CardDescription>
              </CardHeader>
            </Card>
            
            {user && (
              <UniversalAssessmentForm
                clientId={user.id}
                context="onboarding"
                onComplete={handleAssessmentComplete}
                targetAudience="universal"
              />
            )}
          </div>
        );

      case 'profile_creation':
        return (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Skapar din utvecklingsprofil</CardTitle>
              <CardDescription>
                Baserat på din bedömning skapar vi nu din personliga utvecklingsprofil
                och första utvecklingsplan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {assessmentResult && (
                <div className="space-y-4">
                  <div className="text-left">
                    <h3 className="font-semibold mb-2">Din analys:</h3>
                    <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-line">
                      {assessmentResult.analysis}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 text-sm">
                    {Object.entries(assessmentResult.scores.pillar_scores).map(([pillar, score]) => (
                      <div key={pillar} className="text-center">
                        <div className="font-semibold capitalize">{pillar.replace('_', ' ')}</div>
                        <div className="text-2xl font-bold text-primary">{(score as number).toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">av 10</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button onClick={handleProfileCreation} className="w-full">
                Skapa min utvecklingsprofil
              </Button>
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl text-green-600">Välkommen ombord!</CardTitle>
              <CardDescription>
                Din utvecklingsprofil är skapad. Stefan kommer nu att börja coacha dig genom
                personaliserade insights och utvecklingsplaner.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Du kommer att få din första utvecklingsplan inom kort.
                Börja utforska din dashboard för att se dina framsteg!
              </p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold">Utvecklingsprofilskapande</h1>
              <span className="text-sm text-muted-foreground">
                Steg {currentStepIndex + 1} av {steps.length}
              </span>
            </div>
            <Progress value={progress} className="w-full" />
            
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isComplete = index < currentStepIndex;
                
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center space-y-2 ${
                      isActive ? 'text-primary' : isComplete ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      isActive ? 'bg-primary text-primary-foreground' : 
                      isComplete ? 'bg-green-600 text-white' : 
                      'bg-muted'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-center">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {renderStep()}
    </div>
  );
};

// Helper functions to extract data from assessment
function extractRoleFromAssessment(result: any): string {
  return result.answers?.primary_role || 'Utvecklingsresenär';
}

function extractDescriptionFromAssessment(result: any): string {
  return result.answers?.main_challenge || 'Fokuserar på personlig utveckling';
}

function extractSituationFromAssessment(result: any): string {
  return result.answers?.primary_role + ' som arbetar med ' + (result.answers?.main_challenge || 'personlig utveckling');
}

function extractGoalsFromAssessment(result: any): string[] {
  const goals = result.answers?.primary_goal || '';
  return goals ? [goals] : ['Utveckla mig inom alla fem pelare'];
}

function extractChallengesFromAssessment(result: any): string[] {
  const challenge = result.answers?.main_challenge || '';
  return challenge ? [challenge] : ['Hitta balans och utveckling'];
}