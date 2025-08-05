import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsData {
  // User Progress Metrics
  onboardingProgress: number;
  assessmentProgress: number;
  taskCompletionRate: number;
  overallProgress: number;
  
  // Activity Metrics
  dailyActivity: ActivityPoint[];
  weeklyActivity: ActivityPoint[];
  monthlyActivity: ActivityPoint[];
  
  // Performance Metrics
  pillarsProgress: PillarProgress[];
  velocityScore: number;
  consistencyScore: number;
  
  // Engagement Metrics
  loginStreak: number;
  totalSessions: number;
  averageSessionDuration: number;
  lastActive: Date;
  
  // Goal Tracking
  goalsCompleted: number;
  goalProgress: GoalProgress[];
  
  // Stefan Interactions
  stefanInteractions: number;
  aiRecommendationsFollowed: number;
  
  // Summary for compatibility
  summary?: {
    totalUsers: number;
    activeUsers: number;
    completionRate: number;
    completedTasks: number;
    totalTasks: number;
    currentVelocity: number;
    averageVelocity: number;
    mostCommonBarrier: string;
  };
}

export interface ActivityPoint {
  date: string;
  value: number;
  type: 'login' | 'task' | 'assessment' | 'interaction';
  metadata?: Record<string, any>;
}

export interface PillarProgress {
  pillarKey: string;
  currentScore: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  lastUpdated: Date;
}

export interface GoalProgress {
  goalId: string;
  title: string;
  progress: number;
  target: number;
  deadline?: Date;
  category: string;
}

export interface PerformanceMetrics {
  timeToComplete: Record<string, number>;
  engagementLevel: 'low' | 'medium' | 'high';
  productivityScore: number;
  focusAreas: string[];
  recommendations: string[];
}

// Legacy compatibility exports
export interface BarrierTrend { 
  trend: string; 
  count: number; 
  date: string;
  types: {
    technical: number;
    process: number;
    communication: number;
    resource: number;
    other: number;
  };
}

export interface FunctionalResourceTrend { 
  resource: string; 
  usage: number;
  functionalAccessCount: number;
  subjectiveOpportunitiesAvg: number;
  hasRegularSupport: boolean;
  relationshipComments: string[];
}

export interface ProblemArea { 
  area: string; 
  severity: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

export interface SentimentTrend { 
  date: string; 
  sentiment: number;
  average: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface TaskProgress { 
  completed: number; 
  total: number;
  created: number;
  pending: number;
  date: string;
}

export interface VelocityPoint { 
  date: string; 
  velocity: number;
  score: number;
  rank: number;
}

export interface AnalyticsFilters { 
  timeRange: string; 
  category: string;
  period: string;
  startDate?: Date;
  endDate?: Date;
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Track user activity
  const trackActivity = useCallback(async (
    type: ActivityPoint['type'], 
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      // Store activity in analytics_events table
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        session_id: 'session-' + Date.now(),
        event: type,
        properties: metadata || {},
        page_url: window.location.href,
        user_agent: navigator.userAgent
      });
      
      // Also track in analytics_metrics if it's a measurable metric
      if (['login', 'task', 'assessment'].includes(type)) {
        await supabase.from('analytics_metrics').insert({
          user_id: user.id,
          metric_type: `${type}_count`,
          metric_value: 1,
          metadata: metadata || {}
        });
      }
      
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }, [user]);

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch real analytics data from database
      const [metricsResult, assessmentsResult, tasksResult, eventsResult] = await Promise.all([
        supabase.from('analytics_metrics').select('*').eq('user_id', user.id),
        supabase.functions.invoke('get-user-attribute', {
          body: { user_id: user.id, attribute_key: 'pillar_assessments' }
        }),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('analytics_events').select('*').eq('user_id', user.id)
      ]);

      const metrics = metricsResult.data || [];
      const assessments = Array.isArray(assessmentsResult.data?.data) ? assessmentsResult.data.data : [];
      const tasks = tasksResult.data || [];
      const events = eventsResult.data || [];

