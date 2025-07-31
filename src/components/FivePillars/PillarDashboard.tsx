import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAssessmentEngine } from '@/hooks/useAssessmentEngine';
import { useFivePillarsModular } from '@/hooks/useFivePillarsModular';
import { DynamicAssessmentForm } from '@/components/AssessmentEngine/DynamicAssessmentForm';

import { ArrowLeft, TrendingUp, Clock } from 'lucide-react';

interface PillarDashboardProps {
  userId: string;
  userName: string;
}

export const PillarDashboard = ({ userId, userName }: PillarDashboardProps) => {
  // Use user-centric hooks for enterprise architecture
  const { formDefinitions, assignments, assessmentRounds, getLatestAssessment } = useAssessmentEngine(userId);
  const { pillarDefinitions, getActivatedPillars } = useFivePillarsModular(userId);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  
  const activatedPillars = getActivatedPillars();
  const selfCarePillar = pillarDefinitions.find(p => p.pillar_key === 'self_care');
  
  
  if (selectedForm) {
    const formDefinition = formDefinitions.find(f => f.id === selectedForm);
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedForm(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till översikt
        </Button>
        <DynamicAssessmentForm
          clientId={userId}
          formDefinitionId={selectedForm}
          formName={formDefinition?.name || 'Assessment'}
          formDescription={formDefinition?.description}
          onComplete={() => setSelectedForm(null)}
        />
      </div>
    );
  }

  const calculateFormScore = (formDefinitionId: string) => {
    const assessment = getLatestAssessment(formDefinitionId);
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

      {/* Show Self Care pillar first if available */}
      {selfCarePillar && activatedPillars.includes('self_care') && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{selfCarePillar.name}</CardTitle>
              <Badge variant="default" className="bg-primary">
                Aktiverad
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{selfCarePillar.description}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Den nya självskattningen är nu integrerad i Five Pillars-systemet. Gå till Five Pillars för att göra din självskattning.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Show regular assessment forms */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">Inga assessments tilldelade</h2>
            <p className="text-muted-foreground">
              Din coach har inte tilldelat några bedömningsformulär än.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const formDefinition = formDefinitions.find(f => f.id === assignment.form_definition_id);
            if (!formDefinition) return null;
            
            const latestAssessment = getLatestAssessment(assignment.form_definition_id);
            const score = calculateFormScore(assignment.form_definition_id);
            
            return (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{formDefinition?.name}</CardTitle>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {latestAssessment 
                        ? `Senaste bedömning: ${new Date(latestAssessment.created_at).toLocaleDateString('sv-SE')}`
                        : 'Ingen bedömning gjord än'
                      }
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formDefinition?.description}</p>
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
                        Klicka på knappen nedan för att göra din första bedömning
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => setSelectedForm(assignment.form_definition_id)}
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