import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, CheckCircle, Clock, Target } from 'lucide-react';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useCentralizedData } from '@/hooks/useCentralizedData';

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

/**
 * 🎯 MODERNIZED PILLAR PROGRESS TRACKER
 * 
 * Använder nu CentralizedData för REAL DATA från path_entries
 * Inga mer mockdata eller disconnected räknevärken!
 */
export const PillarProgressTracker = ({ 
  userId, 
  completedJourneys, 
  activeJourneys 
}: PillarProgressTrackerProps) => {
  
  // 🔄 REAL DATA från centralized system
  const { 
    metrics,
    loading,
    isHealthy,
    refreshAllData 
  } = useCentralizedData(userId);

  console.log('📊 PillarProgressTracker: Using REAL metrics:', metrics);

  // Use REAL data från centralized metrics
  const totalJourneys = metrics.total_pillars || (completedJourneys.length + activeJourneys.length);
  const overallProgress = metrics.overall_completion || (totalJourneys > 0 
    ? ((completedJourneys.length * 100) + activeJourneys.reduce((sum, j) => sum + j.progress, 0)) / totalJourneys
    : 0);

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
        {/* 🎯 REAL METRICS från path_entries */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.completed_pillars || completedJourneys.length}
            </div>
            <div className="text-sm text-muted-foreground">Slutförda</div>
            <div className="text-xs text-green-600">LIVE DATA</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.active_pillars || activeJourneys.length}
            </div>
            <div className="text-sm text-muted-foreground">Aktiva</div>
            <div className="text-xs text-blue-600">Real-time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.overall_completion.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">Total framsteg</div>
            <div className="text-xs text-purple-600">Path entries</div>
          </div>
        </div>

        {/* 🔄 REAL PROGRESS från databas */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Övergripande framsteg</span>
            <span className="text-sm text-muted-foreground">{metrics.overall_completion.toFixed(0)}%</span>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              {metrics.total_path_entries} entries
            </Badge>
          </div>
          <Progress value={metrics.overall_completion} className="h-3" />
          <div className="text-xs text-center text-muted-foreground mt-1">
            Baserat på {metrics.total_path_entries} path entries från databasen
          </div>
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
                <div key={journey.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{journey.pillarName}</span>
                    {journey.completedAt && (
                      <div className="text-xs text-muted-foreground">
                        Slutförd {new Date(journey.completedAt).toLocaleDateString('sv-SE')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Slutförd
                    </Badge>
                    <button 
                      className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition-colors"
                      onClick={() => {
                        // Implementera retake funktionalitet här
                        console.log('Retake pillar:', journey.pillarKey);
                      }}
                    >
                      Gör om
                    </button>
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