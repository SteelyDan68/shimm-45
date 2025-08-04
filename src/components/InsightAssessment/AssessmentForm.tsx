import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Brain, Send, BarChart3, Zap, Users, Activity } from 'lucide-react';
import { useInsightAssessment } from '@/hooks/useInsightAssessment';
import { useSixPillarsModular } from '@/hooks/useSixPillarsModular';

interface AssessmentFormProps {
  clientId: string;
  clientName: string;
  onComplete?: () => void;
}

const assessmentAreas = [
  'Mediestress',
  'Sociala medier-press', 
  'Kritik och hat',
  'Prestationsångest',
  'Tidsbrist',
  'Balans arbete/privatliv',
  'Ekonomisk oro',
  'Relationsproblem',
  'Hälsoproblem',
  'Självkänsla',
  'Perfektionism',
  'Kontrollbehov',
  'Ensamhet'
] as const;

// Funktionell tillgång (ja/nej/ibland)
const functionalAccessQuestions = [
  'Kan du laga eller äta bra mat?',
  'Har du en trygg plats att sova?',
  'Har du tillgång till dusch eller bad?',
  'Har du tillgång till internet och telefon?'
] as const;

// Subjektiva möjligheter (skala 1-5)
const subjectiveOpportunityQuestions = [
  'Hur lätt är det för dig att be om hjälp?',
  'Hur ofta kan du träna eller röra på dig?',
  'Hur ofta har du energi att svara på meddelanden eller mejl?',
  'Hur ofta har du möjlighet att läsa eller ta in längre information?'
] as const;

// Relationer (ja/nej + kommentar)
const relationshipQuestions = [
  'Har du någon du kan prata med regelbundet?',
  'Har du kontakt med någon familjemedlem eller nära vän?'
] as const;