      // Calculate real analytics from database data
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const totalTasks = tasks.length;
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate assessment progress
      const completedAssessments = assessments.filter(a => a.calculated_score > 0).length;
      const assessmentProgress = completedAssessments > 0 ? 100 : 0;

      // Calculate pillar progress from real assessments
      const pillarGroups = assessments.reduce((acc, assessment) => {
        if (!acc[assessment.pillar_key]) {
          acc[assessment.pillar_key] = [];
        }
        acc[assessment.pillar_key].push(assessment);
        return acc;
      }, {} as Record<string, any[]>);

      const pillarsProgress: PillarProgress[] = Object.entries(pillarGroups).map(([pillarKey, pillarAssessments]) => {
        const assessmentArray = Array.isArray(pillarAssessments) ? pillarAssessments : [];
        const sorted = assessmentArray.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const current = sorted[0]?.calculated_score || 0;
        const previous = sorted[1]?.calculated_score || 0;
        
        return {
          pillarKey,
          currentScore: current,
          previousScore: previous,
          trend: current > previous ? 'up' : current < previous ? 'down' : 'stable',
          change: current - previous,
          lastUpdated: new Date(sorted[0]?.created_at || new Date())
        };
      });

      // Calculate activity from events
      const dailyActivity = generateActivityFromEvents(events, 'day', 7);
      const weeklyActivity = generateActivityFromEvents(events, 'week', 4);
      const monthlyActivity = generateActivityFromEvents(events, 'month', 6);

      // Calculate login streak and session metrics
      const loginEvents = events.filter(e => e.event === 'login' || e.event === 'page_view');
      const loginStreak = calculateLoginStreak(loginEvents);
      const totalSessions = loginEvents.length;
      const averageSessionDuration = metrics
        .filter(m => m.metric_type === 'session_duration')
        .reduce((sum, m) => sum + Number(m.metric_value), 0) / totalSessions || 0;

      // Calculate overall progress
      const progressFactors = [assessmentProgress, taskCompletionRate];
      const overallProgress = progressFactors.reduce((sum, p) => sum + p, 0) / progressFactors.length;

      const analyticsData: AnalyticsData = {
        onboardingProgress: assessmentProgress,
        assessmentProgress,
        taskCompletionRate,
        overallProgress,
        
        dailyActivity,
        weeklyActivity,
        monthlyActivity,
        
        pillarsProgress,
        
        velocityScore: Math.min(100, taskCompletionRate + loginStreak * 2),
        consistencyScore: loginStreak * 10,
        
        loginStreak,
        totalSessions,
        averageSessionDuration,
        lastActive: new Date(),
        
        goalsCompleted: completedTasks,
        goalProgress: [], // Would need goals table to populate
        
        stefanInteractions: events.filter(e => e.event === 'stefan_interaction').length,
        aiRecommendationsFollowed: events.filter(e => e.event === 'recommendation_followed').length,
        
        summary: {
          totalUsers: 1,
          activeUsers: 1,
          completionRate: taskCompletionRate,
          completedTasks,
          totalTasks,
          currentVelocity: Math.min(100, taskCompletionRate + loginStreak * 2),
          averageVelocity: 65,
          mostCommonBarrier: 'Tidsbrist'
        }
      };

      const performanceMetrics: PerformanceMetrics = {
        timeToComplete: {
          'assessment': averageSessionDuration,
          'task': averageSessionDuration * 0.6,
          'onboarding': averageSessionDuration * 0.4
        },
        engagementLevel: analyticsData.consistencyScore > 80 ? 'high' : 
                        analyticsData.consistencyScore > 60 ? 'medium' : 'low',
        productivityScore: Math.round((analyticsData.taskCompletionRate + analyticsData.consistencyScore) / 2),
        focusAreas: pillarsProgress.filter(p => p.trend === 'up').map(p => p.pillarKey),
        recommendations: generateRecommendations(analyticsData, pillarsProgress)
      };
      
