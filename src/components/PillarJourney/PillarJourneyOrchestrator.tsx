import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/HelpTooltip';
import { GuidedPillarDiscovery } from './GuidedPillarDiscovery';
import { PillarProgressTracker } from './PillarProgressTracker';
import { AsynchronousJourneyManager } from './AsynchronousJourneyManager';
import { PillarTaskManager } from './PillarTaskManager';
import { JourneyTimeline } from './JourneyTimeline';
import { usePillarJourney } from '@/hooks/usePillarJourney';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useSixPillarsModular } from '@/hooks/useSixPillarsModular';
import { 
  Target, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Pause,
  Play,
  RotateCcw,
  TrendingUp,
  Users,
  Brain
} from 'lucide-react';

interface PillarJourneyOrchestratorProps {
  userId: string;
  userName: string;
}

// Huvudpolicy från UX Expert: Kognitiv belastning minimeras genom progressive disclosure
export const PillarJourneyOrchestrator = ({ userId, userName }: PillarJourneyOrchestratorProps) => {
  const { journeyState } = useUserJourney();
  const { getActivatedPillars, activatePillar } = useSixPillarsModular(userId);
  const { 
    activeJourneys, 
    completedJourneys, 
    pausedJourneys,
    initializeJourney,
    pauseJourney,
    resumeJourney,
    abandonJourney,
    completeJourney,
    getJourneyTimeline
  } = usePillarJourney(userId);

  const [selectedMode, setSelectedMode] = useState<'guided' | 'flexible' | 'intensive'>('guided');
  const [currentPhase, setCurrentPhase] = useState<'selection' | 'active' | 'reflection'>('selection');
  const [showIncompleteHandler, setShowIncompleteHandler] = useState(false);

  const activatedPillars = getActivatedPillars();
  const timeline = getJourneyTimeline();

  // Huvudpolicy från Coaching Psykolog: Respektera användarens autonomi
  const journeyModes = {
    guided: {
      name: 'Guidat läge',
      description: 'En pillar i taget med full support och vägledning',
      maxConcurrent: 1,
      supportLevel: 'hög',
      icon: <MapPin className="h-5 w-5" />
    },
    flexible: {
      name: 'Flexibelt läge', 
      description: 'Två pillars samtidigt med balanserat stöd',
      maxConcurrent: 2,
      supportLevel: 'medium',
      icon: <Target className="h-5 w-5" />
    },
    intensive: {
      name: 'Intensivt läge',
      description: 'Upp till tre pillars med minimal vägledning',
      maxConcurrent: 3,
      supportLevel: 'låg',
      icon: <TrendingUp className="h-5 w-5" />
    }
  };

  // Huvudpolicy från Product Manager: Mät engagement kontinuerligt
  const getEngagementMetrics = () => {
    const totalJourneys = activeJourneys.length + completedJourneys.length;
    const completionRate = totalJourneys > 0 ? (completedJourneys.length / totalJourneys) * 100 : 0;
    const averageProgress = activeJourneys.length > 0 
      ? activeJourneys.reduce((sum, j) => sum + j.progress, 0) / activeJourneys.length 
      : 0;
    
    return { totalJourneys, completionRate, averageProgress };
  };

  const metrics = getEngagementMetrics();

  // Huvudpolicy från Systemarkitekt: Error handling och edge cases
  const handleIncompleteJourney = async (journeyId: string, action: 'pause' | 'abandon' | 'restart') => {
    try {
      switch (action) {
        case 'pause':
          await pauseJourney(journeyId);
          break;
        case 'abandon':
          await abandonJourney(journeyId);
          break;
        case 'restart':
          await resumeJourney(journeyId);
          break;
      }
      setShowIncompleteHandler(false);
    } catch (error) {
      console.error('Error handling incomplete journey:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Huvudpolicy från UX Expert: Visuell hierarki och progressindikation */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Din Six Pillars Utvecklingsresa
                <HelpTooltip content="Välj hur många utvecklingsområden du vill fokusera på samtidigt. Du kan alltid ändra detta senare." />
              </CardTitle>
              <p className="text-muted-foreground">
                {metrics.totalJourneys > 0 
                  ? `${metrics.completionRate.toFixed(0)}% slutförd • ${activeJourneys.length} aktiva resor`
                  : 'Välj ditt lämpliga tempo och starta din utvecklingsresa'
                }
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-4 w-4" />
              {selectedMode ? journeyModes[selectedMode].name : 'Välj läge'}
            </Badge>
          </div>
          
          {metrics.totalJourneys > 0 && (
            <Progress value={metrics.averageProgress} className="mt-4" />
          )}
        </CardHeader>
      </Card>

      {/* Huvudpolicy från Coaching Psykolog: Stödja olika lärstilar */}
      <Tabs value={currentPhase} onValueChange={(value) => setCurrentPhase(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="selection" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Välj Pillars
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Aktiva Resor
          </TabsTrigger>
          <TabsTrigger value="reflection" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Reflektion
          </TabsTrigger>
        </TabsList>

        {/* Pillar Urval */}
        <TabsContent value="selection" className="space-y-6">
          {/* Lägesväljare */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Välj ditt utvecklingstempo
                <HelpTooltip content="Olika lägen passar olika personer. Börja med guidat läge om du är osäker." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(journeyModes).map(([key, mode]) => (
                  <Card 
                    key={key}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedMode === key ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedMode(key as any)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        {mode.icon}
                      </div>
                      <h3 className="font-semibold mb-1">{mode.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {mode.description}
                      </p>
                      <div className="flex justify-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Max {mode.maxConcurrent} samtidigt
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {mode.supportLevel} support
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informationssektion om Five Pillars */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Om Six Pillars systemet
                <HelpTooltip content="Five Pillars är ett beprövat system för hållbar utveckling inom fem kritiska livsområden." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Six Pillars är vårt holistiska utvecklingssystem som balanserar sex grundpelare: 
                <strong> Självomvårdnad, Kompetenser, Talang, Varumärke, Ekonomi och Öppna Spåret</strong>. 
                Varje pelare representerar ett kritiskt område för din personliga och professionella utveckling.
              </p>
              
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <h4 className="font-semibold">Redo att börja?</h4>
                  <p className="text-sm text-muted-foreground">
                    Gå till Six Pillars Dashboard för att läsa mer om systemet, 
                    göra dina första bedömningar och aktivera dina utvecklingsområden.
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/six-pillars'}
                  className="shrink-0"
                >
                  Öppna Six Pillars
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Guided Pillar Discovery */}
          <GuidedPillarDiscovery 
            userId={userId}
            maxSelection={journeyModes[selectedMode].maxConcurrent}
            currentActive={activeJourneys.length}
            onPillarSelect={(pillarKey) => initializeJourney(pillarKey, selectedMode)}
          />
        </TabsContent>

        {/* Aktiva Resor */}
        <TabsContent value="active" className="space-y-6">
          {activeJourneys.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inga aktiva resor</h3>
                <p className="text-muted-foreground mb-4">
                  Starta din första utvecklingsresa genom att välja en pillar.
                </p>
                <Button onClick={() => setCurrentPhase('selection')}>
                  Välj Pillars
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Aktiva resor hantering */}
              <AsynchronousJourneyManager 
                journeys={activeJourneys}
                onPause={pauseJourney}
                onComplete={completeJourney}
                onAbandon={abandonJourney}
              />
              
              {/* Task Management */}
              <PillarTaskManager
                userId={userId}
                activeJourneys={activeJourneys}
                onTaskComplete={(taskId) => {
                  // Huvudpolicy från Frontend Dev: Optimistisk UI
                  console.log('Task completed:', taskId);
                }}
              />
            </>
          )}

          {/* Pausade resor hantering */}
          {pausedJourneys.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Pause className="h-5 w-5" />
                  Pausade Resor
                  <HelpTooltip content="Resor du har pausat kan återupptas när som helst." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pausedJourneys.map((journey) => (
                    <div key={journey.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <h4 className="font-medium">{journey.pillarName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Pausad {new Date(journey.pausedAt!).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleIncompleteJourney(journey.id, 'restart')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Återuppta
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleIncompleteJourney(journey.id, 'abandon')}
                        >
                          Avbryt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reflektion och Timeline */}
        <TabsContent value="reflection" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Tracker */}
            <div className="lg:col-span-2">
              <PillarProgressTracker 
                userId={userId}
                completedJourneys={completedJourneys}
                activeJourneys={activeJourneys}
              />
            </div>
            
            {/* Metrics Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Utvecklingsstatistik
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {completedJourneys.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Slutförda pillars
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.completionRate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Slutförandegrad
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {activeJourneys.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Aktiva resor
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Journey Timeline */}
          <JourneyTimeline 
            timeline={timeline}
            userId={userId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};