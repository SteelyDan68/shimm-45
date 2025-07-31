import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AdaptiveQuestion } from '@/types/welcomeAssessment';
import { Badge } from '@/components/ui/badge';

interface AdaptiveQuestionsSectionProps {
  questions: AdaptiveQuestion[];
  answers: Record<string, any>;
  onAnswersChange: (answers: Record<string, any>) => void;
}

export const AdaptiveQuestionsSection = ({ 
  questions, 
  answers, 
  onAnswersChange 
}: AdaptiveQuestionsSectionProps) => {
  const handleAnswerChange = (questionKey: string, value: any) => {
    const updatedAnswers = {
      ...answers,
      [questionKey]: value,
    };
    onAnswersChange(updatedAnswers);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            🎉 Fantastiska resultat!
          </h3>
          <p className="text-green-700">
            Dina poäng på Livets hjul är så bra att vi inte behöver fördjupa oss ytterligare just nu. 
            Du kan gå vidare till nästa steg!
          </p>
        </div>
      </div>
    );
  }

  const getProgressColor = (current: number, total: number) => {
    const percentage = (current / total) * 100;
    if (percentage < 50) return "bg-red-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Fördjupning inom utvecklingsområden</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Baserat på dina svar från Livets hjul vill vi förstå dessa områden bättre
        </p>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="outline">
            {Object.keys(answers).length} av {questions.length} besvarade
          </Badge>
          <div className="w-32 bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(Object.keys(answers).length, questions.length)}`}
              style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {questions.map((question, index) => (
          <Card key={question.key} className="p-4">
            <CardContent className="p-0">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <Label className="text-base font-medium flex-1">{question.text}</Label>
                  <Badge variant="secondary" className="ml-2">
                    {index + 1}/{questions.length}
                  </Badge>
                </div>

                {question.type === 'scale' && (
                  <div className="space-y-2">
                    <Slider
                      value={[answers[question.key] || (question.min || 1)]}
                      onValueChange={(value) => handleAnswerChange(question.key, value[0])}
                      max={question.max || 10}
                      min={question.min || 1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Låg ({question.min || 1})</span>
                      <span className="font-bold text-primary">
                        {answers[question.key] || (question.min || 1)}
                      </span>
                      <span>Hög ({question.max || 10})</span>
                    </div>
                  </div>
                )}

                {question.type === 'multiple_choice' && question.options && (
                  <RadioGroup
                    value={answers[question.key] || ''}
                    onValueChange={(value) => handleAnswerChange(question.key, value)}
                  >
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${question.key}-${optionIndex}`} />
                        <Label htmlFor={`${question.key}-${optionIndex}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.type === 'boolean' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={question.key}
                      checked={answers[question.key] || false}
                      onCheckedChange={(checked) => handleAnswerChange(question.key, checked)}
                    />
                    <Label htmlFor={question.key}>Ja</Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">🎯 Varför just dessa frågor?</h4>
          <p className="text-sm text-blue-700">
            Vi fokuserar på områden där du angav lägre poäng för att bättre förstå din situation 
            och kunna ge dig mer personliga rekommendationer.
          </p>
        </div>
      )}
    </div>
  );
};