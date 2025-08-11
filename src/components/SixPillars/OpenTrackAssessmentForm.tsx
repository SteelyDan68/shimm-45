import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useSixPillarsModular } from '@/hooks/useSixPillarsModular';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { HelpTooltip } from '@/components/HelpTooltip';
import { Compass, ArrowRight, Lightbulb, Target, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OpenTrackAssessmentFormProps {
  onComplete?: () => void;
}

interface AssessmentStep {
  id: string;
  title: string;
  description: string;
  type: 'vision' | 'exploration' | 'capacity' | 'planning';
  questions: AssessmentQuestion[];
}

interface AssessmentQuestion {
  key: string;
  text: string;
  type: 'text' | 'slider' | 'multiple_choice' | 'checkboxes';
  options?: string[];
  min?: number;
  max?: number;
  conditional?: (answers: Record<string, any>) => boolean;
  aiAnalysis?: boolean;
}

export function OpenTrackAssessmentForm({ onComplete }: OpenTrackAssessmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { submitPillarAssessment } = useSixPillarsModular(user?.id || '');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});

  const assessmentSteps: AssessmentStep[] = [
    {
      id: 'vision',
      title: 'Din Vision',
      description: 'Låt oss utforska vad som verkligen inspirerar dig',
      type: 'vision',
      questions: [
        {
          key: 'life_vision',
          text: 'Om du kunde leva ditt drömmliv om 5 år, hur skulle det se ut?',
          type: 'text',
          aiAnalysis: true
        },
        {
          key: 'passion_discovery',
          text: 'Vad får dig att tappa tidskänslan? När känner du dig mest levande?',
          type: 'text',
          aiAnalysis: true
        },
        {
          key: 'untapped_potential',
          text: 'Finns det något du alltid velat pröva men aldrig vågat?',
          type: 'text'
        },
        {
          key: 'legacy_desire',
          text: 'Vilken typ av påverkan vill du ha på världen eller andra människor?',
          type: 'text',
          aiAnalysis: true
        }
      ]
    },
    {
      id: 'exploration',
      title: 'Utforskningsområden',
      description: 'Identifiera dina mest spännande utvecklingsmöjligheter',
      type: 'exploration',
      questions: [
        {
          key: 'exploration_areas',
          text: 'Vilka områden lockar dig mest att utforska?',
          type: 'checkboxes',
          options: [
            'Kreativitet & Konstnärligt uttryck',
            'Relationer & Djup kommunikation',
            'Spiritualitet & Inre utveckling',
            'Livslångt lärande & Intellektuell nyfikenhet',
            'Äventyr & Nya kulturella upplevelser',
            'Syfte & Meningsfullhet',
            'Ledarskap & Påverkan',
            'Innovation & Entreprenörskap',
            'Kroppslig hälsa & Extremsporter',
            'Miljöengagemang & Hållbarhet'
          ]
        },
        {
          key: 'curiosity_level',
          text: 'Hur stark är din nyfikenhet att utforska okända områden? (1-10)',
          type: 'slider',
          min: 1,
          max: 10
        },
        {
          key: 'risk_appetite',
          text: 'Hur bekväm är du med att ta risker för din utveckling? (1-10)',
          type: 'slider',
          min: 1,
          max: 10
        },
        {
          key: 'innovation_style',
          text: 'Hur föredrar du att innovera och utforska?',
          type: 'multiple_choice',
          options: [
            'Systematiskt och metodiskt',
            'Intuitivt och experimentellt',
            'Tillsammans med andra',
            'Genom reflektion och meditation',
            'Genom handling och praktik'
          ]
        }
      ]
    },
    {
      id: 'capacity',
      title: 'Din Kapacitet',
      description: 'Utvärdera dina resurser och förutsättningar',
      type: 'capacity',
      questions: [
        {
          key: 'time_availability',
          text: 'Hur mycket tid kan du realistiskt dedikera till utforskning per vecka?',
          type: 'multiple_choice',
          options: [
            '1-3 timmar per vecka',
            '4-7 timmar per vecka',
            '8-15 timmar per vecka',
            '16+ timmar per vecka'
          ]
        },
        {
          key: 'energy_level',
          text: 'Hur skulle du beskriva din nuvarande energinivå? (1-10)',
          type: 'slider',
          min: 1,
          max: 10
        },
        {
          key: 'support_system',
          text: 'Hur stark är ditt stödsystem för personlig utveckling? (1-10)',
          type: 'slider',
          min: 1,
          max: 10
        },
        {
          key: 'obstacles',
          text: 'Vilka är dina största hinder för att utforska nytt?',
          type: 'checkboxes',
          options: [
            'Tidsbrist',
            'Ekonomiska begränsningar',
            'Rädsla för misslyckande',
            'Bristande självförtroende',
            'Familjeansvar',
            'Arbetskrav',
            'Sociala förväntningar',
            'Kunskapsbrist'
          ]
        }
      ]
    },
    {
      id: 'planning',
      title: 'Din Utvecklingsplan',
      description: 'Skapa en personlig roadmap för din resa',
      type: 'planning',
      questions: [
        {
          key: 'priority_focus',
          text: 'Baserat på dina svar, vilket område känns mest angeläget att utforska först?',
          type: 'text',
          conditional: (answers) => answers.exploration_areas?.length > 0
        },
        {
          key: 'success_metrics',
          text: 'Hur kommer du att veta att du gör framsteg?',
          type: 'text'
        },
        {
          key: 'commitment_level',
          text: 'Hur dedikerad är du till denna utvecklingsresa? (1-10)',
          type: 'slider',
          min: 1,
          max: 10
        },
        {
          key: 'preferred_timeline',
          text: 'Vilken tidsram känns mest realistisk för dig?',
          type: 'multiple_choice',
          options: [
            '4 veckor - Kort intensiv utforskning',
            '6 veckor - Djupare förståelse',
            '10 veckor - Grundlig transformation'
          ]
        },
        {
          key: 'additional_thoughts',
          text: 'Finns det något mer du vill dela om din utvecklingsresa?',
          type: 'text'
        }
      ]
    }
  ];

  const currentStepData = assessmentSteps[currentStep];
  const progress = ((currentStep + 1) / assessmentSteps.length) * 100;

  // AI Analysis för vision step
  const generateAIInsight = async (questionKey: string, answer: string) => {
    if (!answer || answer.length < 10) return;

    try {
      const { data, error } = await supabase.functions.invoke('analyze-dynamic-assessment', {
        body: {
          user_id: user?.id,
          question_key: questionKey,
          answer: answer,
          assessment_type: 'open_track_vision',
          context: `Open Track pillar vision analysis for: ${questionKey}`
        }
      });

      if (!error && data?.insight) {
        setAiInsights(prev => ({
          ...prev,
          [questionKey]: data.insight
        }));
      }
    } catch (error) {
      console.error('AI insight generation failed:', error);
    }
  };

  const handleInputChange = async (questionKey: string, value: any) => {
    setFormData(prev => ({ ...prev, [questionKey]: value }));
    
    // Trigger AI analysis for vision questions with text input
    const question = currentStepData.questions.find(q => q.key === questionKey);
    if (question?.aiAnalysis && typeof value === 'string' && value.length > 20) {
      await generateAIInsight(questionKey, value);
    }
  };

  const nextStep = () => {
    if (currentStep < assessmentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    
    // Vision klarhet (30%)
    const visionQuestions = ['life_vision', 'passion_discovery', 'legacy_desire'];
    const visionScore = visionQuestions.reduce((sum, key) => {
      return sum + (formData[key]?.length > 50 ? 10 : formData[key]?.length > 20 ? 7 : 3);
    }, 0) / visionQuestions.length;
    score += (visionScore / 10) * 3;

    // Utforskningsvilja (25%)
    const explorationScore = (
      (formData.exploration_areas?.length || 0) * 2 +
      (formData.curiosity_level || 5) +
      (formData.risk_appetite || 5)
    ) / 4;
    score += Math.min(explorationScore, 10) / 10 * 2.5;

    // Kapacitet (25%)
    const capacityScore = (
      (formData.energy_level || 5) +
      (formData.support_system || 5) +
      (formData.obstacles?.length < 3 ? 8 : 5)
    ) / 3;
    score += (capacityScore / 10) * 2.5;

    // Commitment (20%)
    const commitmentScore = formData.commitment_level || 5;
    score += (commitmentScore / 10) * 2;

    return Math.round(score * 10) / 10;
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const score = calculateScore();
      
      const assessmentData = {
        ...formData,
        ai_insights: aiInsights,
        completed_steps: assessmentSteps.map(step => step.id),
        assessment_type: 'open_track_neuroplastic',
        timestamp: new Date().toISOString()
      };

      await submitPillarAssessment('open_track', assessmentData, score);

      toast({
        title: "Öppna spåret-bedömning genomförd!",
        description: "Din personliga utvecklingsresa har skapats med AI-insikter.",
      });

      onComplete?.();
    } catch (error) {
      console.error('Assessment submission failed:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara bedömningen. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: AssessmentQuestion) => {
    // Check conditional logic
    if (question.conditional && !question.conditional(formData)) {
      return null;
    }

    const value = formData[question.key];

    return (
      <div key={question.key} className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">{question.text}</Label>
          <HelpTooltip content={question.type === 'text' ? 'Skriv ett kort, konkret svar.' : question.type === 'multiple_choice' ? 'Välj det alternativ som passar bäst.' : question.type === 'checkboxes' ? 'Kryssa i alla alternativ som stämmer.' : 'Dra reglaget till den nivå som stämmer för dig.'} />
        </div>
        
        {question.type === 'text' && (
          <div className="space-y-2">
            <Textarea
              value={value || ''}
              onChange={(e) => handleInputChange(question.key, e.target.value)}
              placeholder="Dela dina tankar..."
              rows={4}
              className="resize-none"
            />
            {aiInsights[question.key] && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">AI-insikt</span>
                </div>
                <p className="text-sm text-blue-600">{aiInsights[question.key]}</p>
              </div>
            )}
          </div>
        )}

        {question.type === 'slider' && (
          <div className="space-y-2">
            <Slider
              value={[value || 5]}
              onValueChange={(values) => handleInputChange(question.key, values[0])}
              min={question.min || 1}
              max={question.max || 10}
              step={1}
              className="w-full"
            />
            <div className="text-center text-sm text-muted-foreground">
              Värde: {value || 5}
            </div>
          </div>
        )}

        {question.type === 'multiple_choice' && (
          <RadioGroup
            value={value || ''}
            onValueChange={(newValue) => handleInputChange(question.key, newValue)}
          >
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.key}-${option}`} />
                <Label htmlFor={`${question.key}-${option}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === 'checkboxes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.key}-${option}`}
                  checked={(value || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = value || [];
                    if (checked) {
                      handleInputChange(question.key, [...currentValues, option]);
                    } else {
                      handleInputChange(question.key, currentValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.key}-${option}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Compass className="h-8 w-8 text-purple-500" />
              <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1" />
            </div>
            <div>
<div className="flex items-center gap-2">
  <CardTitle className="text-2xl">Öppna spåret - Neuroplastisk utforskning</CardTitle>
  <HelpTooltip content="Ett öppet spår där dina svar formar en personlig utvecklingsresa." />
</div>
<CardDescription className="text-base">
  {currentStepData.description}
</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Steg {currentStep + 1} av {assessmentSteps.length}</div>
            <Progress value={progress} className="w-32 h-2 mt-1" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            {currentStepData.title}
            <HelpTooltip content="För detta steg: besvara frågorna för att hjälpa AI att skräddarsy din plan." />
          </h3>
          <p className="text-muted-foreground text-sm">{currentStepData.description}</p>
        </div>

        <div className="space-y-6">
          {currentStepData.questions.map(renderQuestion)}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Föregående
            </Button>
            <HelpTooltip content="Gå tillbaka utan att tappa dina svar." />
          </div>
          
          {currentStep < assessmentSteps.length - 1 ? (
            <div className="flex items-center gap-2">
              <Button onClick={nextStep} className="flex items-center gap-2">
                Nästa <ArrowRight className="h-4 w-4" />
              </Button>
              <HelpTooltip content="Gå vidare till nästa steg. Du kan alltid gå tillbaka." />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
              >
                {isSubmitting ? 'Skapar din resa...' : 'Slutför bedömning'}
                <Sparkles className="h-4 w-4" />
              </Button>
              <HelpTooltip content="Skicka in dina svar och generera en personlig utvecklingsplan." />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}