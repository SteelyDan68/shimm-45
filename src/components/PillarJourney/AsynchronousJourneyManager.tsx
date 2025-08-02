import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/HelpTooltip';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Target,
  MoreVertical
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PillarJourney {
  id: string;
  pillarKey: string;
  pillarName: string;
  mode: string;
  status: string;
  progress: number;
  startedAt: string;
}

interface AsynchronousJourneyManagerProps {
  journeys: PillarJourney[];
  onPause: (journeyId: string) => Promise<void>;
  onComplete: (journeyId: string) => Promise<void>;
  onAbandon: (journeyId: string) => Promise<void>;
}

// Huvudpolicy från Coaching Psykolog: Respektera autonomi med mjuk vägledning
export const AsynchronousJourneyManager = ({
  journeys,
  onPause,
  onComplete,
  onAbandon
}: AsynchronousJourneyManagerProps) => {
  
  // Huvudpolicy från Product Manager: Prioritera baserat på progress och tid
  const getSortedJourneys = () => {
    return [...journeys].sort((a, b) => {
      // Visa mest aktiva först
      if (a.progress !== b.progress) {
        return b.progress - a.progress;
      }
      // Sen äldsta först
      return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
    });
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'guided': return 'bg-blue-100 text-blue-800';
      case 'flexible': return 'bg-green-100 text-green-800';
      case 'intensive': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'guided': return 'Guidat';
      case 'flexible': return 'Flexibelt';
      case 'intensive': return 'Intensivt';
      default: return mode;
    }
  };

  const sortedJourneys = getSortedJourneys();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Aktiva utvecklingsresor
          <HelpTooltip content="Hantera dina pågående utvecklingsområden. Du kan pausa, slutföra eller anpassa tempot." />
        </h3>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {journeys.length} aktiva
        </Badge>
      </div>

      {/* Huvudpolicy från UX Expert: Visuell gruppering och tydlig hierarki */}
      <div className="grid gap-4">
        {sortedJourneys.map((journey) => (
          <Card key={journey.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{journey.pillarName}</CardTitle>
                  <Badge className={getModeColor(journey.mode)}>
                    {getModeLabel(journey.mode)}
                  </Badge>
                </div>
                
                {/* Huvudpolicy från Frontend Dev: Intuitive controls */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onPause(journey.id)}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausa resa
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onComplete(journey.id)}
                      className="text-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Markera som slutförd
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onAbandon(journey.id)}
                      className="text-red-600"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Avbryt resa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progress indikator */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Framsteg</span>
                  <span className="text-sm text-muted-foreground">{journey.progress}%</span>
                </div>
                <Progress value={journey.progress} className="h-2" />
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Startad: {new Date(journey.startedAt).toLocaleDateString('sv-SE')}
                </span>
                <span className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  Aktiv
                </span>
              </div>

              {/* Huvudpolicy från Coaching Psykolog: Motiverande meddelanden */}
              {journey.progress < 25 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Kom igång med din resa! Små steg varje dag leder till stora förändringar.
                  </AlertDescription>
                </Alert>
              )}

              {journey.progress >= 75 && journey.progress < 100 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Fantastiskt framsteg! Du är nästan i mål med denna utvecklingsresa.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {journeys.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inga aktiva resor</h3>
            <p className="text-muted-foreground">
              Starta din första utvecklingsresa genom att välja en pillar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};