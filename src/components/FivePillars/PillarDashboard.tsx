import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PillarType, PILLAR_CONFIGS } from '@/types/fivePillars';
import { useFivePillars } from '@/hooks/useFivePillars';
import { PillarAssessmentForm } from './PillarAssessmentForm';
import { ArrowLeft, TrendingUp, Clock } from 'lucide-react';

interface PillarDashboardProps {
  clientId: string;
  clientName: string;
}

export const PillarDashboard = ({ clientId, clientName }: PillarDashboardProps) => {
  const { assignments, assessmentRounds, getAssignedPillars, getLatestAssessment } = useFivePillars(clientId);
  const [selectedPillar, setSelectedPillar] = useState<PillarType | null>(null);
  
  const assignedPillars = getAssignedPillars();

  if (selectedPillar) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedPillar(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till översikt
        </Button>
        <PillarAssessmentForm
          clientId={clientId}
          pillarType={selectedPillar}
          onComplete={() => setSelectedPillar(null)}
        />
      </div>
    );
  }

  const calculatePillarScore = (pillarType: PillarType) => {
    const assessment = getLatestAssessment(pillarType);
    if (!assessment) return 0;
    
    const scores = Object.values(assessment.scores);
    return scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 20) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Five Pillars Assessment</h1>
        <p className="text-muted-foreground">
          Bedöm dina fem grundpelare för en stark karriär och personligt varumärke
        </p>
      </div>

      {assignedPillars.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">Inga pelare tilldelade</h2>
            <p className="text-muted-foreground">
              Din coach har inte tilldelat några pelare för bedömning än.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignedPillars.map((pillarType) => {
            const config = PILLAR_CONFIGS[pillarType];
            const latestAssessment = getLatestAssessment(pillarType);
            const score = calculatePillarScore(pillarType);
            
            return (
              <Card key={pillarType} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    {latestAssessment && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(latestAssessment.created_at).toLocaleDateString('sv-SE')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {latestAssessment ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Nuvarande nivå</span>
                        <span className="font-medium">{score}%</span>
                      </div>
                      <Progress value={score} className="h-2" />
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        Senaste bedömning
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Ingen bedömning gjord än
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => setSelectedPillar(pillarType)}
                    className="w-full"
                    variant={latestAssessment ? "outline" : "default"}
                  >
                    {latestAssessment ? "Uppdatera bedömning" : "Gör bedömning"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};