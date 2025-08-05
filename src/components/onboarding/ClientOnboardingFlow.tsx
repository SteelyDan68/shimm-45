/**
 * 🎯 CLIENT ONBOARDING FLOW SYSTEM
 * SCRUM-TEAM STRUCTURED ONBOARDING PROCESS
 */
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Target, 
  Calendar,
  FileText,
  Sparkles,
  Trophy
} from 'lucide-react';
import { logger } from '@/utils/productionLogger';
import { useLoadingState } from '@/hooks/useLoadingState';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
  completed: boolean;
  validation?: (data: any) => string | null;
}

export interface OnboardingData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    preferredContact: 'email' | 'phone' | 'both';
  };
  goals: {
    primaryGoal: string;
    timeline: string;
    specificChallenges: string;
    successMetrics: string;
  };
  preferences: {
    sessionFrequency: 'weekly' | 'biweekly' | 'monthly';
    sessionDuration: '30' | '45' | '60';
    communicationStyle: 'direct' | 'supportive' | 'collaborative';
    focusAreas: string[];
  };
  background: {
    experience: string;
    previousCoaching: boolean;
    currentSituation: string;
    motivation: string;
  };
}

export interface ClientOnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onCancel?: () => void;
  initialData?: Partial<OnboardingData>;
}

/**
 * Step Component for Individual Onboarding Steps
 */
