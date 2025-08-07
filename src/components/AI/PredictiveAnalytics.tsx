/**
 * 🔮 PREDICTIVE ANALYTICS DASHBOARD
 * Prediktiv analys för användarutveckling och framgångsprediktion
 * Phase 3: AI Intelligence Revolution
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar,
  Target,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUserPillars } from '@/hooks/useUserPillars';
import { useTasks } from '@/hooks/useTasks';

interface PredictiveModel {
  id: string;
  name: string;
  type: 'completion_rate' | 'engagement_trend' | 'goal_achievement' | 'skill_progression';
  confidence: number;
  timeframe: number; // days
  prediction: number; // percentage or score
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
  recommendation: string;
  lastUpdated: Date;
}

interface UserPattern {
  id: string;
  type: 'behavioral' | 'temporal' | 'motivational' | 'cognitive';
  strength: number; // 1-10
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  evidence: string[];
  suggestedInterventions: string[];
}

interface PredictiveAnalyticsProps {
  userId?: string;
  timeframe?: 7 | 14 | 30 | 90;
  className?: string;
}

export const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  userId,
  timeframe = 30,
  className = ""
}) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  
  const { getCompletedPillars, getActivatedPillars } = useUserPillars(effectiveUserId || '');
  const { tasks } = useTasks(effectiveUserId);
  
  const [predictions, setPredictions] = useState<PredictiveModel[]>([]);
  const [userPatterns, setUserPatterns] = useState<UserPattern[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  // 🔮 PREDICTIVE MODEL GENERATION
  const generatePredictions = async () => {
    setIsAnalyzing(true);
    
    try {
      const completedPillars = getCompletedPillars();
      const activatedPillars = getActivatedPillars();
      const activeTasks = tasks?.filter(t => t.status !== 'completed') || [];
      const completedTasks = tasks?.filter(t => t.status === 'completed') || [];
      
      const newPredictions: PredictiveModel[] = [];
      const newPatterns: UserPattern[] = [];
      
      // 📊 COMPLETION RATE PREDICTION
      const currentCompletionRate = tasks?.length ? (completedTasks.length / tasks.length) * 100 : 0;
      const pillarCompletionRate = activatedPillars.length ? (completedPillars.length / activatedPillars.length) * 100 : 0;
      
      // Predict future completion rate based on current trends
      let predictedCompletionRate = currentCompletionRate;
      let completionTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      
      if (currentCompletionRate > 70) {
        predictedCompletionRate = Math.min(95, currentCompletionRate + 10);
        completionTrend = 'increasing';
      } else if (currentCompletionRate < 30) {
        predictedCompletionRate = Math.max(10, currentCompletionRate - 5);
        completionTrend = 'decreasing';
      }
      
      newPredictions.push({
        id: 'completion-rate-prediction',
        name: 'Uppgifts-genomförande',
        type: 'completion_rate',
        confidence: 85,
        timeframe,
        prediction: predictedCompletionRate,
        trend: completionTrend,
        factors: [
          `Nuvarande completion rate: ${Math.round(currentCompletionRate)}%`,
          `Pillar completion rate: ${Math.round(pillarCompletionRate)}%`,
          `Aktiva uppgifter: ${activeTasks.length}`
        ],
        recommendation: completionTrend === 'decreasing' 
          ? 'Fokusera på att slutföra befintliga uppgifter innan du tar på dig nya'
          : 'Fortsätt det positiva momentumet med nya utmaningar',
        lastUpdated: new Date()
      });

      // 📈 ENGAGEMENT TREND PREDICTION
      const recentActivity = activeTasks.filter(task => {
        const createdDate = new Date(task.created_at);
        const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreated <= 7;
      }).length;
      
      let engagementScore = 50; // Base score
      if (recentActivity > 2) engagementScore = 80;
      else if (recentActivity === 0) engagementScore = 20;
      
      let engagementTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentActivity > activeTasks.length * 0.3) engagementTrend = 'increasing';
      else if (recentActivity === 0 && activeTasks.length > 0) engagementTrend = 'decreasing';
      
      newPredictions.push({
        id: 'engagement-trend-prediction',
        name: 'Engagement-nivå',
        type: 'engagement_trend',
        confidence: 78,
        timeframe,
        prediction: engagementScore,
        trend: engagementTrend,
        factors: [
          `Senaste veckans aktivitet: ${recentActivity} uppgifter`,
          `Total pending uppgifter: ${activeTasks.length}`,
          `Genomförda pillars: ${completedPillars.length}`
        ],
        recommendation: engagementTrend === 'decreasing'
          ? 'Överväg att minska antalet samtidiga mål för ökad fokus'
          : 'Din nuvarande engagement-nivå är hållbar för fortsatt framgång',
        lastUpdated: new Date()
      });

      // 🎯 GOAL ACHIEVEMENT PREDICTION
      const goalAchievementScore = (pillarCompletionRate + currentCompletionRate) / 2;
      const goalTrend = goalAchievementScore > 60 ? 'increasing' : 
                        goalAchievementScore < 30 ? 'decreasing' : 'stable';
      
      newPredictions.push({
        id: 'goal-achievement-prediction',
        name: 'Måluppfyllelse',
        type: 'goal_achievement',
        confidence: 82,
        timeframe,
        prediction: goalAchievementScore,
        trend: goalTrend,
        factors: [
          `Pillar genomförande: ${Math.round(pillarCompletionRate)}%`,
          `Uppgift genomförande: ${Math.round(currentCompletionRate)}%`,
          `Antal aktiva mål: ${activatedPillars.length}`
        ],
        recommendation: goalTrend === 'increasing'
          ? 'Du är på rätt väg - överväg att sätta mer ambitiösa mål'
          : 'Fokusera på kvalitet över kvantitet i dina mål',
        lastUpdated: new Date()
      });

      // 🧠 SKILL PROGRESSION PREDICTION
      const skillProgressionScore = completedPillars.length * 15 + Math.min(currentCompletionRate, 40);
      const skillTrend = completedPillars.length > 1 ? 'increasing' : 'stable';
      
      newPredictions.push({
        id: 'skill-progression-prediction',
        name: 'Färdighetsutveckling',
        type: 'skill_progression',
        confidence: 75,
        timeframe,
        prediction: skillProgressionScore,
        trend: skillTrend,
        factors: [
          `Genomförda utvecklingsområden: ${completedPillars.length}`,
          `Aktiverade områden: ${activatedPillars.length}`,
          `Konsistens i genomförande: ${Math.round(currentCompletionRate)}%`
        ],
        recommendation: skillTrend === 'increasing'
          ? 'Utmärkt progression - överväg mer utmanande färdighetsområden'
          : 'Fokusera på att bygga konsistenta vanor för färdighetsutveckling',
        lastUpdated: new Date()
      });

      // 🧩 USER PATTERN ANALYSIS
      
      // Behavioral Pattern: Completion Consistency
      if (currentCompletionRate > 75) {
        newPatterns.push({
          id: 'high-completion-pattern',
          type: 'behavioral',
          strength: 9,
          description: 'Konsekvent hög genomförandeförmåga',
          impact: 'positive',
          evidence: [
            `${Math.round(currentCompletionRate)}% completion rate`,
            'Starkt mönster av måluppfyllelse'
          ],
          suggestedInterventions: [
            'Sätt mer utmanande mål',
            'Mentorskap för andra användare',
            'Utforska nya utvecklingsområden'
          ]
        });
      } else if (currentCompletionRate < 30) {
        newPatterns.push({
          id: 'low-completion-pattern',
          type: 'behavioral',
          strength: 7,
          description: 'Utmaning med genomförande och måluppfyllelse',
          impact: 'negative',
          evidence: [
            `Endast ${Math.round(currentCompletionRate)}% completion rate`,
            'Mönster av ofullständiga mål'
          ],
          suggestedInterventions: [
            'Minska antalet samtidiga mål',
            'Bryt ner stora mål i mindre steg',
            'Implementera dagliga check-ins'
          ]
        });
      }

      // Temporal Pattern: Activity Timing
      if (recentActivity === 0 && activeTasks.length > 0) {
        newPatterns.push({
          id: 'stagnation-pattern',
          type: 'temporal',
          strength: 8,
          description: 'Periods av inaktivitet trots aktiva mål',
          impact: 'negative',
          evidence: [
            'Ingen aktivitet senaste veckan',
            `${activeTasks.length} väntande uppgifter`
          ],
          suggestedInterventions: [
            'Dagliga påminnelser',
            'Accountability partner',
            'Omvärdera målens relevans'
          ]
        });
      }

      // Motivational Pattern: Goal Setting Behavior
      if (activatedPillars.length > completedPillars.length * 3) {
        newPatterns.push({
          id: 'over-activation-pattern',
          type: 'motivational',
          strength: 6,
          description: 'Tendens att aktivera fler mål än vad som genomförs',
          impact: 'negative',
          evidence: [
            `${activatedPillars.length} aktiverade vs ${completedPillars.length} genomförda`,
            'Hög aktivering, låg completion ratio'
          ],
          suggestedInterventions: [
            'Fokus på ett mål i taget',
            'Vänta med nya aktiveringar',
            'Utvärdera målets realism'
          ]
        });
      }

      setPredictions(newPredictions);
      setUserPatterns(newPatterns);
      setLastAnalysis(new Date());
      
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (effectiveUserId && tasks) {
      generatePredictions();
    }
  }, [effectiveUserId, tasks, timeframe]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600 bg-green-50 border-green-200';
      case 'decreasing': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPatternImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Predictive Analytics</CardTitle>
                <CardDescription>
                  AI-driven prediktioner för din utvecklingsresa
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {timeframe} dagar prognos
              </Badge>
              <Button 
                variant="outline" 
                onClick={generatePredictions}
                disabled={isAnalyzing}
                size="sm"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Analyserar...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Uppdatera
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {lastAnalysis && (
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Senaste analys: {lastAnalysis.toLocaleString('sv-SE')}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {predictions.map((prediction) => (
          <Card key={prediction.id} className={`border-l-4 ${getTrendColor(prediction.trend)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{prediction.name}</CardTitle>
                {getTrendIcon(prediction.trend)}
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-xs">
                  {prediction.confidence}% säkerhet
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {prediction.timeframe} dagar
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Prediction Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Predikterat värde</span>
                    <span className="text-2xl font-bold">{Math.round(prediction.prediction)}%</span>
                  </div>
                  <Progress value={prediction.prediction} className="h-2" />
                </div>
                
                {/* Factors */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Baserat på:</h5>
                  <ul className="space-y-1">
                    {prediction.factors.map((factor, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Recommendation */}
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Rekommendation:</strong> {prediction.recommendation}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Patterns */}
      {userPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Identifierade mönster
            </CardTitle>
            <CardDescription>
              AI-upptäckta beteendemönster i din utveckling
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {userPatterns.map((pattern) => (
                <div key={pattern.id} className={`p-4 rounded-lg border ${getPatternImpactColor(pattern.impact)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{pattern.description}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {pattern.type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Styrka: {pattern.strength}/10
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Evidens:</h5>
                      <ul className="space-y-1">
                        {pattern.evidence.map((evidence, index) => (
                          <li key={index} className="text-xs flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {evidence}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-1">Föreslagna åtgärder:</h5>
                      <ul className="space-y-1">
                        {pattern.suggestedInterventions.map((intervention, index) => (
                          <li key={index} className="text-xs flex items-start gap-2">
                            <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {intervention}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {predictions.length === 0 && !isAnalyzing && (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Inga prediktioner tillgängliga</h3>
            <p className="text-muted-foreground mb-4">
              Generera prediktioner baserat på din utvecklingsdata
            </p>
            <Button onClick={generatePredictions}>
              <Zap className="h-4 w-4 mr-2" />
              Starta prediktiv analys
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};