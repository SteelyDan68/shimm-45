import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, Heart, Lightbulb, Users, Calendar } from 'lucide-react';
import { useFivePillarsModular } from '@/hooks/useFivePillarsModular';

interface OpenTrackAssessmentFormProps {
  clientId: string;
  onComplete?: () => void;
}

export function OpenTrackAssessmentForm({ clientId, onComplete }: OpenTrackAssessmentFormProps) {
  const { submitPillarAssessment, loading } = useFivePillarsModular(clientId);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const handleAnswerChange = (key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Beräkna score baserat på vårt scoring system från config
      const score = calculateOpenTrackScore(answers);
      await submitPillarAssessment('open_track', answers, score);
      onComplete?.();
    } catch (error) {
      console.error('Error submitting open track assessment:', error);
    }
  };

  const calculateOpenTrackScore = (answers: Record<string, any>) => {
    let totalScore = 0;
    let components = 0;
    
    // Målklarhet (30% av total score)
    const goalClarity = (answers.change_goal?.length > 10 ? 7 : 3) + 
                       (answers.goal_importance?.length > 20 ? 7 : 3) + 
                       (answers.success_vision?.length > 30 ? 8 : 4);
    totalScore += (goalClarity / 22) * 3;
    components++;
    
    // Motivation och självförtroende (25% av total score)
    const motivationScore = ((answers.motivation_level || 5) + (answers.confidence_level || 5)) / 2;
    totalScore += (motivationScore / 10) * 2.5;
    components++;
    
    // Kapacitet och realism (25% av total score)
    const hasRealisticTimeframe = answers.total_timeframe && answers.daily_time_commitment;
    const urgencyBalance = answers.urgency_level >= 3 && answers.urgency_level <= 8;
    const capacityScore = (hasRealisticTimeframe ? 6 : 3) + (urgencyBalance ? 4 : 2);
    totalScore += (capacityScore / 10) * 2.5;
    components++;
    
    // Förberedelse och insikt (20% av total score)
    const preparationScore = (answers.current_situation?.length > 15 ? 5 : 2) + 
                            (answers.main_challenges?.length > 15 ? 5 : 2);
    totalScore += (preparationScore / 10) * 2;
    components++;
    
    return components > 0 ? Math.round((totalScore / components) * 10) / 10 : 5;
  };

  const canProceed = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return answers.change_goal?.length > 10 && answers.goal_importance?.length > 10;
      case 2:
        return answers.success_vision?.length > 20 && answers.current_situation?.length > 10;
      case 3:
        return answers.main_challenges?.length > 10 && answers.previous_attempts?.length > 5;
      case 4:
        return answers.daily_time_commitment && answers.total_timeframe && typeof answers.urgency_level === 'number';
      case 5:
        return typeof answers.motivation_level === 'number' && typeof answers.confidence_level === 'number';
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Target className="mx-auto h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Ditt personliga mål</h3>
              <p className="text-muted-foreground">Berätta vad du vill förändra eller utveckla</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="change_goal" className="text-base font-medium">
                  Vad vill du specifikt förändra eller utveckla? *
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Var så specifik som möjligt. T.ex. "Jag vill sluta snusa", "Jag vill bli bättre på att lära känna mig själv"
                </p>
                <Textarea
                  id="change_goal"
                  placeholder="Beskriv ditt mål..."
                  value={answers.change_goal || ''}
                  onChange={(e) => handleAnswerChange('change_goal', e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{answers.change_goal?.length || 0} tecken</span>
                  <span>Minimum 10 tecken</span>
                </div>
              </div>

              <div>
                <Label htmlFor="goal_importance" className="text-base font-medium">
                  Varför är denna förändring viktig för dig? *
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Vad motiverar dig? Vad händer om du inte gör denna förändring?
                </p>
                <Textarea
                  id="goal_importance"
                  placeholder="Beskriv varför detta är viktigt..."
                  value={answers.goal_importance || ''}
                  onChange={(e) => handleAnswerChange('goal_importance', e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{answers.goal_importance?.length || 0} tecken</span>
                  <span>Minimum 10 tecken</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Lightbulb className="mx-auto h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Vision och nuläge</h3>
              <p className="text-muted-foreground">Hur ser framgång ut och var står du idag?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="success_vision" className="text-base font-medium">
                  Hur ser framgång ut för dig? *
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Beskriv så detaljerat som möjligt hur livet ser ut när du har lyckats med denna förändring
                </p>
                <Textarea
                  id="success_vision"
                  placeholder="När jag har lyckats så..."
                  value={answers.success_vision || ''}
                  onChange={(e) => handleAnswerChange('success_vision', e.target.value)}
                  className="min-h-[120px]"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{answers.success_vision?.length || 0} tecken</span>
                  <span>Minimum 20 tecken</span>
                </div>
              </div>

              <div>
                <Label htmlFor="current_situation" className="text-base font-medium">
                  Hur ser din situation ut idag? *
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Beskriv ditt nuläge inom detta område
                </p>
                <Textarea
                  id="current_situation"
                  placeholder="Just nu så..."
                  value={answers.current_situation || ''}
                  onChange={(e) => handleAnswerChange('current_situation', e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{answers.current_situation?.length || 0} tecken</span>
                  <span>Minimum 10 tecken</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Heart className="mx-auto h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Utmaningar och tidigare försök</h3>
              <p className="text-muted-foreground">Vad har varit svårt och vad har du redan provat?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="main_challenges" className="text-base font-medium">
                  Vilka är dina största utmaningar eller hinder? *
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Vad gör denna förändring svår för dig?
                </p>
                <Textarea
                  id="main_challenges"
                  placeholder="Mina största utmaningar är..."
                  value={answers.main_challenges || ''}
                  onChange={(e) => handleAnswerChange('main_challenges', e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{answers.main_challenges?.length || 0} tecken</span>
                  <span>Minimum 10 tecken</span>
                </div>
              </div>

              <div>
                <Label htmlFor="previous_attempts" className="text-base font-medium">
                  Vad har du redan provat för att förändra detta? *
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Även om du inte har provat något specifikt, skriv "Ingenting än så länge"
                </p>
                <Textarea
                  id="previous_attempts"
                  placeholder="Jag har provat..."
                  value={answers.previous_attempts || ''}
                  onChange={(e) => handleAnswerChange('previous_attempts', e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{answers.previous_attempts?.length || 0} tecken</span>
                  <span>Minimum 5 tecken</span>
                </div>
              </div>

              <div>
                <Label htmlFor="challenge_background" className="text-base font-medium">
                  Beskriv bakgrunden till denna utmaning
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Hur länge har den funnits? När märkte du det första gången?
                </p>
                <Textarea
                  id="challenge_background"
                  placeholder="Denna utmaning började..."
                  value={answers.challenge_background || ''}
                  onChange={(e) => handleAnswerChange('challenge_background', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Clock className="mx-auto h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Din kapacitet och tidsplanering</h3>
              <p className="text-muted-foreground">Hur mycket tid och energi kan du avsätta?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  Hur mycket tid per dag kan du realistiskt avsätta? *
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Var ärlig - det är bättre med lite tid konsekvent än mycket tid sporadiskt
                </p>
                <Select value={answers.daily_time_commitment} onValueChange={(value) => handleAnswerChange('daily_time_commitment', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj din dagliga kapacitet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5-10 minuter">5-10 minuter</SelectItem>
                    <SelectItem value="15-30 minuter">15-30 minuter</SelectItem>
                    <SelectItem value="30-60 minuter">30-60 minuter</SelectItem>
                    <SelectItem value="1-2 timmar">1-2 timmar</SelectItem>
                    <SelectItem value="Mer än 2 timmar">Mer än 2 timmar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">
                  Vilka dagar i veckan passar bäst? *
                </Label>
                <Select value={answers.weekly_schedule} onValueChange={(value) => handleAnswerChange('weekly_schedule', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj ditt veckoschema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Varje dag">Varje dag</SelectItem>
                    <SelectItem value="Vardagar">Vardagar</SelectItem>
                    <SelectItem value="Helger">Helger</SelectItem>
                    <SelectItem value="Specifika dagar (beskriv i kommentar)">Specifika dagar</SelectItem>
                    <SelectItem value="Oregelbundet när jag har tid">Oregelbundet när jag har tid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">
                  Hur lång tid föreställer du dig att denna förändring behöver ta? *
                </Label>
                <Select value={answers.total_timeframe} onValueChange={(value) => handleAnswerChange('total_timeframe', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj tidsram" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-4 veckor">1-4 veckor</SelectItem>
                    <SelectItem value="1-3 månader">1-3 månader</SelectItem>
                    <SelectItem value="3-6 månader">3-6 månader</SelectItem>
                    <SelectItem value="6-12 månader">6-12 månader</SelectItem>
                    <SelectItem value="Mer än ett år">Mer än ett år</SelectItem>
                    <SelectItem value="Det spelar ingen roll">Det spelar ingen roll</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">
                  Hur akut känns denna förändring för dig? *
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  1 = Kan vänta, 10 = Måste ske nu
                </p>
                <div className="space-y-2">
                  <Slider
                    value={[answers.urgency_level || 5]}
                    onValueChange={(value) => handleAnswerChange('urgency_level', value[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Kan vänta (1)</span>
                    <Badge variant="outline">{answers.urgency_level || 5}</Badge>
                    <span>Måste ske nu (10)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Users className="mx-auto h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Motivation och självförtroende</h3>
              <p className="text-muted-foreground">Hur känner du inför denna förändring?</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">
                  Hur motiverad känner du dig just nu? *
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  1 = Inte alls motiverad, 10 = Extremt motiverad
                </p>
                <div className="space-y-2">
                  <Slider
                    value={[answers.motivation_level || 5]}
                    onValueChange={(value) => handleAnswerChange('motivation_level', value[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Inte alls (1)</span>
                    <Badge variant="outline">{answers.motivation_level || 5}</Badge>
                    <span>Extremt (10)</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">
                  Hur säker är du på att du kan lyckas? *
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  1 = Inte säker alls, 10 = Helt säker
                </p>
                <div className="space-y-2">
                  <Slider
                    value={[answers.confidence_level || 5]}
                    onValueChange={(value) => handleAnswerChange('confidence_level', value[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Inte säker (1)</span>
                    <Badge variant="outline">{answers.confidence_level || 5}</Badge>
                    <span>Helt säker (10)</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="available_resources" className="text-base font-medium">
                  Vilka resurser, verktyg eller hjälp har du tillgång till?
                </Label>
                <Textarea
                  id="available_resources"
                  placeholder="Jag har tillgång till..."
                  value={answers.available_resources || ''}
                  onChange={(e) => handleAnswerChange('available_resources', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="support_system" className="text-base font-medium">
                  Vem i din omgivning kan stötta dig?
                </Label>
                <Textarea
                  id="support_system"
                  placeholder="Familj, vänner, kollegor..."
                  value={answers.support_system || ''}
                  onChange={(e) => handleAnswerChange('support_system', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Calendar className="mx-auto h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Avslutande reflektion</h3>
              <p className="text-muted-foreground">Sista detaljerna för din utvecklingsresa</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="emotional_connection" className="text-base font-medium">
                  Vilka känslor väcker denna förändring hos dig?
                </Label>
                <Textarea
                  id="emotional_connection"
                  placeholder="Jag känner..."
                  value={answers.emotional_connection || ''}
                  onChange={(e) => handleAnswerChange('emotional_connection', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="biggest_fear" className="text-base font-medium">
                  Vad är du mest rädd för när det gäller denna förändring?
                </Label>
                <Textarea
                  id="biggest_fear"
                  placeholder="Min största oro är..."
                  value={answers.biggest_fear || ''}
                  onChange={(e) => handleAnswerChange('biggest_fear', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label className="text-base font-medium">
                  Föredrar du små dagliga framsteg eller större veckovisa mål?
                </Label>
                <Select value={answers.milestone_preferences} onValueChange={(value) => handleAnswerChange('milestone_preferences', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj din preferens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Små dagliga steg">Små dagliga steg</SelectItem>
                    <SelectItem value="Större veckovisa mål">Större veckovisa mål</SelectItem>
                    <SelectItem value="En blandning av båda">En blandning av båda</SelectItem>
                    <SelectItem value="Låt coachen bestämma">Låt coachen bestämma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="additional_context" className="text-base font-medium">
                  Finns det något annat viktigt att veta?
                </Label>
                <Textarea
                  id="additional_context"
                  placeholder="Ytterligare information..."
                  value={answers.additional_context || ''}
                  onChange={(e) => handleAnswerChange('additional_context', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🛤️ Öppet Spår Assessment
            </CardTitle>
            <CardDescription>
              Din personliga utvecklingsresa - steg {step} av {totalSteps}
            </CardDescription>
          </div>
          <Badge variant="outline">{Math.round(progress)}% klar</Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        {renderStep()}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Föregående
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed(step)}
            >
              Nästa
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Sparar...' : 'Skicka Assessment'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}