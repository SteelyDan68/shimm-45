import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StefanWidget } from '@/components/Stefan/StefanWidget';
import { SmartJourneyGuide } from '@/components/Journey/SmartJourneyGuide';
import { WelcomeAssessmentReset } from '@/components/Admin/WelcomeAssessmentReset';
import { PillarHeatmap } from '@/components/SixPillars/PillarHeatmap';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { ClientTaskList } from '@/components/ClientTasks/ClientTaskList';
import { PathTimeline } from '@/components/ClientPath/PathTimeline';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useSixPillarsModular } from '@/hooks/useSixPillarsModular';
import { useAuth } from '@/hooks/useAuth';
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';
import { 
  User, 
  Brain, 
  CheckSquare,
  TrendingUp,
  MessageSquare,
  Calendar,
  Target,
  Activity,
  MapPin,
  Star,
  Trophy
} from 'lucide-react';

interface EnhancedDashboardProps {
  userId: string;
  userName: string;
}

export const EnhancedDashboard = ({ userId, userName }: EnhancedDashboardProps) => {
  const { user } = useAuth();
  const { journeyState, getJourneyProgress, getCurrentPhaseDescription } = useUserJourney();
  const { generateHeatmapData, getActivatedPillars } = useSixPillarsModular(userId);
  const [selectedTab, setSelectedTab] = useState('journey');

  const heatmapData = generateHeatmapData();
  const activatedPillars = getActivatedPillars();
  const journeyProgress = getJourneyProgress();

  const getPhaseIcon = () => {
    switch (journeyState?.current_phase) {
      case 'welcome':
        return <Star className="h-5 w-5 text-blue-600" />;
      case 'pillar_selection':
        return <Target className="h-5 w-5 text-green-600" />;
      case 'deep_dive':
        return <TrendingUp className="h-5 w-5 text-purple-600" />;
      case 'maintenance':
        return <Trophy className="h-5 w-5 text-gold-600" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-600" />;
    }
  };

  const getWelcomeMessage = () => {
    if (journeyProgress === 0) {
      return `Välkommen ${userName}! Dags att börja din utvecklingsresa.`;
    } else if (journeyProgress < 50) {
      return `Bra jobbat ${userName}! Du är ${journeyProgress}% färdig med din grundläggande kartläggning.`;
    } else if (journeyProgress < 100) {
      return `Fantastiskt framsteg ${userName}! Du utvecklas stadigt inom dina fokusområden.`;
    } else {
      return `Imponerande ${userName}! Du har byggt en stark grund för kontinuerlig utveckling.`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header with Journey Status */}
      <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                {getPhaseIcon()}
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {getWelcomeMessage()}
                  <HelpTooltip content={helpTexts.enhancedDashboard.journeyProgress} />
                </CardTitle>
                <p className="text-muted-foreground flex items-center gap-1">
                  {getCurrentPhaseDescription()}
                  <HelpTooltip content={helpTexts.enhancedDashboard.currentPhase} />
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 flex items-center gap-1">
                {journeyProgress}%
                <HelpTooltip content={helpTexts.enhancedDashboard.journeyProgress} side="left" />
              </div>
              <p className="text-sm text-muted-foreground">Framsteg</p>
            </div>
          </div>
          
          <Progress value={journeyProgress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Stefan Widget - Always Visible */}
      <StefanWidget userId={userId} />

      {/* Main Dashboard Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="journey" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Min resa</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Översikt</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Uppgifter</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Analys</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
        </TabsList>

        {/* Journey Tab - Smart Journey Guide */}
        <TabsContent value="journey" className="space-y-6">
          {/* Debug: Welcome Assessment Reset */}
          <WelcomeAssessmentReset />
          
          <SmartJourneyGuide userId={userId} userName={userName} />
        </TabsContent>

        {/* Overview Tab - Heatmap and Statistics */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {activatedPillars.length}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  Aktiva områden
                  <HelpTooltip content={helpTexts.sixPillars?.activePillars || "Aktiva utvecklingsområden"} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <CheckSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {journeyState?.completed_assessments?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  Bedömningar
                  <HelpTooltip content={helpTexts.journey.recommendedAssessments} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {heatmapData.length > 0 
                    ? (heatmapData.reduce((sum, p) => sum + p.score, 0) / heatmapData.length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  Genomsnitt
                  <HelpTooltip content={helpTexts.sixPillars?.overallScore || "Genomsnittlig poäng"} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {journeyState?.stefan_interventions_count || 0}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  Stefan-tips
                  <HelpTooltip content={helpTexts.stefan.proactiveMessages} />
                </div>
              </CardContent>
            </Card>
          </div>

          <PillarHeatmap
            userId={userId}
            heatmapData={heatmapData}
            showDetails={true}
            title="Six Pillars Status"
            onPillarClick={() => {}}
          />
          <div className="text-center">
            <HelpTooltip content={helpTexts.sixPillars?.heatmap || "Sex Pillars visualisering"}>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Vad betyder färgerna? <span className="ml-1">💡</span>
              </Button>
            </HelpTooltip>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <ClientTaskList clientId={userId} clientName={userName} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard clientId={userId} />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <PathTimeline clientId={userId} clientName={userName} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium flex items-center gap-1">
                Nästa steg
                <HelpTooltip content={helpTexts.dashboard.nextSteps} />
              </h4>
              <p className="text-sm text-muted-foreground">
                {journeyState?.next_recommended_assessment 
                  ? `Rekommenderat: ${journeyState.next_recommended_assessment} bedömning`
                  : 'Utforska dina utvecklingsområden'
                }
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedTab === 'journey' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTab('journey')}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Se reseguide
              </Button>
              
              {journeyState?.next_recommended_assessment && (
                <Button size="sm">
                  <Target className="h-4 w-4 mr-1" />
                  Gör bedömning
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};