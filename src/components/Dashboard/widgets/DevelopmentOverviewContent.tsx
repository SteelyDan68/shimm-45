/**
 * 🎯 DEVELOPMENT OVERVIEW CONTENT - Innehåll från utvecklingsöversikt
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Clock,
  Brain,
  Star,
  Award,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
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

export const DevelopmentOverviewContent: React.FC = () => {
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
      <div className="text-center py-4">
        <div className="text-sm text-muted-foreground">Laddar utvecklingsöversikt...</div>
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
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Utvecklingsframsteg
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Totalt framsteg</span>
                <span className="text-sm text-muted-foreground">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(pillarNames).map(([key, name]) => {
                const pillarKey = key as PillarKey;
                const isCompleted = completedPillars.includes(pillarKey);
                const assessment = assessmentRounds.find(a => a.pillar_type === pillarKey);
                
                return (
                  <div
                    key={key}
                    className={`p-2 rounded-lg border cursor-pointer hover:shadow-md transition-all text-xs ${
                      isCompleted 
                        ? pillarColors[pillarKey]
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      if (isCompleted) {
                        window.location.href = `/user-analytics?focus=${pillarKey}`;
                      } else {
                        window.location.href = `/six-pillars/${pillarKey}`;
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{name}</span>
                      {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    {assessment && assessment.scores && (
                      <div className="text-xs mt-1 opacity-75">
                        {new Date(assessment.created_at).toLocaleDateString('sv-SE')}
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
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-yellow-600" />
              Snabbstatistik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {assessmentRounds.length}
              </div>
              <div className="text-xs text-muted-foreground">Genomförda bedömningar</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {completedActionables.length}
              </div>
              <div className="text-xs text-muted-foreground">Slutförda uppgifter</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">
                {recentInsights.length}
              </div>
              <div className="text-xs text-muted-foreground">AI-genererade insikter</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-green-600" />
              Senaste prestationer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedActionables.length > 0 ? (
              <div className="space-y-2">
                {completedActionables.slice(0, 3).map((actionable) => (
                  <div key={actionable.id} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
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
                      className={`text-xs ${pillarColors[actionable.pillar_key as PillarKey]}`}
                    >
                      {pillarNames[actionable.pillar_key as PillarKey]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Inga slutförda uppgifter än. Börja din utvecklingsresa!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-purple-600" />
              Senaste AI-insikter
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInsights.length > 0 ? (
              <div className="space-y-2">
                {recentInsights.slice(0, 2).map((insight, index) => (
                  <div key={index} className="p-2 bg-purple-50 rounded-lg border">
                    <div className="text-sm">{insight.ai_analysis.substring(0, 100)}...</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
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
              <p className="text-sm text-muted-foreground text-center py-4">
                Inga AI-insikter än. Genomför bedömningar för personliga insikter!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      {completedPillars.length < totalPillars && (
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardContent className="py-6">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-bold">Fortsätt din utvecklingsresa!</h3>
              <p className="text-blue-100 text-sm max-w-2xl mx-auto">
                Du har genomfört {completedPillars.length} av {totalPillars} utvecklingspelare. 
                Varje steg tar dig närmare dina mål.
              </p>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => window.location.href = '/six-pillars'}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                Fortsätt utveckling
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};