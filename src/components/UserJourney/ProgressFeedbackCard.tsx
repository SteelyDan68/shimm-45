import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  ArrowRight, 
  Brain, 
  Target, 
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';

interface ProgressFeedbackCardProps {
  className?: string;
}

/**
 * ✅ KRITISK UX-KOMPONENT: Post-Assessment Progress Feedback
 * Visar tydlig återkoppling efter genomförd assessment och guidar användaren vidare
 * Eliminerar "hängande" känsla genom pedagogisk vägledning
 */
export const ProgressFeedbackCard = ({ className }: ProgressFeedbackCardProps) => {
  const { user } = useAuth();
  const { journeyState, getJourneyProgress } = useUserJourney();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showCard, setShowCard] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [nextSteps, setNextSteps] = useState<Array<{
    id: string;
    title: string;
    description: string;
    action: () => void;
    icon: React.ReactNode;
    estimatedTime: string;
  }>>([]);

  useEffect(() => {
    const checkProgress = async () => {
      if (!user) return;

      try {
        // Kontrollera om assessment är klar men användaren inte har fått feedback
        const progress = await getJourneyProgress();
        
        // Visa feedback-kort om assessment är klar men progress < 30%
        const shouldShow = progress > 15 && progress < 50 && 
          journeyState?.metadata?.assessment_insights_available;
        
        setShowCard(shouldShow);
        setAssessmentCompleted(progress > 15);
        setProgressPercentage(progress);
        
        if (shouldShow) {
          // Definiera nästa steg baserat på var användaren befinner sig
          const steps = [
            {
              id: 'view_insights',
              title: 'Granska dina AI-insikter',
              description: 'Stefan har analyserat din bedömning och skapat personliga rekommendationer',
              action: () => navigate('/ai-insights'),
              icon: <Brain className="h-5 w-5 text-blue-600" />,
              estimatedTime: '5 min'
            },
            {
              id: 'select_pillars',
              title: 'Välj utvecklingsområden',
              description: 'Aktivera de pelare du vill fokusera på först',
              action: () => navigate('/six-pillars'),
              icon: <Target className="h-5 w-5 text-green-600" />,
              estimatedTime: '10 min'
            },
            {
              id: 'start_tasks',
              title: 'Påbörja dina första uppgifter',
              description: 'Få konkreta, genomförbara steg för din utveckling',
              action: () => navigate('/tasks'),
              icon: <CheckCircle2 className="h-5 w-5 text-purple-600" />,
              estimatedTime: '15 min'
            }
          ];
          
          setNextSteps(steps);
        }
      } catch (error) {
        console.error('Error checking progress:', error);
      }
    };

    checkProgress();
  }, [user, journeyState, getJourneyProgress, navigate]);

  const handleDismiss = () => {
    setShowCard(false);
    toast({
      title: "Feedback sparad! 👍",
      description: "Du kan alltid komma tillbaka till din utvecklingsresa via dashboard."
    });
  };

  const handleContinueJourney = () => {
    if (nextSteps.length > 0) {
      nextSteps[0].action();
    }
    setShowCard(false);
  };

  if (!showCard || !assessmentCompleted) {
    return null;
  }

  return (
    <Card className={`border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-emerald-900">
                Fantastiskt! Din bedömning är genomförd! 🎉
              </CardTitle>
              <p className="text-emerald-700 text-sm mt-1">
                Stefan AI har analyserat dina svar och förberett din personliga utvecklingsplan
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            {progressPercentage}% klart
          </Badge>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className="w-full mt-4 h-2"
        />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Vad som just hänt */}
        <div className="bg-white/60 p-4 rounded-lg border border-emerald-100">
          <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Vad som precis hänt:
          </h3>
          <ul className="space-y-1 text-sm text-emerald-700">
            <li>✅ Din välkomstbedömning är analyserad av Stefan AI</li>
            <li>✅ Personliga utvecklingsinsikter har skapats</li>
            <li>✅ Rekommendationer för nästa steg är redo</li>
            <li>✅ Din utvecklingsresa har officiellt börjat!</li>
          </ul>
        </div>

        {/* Vad nyttan var */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Nyttan med din bedömning:
          </h3>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>🎯 Identifierat dina starkaste och svagaste livsområden</li>
            <li>🧠 AI-analys har skapat skräddarsydda rekommendationer</li>
            <li>📈 Baseline etablerad för att mäta din framtida utveckling</li>
            <li>⚡ Neuroplastiska principer tillämpade på dina specifika behov</li>
          </ul>
        </div>

        {/* Nästa steg */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Dina nästa steg:
          </h3>
          
          {nextSteps.map((step, index) => (
            <div 
              key={step.id}
              className="flex items-center gap-3 p-3 bg-white/80 rounded-lg border hover:bg-white/90 transition-colors cursor-pointer"
              onClick={step.action}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{step.title}</span>
                    <Badge variant="outline" className="text-xs">
                      Steg {index + 1}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-3 w-3" />
                {step.estimatedTime}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-emerald-100">
          <Button 
            onClick={handleContinueJourney}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            <Brain className="h-4 w-4 mr-2" />
            Fortsätt min resa
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleDismiss}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            Senare
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};