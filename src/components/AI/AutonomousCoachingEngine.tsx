/**
 * 🤖 AUTONOMOUS COACHING ENGINE
 * Enterprise-grade AI coaching system med proaktiv intervention
 * Phase 3: AI Intelligence Revolution
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Activity,
  Clock,
  Star
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUserPillars } from '@/hooks/useUserPillars';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';

interface CoachingInsight {
  id: string;
  type: 'performance' | 'engagement' | 'goal_alignment' | 'behavior_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  actionable: boolean;
  confidence: number;
  dataPoints: string[];
  timeframe: string;
  expectedOutcome: string;
}

interface AutonomousCoachingEngineProps {
  userId?: string;
  autoMode?: boolean;
  className?: string;
}

export const AutonomousCoachingEngine: React.FC<AutonomousCoachingEngineProps> = ({
  userId,
  autoMode = true,
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const effectiveUserId = userId || user?.id;
  
  const { getCompletedPillars, getActivatedPillars } = useUserPillars(effectiveUserId || '');
  const { tasks } = useTasks(effectiveUserId);
  
  const [insights, setInsights] = useState<CoachingInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(autoMode);

  // 🧠 INTELLIGENT INSIGHT GENERATION
  const generateInsights = async () => {
    setIsAnalyzing(true);
    
    try {
      const completedPillars = getCompletedPillars();
      const activatedPillars = getActivatedPillars();
      const activeTasks = tasks?.filter(t => t.status !== 'completed') || [];
      const completedTasks = tasks?.filter(t => t.status === 'completed') || [];
      
      const generatedInsights: CoachingInsight[] = [];
      
      // 📊 PERFORMANCE ANALYSIS
      if (completedPillars.length === 0 && activatedPillars.length > 0) {
        generatedInsights.push({
          id: 'performance-activation-gap',
          type: 'performance',
          severity: 'medium',
          title: 'Aktiverade men ej genomförda pillars',
          description: `Du har aktiverat ${activatedPillars.length} pillars men inte genomfört någon ännu.`,
          recommendation: 'Fokusera på att slutföra en pillar i taget för att bygga momentum.',
          actionable: true,
          confidence: 85,
          dataPoints: [`${activatedPillars.length} aktiverade pillars`, '0 genomförda'],
          timeframe: '2 veckor',
          expectedOutcome: 'Förbättrad completion rate och självförtroende'
        });
      }

      // 🎯 ENGAGEMENT ANALYSIS
      const recentTaskActivity = activeTasks.filter(task => {
        const createdDate = new Date(task.created_at);
        const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreated <= 7;
      });

      if (recentTaskActivity.length === 0 && activeTasks.length > 3) {
        generatedInsights.push({
          id: 'engagement-declining',
          type: 'engagement',
          severity: 'high',
          title: 'Minskad aktivitet upptäckt',
          description: 'Ingen ny aktivitet på 7 dagar trots aktiva uppgifter.',
          recommendation: 'Överväg att dela upp stora uppgifter i mindre, mer hanterbara steg.',
          actionable: true,
          confidence: 92,
          dataPoints: ['0 nya uppgifter senaste veckan', `${activeTasks.length} väntande uppgifter`],
          timeframe: '3 dagar',
          expectedOutcome: 'Återupptagen aktivitet och minskad procrastination'
        });
      }

      // 🎪 GOAL ALIGNMENT ANALYSIS
      const pillarBalance = activatedPillars.reduce((acc, pillar) => {
        const pillarKey = String(pillar);
        acc[pillarKey] = (acc[pillarKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const unevenFocus = Object.values(pillarBalance).some(count => count > 2);
      if (unevenFocus) {
        generatedInsights.push({
          id: 'goal-alignment-imbalance',
          type: 'goal_alignment',
          severity: 'medium',
          title: 'Obalanserad utvecklingsfokus',
          description: 'Din utveckling är starkt fokuserad på specifika områden.',
          recommendation: 'Överväg att diversifiera din utveckling för holistisk tillväxt.',
          actionable: true,
          confidence: 78,
          dataPoints: Object.entries(pillarBalance).map(([pillar, count]) => `${pillar}: ${count} aktiviteter`),
          timeframe: '1 månad',
          expectedOutcome: 'Mer balanserad personlig utveckling'
        });
      }

      // 🔥 BEHAVIOR PATTERN ANALYSIS
      const completionRate = tasks?.length ? (completedTasks.length / tasks.length) * 100 : 0;
      if (completionRate > 80) {
        generatedInsights.push({
          id: 'behavior-high-performer',
          type: 'behavior_pattern',
          severity: 'low',
          title: 'Stark prestationsförmåga identifierad',
          description: `Imponerande ${Math.round(completionRate)}% completion rate på dina uppgifter.`,
          recommendation: 'Överväg att sätta mer utmanande mål för fortsatt tillväxt.',
          actionable: true,
          confidence: 95,
          dataPoints: [`${completedTasks.length}/${tasks?.length} uppgifter slutförda`],
          timeframe: '1 vecka',
          expectedOutcome: 'Accelererad utveckling genom utmanade mål'
        });
      }

      // 🚨 CRITICAL INTERVENTION NEEDED
      const staleTasks = activeTasks.filter(task => {
        const createdDate = new Date(task.created_at);
        const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreated > 14;
      });

      if (staleTasks.length > 2) {
        generatedInsights.push({
          id: 'critical-stagnation',
          type: 'engagement',
          severity: 'critical',
          title: 'Kritisk stagnation upptäckt',
          description: `${staleTasks.length} uppgifter har varit inaktiva i över 2 veckor.`,
          recommendation: 'Omedelbar intervention krävs. Överväg att arkivera gamla uppgifter och sätta nya, relevanta mål.',
          actionable: true,
          confidence: 98,
          dataPoints: [`${staleTasks.length} inaktiva uppgifter`, '14+ dagar utan aktivitet'],
          timeframe: 'Omedelbart',
          expectedOutcome: 'Återupptagen motivation och klarhet i mål'
        });
      }

      setInsights(generatedInsights);
      setLastAnalysis(new Date());
      
      if (generatedInsights.some(i => i.severity === 'critical')) {
        toast({
          title: "Kritisk coaching insight",
          description: "Stefan AI har identifierat områden som behöver omedelbar uppmärksamhet.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Error generating coaching insights:', error);
      toast({
        title: "Analys misslyckades",
        description: "Kunde inte generera coaching insights just nu.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-analysis trigger
  useEffect(() => {
    if (autoAnalysisEnabled && effectiveUserId && !lastAnalysis) {
      generateInsights();
    }
  }, [autoAnalysisEnabled, effectiveUserId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'high': return Clock;
      case 'medium': return Activity;
      default: return CheckCircle;
    }
  };

  const prioritizedInsights = useMemo(() => {
    return [...insights].sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [insights]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Autonomous Coaching Engine</CardTitle>
                <CardDescription>
                  AI-driven insikter för kontinuerlig utveckling
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={generateInsights}
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
                    Ny Analys
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {lastAnalysis && (
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Senaste analys: {lastAnalysis.toLocaleString('sv-SE')}</span>
              <Badge variant="secondary">
                {insights.length} insights genererade
              </Badge>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Insights */}
      {prioritizedInsights.length > 0 ? (
        <div className="space-y-4">
          {prioritizedInsights.map((insight) => {
            const SeverityIcon = getSeverityIcon(insight.severity);
            
            return (
              <Card key={insight.id} className={`border-l-4 ${getSeverityColor(insight.severity)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <SeverityIcon className="h-5 w-5 mt-1 flex-shrink-0" />
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <CardDescription>{insight.description}</CardDescription>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-xs">
                            {insight.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {insight.confidence}% säkerhet
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Timeframe: {insight.timeframe}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Alert className="mb-4">
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Rekommendation:</strong> {insight.recommendation}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Förväntad utfall:</h5>
                      <p className="text-sm text-muted-foreground">{insight.expectedOutcome}</p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">Baserat på data:</h5>
                      <div className="flex flex-wrap gap-2">
                        {insight.dataPoints.map((point, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {point}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {insight.actionable && (
                      <Button size="sm" className="w-full sm:w-auto">
                        Implementera rekommendation
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : !isAnalyzing ? (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Inga insights ännu</h3>
            <p className="text-muted-foreground mb-4">
              Kör en analys för att få personaliserade coaching-insights
            </p>
            <Button onClick={generateInsights}>
              <Zap className="h-4 w-4 mr-2" />
              Starta analys
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Activity className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Analyserar dina mönster...</h3>
            <p className="text-muted-foreground">Stefan AI granskar din utvecklingsdata</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};