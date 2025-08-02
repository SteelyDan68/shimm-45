import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { WheelOfLifeSection } from './WheelOfLifeSection';
import { AdaptiveQuestionsSection } from './AdaptiveQuestionsSection';
import { FreeTextSection } from './FreeTextSection';
import { QuickWinsSection } from './QuickWinsSection';
import { WelcomeAssessmentData } from '@/types/welcomeAssessment';
import { useWelcomeAssessment } from '@/hooks/useWelcomeAssessment';
import { useStefanPersonality } from '@/hooks/useStefanPersonality';
import { useToast } from '@/hooks/use-toast';
import { WHEEL_OF_LIFE_AREAS, FREE_TEXT_QUESTIONS, QUICK_WINS_QUESTIONS, ADAPTIVE_QUESTIONS } from '@/config/welcomeAssessment';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface WelcomeAssessmentFormProps {
  onComplete?: (result: any) => void;
}

type AssessmentStep = 'wheel_of_life' | 'adaptive' | 'free_text' | 'quick_wins' | 'review';

export const WelcomeAssessmentForm = ({ onComplete }: WelcomeAssessmentFormProps) => {
  const { submitWelcomeAssessment, submitting } = useWelcomeAssessment();
  const { createStefanInteraction } = useStefanPersonality();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('wheel_of_life');
  const [assessmentData, setAssessmentData] = useState<WelcomeAssessmentData>({
    wheelOfLife: {},
    adaptiveQuestions: {},
    freeTextResponses: {},
    quickWins: {},
  });

  const [adaptiveQuestions, setAdaptiveQuestions] = useState<any[]>([]);

  // Generate adaptive questions based on low Wheel of Life scores
  useEffect(() => {
    if (currentStep === 'adaptive') {
      const lowAreas = Object.entries(assessmentData.wheelOfLife)
        .filter(([_, score]) => score <= 5)
        .map(([area, _]) => area)
        .slice(0, 3); // Max 3 areas to avoid overwhelming

      const generatedQuestions: any[] = [];
      lowAreas.forEach(area => {
        const questionsForArea = ADAPTIVE_QUESTIONS[area] || [];
        generatedQuestions.push(...questionsForArea.slice(0, 2)); // Max 2 questions per area
      });

      setAdaptiveQuestions(generatedQuestions.slice(0, 15)); // Max 15 total
    }
  }, [currentStep, assessmentData.wheelOfLife]);

  const updateWheelOfLife = (scores: Record<string, number>) => {
    setAssessmentData(prev => ({
      ...prev,
      wheelOfLife: scores,
    }));
  };

  const updateAdaptiveQuestions = (answers: Record<string, any>) => {
    setAssessmentData(prev => ({
      ...prev,
      adaptiveQuestions: answers,
    }));
  };

  const updateFreeText = (responses: Record<string, string>) => {
    setAssessmentData(prev => ({
      ...prev,
      freeTextResponses: responses,
    }));
  };

  const updateQuickWins = (answers: Record<string, any>) => {
    setAssessmentData(prev => ({
      ...prev,
      quickWins: answers,
    }));
  };

  const getStepProgress = () => {
    const steps: AssessmentStep[] = ['wheel_of_life', 'adaptive', 'free_text', 'quick_wins', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'wheel_of_life':
        // Kräver att alla områden har bedömts (inte standardvärdet 5)
        const wheelAreas = WHEEL_OF_LIFE_AREAS.length;
        const completedAreas = Object.keys(assessmentData.wheelOfLife).length;
        // Acceptera om användaren har rört vid alla områden
        return completedAreas >= wheelAreas;
      case 'adaptive':
        return adaptiveQuestions.length === 0 || Object.keys(assessmentData.adaptiveQuestions).length >= Math.min(adaptiveQuestions.length, 10);
      case 'free_text':
        return Object.keys(assessmentData.freeTextResponses).length >= 6; // Minst 6 av 10 frågor
      case 'quick_wins':
        return Object.keys(assessmentData.quickWins).length >= 4; // Minst 4 av 7 frågor
      default:
        return true;
    }
  };

  const getStepValidationMessage = () => {
    switch (currentStep) {
      case 'wheel_of_life':
        const wheelAreas = WHEEL_OF_LIFE_AREAS.length;
        const completedAreas = Object.keys(assessmentData.wheelOfLife).length;
        return completedAreas < wheelAreas 
          ? `Betygsätt alla ${wheelAreas} områden för att fortsätta (${completedAreas}/${wheelAreas} klara)`
          : '';
      case 'adaptive':
        if (adaptiveQuestions.length === 0) return '';
        const required = Math.min(adaptiveQuestions.length, 10);
        const completed = Object.keys(assessmentData.adaptiveQuestions).length;
        return completed < required 
          ? `Svara på minst ${required} frågor för att fortsätta (${completed}/${required} klara)`
          : '';
      case 'free_text':
        const freeTextCompleted = Object.keys(assessmentData.freeTextResponses).length;
        return freeTextCompleted < 6 
          ? `Svara på minst 6 frågor för att fortsätta (${freeTextCompleted}/6 klara)`
          : '';
      case 'quick_wins':
        const quickWinsCompleted = Object.keys(assessmentData.quickWins).length;
        return quickWinsCompleted < 4 
          ? `Svara på minst 4 frågor för att fortsätta (${quickWinsCompleted}/4 klara)`
          : '';
      default:
        return '';
    }
  };

  const goToNextStep = () => {
    if (!canProceedToNextStep()) {
      toast({
        title: "Ofullständigt steg",
        description: getStepValidationMessage(),
        variant: "destructive"
      });
      return;
    }

    const steps: AssessmentStep[] = ['wheel_of_life', 'adaptive', 'free_text', 'quick_wins', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      // Spara progress automatiskt
      saveProgress();
    }
  };

  const goToPreviousStep = () => {
    const steps: AssessmentStep[] = ['wheel_of_life', 'adaptive', 'free_text', 'quick_wins', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const saveProgress = async () => {
    try {
      await submitWelcomeAssessment(assessmentData); // Save as draft
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleSubmit = async () => {
    const result = await submitWelcomeAssessment(assessmentData);
    
    if (result) {
      // Trigger Stefan welcome interaction
      await createStefanInteraction(
        'assessment_completion',
        'welcome_assessment',
        {
          assessment_type: 'welcome',
          total_questions: 40,
          completion_time: Date.now(),
          wheel_scores: assessmentData.wheelOfLife,
        }
      );
      
      if (onComplete) {
        onComplete(result);
      }
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'wheel_of_life':
        return 'Livets hjul - Överblick';
      case 'adaptive':
        return 'Fördjupning';
      case 'free_text':
        return 'Din historia';
      case 'quick_wins':
        return 'Snabba vinster';
      case 'review':
        return 'Sammanfattning';
      default:
        return 'Välkomstbedömning';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'wheel_of_life':
        return 'Betygsätt olika områden i ditt liv på en skala från 1-10';
      case 'adaptive':
        return 'Låt oss fördjupa oss inom de områden som behöver extra uppmärksamhet';
      case 'free_text':
        return 'Berätta din historia och dela dina tankar med oss';
      case 'quick_wins':
        return 'Identifiera enkla förändringar som kan ge snabba resultat';
      case 'review':
        return 'Granska dina svar innan du slutför bedömningen';
      default:
        return '';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'wheel_of_life':
        return (
          <WheelOfLifeSection
            scores={assessmentData.wheelOfLife}
            onScoresChange={updateWheelOfLife}
          />
        );
      case 'adaptive':
        return (
          <AdaptiveQuestionsSection
            questions={adaptiveQuestions}
            answers={assessmentData.adaptiveQuestions}
            onAnswersChange={updateAdaptiveQuestions}
          />
        );
      case 'free_text':
        return (
          <FreeTextSection
            questions={FREE_TEXT_QUESTIONS}
            responses={assessmentData.freeTextResponses}
            onResponsesChange={updateFreeText}
          />
        );
      case 'quick_wins':
        return (
          <QuickWinsSection
            questions={QUICK_WINS_QUESTIONS}
            answers={assessmentData.quickWins}
            onAnswersChange={updateQuickWins}
          />
        );
      case 'review':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Livets hjul genomsnitt</h4>
                <div className="text-2xl font-bold text-primary">
                  {Object.values(assessmentData.wheelOfLife).length > 0
                    ? (Object.values(assessmentData.wheelOfLife).reduce((a, b) => a + b, 0) / Object.values(assessmentData.wheelOfLife).length).toFixed(1)
                    : 0}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Besvarade frågor</h4>
                <div className="flex gap-2">
                  <Badge variant="outline">{Object.keys(assessmentData.wheelOfLife).length}/8 Livets hjul</Badge>
                  <Badge variant="outline">{Object.keys(assessmentData.adaptiveQuestions).length}/{adaptiveQuestions.length} Fördjupning</Badge>
                  <Badge variant="outline">{Object.keys(assessmentData.freeTextResponses).length}/10 Fritext</Badge>
                  <Badge variant="outline">{Object.keys(assessmentData.quickWins).length}/7 Snabba vinster</Badge>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Bedömningen är redo att skickas!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Din bedömning kommer att analyseras av vår AI och du kommer få personliga insikter och rekommendationer.
                Stefan kommer också att ta kontakt med dig för att diskutera resultaten.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start mb-4">
          <div>
            <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
            <p className="text-muted-foreground mt-1">{getStepDescription()}</p>
          </div>
          <Badge variant="outline">
            Steg {['wheel_of_life', 'adaptive', 'free_text', 'quick_wins', 'review'].indexOf(currentStep) + 1} av 5
          </Badge>
        </div>
        
        <Progress value={getStepProgress()} className="w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        {renderStepContent()}

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 'wheel_of_life'}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Föregående
          </Button>

          {currentStep === 'review' ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2"
            >
              {submitting ? 'Slutför bedömning...' : 'Slutför bedömning'}
              <CheckCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={goToNextStep}
              disabled={!canProceedToNextStep()}
              className="flex items-center gap-2"
            >
              Nästa
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};