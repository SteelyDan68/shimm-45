import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useRoleCache } from '@/hooks/useRoleCache';
import { useUserPillars } from '@/hooks/useUserPillars'; // FIXED to use path_entries
import { useTasks } from '@/hooks/useTasks';
import { useNavigate } from 'react-router-dom';
import UnifiedPillarOrchestrator from '@/components/PillarJourney/UnifiedPillarOrchestrator';
import { Sparkles, Target, Clock, Trophy, ArrowRight, Calendar, CheckSquare, Users, FileText } from 'lucide-react';
import { PILLAR_MODULES } from '@/config/pillarModules';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface EnhancedClientDashboardProps {
  className?: string;
}

const EnhancedClientDashboard: React.FC<EnhancedClientDashboardProps> = ({
  className = ""
}) => {
  const { user } = useAuth();
  const { isClient } = useRoleCache(); // Use cached role check
  const navigate = useNavigate();
  const [showPillarJourney, setShowPillarJourney] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const { tasks, loading: tasksLoading } = useTasks(isClient ? user?.id : undefined);
  
  // CRITICAL FIX: Use real pillar data from path_entries
  const { 
    activations, 
    assessments, 
    loading: pillarLoading,
    getCompletedPillars,
    getActivatedPillars 
  } = useUserPillars(user?.id || '');
  
  // Calculate actual pillar progress from real data
  const completedPillars = getCompletedPillars().length;
  const activePillars = getActivatedPillars().length;
  const overallProgress = completedPillars > 0 ? (completedPillars / 6) * 100 : 0;

  // Load calendar events with memoization
  useEffect(() => {
    if (!user?.id) return;
    
    let isMounted = true;
    
    const loadCalendarEvents = async () => {
      try {
        const { data: events, error } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', user.id)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(5);

        if (error) throw error;
        
        if (isMounted) {
          setCalendarEvents(events || []);
          setUpcomingEvents(events?.slice(0, 3) || []);
        }
      } catch (error) {
        console.error('Error loading calendar events:', error);
      }
    };

    loadCalendarEvents();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only depend on user.id

  // Refresh data när komponenten visas igen
  const handleShowPillarJourney = () => {
    setShowPillarJourney(true);
  };

  if (pillarLoading || tasksLoading) {
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

  // CRITICAL FIX: Calculate next pillar from REAL completion data
  const pillarOrder: string[] = ['self_care', 'skills', 'talent', 'brand', 'economy', 'open_track'];
  const completedPillarKeys = getCompletedPillars();
  const nextPillar = pillarOrder.find(pillar => !completedPillarKeys.includes(pillar as any));
  const hasActiveWork = activePillars > 0;
  
  // Calculate real activity statistics
  const activeTasks = tasks?.filter(task => task.status !== 'completed') || [];
  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];
  const totalActivities = calendarEvents.length + (tasks?.length || 0);
  const completedActivities = completedTasks.length;
  
  // Check if all pillars are completed
  const allPillarsCompleted = completedPillars === 6;

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
                {completedActivities}
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
            <Progress value={overallProgress} className="h-3 bg-gray-200" />
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
            {!allPillarsCompleted && nextPillar ? (
              <div className="space-y-3">
                <p className="text-blue-600">
                  Redo att börja med <strong>{PILLAR_MODULES[nextPillar].name}</strong>?
                </p>
                <p className="text-sm text-blue-500">
                  {PILLAR_MODULES[nextPillar].description}
                </p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleShowPillarJourney}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Starta {PILLAR_MODULES[nextPillar].name}
                </Button>
              </div>
            ) : allPillarsCompleted ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-100 rounded-lg border-2 border-green-300">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">✓</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">
                    ✅ FAS 2 AKTIVERAD!
                  </h3>
                  <p className="text-green-700 font-medium">
                    {calendarEvents.length} kalenderaktiviteter och {tasks?.length || 0} utvecklingsuppgifter har skapats!
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate('/calendar')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Se Kalender
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate('/tasks')}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Se Uppgifter
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-blue-600">
                  Välkommen! Börja din utvecklingsresa genom att genomföra dina första pillar-assessments.
                </p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleShowPillarJourney}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Börja utvecklingsresan
                </Button>
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
            {upcomingEvents.length > 0 || activeTasks.length > 0 ? (
              <div className="space-y-3">
                {/* Upcoming Calendar Events */}
                {upcomingEvents.slice(0, 2).map(event => (
                  <div key={event.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString('sv-SE')} - {event.category}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatDistanceToNow(new Date(event.event_date), { locale: sv, addSuffix: true })}
                    </Badge>
                  </div>
                ))}
                
                {/* Active Tasks */}
                {activeTasks.slice(0, 2 - upcomingEvents.length).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Uppgift - {task.priority} prioritet
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.status === 'in_progress' ? 'Pågår' : 'Ej påbörjad'}
                    </Badge>
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate('/calendar')}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Kalender
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate('/tasks')}
                  >
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Uppgifter
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-green-600">
                  Inga aktiva utvecklingsplaner just nu.
                </p>
                <p className="text-sm text-muted-foreground">
                  Genomför en pillar-assessment för att få personliga aktiviteter!
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShowPillarJourney}
                >
                  Starta assessment
                </Button>
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
                onClick={handleShowPillarJourney}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Öppna Pillar-resa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Cards for Live Functionality */}
      {allPillarsCompleted && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/calendar')}>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{calendarEvents.length}</div>
              <p className="text-sm text-muted-foreground">Kalenderaktiviteter</p>
              <Button variant="ghost" size="sm" className="mt-2">Öppna kalender</Button>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/tasks')}>
            <CardContent className="p-6 text-center">
              <CheckSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{tasks?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Utvecklingsuppgifter</p>
              <Button variant="ghost" size="sm" className="mt-2">Se uppgifter</Button>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/messages')}>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">Coach</div>
              <p className="text-sm text-muted-foreground">Kontakt & Support</p>
              <Button variant="ghost" size="sm" className="mt-2">Chatta</Button>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleShowPillarJourney}>
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{Math.round(overallProgress)}%</div>
              <p className="text-sm text-muted-foreground">Utvecklingsstatus</p>
              <Button variant="ghost" size="sm" className="mt-2">Se framsteg</Button>
            </CardContent>
          </Card>
        </div>
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
              {completedActivities}
            </div>
            <p className="text-xs text-muted-foreground">Aktiviteter klara</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {activeTasks.length}
            </div>
            <p className="text-xs text-muted-foreground">Aktiva uppgifter</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(overallProgress)}%
            </div>
            <p className="text-xs text-muted-foreground">Total framsteg</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedClientDashboard;