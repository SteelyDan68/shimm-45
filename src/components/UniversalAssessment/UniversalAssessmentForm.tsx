import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useUniversalAssessment } from '@/hooks/useUniversalAssessment';
import type { AssessmentContext, UniversalQuestion } from '@/types/universalAssessment';

interface UniversalAssessmentFormProps {
  clientId: string;
  context: AssessmentContext;
  onComplete: (result: any) => void;
  targetAudience?: string;
}

export const UniversalAssessmentForm: React.FC<UniversalAssessmentFormProps> = ({
  clientId,
  context,
  onComplete,
  targetAudience
}) => {
  const { getOptimalTemplate, submitAssessment, isLoading } = useUniversalAssessment();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [questions, setQuestions] = useState<UniversalQuestion[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    const loadTemplate = async () => {
      const template = await getOptimalTemplate(context, clientId, targetAudience);
      if (template) {
        setQuestions(template.questions);
        setStartTime(Date.now());
      }
    };
    loadTemplate();
  }, [context, clientId, targetAudience, getOptimalTemplate]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleAnswer = (value: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.key]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const completionTime = Math.floor((Date.now() - startTime) / 1000);
    const templateId = `template_${context}_universal`;
    
    const result = await submitAssessment(templateId, clientId, answers, completionTime);
    if (result) {
      onComplete(result);
    }
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const currentAnswer = answers[currentQuestion.key];

    switch (currentQuestion.type) {
      case 'text':
        return (
          <Input
            value={currentAnswer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Skriv ditt svar..."
            className="mt-4"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={currentAnswer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Beskriv dina tankar..."
            className="mt-4 min-h-[120px]"
          />
        );

      case 'scale':
        return (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{currentQuestion.min_value || 1}</span>
              <span>{currentQuestion.max_value || 10}</span>
            </div>
            <Slider
              value={[currentAnswer || 5]}
              onValueChange={(values) => handleAnswer(values[0])}
              min={currentQuestion.min_value || 1}
              max={currentQuestion.max_value || 10}
              step={1}
              className="mt-2"
            />
            <div className="text-center mt-3">
              <span className="text-lg font-semibold">{currentAnswer || 5}</span>
            </div>
          </div>
        );

      case 'boolean':
        return (
          <RadioGroup
            value={currentAnswer?.toString() || ''}
            onValueChange={(value) => handleAnswer(value === 'true')}
            className="mt-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="yes" />
              <Label htmlFor="yes">Ja</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="no" />
              <Label htmlFor="no">Nej</Label>
            </div>
          </RadioGroup>
        );

      case 'multiple_choice':
        return (
          <RadioGroup
            value={currentAnswer || ''}
            onValueChange={handleAnswer}
            className="mt-4"
          >
            {currentQuestion.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      default:
        return (
          <Input
            value={currentAnswer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="mt-4"
          />
        );
    }
  };

  const isAnswered = currentQuestion && answers[currentQuestion.key] !== undefined;
  const canProceed = !currentQuestion?.required || isAnswered;

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Förbereder din personliga bedömning...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              Fråga {currentQuestionIndex + 1} av {questions.length}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {progress.toFixed(0)}% klar
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <CardDescription className="text-base leading-relaxed">
            {currentQuestion.text}
          </CardDescription>
          
          {currentQuestion.pillar_relevance && (
            <div className="mt-2 text-xs text-muted-foreground">
              Påverkar: {currentQuestion.pillar_relevance.join(', ')}
            </div>
          )}
        </div>

        {renderQuestionInput()}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Föregående
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed || isLoading}
          >
            {isLoading ? 'Analyserar...' : 
             currentQuestionIndex === questions.length - 1 ? 'Slutför bedömning' : 'Nästa'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};