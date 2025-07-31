import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FREE_TEXT_QUESTIONS } from '@/config/welcomeAssessment';

interface FreeTextSectionProps {
  questions: typeof FREE_TEXT_QUESTIONS;
  responses: Record<string, string>;
  onResponsesChange: (responses: Record<string, string>) => void;
}

export const FreeTextSection = ({ 
  questions, 
  responses, 
  onResponsesChange 
}: FreeTextSectionProps) => {
  const handleResponseChange = (questionKey: string, value: string) => {
    const updatedResponses = {
      ...responses,
      [questionKey]: value,
    };
    onResponsesChange(updatedResponses);
  };

  const getProgressColor = (current: number, total: number) => {
    const percentage = (current / total) * 100;
    if (percentage < 50) return "bg-red-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      vision: '🌟',
      challenges: '💪',
      values: '💎',
      achievements: '🏆',
      energy: '⚡',
      support: '🤝',
      patterns: '🔄',
      motivation: '🔥',
      growth: '📈',
      legacy: '🌍',
    };
    return icons[category] || '💭';
  };

  const answeredCount = Object.values(responses).filter(response => response && response.trim().length > 0).length;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Din personliga historia</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Här får du dela dina tankar och berättelser. Ju mer du delar, desto bättre kan vi hjälpa dig.
        </p>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="outline">
            {answeredCount} av {questions.length} besvarade
          </Badge>
          <div className="w-32 bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(answeredCount, questions.length)}`}
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Minst 8 frågor behöver besvaras för att gå vidare
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {questions.map((question, index) => (
          <Card key={question.key} className="p-4">
            <CardContent className="p-0">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <Label className="text-base font-medium flex-1 flex items-center gap-2">
                    <span>{getCategoryIcon(question.category)}</span>
                    {question.text}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}/{questions.length}
                    </Badge>
                    {responses[question.key] && responses[question.key].trim().length > 0 && (
                      <Badge variant="default" className="text-xs bg-green-500">
                        ✓
                      </Badge>
                    )}
                  </div>
                </div>

                <Textarea
                  value={responses[question.key] || ''}
                  onChange={(e) => handleResponseChange(question.key, e.target.value)}
                  placeholder="Dela dina tankar här..."
                  className="min-h-[100px] resize-none"
                  rows={4}
                />
                
                {responses[question.key] && responses[question.key].length > 0 && (
                  <div className="text-xs text-muted-foreground text-right">
                    {responses[question.key].length} tecken
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">✨ Tips för bättre svar</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Var konkret och specifik i dina svar</li>
          <li>• Tänk på exempel från ditt eget liv</li>
          <li>• Det är okej att vara sårbar och ärlig</li>
          <li>• Ju mer detaljer du ger, desto bättre rekommendationer får du</li>
          <li>• Du kan hoppa över frågor som känns för privata</li>
        </ul>
      </div>
    </div>
  );
};