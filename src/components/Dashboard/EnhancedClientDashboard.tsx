import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { usePillarOrchestration } from '@/hooks/usePillarOrchestration';
import UnifiedPillarOrchestrator from '@/components/PillarJourney/UnifiedPillarOrchestrator';
import { Sparkles, Target, Clock, Trophy, ArrowRight } from 'lucide-react';
import { PILLAR_MODULES } from '@/config/pillarModules';

interface EnhancedClientDashboardProps {
  className?: string;
}

const EnhancedClientDashboard: React.FC<EnhancedClientDashboardProps> = ({
  className = ""
}) => {
  const { user } = useAuth();
  const [showPillarJourney, setShowPillarJourney] = useState(false);
  const {
    loading,
    pillarProgress,
    activeDevelopmentPlans,
    overallProgress,
    getNextUnlockedPillar
  } = usePillarOrchestration();

  if (loading) {
    return (
      <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar din dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextPillar = getNextUnlockedPillar();
  const completedPillars = pillarProgress.filter(p => p.isCompleted).length;
  const hasActiveWork = activeDevelopmentPlans.length > 0;

  return (
    <div className={`max-w-6xl mx-auto space-y-6 ${className}`}>
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Hej {user?.user_metadata?.first_name || 'där'}! 👋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-600">{completedPillars}/6</div>
              <p className="text-sm text-muted-foreground">Pillars genomförda</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-green-600">
                {activeDevelopmentPlans.reduce((sum, plan) => sum + plan.completedActivities, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Aktiviteter klara</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(overallProgress)}%
              </div>
              <p className="text-sm text-muted-foreground">Total progress</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Din utvecklingsresa</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Action */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Target className="w-5 h-5" />
              Nästa steg
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextPillar ? (
              <div className="space-y-3">
                <p className="text-blue-600">
                  Redo att börja med <strong>{PILLAR_MODULES[nextPillar].name}</strong>?
                </p>
                <p className="text-sm text-blue-500">
                  {PILLAR_MODULES[nextPillar].description}
                </p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowPillarJourney(true)}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Starta {PILLAR_MODULES[nextPillar].name}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto" />
                <p className="text-green-600 font-semibold">
                  🎉 Alla pillars genomförda!
                </p>
                <p className="text-sm text-muted-foreground">
                  Fantastiskt arbete! Du har genomfört hela utvecklingsprogrammet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Work */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Clock className="w-5 h-5" />
              Pågående aktiviteter
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasActiveWork ? (
              <div className="space-y-3">
                {activeDevelopmentPlans.slice(0, 2).map(plan => (
                  <div key={plan.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{PILLAR_MODULES[plan.pillarKey].name}</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.completedActivities}/{plan.totalActivities} klara
                      </p>
                    </div>
                    <Badge variant="outline">
                      Vecka {plan.currentWeek}/{plan.totalWeeks}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Clock className="w-4 h-4 mr-2" />
                  Se alla aktiviteter
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-green-600">
                  Inga aktiva utvecklingsplaner just nu.
                </p>
                <p className="text-sm text-muted-foreground">
                  Genomför en pillar-assessment för att få personliga aktiviteter!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Pillar Journey */}
      {showPillarJourney && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Din Pillar-Utvecklingsresa
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPillarJourney(false)}
              >
                Stäng
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <UnifiedPillarOrchestrator />
          </CardContent>
        </Card>
      )}

      {/* Pillar Journey Quick Access */}
      {!showPillarJourney && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Pillar-Utvecklingsresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Upptäck och utveckla alla områden i ditt liv genom våra sex pillars.
              </p>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowPillarJourney(true)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Öppna Pillar-resa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{completedPillars}</div>
            <p className="text-xs text-muted-foreground">Pillars klara</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {activeDevelopmentPlans.reduce((sum, plan) => sum + plan.totalActivities, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Totalt aktiviteter</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {activeDevelopmentPlans.reduce((sum, plan) => sum + plan.currentWeek, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Aktiva veckor</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(overallProgress)}%
            </div>
            <p className="text-xs text-muted-foreground">Framsteg</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedClientDashboard;