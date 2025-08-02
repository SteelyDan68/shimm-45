import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IntelligentPillarRecommendation } from './IntelligentPillarRecommendation';
import { PillarSelector } from './PillarSelector';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useWelcomeAssessment } from '@/hooks/useWelcomeAssessment';
import { Lightbulb, ChevronDown, ChevronUp, Users, BookOpen } from 'lucide-react';

interface GuidedPillarDiscoveryProps {
  userId: string;
  maxSelection: number;
  currentActive: number;
  onPillarSelect: (pillarKey: string) => Promise<{ shouldNavigate: boolean; url?: string } | void>;
}

export const GuidedPillarDiscovery: React.FC<GuidedPillarDiscoveryProps> = ({
  userId,
  maxSelection,
  currentActive,
  onPillarSelect
}) => {
  const { hasCompletedWelcomeAssessment } = useUserJourney();
  const { getLatestWelcomeAssessment } = useWelcomeAssessment();
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [welcomeAssessment, setWelcomeAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssessmentData = async () => {
      setLoading(true);
      try {
        const hasCompleted = hasCompletedWelcomeAssessment();
        if (hasCompleted) {
          const assessment = await getLatestWelcomeAssessment();
          setWelcomeAssessment(assessment);
        }
      } catch (error) {
        console.error('Error loading assessment data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAssessmentData();
  }, [hasCompletedWelcomeAssessment, getLatestWelcomeAssessment]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no welcome assessment, show encouragement to complete it
  if (!welcomeAssessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Få personliga rekommendationer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Genomför först din välkomstbedömning för att få personliga pillar-rekommendationer 
              baserat på dina behov och mål.
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full mt-4" 
            onClick={() => window.location.href = '/client-dashboard'}
          >
            Gå till välkomstbedömning
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if we have intelligent recommendations
  const hasIntelligentRecommendations = welcomeAssessment?.recommendations?.pillar_recommendations;

  return (
    <div className="space-y-6">
      {hasIntelligentRecommendations ? (
        <>
          {/* Header */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-purple-900">
                  Dina personliga utvecklingsrekommendationer
                </h2>
                <p className="text-purple-700">
                  Baserat på din välkomstbedömning har Stefan identifierat de bästa utvecklingsområdena för dig
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Intelligent Recommendations */}
          <IntelligentPillarRecommendation
            userId={userId}
            pillarRecommendations={welcomeAssessment.recommendations.pillar_recommendations}
            stefanMessage={welcomeAssessment.stefan_message || "Låt oss börja din utvecklingsresa!"}
            onPillarSelect={onPillarSelect}
          />

          {/* Option to see all pillars */}
          <Card>
            <CardContent className="pt-6">
              <Button
                variant="ghost"
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="w-full flex items-center justify-center gap-2"
              >
                <Users className="h-4 w-4" />
                Visa alla tillgängliga utvecklingsområden
                {showAlternatives ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showAlternatives && (
                <div className="mt-4 pt-4 border-t">
                  <PillarSelector
                    userId={userId}
                    maxSelection={maxSelection}
                    currentActive={currentActive}
                    onPillarSelect={onPillarSelect}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Fallback if no intelligent recommendations */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Utforska utvecklingsområden</h3>
                  <p className="text-yellow-800 text-sm mt-1">
                    Välj de områden som känns mest relevanta för din utveckling just nu.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <PillarSelector
            userId={userId}
            maxSelection={maxSelection}
            currentActive={currentActive}
            onPillarSelect={onPillarSelect}
          />
        </>
      )}
    </div>
  );
};