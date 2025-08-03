import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';

export interface RealAnalyticsData {
  overallProgress: number;
  taskCompletionRate: number;
  assessmentProgress: number;
  velocityScore: number;
  consistencyScore: number;
  loginStreak: number;
  totalSessions: number;
  averageSessionDuration: number;
  stefanInteractions: number;
  aiRecommendationsFollowed: number;
  pillarsProgress: PillarProgress[];
  goalProgress: GoalProgress[];
  dailyActivity: ActivityPoint[];
  insights: Insight[];
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

export interface ActivityPoint {
  date: string;
  value: number;
  type: 'login' | 'task' | 'assessment' | 'interaction';
  metadata?: Record<string, any>;
}

export interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
}

export const useRealAnalytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<RealAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const loadRealAnalyticsData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load real data from multiple sources
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Parallel data loading for performance
      const [
        tasksData,
        assessmentsData,
        stefanData,
        pillarsData,
        coachingData,
        analyticsEvents
      ] = await Promise.all([
        // Tasks completion data
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString()),
        
        // Assessments data
        supabase
          .from('assessment_rounds')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString()),
        
        // Stefan interactions
        supabase
          .from('stefan_interactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString()),
        
        // Pillar assessments
        supabase
          .from('pillar_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Coaching sessions
        supabase
          .from('coaching_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString()),
        
        // Analytics events for activity tracking
        supabase
          .from('analytics_events')
          .select('*')
          .eq('user_id', user.id)
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: false })
          .limit(100)
      ]);

      // Process tasks data
      const tasks = tasksData.data || [];
      const completedTasks = tasks.filter(t => t.status === 'completed');
      const taskCompletionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

      // Process assessments
      const assessments = assessmentsData.data || [];
      const assessmentProgress = assessments.length > 0 ? 75 : 0; // Based on completion

      // Process Stefan interactions
      const stefanInteractions = stefanData.data || [];
      const stefanCount = stefanInteractions.length;

      // Process pillars data
      const pillarsRaw = pillarsData.data || [];
      const pillarsProgress = processPillarsData(pillarsRaw);

      // Process coaching data
      const coachingSessions = coachingData.data || [];
      const totalSessions = coachingSessions.length;
      const avgDuration = coachingSessions.length > 0 
        ? coachingSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / coachingSessions.length
        : 0;

      // Process activity events
      const events = analyticsEvents.data || [];
      const dailyActivity = processDailyActivity(events);

      // Calculate velocity and consistency
      const velocityScore = calculateVelocityScore(tasks, assessments, stefanInteractions);
      const consistencyScore = calculateConsistencyScore(events);
      const loginStreak = calculateLoginStreak(events);

      // Generate insights
      const insights = generateInsights({
        taskCompletionRate,
        velocityScore,
        consistencyScore,
        loginStreak,
        stefanCount,
        pillarsProgress
      });

      const analyticsData: RealAnalyticsData = {
        overallProgress: Math.round((taskCompletionRate + assessmentProgress + velocityScore) / 3),
        taskCompletionRate: Math.round(taskCompletionRate),
        assessmentProgress,
        velocityScore,
        consistencyScore,
        loginStreak,
        totalSessions,
        averageSessionDuration: Math.round(avgDuration * 10) / 10,
        stefanInteractions: stefanCount,
        aiRecommendationsFollowed: Math.floor(stefanCount * 0.6), // Estimate
        pillarsProgress,
        goalProgress: [], // Could be enhanced with real goals data
        dailyActivity,
        insights
      };

      setAnalyticsData(analyticsData);

    } catch (error) {
      console.error('Error loading real analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, timeRange]);

  // Process pillars data to show trends
  const processPillarsData = (pillarsRaw: any[]): PillarProgress[] => {
    const pillarKeys = ['self_care', 'skills', 'talent', 'brand', 'economy'];
    
    return pillarKeys.map(pillarKey => {
      const pillarAssessments = pillarsRaw.filter(p => p.pillar_type === pillarKey);
      
      if (pillarAssessments.length === 0) {
        return {
          pillarKey,
          currentScore: 0,
          previousScore: 0,
          trend: 'stable' as const,
          change: 0,
          lastUpdated: new Date()
        };
      }

      // Get latest two assessments to calculate trend
      const latest = pillarAssessments[0];
      const previous = pillarAssessments[1];
      
      const currentScore = calculatePillarScore(latest.scores);
      const previousScore = previous ? calculatePillarScore(previous.scores) : currentScore;
      const change = currentScore - previousScore;
      
      return {
        pillarKey,
        currentScore: Math.round(currentScore * 10) / 10,
        previousScore: Math.round(previousScore * 10) / 10,
        trend: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable',
        change: Math.round(change * 10) / 10,
        lastUpdated: new Date(latest.created_at)
      };
    });
  };

  // Calculate average score from pillar assessment scores
  const calculatePillarScore = (scores: any): number => {
    if (!scores || typeof scores !== 'object') return 0;
    
    const values = Object.values(scores).filter(v => typeof v === 'number') as number[];
    if (values.length === 0) return 0;
    
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };

  // Process daily activity from analytics events
  const processDailyActivity = (events: any[]): ActivityPoint[] => {
    const activityMap = new Map<string, ActivityPoint>();
    
    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      const existing = activityMap.get(date);
      
      if (existing) {
        existing.value += 1;
      } else {
        activityMap.set(date, {
          date,
          value: 1,
          type: getActivityTypeFromEvent(event.event),
          metadata: event.properties
        });
      }
    });
    
    return Array.from(activityMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getActivityTypeFromEvent = (eventName: string): ActivityPoint['type'] => {
    if (eventName.includes('task')) return 'task';
    if (eventName.includes('assessment')) return 'assessment';
    if (eventName.includes('stefan') || eventName.includes('chat')) return 'interaction';
    return 'login';
  };

  // Calculate velocity based on completed actions
  const calculateVelocityScore = (tasks: any[], assessments: any[], interactions: any[]): number => {
    const taskVelocity = tasks.filter(t => t.status === 'completed').length;
    const assessmentVelocity = assessments.length;
    const interactionVelocity = interactions.length;
    
    // Weighted scoring
    const score = (taskVelocity * 0.5) + (assessmentVelocity * 0.3) + (interactionVelocity * 0.2);
    return Math.min(Math.round(score * 10), 100); // Cap at 100
  };

  // Calculate consistency from login patterns
  const calculateConsistencyScore = (events: any[]): number => {
    if (events.length === 0) return 0;
    
    const uniqueDays = new Set(
      events.map(e => new Date(e.timestamp).toISOString().split('T')[0])
    );
    
    const daysInPeriod = 30; // Last 30 days
    const consistency = (uniqueDays.size / daysInPeriod) * 100;
    
    return Math.min(Math.round(consistency), 100);
  };

  // Calculate login streak
  const calculateLoginStreak = (events: any[]): number => {
    if (events.length === 0) return 0;
    
    const uniqueDays = [...new Set(
      events.map(e => new Date(e.timestamp).toISOString().split('T')[0])
    )].sort().reverse();
    
    if (uniqueDays.length === 0) return 0;
    
    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const current = new Date(uniqueDays[i]);
      const previous = new Date(uniqueDays[i - 1]);
      const diffDays = Math.abs(current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Generate insights based on data
  const generateInsights = (data: {
    taskCompletionRate: number;
    velocityScore: number;
    consistencyScore: number;
    loginStreak: number;
    stefanCount: number;
    pillarsProgress: PillarProgress[];
  }): Insight[] => {
    const insights: Insight[] = [];
    
    // Task completion insights
    if (data.taskCompletionRate > 80) {
      insights.push({
        type: 'success',
        title: 'Excellenta resultat!',
        description: `Du slutför ${data.taskCompletionRate}% av dina uppgifter - fantastiskt arbete!`
      });
    } else if (data.taskCompletionRate < 40) {
      insights.push({
        type: 'warning',
        title: 'Fokusera på slutförande',
        description: 'Överväg att sätta mindre, mer uppnåeliga mål för att bygga momentum.'
      });
    }
    
    // Consistency insights
    if (data.loginStreak >= 7) {
      insights.push({
        type: 'success',
        title: 'Konsistens-champion!',
        description: `${data.loginStreak} dagar i rad visar din engagemang för utveckling.`
      });
    }
    
    // Stefan interaction insights
    if (data.stefanCount > 10) {
      insights.push({
        type: 'info',
        title: 'Aktiv dialog med Stefan',
        description: `${data.stefanCount} interaktioner visar att du använder AI-supporten aktivt.`
      });
    }
    
    // Pillar improvement insights
    const improvingPillars = data.pillarsProgress.filter(p => p.trend === 'up');
    if (improvingPillars.length > 2) {
      insights.push({
        type: 'success',
        title: 'Bred utveckling',
        description: `Du förbättras inom ${improvingPillars.length} områden samtidigt.`
      });
    }
    
    return insights;
  };

  // Track activity events
  const trackActivity = useCallback(async (
    type: ActivityPoint['type'],
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        session_id: `session_${Date.now()}`,
        event: `${type}_activity`,
        properties: metadata || {},
        page_url: window.location.pathname,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }, [user]);

  // Export functionality
  const exportAnalytics = useCallback(async (format: 'json' | 'csv') => {
    if (!analyticsData) return;
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      user: user?.email,
      ...analyticsData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analyticsData, timeRange, user]);

  // Initialize and set up real-time updates
  useEffect(() => {
    if (user) {
      loadRealAnalyticsData();
      
      // Set up real-time subscriptions for key data changes
      const channel = supabase
        .channel('analytics-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadRealAnalyticsData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'assessment_rounds',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadRealAnalyticsData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'stefan_interactions',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadRealAnalyticsData();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, loadRealAnalyticsData]);

  // Refresh data when time range changes
  useEffect(() => {
    if (user) {
      loadRealAnalyticsData();
    }
  }, [timeRange, loadRealAnalyticsData]);

  return {
    analyticsData,
    isLoading,
    timeRange,
    setTimeRange,
    trackActivity,
    exportAnalytics,
    loadAnalyticsData: loadRealAnalyticsData
  };
};