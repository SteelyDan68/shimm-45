import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, BarChart3 } from 'lucide-react';
import { useInsightAssessment } from '@/hooks/useInsightAssessment';

interface AssessmentFormProps {
  clientId: string;
  clientName: string;
  onComplete?: () => void;
}

const assessmentAreas = [
  'Mediestress',
  'Sociala medier-press', 
  'Kritik och hat',
  'Prestationsångest',
  'Tidsbrist',
  'Balans arbete/privatliv',
  'Ekonomisk oro',
  'Relationsproblem',
  'Hälsoproblem',
  'Självkänsla',
  'Perfektionism',
  'Kontrollbehov',
  'Ensamhet'
] as const;

export function AssessmentForm({ clientId, clientName, onComplete }: AssessmentFormProps) {
  const { submitAssessment, isSubmitting } = useInsightAssessment(clientId);
  
  const [scores, setScores] = useState(() => {
    const initialScores: Record<string, number> = {};
    assessmentAreas.forEach(area => {
      initialScores[area] = 5;
    });
    return initialScores;
  });
  const [comments, setComments] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');

  const handleSliderChange = (area: string, value: number[]) => {
    setScores(prev => ({ ...prev, [area]: value[0] }));
  };

  const handleSubmit = async () => {
    const result = await submitAssessment(
      { scores, comments },
      clientName,
      clientId
    );

    if (result) {
      setAnalysisResult(result.analysis);
      setShowResults(true);
      // Vi kallar inte onComplete här - användaren ska se resultatet först
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'text-green-600 bg-green-50';
    if (score <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 3) return 'Lågt hinder';
    if (score <= 6) return 'Måttligt hinder';
    return 'Stort hinder';
  };

  if (showResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI-analys av din självskattning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Personlig analys och rekommendationer:</h4>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm">
                {analysisResult}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {assessmentAreas.map(area => (
              <div key={area} className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{area}</div>
                <Badge variant="outline" className={getScoreColor(scores[area])}>
                  {scores[area]}/10
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => setShowResults(false)}
              variant="outline"
              className="flex-1"
            >
              Gör ny assessment
            </Button>
            <Button 
              onClick={onComplete}
              className="flex-1"
            >
              Tillbaka till Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Självskattning av hinder
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Skatta hur stora hinder dessa områden är för dig just nu (1 = inget hinder, 10 = mycket stort hinder)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          {assessmentAreas.map(area => (
            <div key={area} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{area}</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getScoreColor(scores[area])}>
                    {scores[area]}/10
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {getScoreLabel(scores[area])}
                  </span>
                </div>
              </div>
              <Slider
                value={[scores[area]]}
                onValueChange={(value) => handleSliderChange(area, value)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Inget hinder</span>
                <span>Stort hinder</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="comments">Kommentarer (valfritt)</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Berätta gärna mer om din situation eller specifika utmaningar..."
            rows={3}
          />
        </div>

        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 mt-0.5 text-primary" />
            <div className="text-sm">
              <p className="font-medium mb-1">AI-analys inkluderad</p>
              <p className="text-muted-foreground">
                När du slutför denna assessment kommer AI:n att analysera dina svar och ge dig 
                personliga rekommendationer för hur du kan arbeta med identifierade hinder.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-pulse" />
              Analyserar...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Skicka assessment för AI-analys
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}