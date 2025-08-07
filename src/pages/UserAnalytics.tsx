import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Brain, 
  Target,
  TrendingUp, 
  Activity,
  Calendar,
  RefreshCw,
  Trophy,
  Star,
  Lightbulb,
  Heart,
  Palette,
  DollarSign,
  Route
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
// Removed problematic imports - implemented inline instead

// 🎯 FIXED INTERFACES FOR CORRECT DATA MAPPING
interface PillarAnalysis {
  id: string;
  pillar_type: string;
  calculated_score: number;
  ai_analysis: string;
  assessment_data: any;
  created_at: string;
  metadata: any;
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  pillar?: string;
  metadata: any;
}

// Simple actionable data interface
interface ActionableData {
  ai_recommendations: any[];
  milestone_checkpoints: any[];
  timeline_duration?: number;
  weekly_goals?: any[];
  daily_micro_actions?: any[];
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

  // 📊 FIXED: LOAD COMPLETE USER ANALYTICS WITH CORRECT DATA MAPPING
  const loadUserAnalytics = async () => {
    if (!targetUserId) return;

    setIsLoading(true);
    try {
      console.log('🔄 Loading user analytics for:', targetUserId);
      
      // 🔍 FIXED: Load ALL analysis data from path_entries with correct filters
      const { data: analysisEntries, error: analysesError } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .in('type', ['assessment', 'recommendation', 'analysis']) // Include all relevant types
        .order('created_at', { ascending: false });

      if (analysesError) {
        console.error('Error loading analyses:', analysesError);
        toast({
          title: "Fel",
          description: "Kunde inte ladda utvecklingsdata",
          variant: "destructive",
        });
        return;
      }

      console.log('📊 Found path entries:', analysisEntries?.length || 0, analysisEntries);

      // 🔄 FIXED: Transform path_entries to pillar analyses with correct mapping
      const transformedAnalyses: PillarAnalysis[] = (analysisEntries || [])
        .filter(entry => entry.ai_generated && entry.details) // Only AI-generated analysis entries
        .map(entry => {
          // Extract pillar info from metadata or title - FIXED TYPE CASTING
          const metadata = entry.metadata as any || {};
          const pillarType = metadata.pillar_type || 
                           entry.title?.toLowerCase().includes('talent') ? 'talent' :
                           entry.title?.toLowerCase().includes('skills') ? 'skills' :
                           entry.title?.toLowerCase().includes('brand') ? 'brand' :
                           entry.title?.toLowerCase().includes('economy') ? 'economy' :
                           entry.title?.toLowerCase().includes('self_care') ? 'self_care' :
                           entry.title?.toLowerCase().includes('open_track') ? 'open_track' : 'unknown';

          const assessmentScore = metadata.assessment_score || 0;

          return {
            id: entry.id,
            pillar_type: pillarType,
            calculated_score: typeof assessmentScore === 'number' ? assessmentScore : parseFloat(assessmentScore) || 0,
            ai_analysis: entry.details || 'Analys inte tillgänglig än',
            assessment_data: entry.metadata || {},
            created_at: entry.created_at,
            metadata: entry.metadata || {}
          };
        });

      setPillarAnalyses(transformedAnalyses);
      console.log('✅ Pillar analyses loaded and transformed:', transformedAnalyses.length, transformedAnalyses);

      // Load timeline events from path_entries
      const { data: timeline, error: timelineError } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!timelineError && timeline) {
        const transformedTimeline: TimelineEvent[] = timeline.map(entry => {
          const metadata = entry.metadata as any || {};
          return {
            id: entry.id,
            type: entry.type,
            title: entry.title || 'Utvecklingsaktivitet',
            description: entry.details || '',
            timestamp: entry.created_at,
            pillar: metadata.pillar_type,
            metadata: entry.metadata || {}
          };
        });
        setTimelineEvents(transformedTimeline);
        console.log('✅ Timeline events loaded:', transformedTimeline.length);
      }

      // Set actionable data
      setActionableData({
        ai_recommendations: transformedAnalyses.filter(a => a.pillar_type !== 'unknown'),
        milestone_checkpoints: []
      });

      // Show success message
      if (transformedAnalyses.length > 0) {
        toast({
          title: "✅ Analys laddad!",
          description: `${transformedAnalyses.length} analyser hittades och visas nu`
        });
      }

    } catch (error: any) {
      console.error('Critical error in loadUserAnalytics:', error);
      toast({
        title: "Systemfel",
        description: "Ett oväntat fel inträffade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // CRITICAL: Always set loading to false
    }
  };

  // 🎨 PILLAR COLOR MAPPING
  const getPillarColor = (pillarType: string) => {
    const colors: Record<string, string> = {
      'talent': 'text-purple-600',
      'mindset': 'text-blue-600', 
      'skills': 'text-green-600',
      'brand': 'text-orange-600',
      'economy': 'text-emerald-600',
      'self_care': 'text-pink-600',
      'open_track': 'text-indigo-600'
    };
    return colors[pillarType] || 'text-gray-600';
  };

  const getPillarName = (pillarType: string) => {
    const names: Record<string, string> = {
      'talent': 'Talang',
      'mindset': 'Mindset',
      'skills': 'Kompetenser', 
      'brand': 'Varumärke',
      'economy': 'Ekonomi',
      'self_care': 'Självomvårdnad',
      'open_track': 'Öppna spåret'
    };
    return names[pillarType] || pillarType;
  };

  const getPillarIcon = (pillarType: string) => {
    switch (pillarType) {
      case 'talent': return <Star className="h-5 w-5" />;
      case 'skills': return <Lightbulb className="h-5 w-5" />;
      case 'brand': return <Palette className="h-5 w-5" />;
      case 'economy': return <DollarSign className="h-5 w-5" />;
      case 'self_care': return <Heart className="h-5 w-5" />;
      case 'open_track': return <Route className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  // Initialize data loading
  useEffect(() => {
    if (targetUserId) {
      loadUserAnalytics();
    }
  }, [targetUserId]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">Laddar din utvecklingsanalys...</h3>
          <p className="text-muted-foreground">
            Hämtar dina pillar-analyser och framsteg
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <TrendingUp className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold">Min Utvecklingsanalys</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Din personliga utvecklingsresa genom AI-analys av dina pillar-bedömningar
        </p>
      </div>

      {/* Quick Stats */}
      {pillarAnalyses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6 text-center">
              <Brain className="h-12 w-12 mx-auto mb-3 text-blue-600" />
              <div className="text-3xl font-bold text-blue-900">{pillarAnalyses.length}</div>
              <div className="text-sm text-blue-700">Genomförda analyser</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <div className="text-3xl font-bold text-green-900">
                {(pillarAnalyses.reduce((sum, a) => sum + a.calculated_score, 0) / pillarAnalyses.length).toFixed(1)}
              </div>
              <div className="text-sm text-green-700">Genomsnittlig poäng</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6 text-center">
              <Activity className="h-12 w-12 mx-auto mb-3 text-purple-600" />
              <div className="text-3xl font-bold text-purple-900">{timelineEvents.length}</div>
              <div className="text-sm text-purple-700">Utvecklingsaktiviteter</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyses" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Pillar-Analyser
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
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
                            {getPillarIcon(analysis.pillar_type)}
                            <Badge variant="outline" className="text-xs">
                              {analysis.calculated_score}/10
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {analysis.ai_analysis.substring(0, 120)}...
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {new Date(analysis.created_at).toLocaleDateString('sv-SE')}
                          </span>
                          <span className="text-blue-600 hover:underline">
                            Läs mer →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Analysis Detail */}
          {selectedAnalysis && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className={`flex items-center gap-2 ${getPillarColor(selectedAnalysis.pillar_type)}`}>
                    {getPillarIcon(selectedAnalysis.pillar_type)}
                    {getPillarName(selectedAnalysis.pillar_type)} - Detaljerad Analys
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAnalysis(null)}>
                    ✕
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-sm">
                    Poäng: {selectedAnalysis.calculated_score}/10
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedAnalysis.created_at).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
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
          <div className="space-y-4">
            {timelineEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Ingen aktivitetshistorik än</h3>
                  <p className="text-muted-foreground">
                    Din utvecklingsresa kommer att visas här när du börjar använda systemet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {timelineEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{event.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(event.timestamp).toLocaleDateString('sv-SE')}</span>
                            {event.pillar && <Badge variant="outline" className="text-xs">{event.pillar}</Badge>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 🎯 ACTIONABLES TAB - Enhanced Development Plan */}
        <TabsContent value="actionables" className="space-y-6">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Din Personliga Utvecklingsplan
              </CardTitle>
              <CardDescription>
                Baserad på dina pillar-assessments och AI-analys av dina utvecklingsområden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  {pillarAnalyses.length === 0 
                    ? "Genomför dina första pillar-bedömningar för att få en personlig utvecklingsplan"
                    : "Din utvecklingsplan genereras automatiskt efter varje ny assessment"
                  }
                </p>
                {pillarAnalyses.length === 0 ? (
                  <Button onClick={() => navigate('/six-pillars')}>
                    <Brain className="h-4 w-4 mr-2" />
                    Starta bedömning för att få utvecklingsplan
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/ai-coaching')}>
                    <Brain className="h-4 w-4 mr-2" />
                    Förbättra planen med AI-coaching
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 text-center">
              <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Utvecklingsplan kommer snart</h3>
              <p className="text-muted-foreground">
                Detaljerad utvecklingsplanering baserad på dina analyser
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}