import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePredictiveJourney } from '@/hooks/usePredictiveJourney';
import { useProactiveMessaging } from '@/hooks/useProactiveMessaging';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Clock,
  Zap,
  CheckCircle2,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

/**
 * 🔮 PREDICTIVE INSIGHTS WIDGET
 * Visar AI-baserade prediktioner och föreslår nästa steg
 */

export const PredictiveInsightsWidget: React.FC = () => {
  const {
    currentPrediction,
    loading,
    analyzeAbandonmentRisk,
    suggestNextBestAction,
    predictNextActiveSession,
    detectSupportNeeds
  } = usePredictiveJourney();

  const { sendMotivationalMessage } = useProactiveMessaging();
  const [expanded, setExpanded] = useState(false);

  const abandonmentRisk = analyzeAbandonmentRisk();
  const nextBestAction = suggestNextBestAction();
  const nextActiveSession = predictNextActiveSession();
  const supportNeeds = detectSupportNeeds();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleActionClick = async (action: any) => {
    // Implementera action handling baserat på action type
    switch (action.action_type) {
      case 'assessment':
        // Navigate to assessment
        
        break;
      case 'task':
        // Navigate to tasks
        
        break;
      case 'reflection':
        // Open reflection interface
        
        break;
      case 'support':
        await sendMotivationalMessage('stuck_too_long');
        break;
      default:
        
    }
  };

  if (loading || !currentPrediction) {
    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium">Stefan analyserar din resa...</p>
              <p className="text-xs text-muted-foreground">Förbereder prediktioner</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm">Stefan's AI-Insights</CardTitle>
              <p className="text-xs text-muted-foreground">
                Prediktiv coaching-vägledning
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {Math.round(currentPrediction.confidence_score * 100)}% säker
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Risk Assessment */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${getRiskColor(abandonmentRisk)}`} />
            <span className="text-sm font-medium">Risk för avhopp:</span>
          </div>
          <Badge className={`text-xs ${getRiskColor(abandonmentRisk)}`}>
            {abandonmentRisk === 'low' && '🟢 Låg'}
            {abandonmentRisk === 'medium' && '🟡 Medium'}
            {abandonmentRisk === 'high' && '🔴 Hög'}
          </Badge>
        </div>

        {/* Next Best Action */}
        {nextBestAction && (
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Föreslaget nästa steg:</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm">{nextBestAction.primary_action.reasoning}</p>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(nextBestAction.primary_action.probability * 100)}%
                </Badge>
              </div>
              <Button 
                size="sm" 
                className="w-full text-xs" 
                onClick={() => handleActionClick(nextBestAction.primary_action)}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                {nextBestAction.primary_action.action_type === 'assessment' && 'Gör bedömning'}
                {nextBestAction.primary_action.action_type === 'task' && 'Utför uppgift'}
                {nextBestAction.primary_action.action_type === 'reflection' && 'Reflektera'}
                {nextBestAction.primary_action.action_type === 'support' && 'Få stöd'}
                {nextBestAction.primary_action.action_type === 'planning' && 'Planera'}
              </Button>
            </div>
          </div>
        )}

        {/* Support Needs */}
        {supportNeeds.length > 0 && (
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Stefan rekommenderar:</span>
            </div>
            <div className="space-y-1">
              {supportNeeds.slice(0, 2).map((need, index) => (
                <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {need.suggestion}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Active Session Prediction */}
        {nextActiveSession && (
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Nästa aktiva session:</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(nextActiveSession.predicted_time).toLocaleString('sv-SE')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {nextActiveSession.reasoning}
            </p>
          </div>
        )}

        {/* Success Indicators */}
        {currentPrediction.success_indicators.length > 0 && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Positiva signaler:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {currentPrediction.success_indicators.map((indicator, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                  {indicator === 'consistent_activity' && '🔄 Konsekvent aktivitet'}
                  {indicator === 'goal_clarity' && '🎯 Tydliga mål'}
                  {indicator === 'progress_momentum' && '📈 Bra framsteg'}
                  {indicator === 'engagement_high' && '⚡ Högt engagemang'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Expand/Collapse for detailed predictions */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs"
        >
          {expanded ? 'Visa mindre' : 'Visa detaljerade prediktioner'}
        </Button>

        {expanded && currentPrediction.predicted_next_actions.length > 1 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium">Alla predikterade steg:</p>
            {currentPrediction.predicted_next_actions.map((action, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-background/50">
                <div className="flex-1">
                  <p className="text-xs font-medium">{action.reasoning}</p>
                  <p className="text-xs text-muted-foreground">
                    Timing: {action.suggested_timing}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {Math.round(action.probability * 100)}%
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleActionClick(action)}
                    className="text-xs h-6 px-2"
                  >
                    Utför
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};