export function AssessmentForm({ clientId, clientName, onComplete }: AssessmentFormProps) {
  const { submitAssessment, isSubmitting } = useInsightAssessment(clientId);
  const { submitPillarAssessment } = useSixPillarsModular(clientId);
  
  const [scores, setScores] = useState(() => {
    const initialScores: Record<string, number> = {};
    assessmentAreas.forEach(area => {
      initialScores[area] = 5;
    });
    return initialScores;
  });
  
  // Funktionell tillgång (ja/nej/ibland)
  const [functionalAccess, setFunctionalAccess] = useState(() => {
    const initial: Record<string, string> = {};
    functionalAccessQuestions.forEach(question => {
      initial[question] = 'ja';
    });
    return initial;
  });
  
  // Subjektiva möjligheter (1-5)
  const [subjectiveOpportunities, setSubjectiveOpportunities] = useState(() => {
    const initial: Record<string, number> = {};
    subjectiveOpportunityQuestions.forEach(question => {
      initial[question] = 3;
    });
    return initial;
  });
  
  // Relationer (ja/nej + kommentar)
  const [relationships, setRelationships] = useState(() => {
    const initial: Record<string, { answer: string; comment: string }> = {};
    relationshipQuestions.forEach(question => {
      initial[question] = { answer: 'ja', comment: '' };
    });
    return initial;
  });
  
  const [comments, setComments] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');

  const handleSliderChange = (area: string, value: number[]) => {
    setScores(prev => ({ ...prev, [area]: value[0] }));
  };

  const handleSubmit = async () => {
    const assessmentData = {
      scores,
      functionalAccess,
      subjectiveOpportunities,
      relationships,
      comments
    };

    try {
      // Submit via InsightAssessment hook (creates path entries)
      const result = await submitAssessment(assessmentData, clientName, clientId);
      
      // Also submit to Six Pillars system for self_care pillar
      if (result) {
        // Calculate a score for the pillar system based on assessment data
        const hinderScores = Object.values(scores);
        const avgHinder = hinderScores.reduce((a, b) => a + b, 0) / hinderScores.length;
        
        // Convert to 0-100 scale, inverted (lower hinder = higher score)
        const calculatedScore = Math.round(((10 - avgHinder) / 9) * 100);
        
        await submitPillarAssessment('self_care', assessmentData, calculatedScore);
        
        setAnalysisResult(result.analysis);
        setShowResults(true);
        // Vi kallar inte onComplete här - användaren ska se resultatet först
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'text-green-600 bg-green-50';
    if (score <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 3) return 'Lågt hinder';
    if (score <= 6) return 'Måttligt hinder';
    return 'Stort hinder';
  };

  if (showResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI-analys av din självskattning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Personlig analys och rekommendationer:</h4>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm">
                {analysisResult}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {assessmentAreas.map(area => (
              <div key={area} className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{area}</div>
                <Badge variant="outline" className={getScoreColor(scores[area])}>
                  {scores[area]}/10
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => setShowResults(false)}
              variant="outline"
              className="flex-1"
            >
              Gör ny assessment
            </Button>
            <Button 
              onClick={onComplete}
              className="flex-1"
            >
              Tillbaka till Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Självskattning av hinder
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Skatta hur stora hinder dessa områden är för dig just nu (1 = inget hinder, 10 = mycket stort hinder)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          {assessmentAreas.map(area => (
            <div key={area} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{area}</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getScoreColor(scores[area])}>
                    {scores[area]}/10
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {getScoreLabel(scores[area])}
                  </span>
                </div>
              </div>
              <Slider
                value={[scores[area]]}
                onValueChange={(value) => handleSliderChange(area, value)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Inget hinder</span>
                <span>Stort hinder</span>
              </div>
            </div>
          ))}
        </div>

        {/* Möjligheter och Funktionsförutsättningar */}
        <div className="space-y-6 pt-6 border-t">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Möjligheter och Funktionsförutsättningar</h3>
          </div>
          
          {/* Block 1: Funktionstillgång */}
          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-orange-600" />
                🟠 Funktionstillgång
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {functionalAccessQuestions.map(question => (
                <div key={question} className="space-y-2">
                  <Label className="text-sm font-medium">{question}</Label>
                  <RadioGroup
                    value={functionalAccess[question]}
                    onValueChange={(value) => setFunctionalAccess(prev => ({ ...prev, [question]: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ja" id={`${question}-ja`} />
                      <Label htmlFor={`${question}-ja`}>Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nej" id={`${question}-nej`} />
                      <Label htmlFor={`${question}-nej`}>Nej</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ibland" id={`${question}-ibland`} />
                      <Label htmlFor={`${question}-ibland`}>Ibland</Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Block 2: Subjektiva möjligheter */}
          <Card className="border-purple-200 bg-purple-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4 text-purple-600" />
                🟣 Subjektiva möjligheter
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Skala 1-5 (1 = mycket svårt, 5 = enkelt och naturligt)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjectiveOpportunityQuestions.map(question => (
                <div key={question} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{question}</Label>
                    <Badge variant="outline" className="text-purple-600 border-purple-300">
                      {subjectiveOpportunities[question]}/5
                    </Badge>
                  </div>
                  <Slider
                    value={[subjectiveOpportunities[question]]}
                    onValueChange={(value) => setSubjectiveOpportunities(prev => ({ ...prev, [question]: value[0] }))}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mycket svårt</span>
                    <span>Enkelt & naturligt</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Block 3: Relationer */}
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-green-600" />
                🟢 Relationer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {relationshipQuestions.map(question => (
                <div key={question} className="space-y-3">
                  <Label className="text-sm font-medium">{question}</Label>
                  <RadioGroup
                    value={relationships[question].answer}
                    onValueChange={(value) => setRelationships(prev => ({ 
                      ...prev, 
                      [question]: { ...prev[question], answer: value } 
                    }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ja" id={`${question}-rel-ja`} />
                      <Label htmlFor={`${question}-rel-ja`}>Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nej" id={`${question}-rel-nej`} />
                      <Label htmlFor={`${question}-rel-nej`}>Nej</Label>
                    </div>
                  </RadioGroup>
                  <Textarea
                    value={relationships[question].comment}
                    onChange={(e) => setRelationships(prev => ({ 
                      ...prev, 
                      [question]: { ...prev[question], comment: e.target.value } 
                    }))}
                    placeholder="Frivillig kommentar..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comments">Kommentarer (valfritt)</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Berätta gärna mer om din situation eller specifika utmaningar..."
            rows={3}
          />
        </div>

        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 mt-0.5 text-primary" />
            <div className="text-sm">
              <p className="font-medium mb-1">AI-analys inkluderad</p>
              <p className="text-muted-foreground">
                När du slutför denna assessment kommer AI:n att analysera dina svar och ge dig 
                personliga rekommendationer för hur du kan arbeta med identifierade hinder.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-pulse" />
              Analyserar...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Skicka assessment för AI-analys
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}