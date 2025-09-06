import { supabase } from '@/integrations/supabase/client';

export interface UserInsights {
  overallProgress: number;
  pillarStrengths: Record<string, number>;
  pillarWeaknesses: Record<string, number>;
  learningVelocity: number;
  consistencyScore: number;
  neuroplasticityIndex: number;
  predictedOutcomes: {
    nextMilestone: string;
    timeToMilestone: number;
    recommendedActions: string[];
  };
}

export interface BehavioralPatterns {
  peakPerformanceTime: string;
  taskCompletionPatterns: Record<string, number>;
  assessmentFrequency: number;
  engagementTrends: Array<{ date: string; level: number }>;
  strugglingAreas: string[];
  strengths: string[];
}

export interface PredictiveAnalytics {
  riskOfChurn: number;
  nextAssessmentRecommendation: string;
  optimalTaskScheduling: Array<{
    taskType: string;
    recommendedTime: string;
    difficulty: number;
  }>;
  interventionTriggers: Array<{
    condition: string;
    action: string;
    priority: number;
  }>;
}

export class AdvancedAnalyticsEngine {
  private static instance: AdvancedAnalyticsEngine;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): AdvancedAnalyticsEngine {
    if (!AdvancedAnalyticsEngine.instance) {
      AdvancedAnalyticsEngine.instance = new AdvancedAnalyticsEngine();
    }
    return AdvancedAnalyticsEngine.instance;
  }

  async generateUserInsights(userId: string): Promise<UserInsights> {
    const cacheKey = `insights-${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Get all user data points
      const [assessments, tasks, progress, neuroplasticity] = await Promise.all([
        this.getAssessmentHistory(userId),
        this.getTaskHistory(userId),
        this.getProgressHistory(userId),
        this.getNeuroplasticityProfile(userId)
      ]);

      const insights: UserInsights = {
        overallProgress: this.calculateOverallProgress(assessments, progress),
        pillarStrengths: this.analyzePillarStrengths(assessments),
        pillarWeaknesses: this.analyzePillarWeaknesses(assessments),
        learningVelocity: this.calculateLearningVelocity(progress),
        consistencyScore: this.calculateConsistencyScore(tasks),
        neuroplasticityIndex: this.calculateNeuroplasticityIndex(neuroplasticity, tasks),
        predictedOutcomes: await this.generatePredictedOutcomes(userId, assessments, progress)
      };

      this.setCachedData(cacheKey, insights);
      return insights;

    } catch (error) {
      console.error('Failed to generate user insights:', error);
      throw error;
    }
  }

  async analyzeBehavioralPatterns(userId: string): Promise<BehavioralPatterns> {
    const cacheKey = `patterns-${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [tasks, assessments, events] = await Promise.all([
        this.getTaskHistory(userId),
        this.getAssessmentHistory(userId),
        this.getAnalyticsEvents(userId)
      ]);

      const patterns: BehavioralPatterns = {
        peakPerformanceTime: this.identifyPeakPerformanceTime(tasks, events),
        taskCompletionPatterns: this.analyzeTaskCompletionPatterns(tasks),
        assessmentFrequency: this.calculateAssessmentFrequency(assessments),
        engagementTrends: this.analyzeEngagementTrends(events),
        strugglingAreas: this.identifyStrugglingAreas(tasks, assessments),
        strengths: this.identifyStrengths(tasks, assessments)
      };

      this.setCachedData(cacheKey, patterns);
      return patterns;

    } catch (error) {
      console.error('Failed to analyze behavioral patterns:', error);
      throw error;
    }
  }

  async generatePredictiveAnalytics(userId: string): Promise<PredictiveAnalytics> {
    const cacheKey = `predictive-${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const insights = await this.generateUserInsights(userId);
      const patterns = await this.analyzeBehavioralPatterns(userId);

      const analytics: PredictiveAnalytics = {
        riskOfChurn: this.calculateChurnRisk(insights, patterns),
        nextAssessmentRecommendation: this.recommendNextAssessment(patterns, insights),
        optimalTaskScheduling: this.generateOptimalScheduling(patterns, insights),
        interventionTriggers: this.generateInterventionTriggers(insights, patterns)
      };

      this.setCachedData(cacheKey, analytics);
      return analytics;

    } catch (error) {
      console.error('Failed to generate predictive analytics:', error);
      throw error;
    }
  }

  private async getAssessmentHistory(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('assessment_rounds')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    return data || [];
  }

  private async getTaskHistory(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    return data || [];
  }

  private async getProgressHistory(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('neuroplastic_progress_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(100);
    
    return data || [];
  }

  private async getNeuroplasticityProfile(userId: string): Promise<any> {
    const { data } = await supabase
      .from('user_neuroplasticity_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    return data;
  }

  private async getAnalyticsEvents(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000);
    
    return data || [];
  }

  private calculateOverallProgress(assessments: any[], progress: any[]): number {
    if (assessments.length === 0) return 0;
    
    const latestScores = assessments.slice(0, 5).map(a => {
      const scores = Object.values(a.scores || {}) as number[];
      return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    
    return latestScores.reduce((sum, score) => sum + score, 0) / latestScores.length;
  }

  private analyzePillarStrengths(assessments: any[]): Record<string, number> {
    const pillarScores: Record<string, number[]> = {};
    
    assessments.forEach(assessment => {
      const pillar = assessment.pillar_type;
      if (!pillarScores[pillar]) pillarScores[pillar] = [];
      
      const scores = Object.values(assessment.scores || {}) as number[];
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      pillarScores[pillar].push(avgScore);
    });

    const strengths: Record<string, number> = {};
    Object.entries(pillarScores).forEach(([pillar, scores]) => {
      strengths[pillar] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    return strengths;
  }

  private analyzePillarWeaknesses(assessments: any[]): Record<string, number> {
    const strengths = this.analyzePillarStrengths(assessments);
    const weaknesses: Record<string, number> = {};
    
    Object.entries(strengths).forEach(([pillar, score]) => {
      weaknesses[pillar] = Math.max(0, 100 - score);
    });

    return weaknesses;
  }

  private calculateLearningVelocity(progress: any[]): number {
    if (progress.length < 2) return 0;
    
    const recentProgress = progress.slice(0, 10);
    const velocities = [];
    
    for (let i = 0; i < recentProgress.length - 1; i++) {
      const current = recentProgress[i];
      const previous = recentProgress[i + 1];
      
      const timeDiff = new Date(current.recorded_at).getTime() - new Date(previous.recorded_at).getTime();
      const progressDiff = current.progress_score - previous.progress_score;
      
      if (timeDiff > 0) {
        velocities.push(progressDiff / (timeDiff / (24 * 60 * 60 * 1000))); // progress per day
      }
    }
    
    return velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
  }

  private calculateConsistencyScore(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = completedTasks.length / tasks.length;
    
    // Analyze completion pattern consistency
    const completionDates = completedTasks
      .map(t => new Date(t.updated_at).getTime())
      .sort((a, b) => a - b);
    
    if (completionDates.length < 2) return completionRate * 100;
    
    const intervals = [];
    for (let i = 1; i < completionDates.length; i++) {
      intervals.push(completionDates[i] - completionDates[i - 1]);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const consistency = Math.max(0, 1 - (Math.sqrt(variance) / avgInterval));
    
    return (completionRate * 0.7 + consistency * 0.3) * 100;
  }

  private calculateNeuroplasticityIndex(profile: any, tasks: any[]): number {
    if (!profile) return 50;
    
    const baseIndex = profile.current_plasticity_score || 50;
    const recentTasksCompleted = tasks.filter(t => 
      t.status === 'completed' && 
      new Date(t.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    const activityBonus = Math.min(20, recentTasksCompleted * 2);
    
    return Math.min(100, baseIndex + activityBonus);
  }

  private async generatePredictedOutcomes(userId: string, assessments: any[], progress: any[]): Promise<UserInsights['predictedOutcomes']> {
    // Simple prediction logic - can be enhanced with ML models
    const avgProgress = progress.length > 0 
      ? progress.reduce((sum, p) => sum + p.progress_score, 0) / progress.length 
      : 0;
    
    const nextMilestone = avgProgress < 25 ? 'Grundläggande färdigheter' :
                         avgProgress < 50 ? 'Medel färdighetsnivå' :
                         avgProgress < 75 ? 'Avancerad kompetens' : 'Expertis';
    
    const timeToMilestone = Math.max(1, Math.ceil((100 - avgProgress) / 10)); // weeks
    
    return {
      nextMilestone,
      timeToMilestone,
      recommendedActions: [
        'Genomför nästa assessment inom en vecka',
        'Fokusera på svagaste pillar-området',
        'Öka träningsintensiteten gradvis'
      ]
    };
  }

  private identifyPeakPerformanceTime(tasks: any[], events: any[]): string {
    const hourCounts: Record<number, number> = {};
    
    [...tasks, ...events].forEach(item => {
      const hour = new Date(item.created_at || item.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '9';
    
    return `${peakHour}:00`;
  }

  private analyzeTaskCompletionPatterns(tasks: any[]): Record<string, number> {
    const patterns: Record<string, number> = {};
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    completedTasks.forEach(task => {
      const dayOfWeek = new Date(task.updated_at).toLocaleDateString('sv-SE', { weekday: 'long' });
      patterns[dayOfWeek] = (patterns[dayOfWeek] || 0) + 1;
    });
    
    return patterns;
  }

  private calculateAssessmentFrequency(assessments: any[]): number {
    if (assessments.length < 2) return 0;
    
    const dates = assessments.map(a => new Date(a.created_at).getTime()).sort((a, b) => a - b);
    const intervals = [];
    
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (24 * 60 * 60 * 1000));
    }
    
    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  private analyzeEngagementTrends(events: any[]): Array<{ date: string; level: number }> {
    const daily: Record<string, number> = {};
    
    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      daily[date] = (daily[date] || 0) + 1;
    });
    
    return Object.entries(daily)
      .map(([date, level]) => ({ date, level }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }

  private identifyStrugglingAreas(tasks: any[], assessments: any[]): string[] {
    const pillarPerformance: Record<string, { total: number; completed: number; avgScore: number }> = {};
    
    // Analyze task completion rates per pillar
    tasks.forEach(task => {
      const pillar = task.pillar || 'general';
      if (!pillarPerformance[pillar]) {
        pillarPerformance[pillar] = { total: 0, completed: 0, avgScore: 0 };
      }
      pillarPerformance[pillar].total++;
      if (task.status === 'completed') {
        pillarPerformance[pillar].completed++;
      }
    });
    
    // Analyze assessment scores per pillar
    assessments.forEach(assessment => {
      const pillar = assessment.pillar_type;
      if (pillarPerformance[pillar]) {
        const scores = Object.values(assessment.scores || {}) as number[];
        pillarPerformance[pillar].avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      }
    });
    
    return Object.entries(pillarPerformance)
      .filter(([_, perf]) => (perf.completed / perf.total) < 0.6 || perf.avgScore < 60)
      .map(([pillar]) => pillar);
  }

  private identifyStrengths(tasks: any[], assessments: any[]): string[] {
    const pillarPerformance: Record<string, { total: number; completed: number; avgScore: number }> = {};
    
    // Same analysis as struggling areas but opposite criteria
    tasks.forEach(task => {
      const pillar = task.pillar || 'general';
      if (!pillarPerformance[pillar]) {
        pillarPerformance[pillar] = { total: 0, completed: 0, avgScore: 0 };
      }
      pillarPerformance[pillar].total++;
      if (task.status === 'completed') {
        pillarPerformance[pillar].completed++;
      }
    });
    
    assessments.forEach(assessment => {
      const pillar = assessment.pillar_type;
      if (pillarPerformance[pillar]) {
        const scores = Object.values(assessment.scores || {}) as number[];
        pillarPerformance[pillar].avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      }
    });
    
    return Object.entries(pillarPerformance)
      .filter(([_, perf]) => (perf.completed / perf.total) > 0.8 && perf.avgScore > 80)
      .map(([pillar]) => pillar);
  }

  private calculateChurnRisk(insights: UserInsights, patterns: BehavioralPatterns): number {
    let riskScore = 0;
    
    // Low consistency increases churn risk
    if (insights.consistencyScore < 50) riskScore += 30;
    else if (insights.consistencyScore < 70) riskScore += 15;
    
    // Low engagement increases risk
    const recentEngagement = patterns.engagementTrends.slice(-7);
    const avgEngagement = recentEngagement.reduce((sum, e) => sum + e.level, 0) / recentEngagement.length || 0;
    if (avgEngagement < 2) riskScore += 25;
    else if (avgEngagement < 5) riskScore += 10;
    
    // Low assessment frequency increases risk
    if (patterns.assessmentFrequency > 14) riskScore += 20; // More than 2 weeks between assessments
    else if (patterns.assessmentFrequency > 7) riskScore += 10;
    
    // Many struggling areas increase risk
    if (patterns.strugglingAreas.length > 2) riskScore += 15;
    
    return Math.min(100, riskScore);
  }

  private recommendNextAssessment(patterns: BehavioralPatterns, insights: UserInsights): string {
    // Find pillar with lowest strength score
    const lowestPillar = Object.entries(insights.pillarStrengths)
      .sort(([,a], [,b]) => a - b)[0];
    
    return lowestPillar ? lowestPillar[0] : 'self_care';
  }

  private generateOptimalScheduling(patterns: BehavioralPatterns, insights: UserInsights): PredictiveAnalytics['optimalTaskScheduling'] {
    const peakHour = patterns.peakPerformanceTime;
    const strugglingAreas = patterns.strugglingAreas;
    
    return [
      {
        taskType: strugglingAreas[0] || 'self_care',
        recommendedTime: peakHour,
        difficulty: insights.neuroplasticityIndex > 70 ? 8 : 6
      },
      {
        taskType: 'reflection',
        recommendedTime: '20:00',
        difficulty: 4
      },
      {
        taskType: 'skill_practice',
        recommendedTime: peakHour,
        difficulty: insights.neuroplasticityIndex > 70 ? 7 : 5
      }
    ];
  }

  private generateInterventionTriggers(insights: UserInsights, patterns: BehavioralPatterns): PredictiveAnalytics['interventionTriggers'] {
    const triggers: PredictiveAnalytics['interventionTriggers'] = [];
    
    if (insights.consistencyScore < 40) {
      triggers.push({
        condition: 'Low consistency detected',
        action: 'Send motivational reminder and suggest easier tasks',
        priority: 8
      });
    }
    
    if (patterns.strugglingAreas.length > 2) {
      triggers.push({
        condition: 'Multiple struggling areas',
        action: 'Recommend coach consultation and pillar-focused assessment',
        priority: 7
      });
    }
    
    if (insights.learningVelocity < 0) {
      triggers.push({
        condition: 'Negative learning velocity',
        action: 'Adjust difficulty and provide additional support resources',
        priority: 9
      });
    }
    
    return triggers.sort((a, b) => b.priority - a.priority);
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const advancedAnalyticsEngine = AdvancedAnalyticsEngine.getInstance();