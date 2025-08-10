/**
 * 🌟 MIN UTVECKLINGSRESA - Complete Development Journey Page
 * Enterprise-grade utvecklingsöversikt med Six Pillars integration
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  CheckSquare, 
  Brain,
  Star,
  Award,
  Clock,
  ArrowRight,
  BookOpen,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const MyDevelopment = () => {
  const { user } = useAuth();

  // Hämta assessment data
  const { data: assessmentRounds } = useQuery({
    queryKey: ['assessment-rounds', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Hämta rekommendationer
  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('ai_coaching_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Hämta pillar activations - simulerad data
  const mockPillarActivations = [
    { pillar_type: 'self_care', is_active: true },
    { pillar_type: 'skills', is_active: true },
    { pillar_type: 'talent', is_active: false }
  ];

  const activePillars = mockPillarActivations.filter(p => p.is_active) || [];
  const completedAssessments = assessmentRounds?.length || 0;
  const activeRecommendations = recommendations?.filter(r => r.status === 'pending' || r.status === 'in_progress') || [];
  const completedRecommendations = recommendations?.filter(r => r.status === 'completed') || [];

  const pillarNames: Record<string, string> = {
    'self_care': 'Självomvårdnad',
    'skills': 'Kompetenser',
    'talent': 'Talang',
    'brand': 'Varumärke',
    'economy': 'Ekonomi'
  };

  const overallProgress = Math.round((completedAssessments / 6) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 p-6 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Min utvecklingsresa</h1>
          <p className="text-blue-100 mb-4">
            Följ din personliga utveckling genom Six Pillars systemet
          </p>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {completedAssessments}/6 Assessments
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {activePillars.length} Aktiva Pillars
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5 text-blue-500" />
              Total Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Genomförda assessments</span>
                <span className="font-semibold">{completedAssessments}/6</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {overallProgress}% av utvecklingsresan genomförd
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="w-5 h-5 text-green-500" />
              Aktiva Rekommendationer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activeRecommendations.length}
              </div>
              <p className="text-sm text-muted-foreground">
                Pågående handlingsplaner
              </p>
              {activeRecommendations.length > 0 && (
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <a href="/my-program">
                    Se program <ArrowRight className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-5 h-5 text-yellow-500" />
              Prestationer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {completedRecommendations.length}
              </div>
              <p className="text-sm text-muted-foreground">
                Slutförda mål
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Six Pillars Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            Six Pillars Status
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Din progress genom de sex grundpelarna för framgång
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(pillarNames).map(([key, name]) => {
              const isActive = activePillars.some(p => p.pillar_type === key);
              const hasAssessment = assessmentRounds?.some(r => r.pillar_type === key);
              
              return (
                <div 
                  key={key} 
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isActive 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                      : hasAssessment
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{name}</h3>
                    {isActive && <Star className="w-4 h-4 text-green-500" />}
                    {hasAssessment && !isActive && <CheckSquare className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="space-y-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        isActive 
                          ? 'text-green-700 border-green-300' 
                          : hasAssessment
                          ? 'text-blue-700 border-blue-300'
                          : 'text-gray-500 border-gray-300'
                      }`}
                    >
                      {isActive ? 'Aktiverad' : hasAssessment ? 'Genomförd' : 'Väntar'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <a href="/six-pillars">
                <BookOpen className="w-4 h-4 mr-2" />
                Gå till Six Pillars
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Senaste Aktivitet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assessmentRounds?.slice(0, 5).map((round) => (
              <div key={round.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {pillarNames[round.pillar_type]} Assessment
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(round.created_at), 'dd MMM yyyy', { locale: sv })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Assessment genomförd och analyserad
                  </p>
                </div>
              </div>
            ))}
            
            {(!assessmentRounds || assessmentRounds.length === 0) && (
              <div className="text-center py-8">
                <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Ingen aktivitet ännu. Starta din första assessment!
                </p>
                <Button className="mt-3" asChild>
                  <a href="/guided-assessment">
                    Börja nu <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyDevelopment;