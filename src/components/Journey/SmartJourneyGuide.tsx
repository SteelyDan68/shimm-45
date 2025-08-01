import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useStefanPersonality } from '@/hooks/useStefanPersonality';
import { StefanInteractionCard } from '@/components/Stefan/StefanInteractionCard';
import { WelcomeAssessmentCard } from '@/components/Dashboard/WelcomeAssessmentCard';
import { ModularPillarAssessment } from '@/components/FivePillars/ModularPillarAssessment';
import { PillarHeatmap } from '@/components/FivePillars/PillarHeatmap';
import { AutonomousCoachingDashboard } from '@/components/Dashboard/AutonomousCoachingDashboard';
import { useFivePillarsModular } from '@/hooks/useFivePillarsModular';
import { PILLAR_PRIORITY_ORDER } from '@/config/pillarModules';
import { 
  MapPin, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Star,
  TrendingUp,
  MessageCircle,
  Trophy,
  Target
} from 'lucide-react';

interface SmartJourneyGuideProps {
  userId: string;
  userName: string;
}

export const SmartJourneyGuide = ({ userId, userName }: SmartJourneyGuideProps) => {
  const { 
    journeyState, 
    getRecommendedAssessments, 
    shouldShowAssessment, 
    getJourneyProgress,
    getCurrentPhaseDescription 
  } = useUserJourney();
  
  const { recentInteractions, createStefanInteraction } = useStefanPersonality();
  const { getActivatedPillars, generateHeatmapData } = useFivePillarsModular(userId);
  
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);
  const [showAllInteractions, setShowAllInteractions] = useState(false);

  const recommendedAssessments = getRecommendedAssessments();
  const activatedPillars = getActivatedPillars();
  const heatmapData = generateHeatmapData();

  // Show Stefan celebration when assessments are completed
  useEffect(() => {
    if (journeyState && journeyState.journey_progress > 0 && journeyState.journey_progress % 20 === 0) {
      createStefanInteraction(
        'celebration',
        'milestone_achievement',
        {
          progress: journeyState.journey_progress,
          phase: journeyState.current_phase
        }
      );
    }
  }, [journeyState?.journey_progress, createStefanInteraction]);

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'welcome':
        return <Star className="h-5 w-5" />;
      case 'pillar_selection':
        return <Target className="h-5 w-5" />;
      case 'deep_dive':
        return <TrendingUp className="h-5 w-5" />;
      case 'maintenance':
        return <Trophy className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'welcome':
        return 'bg-blue-500';
      case 'pillar_selection':
        return 'bg-green-500';
      case 'deep_dive':
        return 'bg-purple-500';
      case 'maintenance':
        return 'bg-gold-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (selectedAssessment === 'welcome') {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => setSelectedAssessment(null)}
          className="mb-4"
        >
          ← Tillbaka till reseguiden
        </Button>
        <WelcomeAssessmentCard userId={userId} />
      </div>
    );
  }

  if (selectedAssessment && PILLAR_PRIORITY_ORDER.includes(selectedAssessment as any)) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => setSelectedAssessment(null)}
          className="mb-4"
        >
          ← Tillbaka till reseguiden
        </Button>
        <ModularPillarAssessment
          userId={userId}
          pillarKey={selectedAssessment as any}
          onComplete={() => setSelectedAssessment(null)}
          onBack={() => setSelectedAssessment(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Journey Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getPhaseColor(journeyState?.current_phase || 'welcome')} text-white`}>
                {getPhaseIcon(journeyState?.current_phase || 'welcome')}
              </div>
              <div>
                <CardTitle className="text-xl">Din utvecklingsresa</CardTitle>
                <p className="text-muted-foreground">{getCurrentPhaseDescription()}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {getJourneyProgress()}% klar
            </Badge>
          </div>
          
          <Progress value={getJourneyProgress()} className="w-full mt-4" />
          
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Start</span>
            <span>Pillar-val</span>
            <span>Fördjupning</span>
            <span>Underhåll</span>
          </div>
        </CardHeader>
      </Card>

      {/* Stefan's Latest Message */}
      {recentInteractions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Stefan's senaste meddelande
            </h3>
            {recentInteractions.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllInteractions(!showAllInteractions)}
              >
                {showAllInteractions ? 'Visa mindre' : `Visa alla (${recentInteractions.length})`}
              </Button>
            )}
          </div>
          
          <StefanInteractionCard 
            interaction={recentInteractions[0]} 
            showResponse={true}
          />
          
          {showAllInteractions && recentInteractions.slice(1).map((interaction) => (
            <StefanInteractionCard 
              key={interaction.id}
              interaction={interaction} 
              showResponse={false}
            />
          ))}
        </div>
      )}

      {/* Recommended Next Steps */}
      {recommendedAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-blue-600" />
              Nästa steg i din utveckling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedAssessments.map((assessment, index) => (
              <div
                key={assessment.type}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  index === 0 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
                onClick={() => setSelectedAssessment(assessment.type)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{assessment.title}</h4>
                      {index === 0 && (
                        <Badge variant="default" className="text-xs">
                          Rekommenderat
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {assessment.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{assessment.estimated_time}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      {activatedPillars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Din utvecklingsöversikt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PillarHeatmap 
              userId={userId} 
              heatmapData={heatmapData}
              onPillarClick={setSelectedAssessment}
            />
          </CardContent>
        </Card>
      )}

      {/* Journey Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {journeyState?.completed_assessments?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Slutförda bedömningar
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {activatedPillars.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Aktiva utvecklingsområden
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {journeyState?.stefan_interventions_count || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Stefan-interaktioner
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Autonomous Coaching Dashboard */}
      <AutonomousCoachingDashboard userId={userId} userName={userName} />

      {/* Journey Phase Description */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-2">Vad händer i denna fas?</h4>
          <p className="text-muted-foreground">
            {journeyState?.current_phase === 'welcome' && 
              "Du börjar din resa genom att kartlägga var du står idag. Välkomstbedömningen ger oss en helhetsbild av ditt liv och hjälper oss identifiera de viktigaste utvecklingsområdena."
            }
            {journeyState?.current_phase === 'pillar_selection' && 
              "Nu fördjupar du dig inom specifika livsområden. Varje pillar-bedömning ger dig djupare insikter och konkreta utvecklingsmöjligheter."
            }
            {journeyState?.current_phase === 'deep_dive' && 
              "Du arbetar intensivt med dina utvecklingsområden och ser tydliga framsteg. Stefan ger dig personliga råd och strategier."
            }
            {journeyState?.current_phase === 'maintenance' && 
              "Du har kommit långt! Nu handlar det om att bibehålla momentum och fortsätta växa. Stefan hjälper dig hitta nya utmaningar och möjligheter."
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};