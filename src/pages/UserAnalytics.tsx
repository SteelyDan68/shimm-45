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
  CheckCircle,
  ArrowLeft
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
  const [selectedAssessmentForDetails, setSelectedAssessmentForDetails] = useState<(UnifiedAssessmentData & { full_analysis?: string; executive_summary?: string }) | null>(null);

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

  const handleAssessmentClick = async (assessment: UnifiedAssessmentData) => {
    try {
      // Försök hämta eller generera detaljerad analys
      const { data: existingAnalysis, error } = await supabase
        .from('assessment_detailed_analyses')
        .select('*')
        .eq('assessment_round_id', assessment.id)
        .maybeSingle();

      if (existingAnalysis) {
        // Visa befintlig detaljerad analys
        setSelectedAssessmentForDetails({
          ...assessment,
          full_analysis: existingAnalysis.full_analysis,
          executive_summary: existingAnalysis.executive_summary
        });
      } else {
        // Generera ny detaljerad analys
        await generateDetailedAnalysis(assessment);
      }
    } catch (error) {
      console.error('Error loading detailed analysis:', error);
      // Fallback till befintlig analys
      setSelectedAssessmentForDetails(assessment);
    }
  };

  const generateDetailedAnalysis = async (assessment: UnifiedAssessmentData) => {
    try {
      toast({
        title: "🤖 Genererar djupanalys...",
        description: "AI skapar en omfattande analys av din assessment. Detta tar några sekunder.",
      });

      // Anropa AI för att generera detaljerad analys
      const { data, error } = await supabase.functions.invoke('generate-overall-assessment', {
        body: {
          assessmentData: assessment.assessment_data,
          pillarType: assessment.pillar_type,
          currentScore: assessment.calculated_score,
          mode: 'detailed_analysis'
        }
      });

      if (data && data.analysis) {
        // Spara till databas
        const { error: saveError } = await supabase
          .from('assessment_detailed_analyses')
          .insert({
            assessment_round_id: assessment.id,
            user_id: assessment.user_id,
            pillar_type: assessment.pillar_type,
            full_analysis: data.analysis,
            executive_summary: data.summary || data.analysis.substring(0, 300) + '...',
            recommendations: data.recommendations || [],
            insights: data.insights || [],
            action_items: data.actionItems || []
          });

        if (saveError) throw saveError;

        setSelectedAssessmentForDetails({
          ...assessment,
          full_analysis: data.analysis,
          executive_summary: data.summary || data.analysis.substring(0, 300) + '...'
        });

        toast({
          title: "✅ Djupanalys klar!",
          description: "Din omfattande assessment-analys har genererats och sparats.",
        });
      } else {
        throw new Error('No analysis generated');
      }
    } catch (error) {
      console.error('Error generating detailed analysis:', error);
      
      // Fallback - skapa en strukturerad version av befintlig analys
      const fallbackAnalysis = createFallbackDetailedAnalysis(assessment);
      setSelectedAssessmentForDetails({
        ...assessment,
        full_analysis: fallbackAnalysis,
        executive_summary: assessment.ai_analysis?.substring(0, 300) + '...' || 'Sammanfattning inte tillgänglig'
      });

      toast({
        title: "📝 Visar befintlig analys",
        description: "En detaljerad vy av din assessment är nu tillgänglig.",
      });
    }
  };

  const createFallbackDetailedAnalysis = (assessment: UnifiedAssessmentData): string => {
    const pillarName = getPillarName(assessment.pillar_type);
    const score = assessment.calculated_score;
    
    return `# Detaljerad ${pillarName}-analys

## Översikt
**Poäng:** ${score}/10
**Genomförd:** ${new Date(assessment.created_at).toLocaleDateString('sv-SE')}

## AI-Analys
${assessment.ai_analysis || 'Analys inte tillgänglig'}

## Utvecklingsområden
Baserat på din poäng på ${score}/10 inom ${pillarName} finns det flera områden för utveckling:

### Styrkor
- Dina svar visar medvetenhet om ${pillarName.toLowerCase()}
- Du har påbörjat din utvecklingsresa inom detta område

### Förbättringsområden
- Fokusera på att bygga starkare strukturer inom ${pillarName.toLowerCase()}
- Utveckla mer konsekventa rutiner och vanor
- Tillämpa dina kunskaper mer systematiskt

## Rekommenderade nästa steg
1. **Kortsiktigt (1-2 veckor):** Identifiera 1-2 specifika områden att fokusera på
2. **Mediumsiktigt (1-3 månader):** Implementera nya rutiner och strategier
3. **Långsiktigt (3-6 månader):** Utvärdera framsteg och justera approach

## Resurser för utveckling
- Personlig utvecklingsplan med fokus på ${pillarName.toLowerCase()}
- Regelbunden uppföljning och reflektion
- Praktisk tillämpning av nya strategier

---
*Denna analys genererades baserat på dina assessment-svar och kan uppdateras när du gör nya bedömningar.*`;
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

  // Show detailed assessment analysis
  if (selectedAssessmentForDetails) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedAssessmentForDetails(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till översikt
          </Button>
          <h1 className="text-2xl font-bold">
            Detaljerad {getPillarName(selectedAssessmentForDetails.pillar_type)}-analys
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPillarIcon(selectedAssessmentForDetails.pillar_type)}
              Omfattande Assessment-analys
              <Badge variant="outline">
                {selectedAssessmentForDetails.calculated_score}/10
              </Badge>
            </CardTitle>
            <CardDescription>
              Detaljerad genomgång av din {getPillarName(selectedAssessmentForDetails.pillar_type).toLowerCase()}-bedömning
            </CardDescription>
          </CardHeader>
          <CardContent className="prose max-w-none">
            {selectedAssessmentForDetails.executive_summary && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Snabb-V (Sammanfattning)</h3>
                <p className="text-sm text-blue-800">
                  {selectedAssessmentForDetails.executive_summary}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {selectedAssessmentForDetails.full_analysis ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedAssessmentForDetails.full_analysis}
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedAssessmentForDetails.ai_analysis || 'Detaljerad analys inte tillgänglig'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
        <TabsList className="grid w-full grid-cols-4">
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
                Sex assessments
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
                      onClick={() => setShowDetailedView(analysis.pillar_type)}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto text-xs"
                              onClick={() => setSelectedAnalysis(analysis)}
                            >
                              ⚡ Snabbvy
                            </Button>
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
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <Button 
                      onClick={() => navigate('/ai-coaching')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Förbättra planen med AI-coaching
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/calendar')}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Se i kalender
                    </Button>
                  </div>
                )}
              </div>
              
              {assessmentData.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Brain className="h-4 w-4" />
                    <span className="font-medium">Funktionalitet:</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    "Förbättra planen med AI-coaching" startar en djupanalys av dina assessments och skapar 
                    personliga actionables baserat på neuroplastiska principer och din utvecklingsprofil.
                  </p>
                </div>
              )}
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

      </Tabs>
    </div>
  );
}