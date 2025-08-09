/**
 * 📊 COACH ANALYTICS WIDGET - Detaljerad analytics flyttad från klient-vy
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Brain,
  Calendar
} from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';
import { useAuth } from '@/providers/UnifiedAuthProvider';

const CoachAnalyticsWidget: React.FC<WidgetProps> = ({ widget, stats }) => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Analytics data för coach
  const { data: clientAnalytics } = useQuery({
    queryKey: ['coach-client-analytics', user?.id, selectedPeriod],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: assignments } = await supabase
        .from('coach_client_assignments')
        .select('client_id')
        .eq('coach_id', user.id)
        .eq('is_active', true);
      
      if (!assignments?.length) return null;
      
      const clientIds = assignments.map(a => a.client_id);
      
      // Hämta assessment data för alla klienter
      const { data: assessments } = await supabase
        .from('assessment_rounds')
        .select('*')
        .in('user_id', clientIds);
      
      // Hämta rekommendationer data
      const { data: recommendations } = await supabase
        .from('ai_coaching_recommendations')
        .select('*')
        .in('user_id', clientIds);
      
      // Hämta actionables data
      const { data: actionables } = await supabase
        .from('calendar_actionables')
        .select('*')
        .in('user_id', clientIds);
      
      return {
        assessments: assessments || [],
        recommendations: recommendations || [],
        actionables: actionables || [],
        clientIds
      };
    },
    enabled: !!user?.id
  });

  const calculateClientProgress = () => {
    if (!clientAnalytics) return { active: 0, improving: 0, stagnant: 0 };
    
    const progressByClient = clientAnalytics.clientIds.map(clientId => {
      const clientAssessments = clientAnalytics.assessments.filter(a => a.user_id === clientId);
      const completedPillars = new Set(clientAssessments.map(a => a.pillar_type)).size;
      const activeRecommendations = clientAnalytics.recommendations.filter(
        r => r.user_id === clientId && r.status === 'pending'
      ).length;
      
      return {
        clientId,
        completedPillars,
        activeRecommendations,
        progressScore: (completedPillars / 6) * 100
      };
    });
    
    return {
      active: progressByClient.filter(p => p.activeRecommendations > 0).length,
      improving: progressByClient.filter(p => p.progressScore > 50).length,
      stagnant: progressByClient.filter(p => p.progressScore < 25 && p.activeRecommendations === 0).length
    };
  };

  const getCompletionTrends = () => {
    if (!clientAnalytics) return { thisWeek: 0, lastWeek: 0, growth: 0 };
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeekCompletions = clientAnalytics.recommendations.filter(r => 
      r.status === 'completed' && 
      new Date(r.updated_at) > weekAgo
    ).length;
    
    const lastWeekCompletions = clientAnalytics.recommendations.filter(r => 
      r.status === 'completed' && 
      new Date(r.updated_at) > twoWeeksAgo &&
      new Date(r.updated_at) <= weekAgo
    ).length;
    
    const growth = lastWeekCompletions > 0 
      ? Math.round(((thisWeekCompletions - lastWeekCompletions) / lastWeekCompletions) * 100)
      : 0;
    
    return { thisWeek: thisWeekCompletions, lastWeek: lastWeekCompletions, growth };
  };

  const clientProgress = calculateClientProgress();
  const completionTrends = getCompletionTrends();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Klientanalyser
        </h3>
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'week' ? 'Vecka' : period === 'month' ? 'Månad' : 'Kvartal'}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="progress">Framsteg</TabsTrigger>
          <TabsTrigger value="engagement">Engagemang</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.activeClients || 0}</div>
                  <p className="text-xs text-muted-foreground">Aktiva klienter</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{clientProgress.improving}</div>
                  <p className="text-xs text-muted-foreground">Gör framsteg</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Target className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{clientProgress.active}</div>
                  <p className="text-xs text-muted-foreground">Aktivt engagerade</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{clientProgress.stagnant}</div>
                  <p className="text-xs text-muted-foreground">Behöver uppmuntran</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Completion Trends */}
          <Card className="p-6">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Slutföranden
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {completionTrends.thisWeek}
                </div>
                <p className="text-sm text-muted-foreground">Denna vecka</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {completionTrends.lastWeek}
                </div>
                <p className="text-sm text-muted-foreground">Förra veckan</p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 ${
                  completionTrends.growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {completionTrends.growth > 0 ? '+' : ''}{completionTrends.growth}%
                </div>
                <p className="text-sm text-muted-foreground">Förändring</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card className="p-6">
            <h4 className="font-medium mb-4">Klientframsteg per område</h4>
            {clientAnalytics?.clientIds.map((clientId, index) => {
              const clientAssessments = clientAnalytics.assessments.filter(a => a.user_id === clientId);
              const completedPillars = new Set(clientAssessments.map(a => a.pillar_type)).size;
              const progressScore = (completedPillars / 6) * 100;
              
              return (
                <div key={clientId} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Klient {index + 1}</span>
                    <span className="text-sm text-muted-foreground">
                      {completedPillars}/6 områden
                    </span>
                  </div>
                  <Progress value={progressScore} className="h-2" />
                </div>
              );
            })}
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card className="p-6">
            <h4 className="font-medium mb-4">Engagemangsmönster</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Brain className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Genomsnittlig tid mellan assessments</span>
                </div>
                <Badge variant="outline">5-7 dagar</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Genomsnittlig slutförandegrad</span>
                </div>
                <Badge variant="outline">78%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Mest aktiva tid på dagen</span>
                </div>
                <Badge variant="outline">09:00-11:00</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Exportera rapport
        </Button>
        <Button variant="ghost" size="sm">
          Schemalägg insikter
        </Button>
      </div>
    </div>
  );
};

export default CoachAnalyticsWidget;