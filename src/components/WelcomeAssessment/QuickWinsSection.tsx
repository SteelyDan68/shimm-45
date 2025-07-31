import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QUICK_WINS_QUESTIONS } from '@/config/welcomeAssessment';

interface QuickWinsSectionProps {
  questions: typeof QUICK_WINS_QUESTIONS;
  answers: Record<string, any>;
  onAnswersChange: (answers: Record<string, any>) => void;
}

export const QuickWinsSection = ({ 
  questions, 
  answers, 
  onAnswersChange 
}: QuickWinsSectionProps) => {
  const handleAnswerChange = (questionKey: string, value: boolean) => {
    const updatedAnswers = {
      ...answers,
      [questionKey]: value,
    };
    onAnswersChange(updatedAnswers);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      habits: '⏰',
      mindset: '🧠',
      growth: '📚',
      relationships: '👥',
      creativity: '🎨',
      wellbeing: '🌿',
      productivity: '📊',
    };
    return icons[category] || '✨';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      habits: 'border-blue-200 bg-blue-50',
      mindset: 'border-purple-200 bg-purple-50',
      growth: 'border-green-200 bg-green-50',
      relationships: 'border-pink-200 bg-pink-50',
      creativity: 'border-orange-200 bg-orange-50',
      wellbeing: 'border-emerald-200 bg-emerald-50',
      productivity: 'border-indigo-200 bg-indigo-50',
    };
    return colors[category] || 'border-gray-200 bg-gray-50';
  };

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const positiveCount = Object.values(answers).filter(answer => answer === true).length;

  const getProgressColor = (current: number, total: number) => {
    const percentage = (current / total) * 100;
    if (percentage < 50) return "bg-red-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Snabba vinster - Enkla förändringar</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Dessa små vanor kan ge stora resultat. Vilka av dessa gör du redan?
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-4">
          <Badge variant="outline">
            {answeredCount} av {questions.length} besvarade
          </Badge>
          <Badge variant="default" className="bg-green-500">
            {positiveCount} positiva vanor
          </Badge>
        </div>
        
        <div className="w-64 mx-auto bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getProgressColor(answeredCount, questions.length)}`}
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map((question, index) => (
          <Card 
            key={question.key} 
            className={`p-4 border-2 ${getCategoryColor(question.category)} transition-all duration-200 hover:shadow-md`}
          >
            <CardContent className="p-0">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={question.key}
                  checked={answers[question.key] || false}
                  onCheckedChange={(checked) => handleAnswerChange(question.key, !!checked)}
                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                
                <div className="flex-1">
                  <Label 
                    htmlFor={question.key} 
                    className="text-base font-medium cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-lg">{getCategoryIcon(question.category)}</span>
                    {question.text}
                  </Label>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {question.category.replace('_', ' ')}
                    </Badge>
                    {answers[question.key] && (
                      <Badge variant="default" className="text-xs bg-green-500">
                        ✓ Gör redan detta
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {positiveCount > 0 && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">
            🎉 Fantastiskt! Du har redan {positiveCount} positiva vanor!
          </h4>
          <p className="text-sm text-green-700">
            {positiveCount >= 5 && "Du har en stark grund av positiva vanor att bygga vidare på."}
            {positiveCount >= 3 && positiveCount < 5 && "Du är på god väg! Några enkla tillägg kan göra stor skillnad."}
            {positiveCount < 3 && "Det finns stor potential för snabba förbättringar med enkla förändringar."}
          </p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Varför fokusera på snabba vinster?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Små förändringar skapar momentum för större förändringar</li>
          <li>• Positiva vanor förstärker varandra över tid</li>
          <li>• Snabba resultat ger motivation att fortsätta utvecklas</li>
          <li>• Grundläggande vanor påverkar alla andra livsområden</li>
        </ul>
      </div>
    </div>
  );
};