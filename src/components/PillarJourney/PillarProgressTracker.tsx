import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, CheckCircle, Clock, Target } from 'lucide-react';
import { HelpTooltip } from '@/components/HelpTooltip';

interface PillarJourney {
  id: string;
  pillarKey: string;
  pillarName: string;
  progress: number;
  status: string;
  completedAt?: string;
}

interface PillarProgressTrackerProps {
  userId: string;
  completedJourneys: PillarJourney[];
  activeJourneys: PillarJourney[];
}

// Huvudpolicy från UX Expert: Visuell progressindikation med kognitiv enkelhet
export const PillarProgressTracker = ({ 
  userId, 
  completedJourneys, 
  activeJourneys 
}: PillarProgressTrackerProps) => {
  const totalJourneys = completedJourneys.length + activeJourneys.length;
  const overallProgress = totalJourneys > 0 
    ? ((completedJourneys.length * 100) + activeJourneys.reduce((sum, j) => sum + j.progress, 0)) / totalJourneys
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Utvecklingsframsteg
          <HelpTooltip content="Överblick över din framsteg genom de sex utvecklingspelarna." />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Huvudpolicy från Product Manager: Nyckeltal först */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {completedJourneys.length}
            </div>
            <div className="text-sm text-muted-foreground">Slutförda</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {activeJourneys.length}
            </div>
            <div className="text-sm text-muted-foreground">Aktiva</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {overallProgress.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">Total framsteg</div>
          </div>
        </div>

        {/* Huvudpolicy från UX Expert: Progressvisualisering */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Övergripande framsteg</span>
            <span className="text-sm text-muted-foreground">{overallProgress.toFixed(0)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Aktiva resor */}
        {activeJourneys.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pågående utvecklingsområden
            </h4>
            {activeJourneys.map((journey) => (
              <div key={journey.id} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{journey.pillarName}</span>
                  <Badge variant="outline">{journey.progress}%</Badge>
                </div>
                <Progress value={journey.progress} className="h-2" />
              </div>
            ))}
          </div>
        )}

        {/* Slutförda resor */}
        {completedJourneys.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Slutförda utvecklingsområden
            </h4>
            <div className="grid gap-2">
              {completedJourneys.map((journey) => (
                <div key={journey.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm font-medium">{journey.pillarName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Slutförd
                    </Badge>
                    {journey.completedAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(journey.completedAt).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalJourneys === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Inga utvecklingsresor startade än</p>
            <p className="text-sm">Välj ditt första utvecklingsområde för att börja!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};