const OnboardingStepComponent: React.FC<{
  step: OnboardingStep;
  data: OnboardingData;
  onDataChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  isLoading: boolean;
}> = ({
  step,
  data,
  onDataChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  isLoading
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNext = () => {
    if (step.validation) {
      const error = step.validation(data);
      if (error) {
        setValidationError(error);
        return;
      }
    }
    setValidationError(null);
    onNext();
  };

  const updatePersonalInfo = (field: string, value: string) => {
    onDataChange({
      personalInfo: { ...data.personalInfo, [field]: value }
    });
  };

  const updateGoals = (field: string, value: string) => {
    onDataChange({
      goals: { ...data.goals, [field]: value }
    });
  };

  const updatePreferences = (field: string, value: any) => {
    onDataChange({
      preferences: { ...data.preferences, [field]: value }
    });
  };

  const updateBackground = (field: string, value: any) => {
    onDataChange({
      background: { ...data.background, [field]: value }
    });
  };

  const renderStepContent = () => {
    switch (step.id) {
      case 'personal_info':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={data.personalInfo.name}
                onChange={(e) => updatePersonalInfo('name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={data.personalInfo.email}
                onChange={(e) => updatePersonalInfo('email', e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={data.personalInfo.phone}
                onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        );

      case 'goals_assessment':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primaryGoal">Primary Goal *</Label>
              <Textarea
                id="primaryGoal"
                value={data.goals.primaryGoal}
                onChange={(e) => updateGoals('primaryGoal', e.target.value)}
                placeholder="What is your main objective for coaching?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline *</Label>
              <Input
                id="timeline"
                value={data.goals.timeline}
                onChange={(e) => updateGoals('timeline', e.target.value)}
                placeholder="When do you want to achieve this goal?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenges">Current Challenges</Label>
              <Textarea
                id="challenges"
                value={data.goals.specificChallenges}
                onChange={(e) => updateGoals('specificChallenges', e.target.value)}
                placeholder="What obstacles are you currently facing?"
                rows={3}
              />
            </div>
          </div>
        );

      case 'preferences_setup':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Session Frequency</Label>
              <div className="flex gap-2">
                {['weekly', 'biweekly', 'monthly'].map((freq) => (
                  <Button
                    key={freq}
                    variant={data.preferences.sessionFrequency === freq ? 'default' : 'outline'}
                    onClick={() => updatePreferences('sessionFrequency', freq)}
                    className="capitalize"
                  >
                    {freq}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Session Duration (minutes)</Label>
              <div className="flex gap-2">
                {['30', '45', '60'].map((duration) => (
                  <Button
                    key={duration}
                    variant={data.preferences.sessionDuration === duration ? 'default' : 'outline'}
                    onClick={() => updatePreferences('sessionDuration', duration)}
                  >
                    {duration} min
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Communication Style</Label>
              <div className="flex gap-2">
                {['direct', 'supportive', 'collaborative'].map((style) => (
                  <Button
                    key={style}
                    variant={data.preferences.communicationStyle === style ? 'default' : 'outline'}
                    onClick={() => updatePreferences('communicationStyle', style)}
                    className="capitalize"
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'background_context':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="experience">Relevant Experience</Label>
              <Textarea
                id="experience"
                value={data.background.experience}
                onChange={(e) => updateBackground('experience', e.target.value)}
                placeholder="Tell us about your relevant background and experience"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentSituation">Current Situation</Label>
              <Textarea
                id="currentSituation"
                value={data.background.currentSituation}
                onChange={(e) => updateBackground('currentSituation', e.target.value)}
                placeholder="Describe your current situation and context"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivation">What Motivates You?</Label>
              <Textarea
                id="motivation"
                value={data.background.motivation}
                onChange={(e) => updateBackground('motivation', e.target.value)}
                placeholder="What drives you to seek coaching?"
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return <div>Step content not found</div>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <step.icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>{step.title}</CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStepContent()}

        {validationError && (
          <Alert variant="destructive">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirst || isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isLoading}
          >
            {isLast ? (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Complete Setup
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Client Onboarding Flow Component
 */
export const ClientOnboardingFlow: React.FC<ClientOnboardingFlowProps> = ({
  onComplete,
  onCancel,
  initialData
}) => {
  const { isLoading, startLoading, completeLoading } = useLoadingState();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      preferredContact: 'email'
    },
    goals: {
      primaryGoal: '',
      timeline: '',
      specificChallenges: '',
      successMetrics: ''
    },
    preferences: {
      sessionFrequency: 'weekly',
      sessionDuration: '45',
      communicationStyle: 'collaborative',
      focusAreas: []
    },
    background: {
      experience: '',
      previousCoaching: false,
      currentSituation: '',
      motivation: ''
    },
    ...initialData
  });

  const steps: OnboardingStep[] = [
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Tell us about yourself',
      icon: User,
      required: true,
      completed: false,
      validation: (data) => {
        if (!data.personalInfo.name.trim()) return 'Name is required';
        if (!data.personalInfo.email.trim()) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(data.personalInfo.email)) return 'Valid email is required';
        return null;
      }
    },
    {
      id: 'goals_assessment',
      title: 'Goals & Objectives',
      description: 'Define what you want to achieve',
      icon: Target,
      required: true,
      completed: false,
      validation: (data) => {
        if (!data.goals.primaryGoal.trim()) return 'Primary goal is required';
        if (!data.goals.timeline.trim()) return 'Timeline is required';
        return null;
      }
    },
    {
      id: 'preferences_setup',
      title: 'Session Preferences',
      description: 'Customize your coaching experience',
      icon: Calendar,
      required: true,
      completed: false
    },
    {
      id: 'background_context',
      title: 'Background & Context',
      description: 'Help us understand your journey',
      icon: FileText,
      required: false,
      completed: false
    }
  ];

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleDataChange = useCallback((newData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({
      ...prev,
      ...newData
    }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      logger.info('Onboarding step completed', { 
        step: currentStep.id,
        stepIndex: currentStepIndex 
      });
    } else {
      // Complete onboarding
      startLoading('Completing setup...');
      
      setTimeout(() => {
        completeLoading();
        onComplete(onboardingData);
        logger.info('Client onboarding completed', { onboardingData });
      }, 1500);
    }
  }, [currentStepIndex, steps.length, currentStep, onboardingData, onComplete, startLoading, completeLoading]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Welcome to Your Coaching Journey</h1>
          </div>
          <p className="text-muted-foreground">
            Let's get you set up for success. This will take about 5 minutes.
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step indicators */}
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex flex-col items-center"
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index <= currentStepIndex 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {index < currentStepIndex ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs mt-1 text-center max-w-[80px]">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Step */}
        <OnboardingStepComponent
          step={currentStep}
          data={onboardingData}
          onDataChange={handleDataChange}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirst={currentStepIndex === 0}
          isLast={currentStepIndex === steps.length - 1}
          isLoading={isLoading}
        />

        {/* Cancel Option */}
        {onCancel && (
          <div className="text-center mt-6">
            <Button variant="ghost" onClick={onCancel}>
              Cancel Setup
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};