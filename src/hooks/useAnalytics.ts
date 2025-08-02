import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
      // Store activity in local storage for immediate UI updates
      const storageKey = `analytics_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      const activities: ActivityPoint[] = stored ? JSON.parse(stored) : [];
      
      const newActivity: ActivityPoint = {
        date: new Date().toISOString(),
        value: 1,
        type,
        metadata
      };
      
      activities.push(newActivity);
      
      // Keep only last 100 activities in localStorage
      const trimmed = activities.slice(-100);
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
      
      // In a real app, this would also sync to Supabase
      // For now, we'll simulate with local data
      
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }, [user]);

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from Supabase
      // For now, we'll create realistic mock data
      
      const mockData: AnalyticsData = {
        onboardingProgress: 100,
        assessmentProgress: 75,
        taskCompletionRate: 68,
        overallProgress: 81,
        
        dailyActivity: generateMockActivity('day', 7),
        weeklyActivity: generateMockActivity('week', 4),
        monthlyActivity: generateMockActivity('month', 6),
        
        pillarsProgress: [
          {
            pillarKey: 'self_care',
            currentScore: 7.2,
            previousScore: 6.8,
            trend: 'up',
            change: 0.4,
            lastUpdated: new Date()
          },
          {
            pillarKey: 'skills',
            currentScore: 6.5,
            previousScore: 6.1,
            trend: 'up',
            change: 0.4,
            lastUpdated: new Date()
          },
          {
            pillarKey: 'talent',
            currentScore: 8.1,
            previousScore: 8.3,
            trend: 'down',
            change: -0.2,
            lastUpdated: new Date()
          },
          {
            pillarKey: 'brand',
            currentScore: 5.8,
            previousScore: 5.8,
            trend: 'stable',
            change: 0,
            lastUpdated: new Date()
          },
          {
            pillarKey: 'economy',
            currentScore: 6.9,
            previousScore: 6.2,
            trend: 'up',
            change: 0.7,
            lastUpdated: new Date()
          }
        ],
        
        velocityScore: 72,
        consistencyScore: 85,
        
        loginStreak: 7,
        totalSessions: 23,
        averageSessionDuration: 18.5, // minutes
        lastActive: new Date(),
        
        goalsCompleted: 3,
        goalProgress: [
          {
            goalId: '1',
            title: 'Förbättra morgonrutin',
            progress: 80,
            target: 100,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            category: 'self_care'
          },
          {
            goalId: '2', 
            title: 'Lär dig ny teknik',
            progress: 45,
            target: 100,
            category: 'skills'
          }
        ],
        
        stefanInteractions: 12,
        aiRecommendationsFollowed: 8,
        
        summary: {
          totalUsers: 1,
          activeUsers: 1,
          completionRate: 68,
          completedTasks: 23,
          totalTasks: 34,
          currentVelocity: 72,
          averageVelocity: 65,
          mostCommonBarrier: 'Tidsbrist'
        }
      };
      
      const mockPerformance: PerformanceMetrics = {
        timeToComplete: {
          'assessment': 12.5,
          'task': 8.2,
          'onboarding': 5.3
        },
        engagementLevel: mockData.consistencyScore > 80 ? 'high' : 
                        mockData.consistencyScore > 60 ? 'medium' : 'low',
        productivityScore: Math.round((mockData.taskCompletionRate + mockData.consistencyScore) / 2),
        focusAreas: ['self_care', 'skills'],
        recommendations: [
          'Fortsätt din fantastiska morgonrutin - du är på rätt spår!',
          'Överväg att lägga till fler tekniska färdigheter till din utvecklingsplan',
          'Din konsistens är imponerande - behåll tempot!'
        ]
      };
      
      setAnalyticsData(mockData);
      setPerformanceMetrics(mockPerformance);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, timeRange]);

  // Generate mock activity data
  const generateMockActivity = (period: string, count: number): ActivityPoint[] => {
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
      
      activities.push({
        date: date.toISOString(),
        value: Math.floor(Math.random() * 10) + 1,
        type: 'login'
      });
    }
    
    return activities;
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
