import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { AssessmentQuestion } from '@/types/assessmentEngine';
import { useAssessmentEngine } from '@/hooks/useAssessmentEngine';

interface DynamicAssessmentFormProps {
  clientId: string;
  formDefinitionId: string;
  formName: string;
  formDescription?: string;
  onComplete?: () => void;
}

export const DynamicAssessmentForm = ({ 
  clientId, 
  formDefinitionId, 
  formName, 
  formDescription,
  onComplete 
}: DynamicAssessmentFormProps) => {
  const { submitAssessment, loading, loadQuestions } = useAssessmentEngine(clientId);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [comments, setComments] = useState('');
  const [questionsLoading, setQuestionsLoading] = useState(true);

  useEffect(() => {
    loadFormQuestions();
  }, [formDefinitionId]);

  const loadFormQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const questionsData = await loadQuestions(formDefinitionId);
      setQuestions(questionsData);
      
      // Initialize answers with default values
      const defaultAnswers: Record<string, any> = {};
      questionsData.forEach(q => {
        if (q.question_type === 'scale') {
          defaultAnswers[q.question_key] = Math.ceil(((q.max_value || 5) + (q.min_value || 1)) / 2);
        } else if (q.question_type === 'boolean') {
          defaultAnswers[q.question_key] = false;
        } else {
          defaultAnswers[q.question_key] = '';
        }
      });
      setAnswers(defaultAnswers);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleAnswerChange = (questionKey: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const handleSubmit = async () => {
    const result = await submitAssessment(formDefinitionId, answers, comments);
    if (result && onComplete) {
      onComplete();
    }
  };

  const renderQuestion = (question: AssessmentQuestion) => {
    const value = answers[question.question_key];

    switch (question.question_type) {
      case 'scale':
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium">{question.question_text}</Label>
            <div className="px-2">
              <Slider
                value={[value || question.min_value || 1]}
                onValueChange={(newValue) => handleAnswerChange(question.question_key, newValue[0])}
                max={question.max_value || 5}
                min={question.min_value || 1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Låg ({question.min_value})</span>
                <span className="font-medium text-primary">
                  {value || question.min_value || 1}
                </span>
                <span>Hög ({question.max_value})</span>
              </div>
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div key={question.id} className="flex items-center space-x-2">
            <Checkbox
              id={question.question_key}
              checked={value || false}
              onCheckedChange={(checked) => handleAnswerChange(question.question_key, checked)}
            />
            <Label htmlFor={question.question_key} className="text-sm font-medium">
              {question.question_text}
            </Label>
          </div>
        );

      case 'multiple_choice':
        return (
          <div key={question.id} className="space-y-2">
            <Label className="text-sm font-medium">{question.question_text}</Label>
            <RadioGroup
              value={value || ''}
              onValueChange={(newValue) => handleAnswerChange(question.question_key, newValue)}
            >
              {question.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.question_key}-${index}`} />
                  <Label htmlFor={`${question.question_key}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'text':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.question_key} className="text-sm font-medium">
              {question.question_text}
            </Label>
            <Input
              id={question.question_key}
              value={value || ''}
              onChange={(e) => handleAnswerChange(question.question_key, e.target.value)}
              placeholder="Ditt svar..."
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.question_key} className="text-sm font-medium">
              {question.question_text}
            </Label>
            <Textarea
              id={question.question_key}
              value={value || ''}
              onChange={(e) => handleAnswerChange(question.question_key, e.target.value)}
              placeholder="Ditt svar..."
              rows={3}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (questionsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Laddar bedömningsformulär...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {formName}
        </CardTitle>
        {formDescription && (
          <p className="text-muted-foreground">{formDescription}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Inga frågor konfigurerade för detta formulär än.
          </p>
        ) : (
          <>
            {questions.map(renderQuestion)}

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
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Skickar bedömning...
                </>
              ) : (
                "Slutför bedömning"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};