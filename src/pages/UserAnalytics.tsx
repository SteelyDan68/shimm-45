import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DetailedAnalysisView } from '@/components/UserAnalytics/DetailedAnalysisView';
import { PersonalDevelopmentPlanViewer } from '@/components/UserAnalytics/PersonalDevelopmentPlanViewer';
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
  Route,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { assessmentDataService, UnifiedAssessmentData } from '@/services/AssessmentDataService';
import { supabase } from '@/integrations/supabase/client';
import { AIActionablesPipelineStatus } from '@/components/AI/AIActionablesPipelineStatus';
import { ActionablePriorityDashboard } from '@/components/ActionablePriorityDashboard';
import { consolidateAssessmentSystems } from '@/utils/assessmentConsolidation';

export default function UserAnalytics() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [assessmentData, setAssessmentData] = useState<UnifiedAssessmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<UnifiedAssessmentData | null>(null);
  const [showDetailedView, setShowDetailedView] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } | null>(null);

  const targetUserId = userId || user?.id;
  const activeTab = searchParams.get('tab') || 'analyses';

  // 🚀 UNIVERSELL DATAHÄMTNING via AssessmentDataService
  const loadUserAnalytics = async () => {
    if (!targetUserId) return;

    setIsLoading(true);
    try {
      console.log('🔄 Loading universal assessment data for:', targetUserId);
      
      // Försök ladda via AssessmentDataService först
      try {
        // KRITISK KONSOLIDERING: Ladda ALLA assessments oavsett AI-status
        const [assessments, healthCheck, allRounds] = await Promise.all([
          assessmentDataService.getAssessments(targetUserId),
          assessmentDataService.performHealthCheck(targetUserId),
          // EMERGENCY FALLBACK: Ladda alla assessment_rounds direkt
          supabase
            .from('assessment_rounds')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
        ]);

        console.log(`📊 Universal service loaded: ${assessments.length} assessments`);
        console.log(`🔄 Direct rounds loaded: ${allRounds.data?.length || 0} rounds`);
        console.log(`🏥 Health status: ${healthCheck.status} (${healthCheck.issues.length} issues)`);

        // KONSOLIDERA: Merge assessments från service + direkta rounds
        const consolidatedAssessments = [...assessments];
        
        // Lägg till assessment_rounds som saknar AI-analys men har data
        (allRounds.data || []).forEach(round => {
          const exists = assessments.find(a => a.id === round.id);
          if (!exists && round.answers && Object.keys(round.answers).length > 0) {
            const scores = round.scores as any || {};
            const calculatedScore = scores?.overall || scores?.[round.pillar_type] || 0;
            
            consolidatedAssessments.push({
              id: round.id,
              user_id: round.user_id,
              pillar_type: round.pillar_type,
              assessment_data: round.answers || {},
              ai_analysis: round.ai_analysis || `**BRAND ASSESSMENT GENOMFÖRD**\n\nPoäng: ${calculatedScore}\n\nAssessment genomförd ${new Date(round.created_at).toLocaleDateString('sv-SE')} men AI-analys väntar på regenerering.\n\n*Systemet konsoliderar nu alla assessments oavsett AI-status.*`,
              calculated_score: typeof calculatedScore === 'number' ? calculatedScore : parseFloat(calculatedScore) || 0,
              created_at: round.created_at,
              updated_at: round.updated_at,
              source: 'assessment_rounds' as const,
              metadata: {
                assessment_round_id: round.id,
                consolidated_entry: true,
                needs_ai_regeneration: !round.ai_analysis
              }
            });
          }
        });

        setAssessmentData(consolidatedAssessments);
        setHealthStatus(healthCheck);

        // Trigga automatisk migration om det behövs
        if (healthCheck.status === 'critical' && healthCheck.recommendations.includes('Run legacy data migration')) {
          console.log('🔄 Triggering automatic legacy data migration...');
          const migrationResult = await assessmentDataService.migrateLegacyData(targetUserId);
          
          if (migrationResult.migrated > 0) {
            toast({
              title: "🔄 Data migrerad automatiskt",
              description: `${migrationResult.migrated} gamla assessments har uppdaterats till modern format`,
            });
            
            // Ladda om data efter migration
            const updatedAssessments = await assessmentDataService.getAssessments(targetUserId);
            setAssessmentData(updatedAssessments);
          }
        }

        // Visa framgångsmeddelande
        if (assessments.length > 0) {
          toast({
            title: "✅ Analys laddad!",
            description: `${assessments.length} analyser hittades via universal service`
          });
        } else {
          toast({
            title: "ℹ️ Ingen data ännu",
            description: "Genomför dina första pillar-bedömningar för att få analyser",
            variant: "default"
          });
        }

      } catch (serviceError) {
        console.error('⚠️ AssessmentDataService failed, falling back to direct queries:', serviceError);
        
        // FALLBACK: Direkta queries om service failar
        const { data: assessmentRounds, error: roundsError } = await supabase
          .from('assessment_rounds')
          .select('*')
          .eq('user_id', targetUserId)
          .not('ai_analysis', 'is', null)
          .order('created_at', { ascending: false });

        if (roundsError) {
          throw roundsError;
        }

        const fallbackAssessments = (assessmentRounds || []).map(round => {
          const scores = round.scores as any || {};
          const calculatedScore = scores[round.pillar_type] || scores.overall || 0;
          
          return {
            id: round.id,
            user_id: round.user_id,
            pillar_type: round.pillar_type,
            calculated_score: typeof calculatedScore === 'number' ? calculatedScore : parseFloat(calculatedScore) || 0,
            ai_analysis: round.ai_analysis || 'AI-analys inte tillgänglig',
            assessment_data: round.answers || {},
            created_at: round.created_at,
            updated_at: round.updated_at,
            source: 'assessment_rounds' as const,
            metadata: {
              assessment_round_id: round.id,
              fallback_mode: true
            }
          };
        });

        setAssessmentData(fallbackAssessments);
        setHealthStatus({
          status: 'warning',
          issues: ['AssessmentDataService unavailable - using fallback'],
          recommendations: ['Check service implementation']
        });

        if (fallbackAssessments.length > 0) {
          toast({
            title: "✅ Data laddad (fallback)",
            description: `${fallbackAssessments.length} analyser hittades direkt från databasen`
          });
        } else {
          toast({
            title: "ℹ️ Ingen data ännu",
            description: "Genomför dina första pillar-bedömningar för att få analyser",
            variant: "default"
          });
        }
      }

    } catch (error: any) {
      console.error('Critical error in loadUserAnalytics:', error);
      toast({
        title: "Systemfel",
        description: "Ett oväntat fel inträffade vid laddning av data",
        variant: "destructive",
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

  // Initialize data loading - FORCE EXECUTION
  useEffect(() => {
    console.log('🚀 UserAnalytics useEffect triggered, targetUserId:', targetUserId);
    if (targetUserId) {
      console.log('✅ Calling loadUserAnalytics for user:', targetUserId);
      loadUserAnalytics();
    } else {
      console.log('❌ No targetUserId found - cannot load analytics');
      setIsLoading(false);
    }
  }, [targetUserId]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">Laddar din utvecklingsanalys...</h3>
          <p className="text-muted-foreground">
            Hämtar dina pillar-analyser och framsteg via AssessmentDataService
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            {targetUserId ? `User ID: ${targetUserId}` : 'Ingen användare identifierad'}
          </div>
        </div>
      </div>
    );
  }

  // Show detailed analysis view if requested
  if (showDetailedView && targetUserId) {
    return (
      <DetailedAnalysisView 
        pillarKey={showDetailedView}
        userId={targetUserId}
        onBack={() => setShowDetailedView(null)}
      />
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

      {/* Health Status Banner */}
      {healthStatus && healthStatus.status !== 'healthy' && (
        <Card className={`border-2 ${
          healthStatus.status === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {healthStatus.status === 'critical' ? (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  healthStatus.status === 'critical' ? 'text-red-900' : 'text-yellow-900'
                }`}>
                  Systemstatus: {healthStatus.status === 'critical' ? 'Kritisk' : 'Varning'}
                </h3>
                <p className={`text-sm ${
                  healthStatus.status === 'critical' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {healthStatus.issues.join(', ')}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {assessmentData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6 text-center">
              <Brain className="h-12 w-12 mx-auto mb-3 text-blue-600" />
              <div className="text-3xl font-bold text-blue-900">{assessmentData.length}</div>
              <div className="text-sm text-blue-700">Genomförda analyser</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <div className="text-3xl font-bold text-green-900">
                {assessmentData.length > 0 
                  ? (assessmentData.reduce((sum, a) => sum + a.calculated_score, 0) / assessmentData.length).toFixed(1)
                  : '0.0'
                }
              </div>
              <div className="text-sm text-green-700">Genomsnittlig poäng</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6 text-center">
              <Activity className="h-12 w-12 mx-auto mb-3 text-purple-600" />
              <div className="text-3xl font-bold text-purple-900">
                {assessmentData.filter(a => a.source === 'assessment_rounds').length}
              </div>
              <div className="text-sm text-purple-700">Assessments</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analyses" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Analyser
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="actionables" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Actionables
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Prioritering
          </TabsTrigger>
          <TabsTrigger value="ai-pipeline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            AI Pipeline
          </TabsTrigger>
        </TabsList>

        {/* 🧠 PILLAR ANALYSES TAB */}
        <TabsContent value="analyses" className="space-y-6">
          {/* Personlig Utvecklingsplan Section */}
          <PersonalDevelopmentPlanViewer 
            userId={targetUserId!}
            assessmentData={assessmentData}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Dina Pillar-Analyser
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assessmentData.length === 0 ? (
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
                  {assessmentData.map((analysis) => (
                    <Card 
                      key={analysis.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow border"
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
                            <Badge variant={analysis.source === 'assessment_rounds' ? 'default' : 'secondary'} className="text-xs">
                              {analysis.source === 'assessment_rounds' ? 'Ny' : 'Legacy'}
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
                          <div className="flex gap-2">
                            <span 
                              className="text-blue-600 hover:underline cursor-pointer" 
                              onClick={() => setSelectedAnalysis(analysis)}
                            >
                              Snabbvy →
                            </span>
                            <span 
                              className="text-purple-600 hover:underline cursor-pointer" 
                              onClick={() => setShowDetailedView(analysis.pillar_type)}
                            >
                              Detaljvy →
                            </span>
                          </div>
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
            {assessmentData.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Ingen utvecklingshistorik än</h3>
                  <p className="text-muted-foreground">
                    Din utvecklingsresa kommer att visas här när du börjar använda systemet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {assessmentData.map((assessment) => (
                  <Card key={assessment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <h4 className="font-semibold flex items-center gap-2">
                            {getPillarName(assessment.pillar_type)} - Analys
                            <Badge variant={assessment.source === 'assessment_rounds' ? 'default' : 'secondary'} className="text-xs">
                              {assessment.source === 'assessment_rounds' ? 'Modern' : 'Legacy'}
                            </Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {assessment.ai_analysis.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(assessment.created_at).toLocaleDateString('sv-SE')}</span>
                            <Badge variant="outline" className="text-xs">
                              Poäng: {assessment.calculated_score}/10
                            </Badge>
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
                  {assessmentData.length === 0 
                    ? "Genomför dina första pillar-bedömningar för att få en personlig utvecklingsplan"
                    : "Din utvecklingsplan genereras automatiskt efter varje ny assessment"
                  }
                </p>
                {assessmentData.length === 0 ? (
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

        {/* 🧠 PRIORITY DASHBOARD TAB */}
        <TabsContent value="priority">
          <ActionablePriorityDashboard userId={targetUserId || ''} />
        </TabsContent>

        {/* 🔄 AI PIPELINE TAB */}
        <TabsContent value="ai-pipeline">
          <AIActionablesPipelineStatus userId={targetUserId || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
}