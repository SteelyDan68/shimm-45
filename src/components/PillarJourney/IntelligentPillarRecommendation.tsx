import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Star, TrendingUp, Clock, CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { PILLAR_MODULES } from '@/config/pillarModules';

interface PillarRecommendationData {
  key: string;
  motivation: string;
  expected_outcome: string;
  relevance_score: number;
}

interface IntelligentPillarRecommendationProps {
  userId: string;
  pillarRecommendations: {
    pillar_scores: Record<string, number>;
    primary_pillar: PillarRecommendationData;
    secondary_pillar: PillarRecommendationData;
    readiness_score: number;
    success_indicators: string[];
    user_context: {
      life_balance: number;
      change_readiness: number;
      focus_areas: string[];
    };
  };
  stefanMessage: string;
  onPillarSelect: (pillarKey: string) => Promise<{ shouldNavigate: boolean; url?: string } | void>;
}

export const IntelligentPillarRecommendation: React.FC<IntelligentPillarRecommendationProps> = ({
  userId,
  pillarRecommendations,
  stefanMessage,
  onPillarSelect
}) => {
  const navigate = useNavigate();
  
  const getPillarInfo = (pillarKey: string) => {
    return PILLAR_MODULES[pillarKey as keyof typeof PILLAR_MODULES] || {
      name: pillarKey,
      icon: '🔄',
      color: '#3B82F6',
      description: 'Utvecklingsområde'
    };
  };

  const handleStartJourney = async (pillarKey: string) => {
    
    const result = await onPillarSelect(pillarKey);
    
    // Om onPillarSelect returnerar navigation-info, använd den
    if (result && 'shouldNavigate' in result && result.shouldNavigate) {
      navigate(result.url!);
    } else {
      // Fallback - navigera direkt till assessment
      const assessmentUrl = `/six-pillars?pillar=${pillarKey}&startAssessment=true`;
      navigate(assessmentUrl);
    }
  };

  const primaryPillar = getPillarInfo(pillarRecommendations.primary_pillar.key);
  const secondaryPillar = getPillarInfo(pillarRecommendations.secondary_pillar.key);

  return (
    <div className="space-y-6">
      {/* Stefan's Personal Message */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              S
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Meddelande från Stefan</h3>
              <p className="text-blue-700 mt-1">{stefanMessage}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Context & Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Din utvecklingsprofil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Livsbalans</label>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={pillarRecommendations.user_context.life_balance * 10} className="flex-1" />
                <span className="text-sm font-medium">{pillarRecommendations.user_context.life_balance.toFixed(1)}/10</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Förändringsvilja</label>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={pillarRecommendations.user_context.change_readiness * 10} className="flex-1" />
                <span className="text-sm font-medium">{pillarRecommendations.user_context.change_readiness.toFixed(1)}/10</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Primära fokusområden</label>
            <div className="flex gap-2 mt-1">
              {pillarRecommendations.user_context.focus_areas.map((area) => (
                <Badge key={area} variant="outline">{area}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Recommendation */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-600" />
              Rekommenderad startpunkt
            </CardTitle>
            <Badge className="bg-green-600">
              {pillarRecommendations.primary_pillar.relevance_score}/10 relevans
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
              style={{ backgroundColor: primaryPillar.color }}
            >
              {primaryPillar.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{primaryPillar.name}</h3>
              <p className="text-sm text-muted-foreground">{primaryPillar.description}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              Varför detta är rätt för dig
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              {pillarRecommendations.primary_pillar.motivation}
            </p>
            
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Vad du kan förvänta dig
            </h4>
            <p className="text-sm text-muted-foreground">
              {pillarRecommendations.primary_pillar.expected_outcome}
            </p>
          </div>

          <Button 
            onClick={() => handleStartJourney(pillarRecommendations.primary_pillar.key)}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            Starta din {primaryPillar.name.toLowerCase()}-resa
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Secondary Recommendation */}
      <Card className="border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Nästa utvecklingsområde
            </CardTitle>
            <Badge variant="outline">
              {pillarRecommendations.secondary_pillar.relevance_score}/10 relevans
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
              style={{ backgroundColor: secondaryPillar.color }}
            >
              {secondaryPillar.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{secondaryPillar.name}</h3>
              <p className="text-sm text-muted-foreground">{secondaryPillar.description}</p>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              {pillarRecommendations.secondary_pillar.motivation}
            </p>
            <p className="text-sm font-medium">
              {pillarRecommendations.secondary_pillar.expected_outcome}
            </p>
          </div>

          <Button 
            onClick={() => handleStartJourney(pillarRecommendations.secondary_pillar.key)}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Välj {secondaryPillar.name.toLowerCase()} istället
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Success Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Tecken på framsteg att titta efter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pillarRecommendations.success_indicators.map((indicator, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{indicator}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};