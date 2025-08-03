/**
 * ENHANCED WELCOME ASSESSMENT CARD WITH PROPER STATE MANAGEMENT
 * 
 * 🎯 UX Expert: Clear state transitions med tydliga användarsignaler
 * 🎨 UI Expert: Visuell representation av alla assessment states
 * 📊 Data Scientist: Robust state tracking och återhämtning
 * 🏗️ Solution Architect: Integration med centraliserat state system
 * 
 * WORLD-CLASS EXECUTION: Hanterar ALLA assessment states korrekt
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ActionPrompt } from '@/components/ui/action-prompt';
import { WelcomeAssessmentForm } from '@/components/WelcomeAssessment/WelcomeAssessmentForm';
import { useAssessmentStateManager, AssessmentStateData } from '@/hooks/useAssessmentStateManager';
import { CheckCircle, Star, RotateCcw, Clock, AlertCircle, Play, RefreshCw } from 'lucide-react';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';

interface WelcomeAssessmentCardProps {
  userId: string;
}

export const WelcomeAssessmentCard = ({ userId }: WelcomeAssessmentCardProps) => {
  const { getAssessmentState, clearDraft, loading } = useAssessmentStateManager();
  const [showForm, setShowForm] = useState(false);
  const [assessmentState, setAssessmentState] = useState<AssessmentStateData | null>(null);

  useEffect(() => {
    const loadState = async () => {
      const state = await getAssessmentState('welcome');
      setAssessmentState(state);
    };
    loadState();
  }, [getAssessmentState]);

  const handleAssessmentComplete = () => {
    setShowForm(false);
    // Reload state to reflect completion
    getAssessmentState('welcome').then(setAssessmentState);
  };

  const handleStartAssessment = () => {
    setShowForm(true);
  };

  const handleResumeAssessment = () => {
    setShowForm(true);
  };

  const handleRestartAssessment = async () => {
    if (assessmentState?.state === 'in_progress' || assessmentState?.state === 'expired') {
      const confirmed = window.confirm(
        'Du har ett påbörjat test. Vill du börja om från början? Dina sparade svar kommer att raderas.'
      );
      if (confirmed) {
        await clearDraft('welcome');
        const newState = await getAssessmentState('welcome');
        setAssessmentState(newState);
        setShowForm(true);
      }
    } else {
      setShowForm(true);
    }
  };

  if (loading || !assessmentState) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showForm) {
    return <WelcomeAssessmentForm onComplete={handleAssessmentComplete} />;
  }

  // COMPLETED STATE - Användaren har slutfört assessmentet
  if (assessmentState.state === 'completed') {
    const completedDate = new Date(assessmentState.completed_at!).toLocaleDateString('sv-SE');
    const daysSince = Math.floor(
      (Date.now() - new Date(assessmentState.completed_at!).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return (
      <Card className="border-success/20 bg-gradient-to-br from-success/10 to-success/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
            <div className="flex-1">
              <h3 className="font-semibold text-success-foreground">Du har gjort din självkoll! ✅</h3>
              <p className="text-success-foreground/80 text-sm">
                Slutförd: {completedDate} ({daysSince} dagar sedan)
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-background/60 border border-primary/20">
              <h4 className="font-medium text-foreground mb-2">🔄 Vill du kolla läget igen?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                <strong>Varför det är smart:</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                <li>📈 Se hur du har utvecklats sedan sist</li>
                <li>🎯 Stefan får bättre koll på vad du behöver nu</li>
                <li>💡 Nya tips baserat på hur du mår just nu</li>
                <li>🚀 Uppdaterad plan för vad du ska satsa på</li>
              </ul>
              
              {daysSince >= 7 && (
                <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400 mb-3">
                  <p className="text-xs text-blue-800">
                    💪 <strong>Perfect timing!</strong> Det har gått {daysSince} dagar - perfekt för att se din utveckling!
                  </p>
                </div>
              )}
              
              <ActionPrompt
                title="🔄 Kolla läget igen!"
                description="Se hur du har utvecklats • Stefan får bättre koll • Nya tips baserat på hur du mår just nu"
                actionText="Ja, kolla läget igen!"
                onClick={handleRestartAssessment}
                icon={<RotateCcw className="h-4 w-4" />}
                variant="default"
                size="sm"
                componentName="WelcomeAssessmentCard"
                className="mb-2"
              />
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {/* Navigate to insights */}}
                className="w-full"
              >
                Se mina resultat 👀
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // IN PROGRESS STATE - Användaren har påbörjat men inte slutfört
  if (assessmentState.state === 'in_progress') {
    const hoursIdle = assessmentState.last_activity_at 
      ? Math.floor((Date.now() - new Date(assessmentState.last_activity_at).getTime()) / (1000 * 60 * 60))
      : 0;

    return (
      <Card className="border-warning/20 bg-gradient-to-br from-warning/10 to-warning/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-warning" />
            Du har påbörjat din självkoll
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Framsteg</span>
              <span>{assessmentState.completed_steps}/{assessmentState.total_steps} steg</span>
            </div>
            <Progress value={assessmentState.completion_percentage} className="h-2" />
          </div>

          <div className="bg-background/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              💾 <strong>Dina svar är sparade!</strong> Du kan fortsätta där du slutade.
            </p>
            {hoursIdle > 0 && (
              <p className="text-xs text-muted-foreground">
                Senast aktiv: för {hoursIdle} timmar sedan
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <ActionPrompt
              title="Fortsätt där du slutade"
              description={`Du är ${assessmentState.completion_percentage.toFixed(0)}% klar - bara ${5 - assessmentState.completed_steps} steg kvar!`}
              actionText="Fortsätt testet 🎯"
              onClick={handleResumeAssessment}
              icon={<Play className="h-4 w-4" />}
              variant="default"
              size="default"
              componentName="WelcomeAssessmentCard"
              className="flex-1"
            />
          </div>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRestartAssessment}
            className="w-full text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Börja om från början
          </Button>
        </CardContent>
      </Card>
    );
  }

  // EXPIRED STATE - Draft för gammal
  if (assessmentState.state === 'expired') {
    return (
      <Card className="border-destructive/20 bg-gradient-to-br from-destructive/10 to-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Påbörjat test har gått ut
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground">
            Du påbörjade testet för länge sedan. För bästa resultat börjar vi om från början.
          </p>

          <ActionPrompt
            title="Börja om med fräscha svar"
            description="Ett nytt test ger Stefan bättre koll på hur du mår just nu"
            actionText="Starta om testet 🔄"
            onClick={handleRestartAssessment}
            icon={<RefreshCw className="h-4 w-4" />}
            variant="default"
            size="lg"
            componentName="WelcomeAssessmentCard"
          />
        </CardContent>
      </Card>
    );
  }

  // ERROR STATE
  if (assessmentState.state === 'error') {
    return (
      <Card className="border-destructive/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive">Problem med testet</h3>
              <p className="text-sm text-muted-foreground">Ett tekniskt fel uppstod. Försök igen.</p>
            </div>
          </div>

          <Button onClick={() => window.location.reload()} className="w-full">
            Uppdatera sidan
          </Button>
        </CardContent>
      </Card>
    );
  }

  // NOT STARTED STATE - Default första gången
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-primary" />
          🎯 Upptäck var du står idag
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-foreground text-base leading-relaxed">
          <strong>Här börjar din resa!</strong> Vi hjälper dig förstå var du är nu och vart du vill komma. 
          Det tar bara 15 minuter 🕐
        </p>

        <div className="bg-background/50 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-sm">Bara enkla frågor om ditt liv</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-sm">Stefan ger dig personlig feedback</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-sm">Du får tips för att må bättre</span>
          </div>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg border-l-4 border-primary">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Smart att börja här!</strong> Stefan behöver veta lite om dig för att kunna hjälpa dig bäst.
          </p>
        </div>

        <ActionPrompt
          title="Kolla läget! 📊"
          description="Svara på enkla frågor om ditt liv så förstår vi vad du behöver"
          actionText="Börja nu - det går snabbt! 🚀"
          onClick={handleStartAssessment}
          size="lg"
          componentName="WelcomeAssessmentCard"
        />
      </CardContent>
    </Card>
  );
};