      setAnalyticsData(analyticsData);
      setPerformanceMetrics(performanceMetrics);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, timeRange]);

  // Generate activity data from real events
  const generateActivityFromEvents = (events: any[], period: string, count: number): ActivityPoint[] => {
    const activities: ActivityPoint[] = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      if (period === 'day') {
        date.setDate(date.getDate() - i);
      } else if (period === 'week') {
        date.setDate(date.getDate() - (i * 7));
      } else if (period === 'month') {
        date.setMonth(date.getMonth() - i);
      }
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.timestamp);
        return eventDate >= dayStart && eventDate <= dayEnd;
      });
      
      activities.push({
        date: date.toISOString(),
        value: dayEvents.length,
        type: dayEvents[0]?.event || 'login',
        metadata: { events: dayEvents.length }
      });
    }
    
    return activities;
  };

  // Calculate login streak from events
  const calculateLoginStreak = (loginEvents: any[]): number => {
    if (loginEvents.length === 0) return 0;
    
    const sortedEvents = loginEvents.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sortedEvents.length; i++) {
      const eventDate = new Date(sortedEvents[i].timestamp);
      const daysDiff = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Generate contextual recommendations
  const generateRecommendations = (data: AnalyticsData, pillars: PillarProgress[]): string[] => {
    const recommendations = [];
    
    if (data.loginStreak >= 7) {
      recommendations.push('Fantastisk konsistens! Fortsätt med din dagliga rutin.');
    }
    
    if (data.taskCompletionRate < 50) {
      recommendations.push('Fokusera på att slutföra fler uppgifter för bättre framsteg.');
    }
    
    const improvingPillars = pillars.filter(p => p.trend === 'up');
    if (improvingPillars.length > 0) {
      recommendations.push(`Bra utveckling inom ${improvingPillars.map(p => p.pillarKey).join(', ')}.`);
    }
    
    return recommendations;
  };

  // Calculate insights
  const getInsights = useCallback(() => {
    if (!analyticsData || !performanceMetrics) return [];
    
    const insights = [];
    
    // Progress insights
    if (analyticsData.overallProgress > 80) {
      insights.push({
        type: 'success',
        title: 'Fantastiska framsteg!',
        description: `Du har kommit ${analyticsData.overallProgress}% av vägen i din utvecklingsresa.`
      });
    } else if (analyticsData.overallProgress < 50) {
      insights.push({
        type: 'warning',
        title: 'Tid för fart!',
        description: 'Det finns mycket potential att utveckla. Låt oss sätta upp några mål!'
      });
    }
    
    // Consistency insights
    if (analyticsData.loginStreak >= 7) {
      insights.push({
        type: 'success',
        title: 'Konsistens-mästare!',
        description: `${analyticsData.loginStreak} dagar i rad - detta bygger verkliga resultat.`
      });
    }
    
    // Pillar insights
    const improvingPillars = analyticsData.pillarsProgress.filter(p => p.trend === 'up');
    if (improvingPillars.length > 0) {
      insights.push({
        type: 'info',
        title: 'Positiv utveckling',
        description: `Du förbättras inom ${improvingPillars.length} pelare. Fortsätt så här!`
      });
    }
    
    return insights;
  }, [analyticsData, performanceMetrics]);

  // Export data for reporting
  const exportAnalytics = useCallback(async (format: 'json' | 'csv') => {
    if (!analyticsData) return;
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      user: user?.email,
      ...analyticsData,
      ...performanceMetrics
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    // CSV export could be implemented similarly
  }, [analyticsData, performanceMetrics, timeRange, user]);

  // Initialize analytics tracking
  useEffect(() => {
    if (user) {
      loadAnalyticsData();
      
      // Track page view
      trackActivity('login', { page: window.location.pathname });
    }
  }, [user, loadAnalyticsData, trackActivity]);

  // Set up periodic data refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        loadAnalyticsData();
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, [user, loadAnalyticsData]);

  return {
    analyticsData,
    performanceMetrics,
    isLoading,
    timeRange,
    setTimeRange,
    
    // Actions
    trackActivity,
    loadAnalyticsData,
    exportAnalytics,
    
    // Computed
    insights: getInsights()
  };
};
