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
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Välkomstbedömning slutförd!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {latestAssessment.overall_score ? latestAssessment.overall_score.toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm text-green-600">Totalpoäng</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {getJourneyProgress()}%
              </div>
              <div className="text-sm text-green-600">Resa slutförd</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-700">
                {journeyState?.current_phase === 'pillar_selection' ? 'Pillar-val' : 'Fortsättning'}
              </div>
              <div className="text-sm text-green-600">Nuvarande fas</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-2">Nästa steg i din utveckling:</h4>
            <p className="text-sm text-muted-foreground">
              {getCurrentPhaseDescription()}
            </p>
          </div>

          {latestAssessment.ai_analysis && (
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium mb-2">Stefan's analys:</h4>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {latestAssessment.ai_analysis.substring(0, 200)}...
              </p>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="w-full"
          >
            Visa fullständig bedömning
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-blue-600" />
          Starta din resa med välkomstbedömning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          En omfattande bedömning som hjälper oss förstå var du står idag och vart du vill gå. 
          40 frågor som täcker alla viktiga livsområden.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>15-20 minuter att genomföra</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Personlig AI-analys och rekommendationer</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-yellow-600" />
            <span>Stefan's personliga feedback</span>
          </div>
        </div>

        <div className="bg-blue-100 p-3 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">Vad ingår i bedömningen?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Livets hjul - 8 viktiga livsområden</li>
            <li>• Fördjupade frågor baserat på dina svar</li>
            <li>• Personliga reflektioner och berättelser</li>
            <li>• Identifiering av snabba vinster</li>
          </ul>
        </div>

        <Button 
          onClick={() => setShowForm(true)}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          Börja välkomstbedömning
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};