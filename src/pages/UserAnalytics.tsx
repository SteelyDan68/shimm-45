import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { JourneyTimeline } from '@/components/PillarJourney/JourneyTimeline';
import { CalendarActionableManager } from '@/components/Calendar/CalendarActionableManager';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target, 
  Brain,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';

/**
 * 🎯 UNIFIED USER ANALYTICS HUB
 * 
 * Centraliserad vy för:
 * - Pillar analyser & historik
 * - Aktivitets-timeline 
 * - Actionables planering
 * - Framstegsanalys
 */

interface PillarAnalysis {
  id: string;
  pillar_type: string;
  ai_analysis: string;
  calculated_score?: number;
  created_at: string;
  assessment_data?: any;
  insights?: any;
}

interface TimelineEvent {
  id: string;
  eventType: string;
  eventTitle: string;
  eventDescription?: string;
  occurredAt: string;
  journeyId: string;
  pillarName?: string;
  eventData?: any;
}

interface ActionableData {
  timeline_duration: number;
  weekly_goals: any[];
  daily_micro_actions: any[];
  milestone_checkpoints: any[];
}

export default function UserAnalytics() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [pillarAnalyses, setPillarAnalyses] = useState<PillarAnalysis[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [actionableData, setActionableData] = useState<ActionableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<PillarAnalysis | null>(null);

  const targetUserId = userId || user?.id;
  const activeTab = searchParams.get('tab') || 'analyses';

  // 📊 LOAD COMPLETE USER ANALYTICS
  const loadUserAnalytics = async () => {
    if (!targetUserId) return;

    setIsLoading(true);
    try {
      console.log('🔄 Loading user analytics for:', targetUserId);
      
      // Load pillar assessments (corrected table name)
      const { data: analyses, error: analysesError } = await supabase
        .from('pillar_assessments')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (analysesError) {
        console.warn('⚠️ Assessment data not available:', analysesError);
        // Continue without throwing error
      }

      // Load timeline events from path_entries
      const { data: pathEntries, error: pathError } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (pathError) throw pathError;

      // Transform path entries to timeline events
      const timeline: TimelineEvent[] = (pathEntries || []).map(entry => ({
        id: entry.id,
        eventType: entry.type,
        eventTitle: entry.title,
        eventDescription: entry.details,
        occurredAt: entry.created_at,
        journeyId: entry.id,
        pillarName: (entry.metadata as any)?.pillar_type || undefined,
        eventData: entry.metadata
      }));

      // Transform analyses using correct field names from pillar_assessments
      const processedAnalyses: PillarAnalysis[] = (analyses || []).map(analysis => {
        return {
          id: analysis.id,
          pillar_type: analysis.pillar_key, // pillar_assessments uses pillar_key
          ai_analysis: analysis.ai_analysis || '',
          calculated_score: analysis.calculated_score || 0,
          created_at: analysis.created_at,
          assessment_data: analysis.assessment_data,
          insights: analysis.insights
        };
      });

      setPillarAnalyses(processedAnalyses);
      setTimelineEvents(timeline);

      toast({
        title: "Analys laddad",
        description: `${analyses?.length || 0} analyser och ${timeline.length} aktiviteter hämtade`
      });

    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda analysdata",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 PILLAR COLOR MAPPING
  const getPillarColor = (pillarType: string) => {
    const colors: Record<string, string> = {
      'talent': 'text-purple-600',
      'mindset': 'text-blue-600', 
      'relationships': 'text-green-600',
      'emotions': 'text-red-600',
      'physical': 'text-orange-600',
      'environment': 'text-teal-600'
    };
    return colors[pillarType] || 'text-gray-600';
  };

  const getPillarName = (pillarType: string) => {
    const names: Record<string, string> = {
      'talent': '🎯 Talang',
      'mindset': '🧠 Mindset',
      'relationships': '👥 Relationer', 
      'emotions': '❤️ Känslor',
      'physical': '💪 Fysisk',
      'environment': '🌍 Miljö'
    };
    return names[pillarType] || pillarType;
  };

  useEffect(() => {
    loadUserAnalytics();
  }, [targetUserId]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 🎯 HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Utvecklingsanalys
            </h1>
            <p className="text-muted-foreground">
              Komplett översikt av din utvecklingsresa
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {pillarAnalyses.length} analyser
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timelineEvents.length} aktiviteter
          </Badge>
        </div>
      </div>

      {/* 📊 MAIN ANALYTICS TABS */}
      <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyses" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI-Analyser
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Aktivitetslinje
          </TabsTrigger>
          <TabsTrigger value="actionables" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Utvecklingsplan
          </TabsTrigger>
        </TabsList>

        {/* 🧠 PILLAR ANALYSES TAB */}
        <TabsContent value="analyses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Dina Pillar-Analyser
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pillarAnalyses.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Inga analyser än</h3>
                  <p className="text-muted-foreground mb-4">
                    Genomför dina första pillar-bedömningar för att få AI-analyser
                  </p>
                  <Button onClick={() => navigate('/six-pillars')}>
                    Starta bedömning
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pillarAnalyses.map((analysis) => (
                    <Card 
                      key={analysis.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow border"
                      onClick={() => setSelectedAnalysis(analysis)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`font-semibold ${getPillarColor(analysis.pillar_type)}`}>
                            {getPillarName(analysis.pillar_type)}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {analysis.calculated_score?.toFixed(1) || '—'}
                            </span>
                            <span className="text-sm text-muted-foreground">/10</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {analysis.ai_analysis?.substring(0, 150)}...
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString('sv-SE')}
                          </span>
                          <Badge variant="outline">
                            Visa analys
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 🔍 SELECTED ANALYSIS MODAL */}
          {selectedAnalysis && (
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`${getPillarColor(selectedAnalysis.pillar_type)}`}>
                    {getPillarName(selectedAnalysis.pillar_type)} - Detaljerad Analys
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedAnalysis(null)}
                  >
                    Stäng
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {selectedAnalysis.calculated_score?.toFixed(1) || '—'}
                    </div>
                    <div className="text-sm text-muted-foreground">Poäng</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold">
                      {new Date(selectedAnalysis.created_at).toLocaleDateString('sv-SE')}
                    </div>
                    <div className="text-xs text-muted-foreground">Genomfört</div>
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <h4 className="font-semibold text-foreground mb-2">AI-Analys:</h4>
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {selectedAnalysis.ai_analysis}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 📈 TIMELINE TAB */}
        <TabsContent value="timeline">
          <JourneyTimeline 
            timeline={timelineEvents} 
            userId={targetUserId} 
          />
        </TabsContent>

        {/* 🎯 ACTIONABLES TAB */}
        <TabsContent value="actionables">
          <CalendarActionableManager 
            userId={targetUserId}
            timelineData={actionableData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}