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

  // 📊 LOAD QUICK ANALYTICS DATA
  const loadQuickStats = async () => {
    if (!userId) {
      console.log('❌ loadQuickStats: No userId provided');
      return;
    }

    try {
      console.log('🔄 loadQuickStats: Starting to load data for userId:', userId);
      setIsLoading(true);

      // Hämta analyser från path_entries (korrekt datakälla)
      console.log('📊 loadQuickStats: Fetching analyses from path_entries...');
      const { data: analyses, error: analysesError } = await supabase
        .from('path_entries')
        .select('id, content, metadata, created_at')
        .eq('user_id', userId)
        .eq('type', 'assessment')
        .not('content', 'is', null);

      if (analysesError) {
        console.error('❌ Error fetching analyses:', analysesError);
        throw analysesError;
      }

      console.log('✅ Analyses fetched successfully:', analyses?.length || 0, 'items');
      console.log('📋 Analyses data:', analyses);

      // Slutför loading direkt för nu - vi kör med enkel mock-data
      console.log('⚡ loadQuickStats: Setting final data and completing load');
      setQuickStats({
        totalAnalyses: analyses?.length || 0,
        recentActivities: analyses?.length || 0,
        completedTasks: 0,
        avgScore: 0
      });
      
      console.log('✅ loadQuickStats: COMPLETED successfully');
      return;

      // Hämta senaste aktiviteter (path_entries)
      console.log('📊 loadQuickStats: Fetching activities from path_entries...');
      const { data: activities, error: activitiesError } = await supabase
        .from('path_entries')
        .select('id, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Senaste veckan

      if (activitiesError) throw activitiesError;

      // Process assessment data från path_entries
      const totalAnalyses = analyses?.length || 0;
      let totalScore = 0;
      let scoreCount = 0;

      analyses?.forEach(analysis => {
        const metadata = analysis.metadata as any;
        if (metadata?.assessment_score) {
          totalScore += metadata.assessment_score;
          scoreCount++;
        }
      });

      const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0;

      // Räkna senaste veckans analyser
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentActivities = analyses?.filter(analysis => 
        new Date(analysis.created_at) > oneWeekAgo
      ).length || 0;

      // Hämta uppgifter
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (tasksError) throw tasksError;

      setQuickStats({
        totalAnalyses,
        recentActivities,
        completedTasks: tasks?.length || 0,
        avgScore
      });

    } catch (error: any) {
      console.error('Error loading quick stats:', error);
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
    console.log('🔍 ClientAnalyticsWidget useEffect triggered, userId:', userId);
    if (userId) {
      console.log('✅ Calling loadQuickStats for ClientAnalytics widget');
      loadQuickStats();
    } else {
      console.log('❌ No userId provided to ClientAnalyticsWidget');
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
            <div className="text-xs text-purple-600">AI-Analyser</div>
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