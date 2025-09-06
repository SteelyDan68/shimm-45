/**
 * 📊 COMPREHENSIVE PROGRESS DASHBOARD - SPRINT 2 UI IMPLEMENTATION
 * Visar neuroplasticitets-baserad progression och adaptive insights
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Target, Zap, Calendar, Award, AlertTriangle } from 'lucide-react';
import { ProgressTrackingEngine, ComprehensiveProgress } from '@/services/ProgressTrackingEngine';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';

export const ComprehensiveProgressDashboard = () => {
  const [progressData, setProgressData] = useState<ComprehensiveProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<string>('self_care');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadProgressData();
    }
  }, [user?.id]);

  const loadProgressData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const data = await ProgressTrackingEngine.getComprehensiveProgress(user.id);
      setProgressData(data);
    } catch (error) {
      console.error('Failed to load progress data:', error);
      toast({
        title: "Kunde inte ladda progressdata",
        description: "Försöker igen automatiskt...",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Ingen progressdata tillgänglig ännu.</p>
          <Button onClick={loadProgressData} className="mt-4">
            Ladda progress
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pillarNames: Record<string, string> = {
    self_care: 'Self Care',
    skills: 'Skills', 
    talent: 'Talent',
    brand: 'Brand',
    economy: 'Economy'
  };

  return (
    <div className="space-y-6">
      {/* Neuroplasticity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Neuroplastisk tillväxt</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    Object.values(progressData.pillarProgression)
                      .reduce((sum, pillar) => sum + pillar.neuroplasticGrowth, 0) / 
                    Object.keys(progressData.pillarProgression).length
                  )}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Inlärningshastighet</p>
                <p className="text-2xl font-bold">
                  {progressData.learningVelocity.currentVelocity.toFixed(1)}x
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Motivationsnivå</p>
                <p className="text-2xl font-bold">
                  {progressData.motivationalState.currentLevel}/10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Genombrott</p>
                <p className="text-2xl font-bold">
                  {progressData.neuroplasticMarkers.filter(m => m.significance === 'breakthrough').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedPillar} onValueChange={setSelectedPillar}>
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(pillarNames).map(([key, name]) => (
            <TabsTrigger key={key} value={key}>{name}</TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(progressData.pillarProgression).map(([pillarType, pillar]) => (
          <TabsContent key={pillarType} value={pillarType} className="space-y-6">
            {/* Pillar Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>{pillarNames[pillarType]} Progress</span>
                </CardTitle>
                <CardDescription>
                  Aktuell nivå: {pillar.currentLevel}/10 • 
                  Neuroplastisk tillväxt: {Math.round(pillar.neuroplasticGrowth)}%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nuvarande nivå</span>
                    <span>{pillar.currentLevel}/10</span>
                  </div>
                  <Progress value={pillar.currentLevel * 10} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Konsistens</span>
                    <span>{Math.round(pillar.consistencyScore * 100)}%</span>
                  </div>
                  <Progress value={pillar.consistencyScore * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Neuroplastisk tillväxt</span>
                    <span>{Math.round(pillar.neuroplasticGrowth)}%</span>
                  </div>
                  <Progress value={Math.min(100, pillar.neuroplasticGrowth)} />
                </div>
              </CardContent>
            </Card>

            {/* Mastery Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Färdighetsmätare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pillar.masteryIndicators.map((indicator, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{indicator.skillArea}</h4>
                        <Badge variant={indicator.masteryLevel > 0.7 ? "default" : "secondary"}>
                          {Math.round(indicator.masteryLevel * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {indicator.neuroplasticEvidence}
                      </p>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{indicator.timeToMastery} dagar till behärskning</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Struggling Areas & Breakthrough Moments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Struggling Areas */}
              {pillar.strugglingAreas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <span>Områden som behöver fokus</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pillar.strugglingAreas.map((area, index) => (
                        <div key={index} className="p-3 bg-warning/10 rounded-lg">
                          <p className="text-sm">{area}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Breakthrough Moments */}
              {pillar.breakthroughMoments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-success" />
                      <span>Genombrott</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pillar.breakthroughMoments.slice(0, 3).map((breakthrough, index) => (
                        <div key={index} className="p-3 bg-success/10 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-medium">{breakthrough.description}</p>
                            <Badge variant="outline">{breakthrough.impactMeasure}/10</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {breakthrough.neuroplasticSignificance}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(breakthrough.timestamp).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Predicted Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Prognostiserad utveckling</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{pillar.predictedTimeline.nextMilestone}</h4>
                      <p className="text-sm text-muted-foreground">
                        Uppskattat: {pillar.predictedTimeline.estimatedDays} dagar
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={pillar.predictedTimeline.confidence > 0.7 ? "default" : "secondary"}>
                        {Math.round(pillar.predictedTimeline.confidence * 100)}% säkerhet
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Påverkande faktorer:</p>
                    <div className="flex flex-wrap gap-2">
                      {pillar.predictedTimeline.adaptationFactors.map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Optimal Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Rekommenderade åtgärder</CardTitle>
          <CardDescription>
            Baserat på din neuroplastiska utveckling och aktuella trender
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {progressData.nextOptimalActions.slice(0, 3).map((action, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{action.title}</h4>
                  <div className="flex space-x-2">
                    <Badge variant={
                      action.urgency === 'critical' ? 'destructive' :
                      action.urgency === 'high' ? 'default' :
                      action.urgency === 'medium' ? 'secondary' : 'outline'
                    }>
                      {action.urgency}
                    </Badge>
                    <Badge variant="outline">{action.estimatedImpact}/10</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {action.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Neuroplastisk grund:</strong> {action.neuroplasticRationale}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};