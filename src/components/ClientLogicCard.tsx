import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, MessageSquare, Loader2 } from 'lucide-react';
import { useClientLogic } from '@/hooks/useClientLogic';
import { AnalysisActions } from '@/components/ui/analysis-actions';

interface LogicState {
  velocity_rank: string;
  recommendation: string;
  tone: string;
  last_updated: string;
  metrics?: {
    followerGrowth: number;
    engagementRate: number;
    postFrequency: number;
    recentActivity: number;
  };
}

interface ClientLogicCardProps {
  clientId: string;
  clientName: string;
}

export const ClientLogicCard = ({ clientId, clientName }: ClientLogicCardProps) => {
  const [logicState, setLogicState] = useState<LogicState | null>(null);
  const { processClientLogic, getClientLogicState, isProcessing } = useClientLogic();

  useEffect(() => {
    loadLogicState();
  }, [clientId]);

  const loadLogicState = async () => {
    const state = await getClientLogicState(clientId);
    setLogicState(state);
  };

  const handleProcessLogic = async () => {
    const result = await processClientLogic(clientId);
    if (result) {
      setLogicState(result);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getToneIcon = (tone: string) => {
    switch (tone) {
      case 'encouraging': return '🎯';
      case 'strategic': return '📊';
      case 'urgent': return '⚡';
      default: return '💭';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'encouraging': return 'bg-blue-100 text-blue-800';
      case 'strategic': return 'bg-purple-100 text-purple-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-analys: {clientName}
          </CardTitle>
          <div className="flex items-center gap-2">
            {logicState && (
              <AnalysisActions
                title={`AI-analys för ${clientName}`}
                content={logicState.recommendation}
                clientName={clientName}
                assessmentType="Client Logic Analysis"
                className="opacity-75 hover:opacity-100"
              />
            )}
            <Button 
              onClick={handleProcessLogic} 
              disabled={isProcessing}
              size="sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyserar...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Kör analys
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!logicState ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Ingen analys utförd ännu</p>
            <p className="text-sm">Klicka på "Kör analys" för att generera rekommendationer</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Velocity Rank */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Velocity Rank:</span>
                <Badge className={getRankColor(logicState.velocity_rank)}>
                  Klass {logicState.velocity_rank}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Ton:</span>
                <Badge className={getToneColor(logicState.tone)}>
                  {getToneIcon(logicState.tone)} {logicState.tone}
                </Badge>
              </div>
            </div>

            {/* Metrics */}
            {logicState.metrics && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Följartillväxt:</span>
                  <span className="ml-2">{logicState.metrics.followerGrowth.toFixed(1)}%</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Engagement:</span>
                  <span className="ml-2">{logicState.metrics.engagementRate.toFixed(1)}%</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Inlägg/vecka:</span>
                  <span className="ml-2">{logicState.metrics.postFrequency}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Aktivitet:</span>
                  <span className="ml-2">{logicState.metrics.recentActivity}</span>
                </div>
              </div>
            )}

            {/* AI Recommendation */}
            <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium text-sm mb-2">AI-rekommendation:</p>
                  <p className="text-sm text-muted-foreground">
                    {logicState.recommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground text-right">
              Senast uppdaterad: {new Date(logicState.last_updated).toLocaleString('sv-SE')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};