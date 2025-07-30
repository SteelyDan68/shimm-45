import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AssessmentForm } from '@/components/InsightAssessment/AssessmentForm';
import { useFivePillarsModular } from '@/hooks/useFivePillarsModular';
import { ArrowLeft, Brain, BarChart3, TrendingUp, Clock } from 'lucide-react';

interface ModularInsightAssessmentProps {
  clientId: string;
  clientName: string;
  onBack?: () => void;
}

export const ModularInsightAssessment = ({ clientId, clientName, onBack }: ModularInsightAssessmentProps) => {
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const { assessments, getLatestAssessment } = useFivePillarsModular(clientId);

  const latestAssessment = getLatestAssessment('self_care');
  const hasAssessment = !!latestAssessment;

  // Beräkna poäng baserat på assessment-data
  const calculateScore = () => {
    if (!latestAssessment?.assessment_data) return 0;
    
    const data = latestAssessment.assessment_data;
    let totalScore = 0;
    let totalWeight = 0;

    // Hinder score (lägre är bättre, så vi inverterar)
    if (data.scores) {
      const hinderScores = Object.values(data.scores as Record<string, number>);
      const avgHinder = hinderScores.reduce((a, b) => a + b, 0) / hinderScores.length;
      const hinderScore = (10 - avgHinder) / 10; // Invertera så lägre hinder = högre poäng
      totalScore += hinderScore * 0.4;
      totalWeight += 0.4;
    }

    // Functional access score
    if (data.functionalAccess) {
      const functionalValues = Object.values(data.functionalAccess as Record<string, string>);
      const yesCount = functionalValues.filter(v => v === 'yes').length;
      const functionalScore = yesCount / functionalValues.length;
      totalScore += functionalScore * 0.3;
      totalWeight += 0.3;
    }

    // Opportunities score
    if (data.subjectiveOpportunities) {
      const oppValues = Object.values(data.subjectiveOpportunities as Record<string, number>);
      const avgOpp = oppValues.reduce((a, b) => a + b, 0) / oppValues.length;
      const oppScore = avgOpp / 5; // Normalisera till 0-1
      totalScore += oppScore * 0.2;
      totalWeight += 0.2;
    }

    // Relationship support score
    if (data.relationships) {
      const relValues = Object.values(data.relationships as Record<string, string>);
      const yesCount = relValues.filter(v => v === 'yes').length;
      const relScore = yesCount / relValues.length;
      totalScore += relScore * 0.1;
      totalWeight += 0.1;
    }

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  };

  const score = calculateScore();

  if (showAssessmentForm) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setShowAssessmentForm(false)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till översikt
        </Button>
        <AssessmentForm
          clientId={clientId}
          clientName={clientName}
          onComplete={() => setShowAssessmentForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till Five Pillars
        </Button>
      )}

      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          Självskattning med AI-analys
        </h1>
        <p className="text-muted-foreground">
          Bedöm dina hinder inom 13 områden och få personlig AI-coaching baserat på dina svar
        </p>
      </div>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Hälsa & Välmående (Self Care)
            </CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {hasAssessment 
                ? `Senaste: ${new Date(latestAssessment.created_at).toLocaleDateString('sv-SE')}`
                : 'Ingen bedömning gjord än'
              }
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Inkluderar hinder, funktionstillgång, möjligheter och relationsstöd
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasAssessment ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Nuvarande välmående-nivå</span>
                  <span className="font-medium">{score}%</span>
                </div>
                <Progress value={score} className="h-2" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Baserat på senaste självskattning
                </div>
              </div>

              {latestAssessment.ai_analysis && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Brain className="h-5 w-5 text-primary" />
                      Din senaste AI-analys
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-background/60 border rounded-lg p-4">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-sm">
                          {latestAssessment.ai_analysis}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                Klicka på knappen nedan för att göra din första självskattning och få personlig AI-coaching
              </p>
            </div>
          )}
          
          <Button 
            onClick={() => setShowAssessmentForm(true)}
            className="w-full"
            variant={hasAssessment ? "outline" : "default"}
          >
            <Brain className="h-4 w-4 mr-2" />
            {hasAssessment ? "Gör ny självskattning" : "Gör självskattning"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};