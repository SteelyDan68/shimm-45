import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/HelpTooltip';
import { PILLAR_MODULES } from '@/config/pillarModules';
import { useFivePillarsModular } from '@/hooks/useFivePillarsModular';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Star,
  TrendingUp,
  Heart,
  Lightbulb,
  Target,
  DollarSign,
  Palette
} from 'lucide-react';

interface PillarSelectorProps {
  userId: string;
  maxSelection: number;
  currentActive: number;
  onPillarSelect: (pillarKey: string) => void;
}

// Huvudpolicy från UX Expert: Visuell hierarki och kognitiv belastning
export const PillarSelector = ({ 
  userId, 
  maxSelection, 
  currentActive, 
  onPillarSelect 
}: PillarSelectorProps) => {
  const { 
    getActivatedPillars, 
    getLatestAssessment, 
    isPillarActive,
    generateHeatmapData 
  } = useFivePillarsModular(userId);

  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [recommendedPillars, setRecommendedPillars] = useState<string[]>([]);

  const activatedPillars = getActivatedPillars();
  const heatmapData = generateHeatmapData();
  const availableSlots = maxSelection - currentActive;

  // Huvudpolicy från AI/Coaching Psykolog: Intelligenta rekommendationer
  useEffect(() => {
    const generateRecommendations = () => {
      // Prioritera baserat på scores och användarens behov
      const pillarsByPriority = heatmapData
        .filter(p => p.is_active && p.score > 0)
        .sort((a, b) => {
          // Prioritera lägre scores (mer förbättringspotential)
          if (a.score < 4 && b.score >= 4) return -1;
          if (a.score >= 4 && b.score < 4) return 1;
          return a.score - b.score;
        })
        .slice(0, maxSelection)
        .map(p => p.pillar_key);

      setRecommendedPillars(pillarsByPriority);
    };

    generateRecommendations();
  }, [heatmapData, maxSelection]);

  // Huvudpolicy från Product Manager: Användarfokuserad funktionalitet
  const getPillarIcon = (pillarKey: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      self_care: <Heart className="h-6 w-6" />,
      skills: <Lightbulb className="h-6 w-6" />,
      talent: <Star className="h-6 w-6" />,
      brand: <Palette className="h-6 w-6" />,
      economy: <DollarSign className="h-6 w-6" />,
      network: <Target className="h-6 w-6" />
    };
    return iconMap[pillarKey] || <Target className="h-6 w-6" />;
  };

  const getPillarScore = (pillarKey: string) => {
    const pillar = heatmapData.find(p => p.pillar_key === pillarKey);
    return pillar?.score || 0;
  };

  const getPillarStatus = (pillarKey: string) => {
    const score = getPillarScore(pillarKey);
    const isActive = isPillarActive(pillarKey);
    
    if (!isActive) return { status: 'inactive', color: 'gray', text: 'Inte aktiverad' };
    if (score === 0) return { status: 'not_assessed', color: 'blue', text: 'Ej bedömd' };
    if (score < 4) return { status: 'critical', color: 'red', text: 'Behöver uppmärksamhet' };
    if (score < 7) return { status: 'developing', color: 'orange', text: 'Under utveckling' };
    return { status: 'strong', color: 'green', text: 'Stark' };
  };

  const handlePillarToggle = (pillarKey: string) => {
    if (selectedPillars.includes(pillarKey)) {
      setSelectedPillars(prev => prev.filter(p => p !== pillarKey));
    } else {
      if (selectedPillars.length < availableSlots) {
        setSelectedPillars(prev => [...prev, pillarKey]);
      }
    }
  };

  const handleStartJourneys = () => {
    selectedPillars.forEach(pillarKey => {
      onPillarSelect(pillarKey);
    });
    setSelectedPillars([]);
  };

  // Huvudpolicy från Systemarkitekt: Robust data validation
  const availablePillars = Object.keys(PILLAR_MODULES).filter(key => 
    isPillarActive(key) && getPillarScore(key) > 0
  );

  return (
    <div className="space-y-6">
      {/* Status och vägledning */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              Du kan välja upp till <strong>{availableSlots}</strong> pillars att arbeta med samtidigt.
              {recommendedPillars.length > 0 && (
                <span className="ml-2">
                  Rekommenderade: <strong>{recommendedPillars.map(p => PILLAR_MODULES[p]?.name).join(', ')}</strong>
                </span>
              )}
            </span>
            {selectedPillars.length > 0 && (
              <Badge variant="secondary">
                {selectedPillars.length} valda
              </Badge>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Pillar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availablePillars.map((pillarKey) => {
          const pillar = PILLAR_MODULES[pillarKey];
          const score = getPillarScore(pillarKey);
          const status = getPillarStatus(pillarKey);
          const isSelected = selectedPillars.includes(pillarKey);
          const isRecommended = recommendedPillars.includes(pillarKey);
          const latestAssessment = getLatestAssessment(pillarKey);

          return (
            <Card 
              key={pillarKey}
              className={`cursor-pointer transition-all hover:shadow-md relative ${
                isSelected ? 'border-blue-500 bg-blue-50' : ''
              } ${
                isRecommended ? 'ring-2 ring-green-200' : ''
              }`}
              onClick={() => handlePillarToggle(pillarKey)}
            >
              {/* Rekommendation badge */}
              {isRecommended && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-green-500 text-white"
                  variant="default"
                >
                  Rekommenderad
                </Badge>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${status.color}-100`}>
                      {getPillarIcon(pillarKey)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pillar?.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-${status.color}-700 border-${status.color}-200`}
                        >
                          {status.text}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Poäng: {score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {pillar?.description}
                </p>

                {/* Progress indikator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Utvecklingspotential</span>
                    <span>{score < 7 ? 'Hög' : 'Medium'}</span>
                  </div>
                  <Progress 
                    value={score * 10} 
                    className="h-2"
                  />
                </div>

                {/* Senaste bedömning */}
                {latestAssessment && (
                  <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Senast bedömd: {new Date(latestAssessment.created_at).toLocaleDateString('sv-SE')}
                  </div>
                )}

                {/* Estimerad tid */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Estimerad tid:</span>
                  <span className="font-medium">
                    {score < 4 ? '6-8 veckor' : score < 7 ? '4-6 veckor' : '2-4 veckor'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ingen pillars tillgänglig */}
      {availablePillars.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inga pillars tillgängliga</h3>
            <p className="text-muted-foreground mb-4">
              Du behöver först aktivera och bedöma dina pillars innan du kan starta utvecklingsresor.
            </p>
            <Button variant="outline">
              Gå till Five Pillars Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Start knapp */}
      {selectedPillars.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Redo att börja?</h3>
                <p className="text-muted-foreground">
                  Du har valt {selectedPillars.length} pillar{selectedPillars.length > 1 ? 's' : ''} 
                  att fokusera på. Dessa kommer att bli dina aktiva utvecklingsresor.
                </p>
              </div>
              <Button 
                size="lg"
                onClick={handleStartJourneys}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Starta Utvecklingsresor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};