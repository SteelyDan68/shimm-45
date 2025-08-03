import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WelcomeAssessmentForm } from '@/components/WelcomeAssessment/WelcomeAssessmentForm';
import { useWelcomeAssessment } from '@/hooks/useWelcomeAssessment';
import { useUserJourney } from '@/hooks/useUserJourney';
import { CheckCircle, Clock, Star, ArrowRight } from 'lucide-react';

interface WelcomeAssessmentCardProps {
  userId: string;
}

export const WelcomeAssessmentCard = ({ userId }: WelcomeAssessmentCardProps) => {
  const { hasCompletedWelcomeAssessment, getLatestWelcomeAssessment, loading } = useWelcomeAssessment();
  const { journeyState, getJourneyProgress, getCurrentPhaseDescription } = useUserJourney();
  const [showForm, setShowForm] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<any>(null);

  useEffect(() => {
    const checkCompletion = async () => {
      const isCompleted = await hasCompletedWelcomeAssessment();
      setCompleted(isCompleted);
      
      if (isCompleted) {
        const assessment = await getLatestWelcomeAssessment();
        setLatestAssessment(assessment);
      }
    };

    checkCompletion();
  }, [hasCompletedWelcomeAssessment, getLatestWelcomeAssessment]);

  const handleAssessmentComplete = () => {
    setCompleted(true);
    setShowForm(false);
  };

  if (loading) {
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

  if (completed && latestAssessment) {
    // Enhanced re-assessment option with clear value proposition for 16-year-olds
    const assessmentDate = new Date(latestAssessment.created_at).toLocaleDateString('sv-SE');
    const daysSince = Math.floor((Date.now() - new Date(latestAssessment.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <Card className="border-success/20 bg-gradient-to-br from-success/10 to-success/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
            <div className="flex-1">
              <h3 className="font-semibold text-success-foreground">Du har gjort din självkoll! ✅</h3>
              <p className="text-success-foreground/80 text-sm">
                Senaste: {assessmentDate} ({daysSince} dagar sedan)
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
              
              {daysSince < 7 && (
                <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400 mb-3">
                  <p className="text-xs text-yellow-800">
                    ⏰ Du kan alltid göra om den, men mest kul är det efter en vecka när du hunnit utvecklas lite!
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setShowForm(true)}
                  className="flex-1"
                >
                  Ja, kolla läget igen! 🔄
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {/* Navigate to insights */}}
                  className="flex-1"
                >
                  Se mina gamla svar 👀
                </Button>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                💡 Tip: Många gör om den en gång i månaden för att följa sin utveckling
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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

        <Button 
          onClick={() => setShowForm(true)}
          className="w-full"
          size="lg"
        >
          Börja nu - det går snabbt! 🚀
        </Button>
      </CardContent>
    </Card>
  );
};