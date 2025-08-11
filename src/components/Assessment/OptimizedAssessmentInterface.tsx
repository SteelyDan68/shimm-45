import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { PillarKey } from '@/types/sixPillarsModular';
import { useOptimizedAssessmentFlow } from '@/hooks/useOptimizedAssessmentFlow';
import { useIntelligentPillarNavigation } from '@/hooks/useIntelligentPillarNavigation';

interface OptimizedAssessmentInterfaceProps {
  pillarKey: PillarKey;
  questions: any[];
  onComplete?: () => void;
}

export const OptimizedAssessmentInterface: React.FC<OptimizedAssessmentInterfaceProps> = ({
  pillarKey,
  questions,
  onComplete
}) => {
  const { flowState, saveProgress, completeAssessment, updateStep } = useOptimizedAssessmentFlow(pillarKey);
  const { navigateToNextPillar } = useIntelligentPillarNavigation();
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && flowState.hasUnsavedChanges) {
      const saveTimer = setTimeout(() => {
        saveProgress(answers);
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(saveTimer);
    }
  }, [answers, autoSaveEnabled, flowState.hasUnsavedChanges, saveProgress]);

  const handleAnswerChange = (questionKey: string, value: any, score?: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));

    if (score !== undefined) {
      setScores(prev => ({
        ...prev,
        [questionKey]: score
      }));
    }

    updateStep(Math.ceil(Object.keys(answers).length / questions.length * flowState.totalSteps));
  };

  const handleComplete = async () => {
    const result = await completeAssessment(answers, scores);
    
    if (result.success) {
      if (onComplete) {
        onComplete();
      } else {
        // Navigate to next logical step
        setTimeout(() => {
          navigateToNextPillar(pillarKey);
        }, 2000);
      }
    }
  };

  const progressPercentage = (flowState.currentStep / flowState.totalSteps) * 100;
  const isComplete = Object.keys(answers).length >= questions.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">
                {pillarKey.replace('_', ' ').toUpperCase()} Självskattning
              </h2>
            </div>
            <Badge variant={isComplete ? "default" : "secondary"}>
              {Object.keys(answers).length} / {questions.length}
            </Badge>
          </div>
          
          <Progress value={progressPercentage} className="mb-2" />
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Steg {flowState.currentStep} av {flowState.totalSteps}</span>
            <div className="flex items-center gap-2">
              {autoSaveEnabled && flowState.hasUnsavedChanges && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Sparar automatiskt...</span>
                </div>
              )}
              {!flowState.hasUnsavedChanges && Object.keys(answers).length > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Sparat</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Questions */}
      <div className="grid gap-4">
        {questions.map((question, index) => (
          <Card key={question.id || index} className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{question.question_text}</CardTitle>
            </CardHeader>
            <CardContent>
              {question.question_type === 'scale' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Inte alls</span>
                    <span>Mycket</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(value => (
                      <Button
                        key={value}
                        variant={answers[question.question_key] === value ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAnswerChange(question.question_key, value, value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {question.question_type === 'multiple_choice' && (
                <div className="space-y-2">
                  {question.options?.map((option: any, optionIndex: number) => (
                    <Button
                      key={optionIndex}
                      variant={answers[question.question_key] === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleAnswerChange(question.question_key, option.value, option.score)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Completion Section */}
      {isComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Redo att slutföra!</h3>
                <p className="text-green-700">
                  Du har svarat på alla frågor. Klicka nedan för AI-analys och personliga rekommendationer.
                </p>
              </div>
              <Button 
                onClick={handleComplete}
                disabled={flowState.isCompleting}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {flowState.isCompleting ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Genererar AI-analys...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Slutför självskattning
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Recovery */}
      {flowState.errorRetryCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <span>
                Det uppstod ett problem. Dina svar är sparade och du kan försöka igen.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};