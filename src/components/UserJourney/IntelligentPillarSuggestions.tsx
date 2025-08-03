import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useWelcomeAssessment } from '@/hooks/useWelcomeAssessment';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useSixPillarsModular } from '@/hooks/useSixPillarsModular';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  Brain, 
  Briefcase, 
  GraduationCap, 
  PiggyBank, 
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Target
} from 'lucide-react';

interface PillarSuggestion {
  key: string;
  name: string;
  reason: string;
  score: number;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  color: string;
}

interface IntelligentPillarSuggestionsProps {
  onPillarSelected?: (pillarKey: string) => void;
}

/**
 * ✅ KRITISK UX-KOMPONENT: Intelligenta Pillar-förslag
 * Visar personaliserade utvecklingsområden baserat på användarens assessment
 * Ersätter generisk navigation till Pillars-sidan med målriktade förslag
 */
export const IntelligentPillarSuggestions = ({ onPillarSelected }: IntelligentPillarSuggestionsProps) => {
  const { user } = useAuth();
  const { getLatestWelcomeAssessment } = useWelcomeAssessment();
  const { journeyState } = useUserJourney();
  const { activatePillar } = useSixPillarsModular();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [suggestions, setSuggestions] = useState<PillarSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const pillarIcons = {
    'self_care': <Heart className="h-5 w-5" />,
    'talent': <Brain className="h-5 w-5" />,
    'skills': <Briefcase className="h-5 w-5" />,
    'learning': <GraduationCap className="h-5 w-5" />,
    'economy': <PiggyBank className="h-5 w-5" />,
    'network': <Users className="h-5 w-5" />,
  };

  const pillarNames = {
    'self_care': 'Hälsa & Välmående',
    'talent': 'Begåvning',
    'skills': 'Kompetenser',
    'learning': 'Lärande',
    'economy': 'Ekonomi',
    'network': 'Nätverk',
  };

  const pillarColors = {
    'self_care': 'bg-rose-100 border-rose-200 text-rose-800',
    'talent': 'bg-purple-100 border-purple-200 text-purple-800',
    'skills': 'bg-blue-100 border-blue-200 text-blue-800',
    'learning': 'bg-green-100 border-green-200 text-green-800',
    'economy': 'bg-yellow-100 border-yellow-200 text-yellow-800',
    'network': 'bg-indigo-100 border-indigo-200 text-indigo-800',
  };

  useEffect(() => {
    const generateSuggestions = async () => {
      if (!user) return;

      try {
        const assessment = await getLatestWelcomeAssessment();
        if (!assessment?.wheel_of_life_scores) {
          setLoading(false);
          return;
        }

        const scores = assessment.wheel_of_life_scores;
        
        // Mappa Wheel of Life till pillars och skapa förslag
        const mappings = [
          {
            wheelArea: 'health',
            pillar: 'self_care',
            reason: 'Din hälsa och välmående kan bli bättre'
          },
          {
            wheelArea: 'career',
            pillar: 'skills',
            reason: 'Utveckla dina karriärsmöjligheter'
          },
          {
            wheelArea: 'finances',
            pillar: 'economy',
            reason: 'Förbättra din ekonomiska situation'
          },
          {
            wheelArea: 'personal_growth',
            pillar: 'talent',
            reason: 'Utveckla din fulla potential'
          },
          {
            wheelArea: 'relationships',
            pillar: 'network',
            reason: 'Stärk dina relationer och nätverk'
          },
          {
            wheelArea: 'fun_recreation',
            pillar: 'self_care',
            reason: 'Hitta bättre balans mellan vila och aktivitet'
          },
        ];

        // Skapa förslag baserat på lägsta poäng
        const pillarSuggestions: PillarSuggestion[] = mappings
          .map(mapping => {
            const score = scores[mapping.wheelArea] || 5;
            return {
              key: mapping.pillar,
              name: pillarNames[mapping.pillar as keyof typeof pillarNames],
              reason: mapping.reason,
              score: score,
              priority: (score <= 3 ? 'high' : 
                        score <= 6 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
              icon: pillarIcons[mapping.pillar as keyof typeof pillarIcons],
              color: pillarColors[mapping.pillar as keyof typeof pillarColors],
            };
          })
          .filter((suggestion, index, self) => 
            // Endast unika pillars
            index === self.findIndex(s => s.key === suggestion.key)
          )
          .sort((a, b) => a.score - b.score) // Lägsta poäng först
          .slice(0, 3); // Max 3 förslag

        setSuggestions(pillarSuggestions);
      } catch (error) {
        console.error('Error generating pillar suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    generateSuggestions();
  }, [user, getLatestWelcomeAssessment]);

  const handleSelectPillar = async (pillarKey: string) => {
    try {
      await activatePillar(pillarKey as any);
      
      toast({
        title: "Bra val! 🎯",
        description: `Du har valt att utveckla ${pillarNames[pillarKey as keyof typeof pillarNames]}`,
      });

      onPillarSelected?.(pillarKey);
      
      // Navigera till pillar dashboard
      navigate(`/client-dashboard?tab=pillars&active=${pillarKey}`);
    } catch (error) {
      console.error('Error activating pillar:', error);
      toast({
        title: "Något gick fel",
        description: "Kunde inte aktivera utvecklingsområdet. Försök igen.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Vad vill du utveckla?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Vi kunde inte skapa personliga förslag. Kolla alla utvecklingsområden istället.
          </p>
          <Button 
            onClick={() => navigate('/client-dashboard?tab=pillars')}
            className="w-full"
          >
            Se alla utvecklingsområden
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Stefan föreslår dessa utvecklingsområden för dig
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Baserat på din bedömning - välj det som känns mest viktigt just nu
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.key}
            className={`p-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer ${suggestion.color}`}
            onClick={() => handleSelectPillar(suggestion.key)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-white/60 rounded-lg">
                  {suggestion.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{suggestion.name}</h3>
                    {index === 0 && (
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        Viktigast
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm opacity-80">{suggestion.reason}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="text-xs font-medium">
                      Nuvarande nivå: {suggestion.score}/10
                    </div>
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 opacity-60 flex-shrink-0 mt-1" />
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t border-primary/20">
          <Button
            variant="outline"
            onClick={() => navigate('/client-dashboard?tab=pillars')}
            className="w-full"
          >
            Eller se alla utvecklingsområden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};