import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Calendar,
  Brain,
  Clock,
  Star,
  Award,
  ArrowRight,
  Compass
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useUserPillars } from '@/hooks/useUserPillars';
import { supabase } from '@/integrations/supabase/client';
import { PillarKey } from '@/types/sixPillarsModular';

interface AssessmentData {
  id: string;
  pillar_type: string;
  scores: any;
  ai_analysis: string;
  created_at: string;
}

interface ActionableData {
  id: string;
  pillar_key: string;
  title: string;
  description: string;
  completion_status: string;
  completed_at: string | null;
  created_at: string;
}

export function DevelopmentOverview() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [assessmentRounds, setAssessmentRounds] = useState<AssessmentData[]>([]);
  const [completedActionables, setCompletedActionables] = useState<ActionableData[]>([]);
  const [recentInsights, setRecentInsights] = useState<any[]>([]);

  const pillarNames: Record<PillarKey, string> = {
    'self_care': 'Självomvårdnad',
    'skills': 'Kompetenser', 
    'talent': 'Talang',
    'brand': 'Varumärke',
    'economy': 'Ekonomi',
    'open_track': 'Öppna spåret'
  };

  const pillarColors: Record<PillarKey, string> = {
    'self_care': 'bg-green-100 text-green-800 border-green-200',
    'skills': 'bg-blue-100 text-blue-800 border-blue-200',
    'talent': 'bg-purple-100 text-purple-800 border-purple-200',
    'brand': 'bg-orange-100 text-orange-800 border-orange-200',
    'economy': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'open_track': 'bg-indigo-100 text-indigo-800 border-indigo-200'
  };

  useEffect(() => {
    loadDevelopmentData();
  }, [user?.id]);

  const loadDevelopmentData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Load assessment rounds (real source of truth)
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (assessmentError) throw assessmentError;
      setAssessmentRounds(assessmentData || []);
      
      // Load completed actionables
      const { data: actionablesData, error: actionablesError } = await supabase
        .from('calendar_actionables')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);

      if (actionablesError) throw actionablesError;
      setCompletedActionables(actionablesData || []);

      // Load recent AI insights from coaching sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('coaching_sessions')
        .select('ai_analysis, created_at, session_type')
        .eq('user_id', user.id)
        .not('ai_analysis', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (sessionsError) throw sessionsError;
      setRecentInsights(sessionsData || []);

    } catch (error) {
      console.error('Error loading development data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda utvecklingsdata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Laddar din utvecklingsöversikt...</div>
      </div>
    );
  }

  // Calculate completion data from assessment_rounds (single source of truth)
  const completedPillars = assessmentRounds
    .map(a => a.pillar_type as PillarKey)
    .filter((pillar, index, arr) => arr.indexOf(pillar) === index);
  
  const totalPillars = Object.keys(pillarNames).length;
  const completionRate = (completedPillars.length / totalPillars) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                <Compass className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Min Utvecklingsöversikt</h1>
                <p className="text-muted-foreground text-lg">
                  Din personliga utvecklingsresa och framsteg
                </p>
              </div>
            </div>
            
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2">
              <Target className="h-4 w-4 mr-2" />
              {completedPillars.length}/{totalPillars} Pelare genomförda
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Utvecklingsframsteg
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Totalt framsteg</span>
                  <span className="text-sm text-muted-foreground">{Math.round(completionRate)}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(pillarNames).map(([key, name]) => {
                  const pillarKey = key as PillarKey;
                  const isCompleted = completedPillars.includes(pillarKey);
                  const assessment = assessmentRounds.find(a => a.pillar_type === pillarKey);
                  
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border-2 ${
                        isCompleted 
                          ? pillarColors[pillarKey]
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{name}</span>
                        {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      {assessment && assessment.scores && (
                        <div className="text-xs mt-1 opacity-75">
                          Genomförd: {new Date(assessment.created_at).toLocaleDateString('sv-SE')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Snabbstatistik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {assessmentRounds.length}
                </div>
                <div className="text-sm text-muted-foreground">Genomförda bedömningar</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {completedActionables.length}
                </div>
                <div className="text-sm text-muted-foreground">Slutförda uppgifter</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {recentInsights.length}
                </div>
                <div className="text-sm text-muted-foreground">AI-genererade insikter</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Senaste prestationer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedActionables.length > 0 ? (
                <div className="space-y-3">
                  {completedActionables.slice(0, 5).map((actionable) => (
                    <div key={actionable.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{actionable.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {actionable.completed_at ? 
                            new Date(actionable.completed_at).toLocaleDateString('sv-SE') : 
                            'Nyligen slutförd'
                          }
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={pillarColors[actionable.pillar_key as PillarKey]}
                      >
                        {pillarNames[actionable.pillar_key as PillarKey]}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Inga slutförda uppgifter än. Börja din utvecklingsresa!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Senaste AI-insikter
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentInsights.length > 0 ? (
                <div className="space-y-3">
                  {recentInsights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg border">
                      <div className="text-sm">{insight.ai_analysis.substring(0, 150)}...</div>
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(insight.created_at).toLocaleDateString('sv-SE')}
                        <Badge variant="outline" className="text-xs">
                          {insight.session_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Inga AI-insikter än. Genomför bedömningar för personliga insikter!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        {completedPillars.length < totalPillars && (
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-bold">Fortsätt din utvecklingsresa!</h3>
                <p className="text-blue-100 max-w-2xl mx-auto">
                  Du har genomfört {completedPillars.length} av {totalPillars} utvecklingspelare. 
                  Varje steg tar dig närmare dina mål.
                </p>
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => window.location.href = '/client-dashboard'}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  Gå till Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}