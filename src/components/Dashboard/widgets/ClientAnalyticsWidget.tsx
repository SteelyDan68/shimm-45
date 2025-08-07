import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target, 
  Brain,
  FileText,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

/**
 * 🎯 CLIENT ANALYTICS QUICK ACCESS
 * 
 * Widget för ClientDashboard som visar:
 * - Senaste pillar-analyser
 * - Aktivitetsammanfattning
 * - Snabblänkar till fullständig analys
 */

interface ClientAnalyticsWidgetProps {
  userId: string;
  compact?: boolean;
}

interface QuickStats {
  totalAnalyses: number;
  recentActivities: number;
  completedTasks: number;
  avgScore: number;
}

export const ClientAnalyticsWidget = ({ 
  userId, 
  compact = false 
}: ClientAnalyticsWidgetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalAnalyses: 0,
    recentActivities: 0,
    completedTasks: 0,
    avgScore: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [validAnalyses, setValidAnalyses] = useState(0);

  // 📊 LOAD QUICK ANALYTICS DATA
  const loadQuickStats = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      // Hämta analyser från path_entries OCH assessment_rounds för komplett data
      const { data: pathAnalyses, error: pathError } = await supabase
        .from('path_entries')
        .select('id, content, metadata, created_at')
        .eq('user_id', userId)
        .eq('type', 'assessment')
        .order('created_at', { ascending: false });

      if (pathError) throw pathError;

      const { data: assessmentRounds, error: roundsError } = await supabase
        .from('assessment_rounds')
        .select('id, pillar_type, scores, ai_analysis, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (roundsError) throw roundsError;

      // Räkna alla assessment rounds oavsett AI-analys (mer inkluderande)
      const totalAnalyses = assessmentRounds?.length || 0;

      // Men visa även hur många som har AI-analys
      const validAnalyses = (assessmentRounds || []).filter(round => 
        (round as any).ai_analysis && (round as any).ai_analysis.length > 50
      ).length;

      // Beräkna genomsnittlig score från assessment_rounds (mer tillförlitlig)
      let totalScore = 0;
      let scoreCount = 0;

      assessmentRounds?.forEach(round => {
        const scores = round.scores as any;
        if (scores?.overall) {
          totalScore += scores.overall;
          scoreCount++;
        } else if (scores && typeof scores === 'object') {
          // Hitta första numeriska score om overall saknas
          const firstScore = Object.values(scores).find(score => typeof score === 'number');
          if (firstScore) {
            totalScore += firstScore as number;
            scoreCount++;
          }
        }
      });

      // Fallback till path_entries scores om assessment_rounds saknas
      if (scoreCount === 0) {
        pathAnalyses?.forEach(analysis => {
          const metadata = analysis.metadata as any;
          if (metadata?.assessment_score && typeof metadata.assessment_score === 'number') {
            totalScore += metadata.assessment_score;
            scoreCount++;
          }
        });
      }

      const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0;

      // Räkna senaste veckans aktiviteter
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentActivities = (assessmentRounds || pathAnalyses)?.filter(item => 
        new Date(item.created_at) > oneWeekAgo
      ).length || 0;

      // Hämta uppgifter från ai_coaching_recommendations som är completed
      const { data: completedRecs, error: recsError } = await supabase
        .from('ai_coaching_recommendations')
        .select('id, status')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (recsError) {
        console.warn('⚠️ Error fetching recommendations:', recsError);
      }

      const finalStats = {
        totalAnalyses,
        recentActivities,
        completedTasks: completedRecs?.length || 0,
        avgScore: Math.round(avgScore * 10) / 10 // Avrunda till 1 decimal
      };

      setQuickStats(finalStats);
      setValidAnalyses(validAnalyses);

    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte ladda utvecklingsstatistik",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadQuickStats();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  if (isLoading) {
    return (
      <Card className={compact ? "h-48" : undefined}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Min Utveckling
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/user-analytics')}
            className="flex items-center gap-1 text-xs"
          >
            <ExternalLink className="h-3 w-3" />
            Fullständig analys
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 📊 QUICK STATS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="text-xl font-bold text-purple-600">
              {quickStats.totalAnalyses}
            </div>
            <div className="text-xs text-purple-600">Bedömningar</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-xl font-bold text-blue-600">
              {quickStats.avgScore.toFixed(1)}
            </div>
            <div className="text-xs text-blue-600">Genomsnitt</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="text-xl font-bold text-green-600">
              {quickStats.recentActivities}
            </div>
            <div className="text-xs text-green-600">Denna vecka</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="text-xl font-bold text-orange-600">
              {quickStats.completedTasks}
            </div>
            <div className="text-xs text-orange-600">Slutförda</div>
          </div>
        </div>

        {/* 🔧 CONSOLIDATION BUTTON - Visa om AI-analyser saknas */}
        {quickStats.totalAnalyses > 0 && validAnalyses < quickStats.totalAnalyses && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-sm text-amber-800 mb-2">
              {validAnalyses} av {quickStats.totalAnalyses} bedömningar har AI-analys
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={async () => {
                try {
                  const { error } = await supabase.functions.invoke('consolidate-assessment-system', {
                    body: { userId }
                  });
                  if (error) throw error;
                  
                  toast({
                    title: "Konsolidering startad",
                    description: "AI-analyser genereras för ofullständiga bedömningar"
                  });
                  
                  // Uppdatera data efter 3 sekunder
                  setTimeout(() => loadQuickStats(), 3000);
                } catch (error) {
                  toast({
                    title: "Fel",
                    description: "Kunde inte starta konsolidering",
                    variant: "destructive"
                  });
                }
              }}
            >
              🤖 Komplettera AI-analyser
            </Button>
          </div>
        )}

        {/* 🎯 QUICK ACTIONS */}
        <div className="space-y-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-between"
            onClick={() => navigate('/user-analytics?tab=analyses')}
          >
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Se alla analyser
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-between"
            onClick={() => navigate('/user-analytics?tab=timeline')}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Aktivitets-timeline
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-between"
            onClick={() => navigate('/user-analytics?tab=actionables')}
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Utvecklingsplan
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 📈 STATUS INDICATOR */}
        {quickStats.totalAnalyses === 0 && (
          <div className="text-center py-3 px-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Starta din utvecklingsresa
            </p>
            <Button 
              size="sm" 
              onClick={() => navigate('/six-pillars')}
              className="w-full"
            >
              Genomför första bedömning
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientAnalyticsWidget;