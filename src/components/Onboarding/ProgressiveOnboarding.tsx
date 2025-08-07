/**
 * 🎓 PROGRESSIVE ONBOARDING SYSTEM
 * Interactive tutorials and achievement-based progression
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, Circle, ArrowRight, ArrowLeft, 
  Trophy, Target, Users, Brain, Award,
  Sparkles, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: React.ComponentType<{ className?: string }>;
  targetElement?: string;
  roles: string[];
  priority: number;
  estimatedTime: string;
  completed?: boolean;
}

/**
 * 🗺️ ROLE-BASED ONBOARDING FLOWS
 * Customized onboarding steps for each user role
 */
const onboardingSteps: OnboardingStep[] = [
  // Client Onboarding
  {
    id: 'welcome-client',
    title: 'Välkommen till din utvecklingsresa!',
    description: 'Lär dig grunderna i din personliga coachingplattform och hur du maximerar din utveckling.',
    action: 'Utforska Dashboard',
    icon: Target,
    roles: ['client'],
    priority: 1,
    estimatedTime: '2 min'
  },
  {
    id: 'first-assessment',
    title: 'Genomför din första utvärdering',
    description: 'Skapa din baslinjevärdering för att få personliga rekommendationer och insikter.',
    action: 'Starta Utvärdering',
    icon: CheckCircle,
    targetElement: '[data-onboarding="assessments"]',
    roles: ['client'],
    priority: 2,
    estimatedTime: '15 min'
  },
  {
    id: 'meet-stefan',
    title: 'Träffa Stefan AI - Din personliga coach',
    description: 'Lär dig hur Stefan AI kan hjälpa dig med personliga råd och utvecklingsstrategier.',
    action: 'Chatta med Stefan',
    icon: Brain,
    targetElement: '[data-onboarding="stefan-chat"]',
    roles: ['client'],
    priority: 3,
    estimatedTime: '5 min'
  },
  
  // Coach Onboarding
  {
    id: 'welcome-coach',
    title: 'Välkommen som coach!',
    description: 'Upptäck kraftfulla verktyg för att stötta dina klienter och maximera deras utveckling.',
    action: 'Utforska Coachingverktyg',
    icon: Users,
    roles: ['coach'],
    priority: 1,
    estimatedTime: '3 min'
  },
  {
    id: 'add-first-client',
    title: 'Lägg till din första klient',
    description: 'Lär dig att hantera klientportföljen och skapa meningsfulla coachingrelationer.',
    action: 'Lägg till Klient',
    icon: Users,
    targetElement: '[data-onboarding="add-client"]',
    roles: ['coach'],
    priority: 2,
    estimatedTime: '5 min'
  },
  {
    id: 'intelligence-insights',
    title: 'Klient Intelligence Dashboard',
    description: 'Upptäck djupa insikter om dina klienter och optimera din coachingstrategi.',
    action: 'Utforska Insights',
    icon: Brain,
    targetElement: '[data-onboarding="intelligence"]',
    roles: ['coach'],
    priority: 3,
    estimatedTime: '10 min'
  },
  
  // Admin Onboarding
  {
    id: 'welcome-admin',
    title: 'Administratörspanel',
    description: 'Hantera användare, system och få överblick över plattformens prestanda.',
    action: 'Utforska Administration',
    icon: Award,
    roles: ['admin', 'superadmin'],
    priority: 1,
    estimatedTime: '5 min'
  },
  {
    id: 'system-overview',
    title: 'Systemöversikt och Analytics',
    description: 'Förstå systemhälsa, användaraktivitet och optimeringsmöjligheter.',
    action: 'Se Analytics',
    icon: Trophy,
    targetElement: '[data-onboarding="analytics"]',
    roles: ['admin', 'superadmin'],
    priority: 2,
    estimatedTime: '8 min'
  }
];

/**
 * 🎯 ONBOARDING MANAGER HOOK
 * Manages onboarding state and progression
 */
