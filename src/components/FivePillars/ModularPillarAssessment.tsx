import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { PillarKey } from '@/types/fivePillarsModular';
import { PILLAR_MODULES } from '@/config/pillarModules';
import { useFivePillarsModular } from '@/hooks/useFivePillarsModular';

interface ModularPillarAssessmentProps {
  clientId: string;
  pillarKey: PillarKey;
  onComplete?: () => void;
  onBack?: () => void;
}

export const ModularPillarAssessment = ({ 
  clientId, 
  pillarKey, 
  onComplete, 
  onBack 
}: ModularPillarAssessmentProps) => {
  const { submitPillarAssessment, loading } = useFivePillarsModular(clientId);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [comments, setComments] = useState('');

  const pillarConfig = PILLAR_MODULES[pillarKey];

  // Initialize answers with default values
  useEffect(() => {
    const defaultAnswers: Record<string, any> = {};
    pillarConfig.questions.forEach(q => {
      if (q.type === 'scale') {
        defaultAnswers[q.key] = Math.ceil(((q.max || 10) + (q.min || 1)) / 2);
      } else {
        defaultAnswers[q.key] = '';
      }
    });
    setAnswers(defaultAnswers);
  }, [pillarKey]);

  const handleAnswerChange = (questionKey: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const handleSubmit = async () => {
    // Calculate score using the pillar's scoring function
    const calculatedScore = pillarConfig.scoreCalculation(answers);
    
    const result = await submitPillarAssessment(pillarKey, answers, calculatedScore);
    if (result && onComplete) {
      onComplete();
    }
  };

  const getScorePreview = () => {
    return pillarConfig.scoreCalculation(answers);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{pillarConfig.icon}</span>
            <div>
              <CardTitle>{pillarConfig.name} Assessment</CardTitle>
              <p className="text-sm text-muted-foreground">{pillarConfig.description}</p>
            </div>
          </div>
        </div>
        
        {/* Live Score Preview */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Förhandsvisning av poäng:</span>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${getScoreColor(getScorePreview())}`}>
              {getScorePreview().toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">/ 10</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {pillarConfig.questions.map((question) => (
          <div key={question.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{question.text}</Label>
              {question.weight && question.weight !== 1 && (
                <Badge variant="outline" className="text-xs">
                  Vikt: {question.weight}x
                </Badge>
              )}
            </div>
            
            {question.type === 'scale' && (
              <div className="px-2">
                <Slider
                  value={[answers[question.key] || question.min || 1]}
                  onValueChange={(value) => handleAnswerChange(question.key, value[0])}
                  max={question.max || 10}
                  min={question.min || 1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Låg ({question.min})</span>
                  <span className="font-medium text-primary">
                    {answers[question.key] || question.min || 1}
                  </span>
                  <span>Hög ({question.max})</span>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="space-y-2">
          <Label htmlFor="comments">Kommentarer och reflektion (valfritt)</Label>
          <Textarea
            id="comments"
            placeholder="Berätta mer om din situation inom detta område..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
          />
        </div>

        {/* Insights Preview */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-medium mb-2 text-primary">AI-analys kommer att inkludera:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Personlig bedömning av dina styrkor och utvecklingsområden</li>
            <li>• Konkreta handlingsplaner anpassade till din profil</li>
            <li>• Rekommendationer baserade på din poäng ({getScorePreview().toFixed(1)}/10)</li>
            <li>• Strategier för förbättring inom {pillarConfig.name.toLowerCase()}</li>
          </ul>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? "Sparar och analyserar..." : "Slutför bedömning & Få AI-analys"}
        </Button>
      </CardContent>
    </Card>
  );
};