import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PillarType, PILLAR_CONFIGS } from '@/types/sixPillars';
import { useSixPillars } from '@/hooks/useSixPillars';

interface PillarAssessmentFormProps {
  clientId: string;
  pillarType: PillarType;
  onComplete?: () => void;
}

export const PillarAssessmentForm = ({ clientId, pillarType, onComplete }: PillarAssessmentFormProps) => {
  const { submitAssessment, loading } = useSixPillars(clientId);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');

  const config = PILLAR_CONFIGS[pillarType];

  const handleSliderChange = (questionId: string, value: number[]) => {
    setScores(prev => ({
      ...prev,
      [questionId]: value[0]
    }));
  };

  const handleSubmit = async () => {
    const result = await submitAssessment(pillarType, scores, comments);
    if (result && onComplete) {
      onComplete();
    }
  };

  const getScoreLabel = (score: number) => {
    if (score <= 2) return "Låg";
    if (score <= 3) return "Måttlig";
    if (score <= 4) return "Bra";
    return "Utmärkt";
  };

  const getScoreColor = (score: number) => {
    if (score <= 2) return "text-red-500";
    if (score <= 3) return "text-yellow-500";
    if (score <= 4) return "text-blue-500";
    return "text-green-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {config.name} Assessment
        </CardTitle>
        <p className="text-muted-foreground">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {config.questions.map((question) => (
          <div key={question.id} className="space-y-2">
            <Label className="text-sm font-medium">{question.text}</Label>
            <div className="px-2">
              <Slider
                value={[scores[question.id] || 3]}
                onValueChange={(value) => handleSliderChange(question.id, value)}
                max={question.max}
                min={question.min}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Låg ({question.min})</span>
                <span className={getScoreColor(scores[question.id] || 3)}>
                  {getScoreLabel(scores[question.id] || 3)}
                </span>
                <span>Hög ({question.max})</span>
              </div>
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <Label htmlFor="comments">Kommentarer (valfritt)</Label>
          <Textarea
            id="comments"
            placeholder="Ytterligare tankar eller kontext..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Sparar..." : "Slutför bedömning"}
        </Button>
      </CardContent>
    </Card>
  );
};