const useOnboardingProgress = (userRoles: string[]) => {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  
  // Filter steps based on user roles
  const availableSteps = onboardingSteps
    .filter(step => step.roles.some(role => userRoles.includes(role)))
    .sort((a, b) => a.priority - b.priority);
    
  const totalSteps = availableSteps.length;
  const completionPercentage = (completedSteps.size / totalSteps) * 100;
  const currentStep = availableSteps[currentStepIndex];
  
  // Load completed steps from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('onboarding-progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedSteps(new Set(parsed));
      } catch (error) {
        console.warn('Failed to parse saved onboarding progress');
      }
    }
  }, []);
  
  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('onboarding-progress', JSON.stringify([...completedSteps]));
  }, [completedSteps]);
  
  const completeStep = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    
    // Auto-advance to next step
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < availableSteps.length) {
      setCurrentStepIndex(nextIndex);
    } else {
      setIsOnboardingActive(false);
    }
  };
  
  const startOnboarding = () => {
    setIsOnboardingActive(true);
    setCurrentStepIndex(0);
  };
  
  const skipOnboarding = () => {
    setIsOnboardingActive(false);
    // Mark all steps as completed
    setCompletedSteps(new Set(availableSteps.map(step => step.id)));
  };
  
  return {
    availableSteps,
    completedSteps,
    currentStep,
    currentStepIndex,
    totalSteps,
    completionPercentage,
    isOnboardingActive,
    completeStep,
    startOnboarding,
    skipOnboarding,
    setCurrentStepIndex
  };
};

export const ProgressiveOnboarding: React.FC = () => {
  const { user } = useAuth();
  const userRoles = user?.user_metadata?.roles || ['client'];
  
  const {
    availableSteps,
    completedSteps,
    currentStep,
    currentStepIndex,
    totalSteps,
    completionPercentage,
    isOnboardingActive,
    completeStep,
    startOnboarding,
    skipOnboarding,
    setCurrentStepIndex
  } = useOnboardingProgress(userRoles);

  // Auto-start onboarding for new users
  useEffect(() => {
    if (completedSteps.size === 0 && availableSteps.length > 0) {
      startOnboarding();
    }
  }, [availableSteps.length, completedSteps.size]);

  const handleStepAction = () => {
    if (currentStep) {
      completeStep(currentStep.id);
      
      // Navigate to target element or route
      if (currentStep.targetElement) {
        const element = document.querySelector(currentStep.targetElement);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('onboarding-highlight');
          setTimeout(() => {
            element.classList.remove('onboarding-highlight');
          }, 3000);
        }
      }
    }
  };

  const navigateStep = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else if (direction === 'prev' && currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (!isOnboardingActive || !currentStep) {
    return null;
  }

  const IconComponent = currentStep.icon;

  return (
    <Dialog open={isOnboardingActive} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                {currentStep.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Steg {currentStepIndex + 1} av {totalSteps}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {currentStep.estimatedTime}
                </Badge>
              </div>
            </div>
          </div>
          
          <Progress value={(currentStepIndex / totalSteps) * 100} className="h-2" />
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            {currentStep.description}
          </p>
          
          {/* Achievement Preview */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Slutför detta steg för att låsa upp:
              </span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3" />
                Personliga rekommendationer
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3" />
                Avancerade insights
              </li>
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateStep('prev')}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Föregående
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={skipOnboarding}
                className="text-muted-foreground"
              >
                Hoppa över
              </Button>
              
              <Button onClick={handleStepAction} className="gap-2">
                {currentStep.action}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * 🏆 ONBOARDING PROGRESS INDICATOR
 * Shows completion status in the UI
 */
export const OnboardingProgressIndicator: React.FC = () => {
  const { user } = useAuth();
  const userRoles = user?.user_metadata?.roles || ['client'];
  
  const { completionPercentage, startOnboarding } = useOnboardingProgress(userRoles);
  
  if (completionPercentage === 100) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Trophy className="h-4 w-4" />
        <span>Onboarding slutfört!</span>
      </div>
    );
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startOnboarding}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Circle className="h-4 w-4" />
      <span>Slutför onboarding ({Math.round(completionPercentage)}%)</span>
    </Button>
  );
};

export default ProgressiveOnboarding;