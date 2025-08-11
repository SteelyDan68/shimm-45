/**
 * 🎓 PILLAR EDUCATION - Interaktiv utforskare av pillar-områden
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Lightbulb, 
  Star, 
  Palette, 
  DollarSign, 
  Route,
  ArrowRight,
  CheckCircle,
  Info,
  Clock,
  Users,
  Target
} from 'lucide-react';
import { IntentData } from './IntentDiscovery';
import { useIntelligentPillarNavigation } from '@/hooks/useIntelligentPillarNavigation';
import { PillarKey } from '@/types/sixPillarsModular';

interface PillarInfo {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  whatYouLearn: string[];
  exampleQuestions: string[];
  estimatedTime: string;
  recommendedFor: string[];
  matchScore?: number;
}

interface PillarEducationProps {
  intentData: IntentData;
  onPillarSelect: (pillarKey: string) => void;
  onBack: () => void;
}

const PILLAR_DETAILS: PillarInfo[] = [
  {
    key: 'self-care',
    name: 'Self Care',
    icon: Heart,
    color: 'hsl(var(--self-care))',
    description: 'Din fysiska och mentala hälsa, energi och balans',
    whatYouLearn: [
      'Hur du hanterar stress och återhämtning',
      'Dina energimönster och vad som ger dig kraft',
      'Balansen mellan arbete och vila',
      'Rutiner som stödjer ditt välmående'
    ],
    exampleQuestions: [
      'Hur väl hanterar du stress i vardagen?',
      'Vilka aktiviteter ger dig mest energi?',
      'Hur prioriterar du din egen hälsa?'
    ],
    estimatedTime: '8-12 min',
    recommendedFor: ['Känner stress', 'Låg energi', 'Dålig balans', 'Söker struktur']
  },
  {
    key: 'skills',
    name: 'Skills',
    icon: Lightbulb,
    color: 'hsl(var(--skills))',
    description: 'Dina kompetenser, färdigheter och kunskapsutveckling',
    whatYouLearn: [
      'Vilka färdigheter du behöver utveckla',
      'Hur du lär dig mest effektivt',
      'Dina kunskapsluckor och styrkor',
      'Vägar för professionell tillväxt'
    ],
    exampleQuestions: [
      'Vilka färdigheter vill du utveckla mest?',
      'Hur håller du dig uppdaterad inom ditt område?',
      'Vad är dina största kompetensstyrkor?'
    ],
    estimatedTime: '10-15 min',
    recommendedFor: ['Karriärutveckling', 'Ny roll', 'Kompetensgap', 'Livslångt lärande']
  },
  {
    key: 'talent',
    name: 'Talent',
    icon: Star,
    color: 'hsl(var(--talent))',
    description: 'Dina naturliga styrkor och unika begåvningar',
    whatYouLearn: [
      'Dina medfödda talanger och styrkor',
      'Hur du kan använda dem optimalt',
      'Områden där du naturligt excellerar',
      'Din unika värdeproposition'
    ],
    exampleQuestions: [
      'Vad kommer naturligt lätt för dig?',
      'Vilka aktiviteter ger dig flyt-känsla?',
      'Vad säger andra att du är bra på?'
    ],
    estimatedTime: '8-12 min',
    recommendedFor: ['Söker klarhet', 'Karriärskifte', 'Självinsikt', 'Förlorad motivation']
  },
  {
    key: 'brand',
    name: 'Brand',
    icon: Palette,
    color: 'hsl(var(--brand))',
    description: 'Din personliga varumärkesbyggnad och synlighet',
    whatYouLearn: [
      'Hur andra uppfattar dig',
      'Ditt unika varumärke och budskap',
      'Strategier för ökad synlighet',
      'Autentisk marknadsföring av dig själv'
    ],
    exampleQuestions: [
      'Hur vill du att andra ska uppfatta dig?',
      'Vilken plattform använder du mest professionellt?',
      'Vad gör ditt budskap unikt?'
    ],
    estimatedTime: '10-15 min',
    recommendedFor: ['Offentlig person', 'Entreprenör', 'Ny marknad', 'Bygga nätverk']
  },
  {
    key: 'economy',
    name: 'Economy',
    icon: DollarSign,
    color: 'hsl(var(--economy))',
    description: 'Din ekonomiska utveckling och värdeskapande',
    whatYouLearn: [
      'Dina inkomstkällor och potential',
      'Investeringsstrategier för dig',
      'Hur du skapar värde och monetariserar',
      'Ekonomisk trygghet och tillväxt'
    ],
    exampleQuestions: [
      'Vilka är dina huvudsakliga inkomstkällor?',
      'Hur ser din ekonomiska planering ut?',
      'Vad är dina finansiella mål?'
    ],
    estimatedTime: '8-12 min',
    recommendedFor: ['Ekonomisk osäkerhet', 'Nya intäktsströmmar', 'Investering', 'Pensionsplanering']
  },
  {
    key: 'open-track',
    name: 'Öppet spår',
    icon: Route,
    color: 'hsl(var(--primary))',
    description: 'Din personliga utvecklingsresa med fria mål',
    whatYouLearn: [
      'Dina djupaste värderingar och mål',
      'Vad som driver dig framåt',
      'Din personliga vision och riktning',
      'Holistisk utvecklingsplan'
    ],
    exampleQuestions: [
      'Vad är viktigast för dig i livet?',
      'Hur ser ditt idealiska liv ut?',
      'Vilka värderingar styr dina beslut?'
    ],
    estimatedTime: '12-18 min',
    recommendedFor: ['Stora livsförändringar', 'Söker mening', 'Holistisk utveckling', 'Osäker på riktning']
  }
];

// Algoritm för att matcha intent med pillar
const calculatePillarMatch = (pillar: PillarInfo, intentData: IntentData): number => {
  let score = 0;
  
  // Match baserat på primaryFocus
  const focusMatches = {
    'health': ['self-care'],
    'career': ['skills', 'talent'],
    'brand': ['brand'],
    'economy': ['economy'],
    'balance': ['self-care', 'open-track']
  };
  
  if (focusMatches[intentData.primaryFocus as keyof typeof focusMatches]?.includes(pillar.key)) {
    score += 40;
  }
  
  // Match baserat på mainGoal
  const goalMatches = {
    'clarity': ['talent', 'open-track'],
    'momentum': ['skills', 'brand'],
    'results': ['economy', 'skills'],
    'system': ['self-care', 'open-track']
  };
  
  if (goalMatches[intentData.mainGoal as keyof typeof goalMatches]?.includes(pillar.key)) {
    score += 30;
  }
  
  // Match baserat på urgency
  if (intentData.urgency === 'immediate' && ['self-care', 'skills'].includes(pillar.key)) {
    score += 20;
  }
  
  // Ge alltid open-track en baseline score som helhetslösning
  if (pillar.key === 'open-track') {
    score += 10;
  }
  
  return Math.min(score, 100);
};

export const PillarEducation: React.FC<PillarEducationProps> = ({
  intentData,
  onPillarSelect,
  onBack
}) => {
  const { smartNavigate } = useIntelligentPillarNavigation();
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Beräkna matchning och sortera
  const pillarsWithMatch = PILLAR_DETAILS.map(pillar => ({
    ...pillar,
    matchScore: calculatePillarMatch(pillar, intentData)
  })).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const topRecommendations = pillarsWithMatch.filter(p => (p.matchScore || 0) >= 30);
  const otherPillars = pillarsWithMatch.filter(p => (p.matchScore || 0) < 30);

  const handlePillarClick = (pillarKey: string) => {
    if (showDetails === pillarKey) {
      setShowDetails(null);
    } else {
      setShowDetails(pillarKey);
    }
  };

  const renderPillarCard = (pillar: PillarInfo, isRecommended: boolean = false) => {
    const IconComponent = pillar.icon;
    const isSelected = selectedPillar === pillar.key;
    const isExpanded = showDetails === pillar.key;

    return (
      <Card 
        key={pillar.key}
        className={`cursor-pointer transition-all duration-300 ${
          isSelected 
            ? 'border-primary shadow-lg scale-105' 
            : 'border-border hover:border-primary/50 hover:shadow-md'
        } ${isRecommended ? 'ring-2 ring-green-200' : ''}`}
        onClick={() => handlePillarClick(pillar.key)}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-lg"
                style={{ 
                  backgroundColor: `${pillar.color}15`,
                  color: pillar.color 
                }}
              >
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {pillar.name}
                  {isRecommended && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {pillar.matchScore}% match
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {pillar.estimatedTime}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant={isSelected ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPillar(pillar.key);
              }}
            >
              {isSelected ? <CheckCircle className="h-4 w-4" /> : 'Välj'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-left">
            {pillar.description}
          </p>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="border-t space-y-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Vad du kommer att lära dig:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {pillar.whatYouLearn.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Exempel på frågor:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {pillar.exampleQuestions.map((question, idx) => (
                  <li key={idx} className="italic">"{question}"</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Rekommenderas för:
              </h4>
              <div className="flex flex-wrap gap-1">
                {pillar.recommendedFor.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Utforska våra utvecklingsområden</CardTitle>
          <p className="text-muted-foreground">
            Klicka på ett område för att lära dig mer. Vi har redan rangordnat dem baserat på dina svar.
          </p>
        </CardHeader>
      </Card>

      {/* Rekommenderade områden */}
      {topRecommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              Rekommenderade för dig
            </Badge>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topRecommendations.map(pillar => renderPillarCard(pillar, true))}
          </div>
        </div>
      )}

      {/* Andra områden */}
      {otherPillars.length > 0 && (
        <div className="space-y-4">
          <Badge variant="secondary">Andra utvecklingsområden</Badge>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherPillars.map(pillar => renderPillarCard(pillar))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Tillbaka
        </Button>
        
        <Button 
          size="lg"
          disabled={!selectedPillar}
          onClick={async () => {
            if (!selectedPillar) return;
            const toPillarKey = (k: string) => k.replace(/-/g, '_') as PillarKey;
            await smartNavigate(toPillarKey(selectedPillar));
          }}
          className="px-8"
        >
          {selectedPillar ? 
            `Starta ${PILLAR_DETAILS.find(p => p.key === selectedPillar)?.name}` : 
            'Välj ett område'
          }
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};