/**
 * 📈 PROGRESS TRACKING ENGINE - SPRINT 2 IMPLEMENTATION
 * Omfattande progression tracking med neuroplasticitets-markers och adaptive insights
 */

import { supabase } from '@/integrations/supabase/client';

export interface ComprehensiveProgress {
  userId: string;
  pillarProgression: Record<string, PillarProgress>;
  neuroplasticMarkers: NeuroplasticMarker[];
  learningVelocity: LearningVelocityData;
  adaptiveTrends: AdaptiveTrend[];
  nextOptimalActions: OptimalAction[];
  motivationalState: MotivationalState;
}

export interface PillarProgress {
  pillarType: string;
  currentLevel: number; // 1-10
  neuroplasticGrowth: number; // percentage growth in neural pathways
  consistencyScore: number; // 0-1 based on daily engagement
  masteryIndicators: MasteryIndicator[];
  strugglingAreas: string[];
  breakthroughMoments: BreakthroughMoment[];
  predictedTimeline: PredictedTimeline;
}

export interface NeuroplasticMarker {
  timestamp: string;
  markerType: 'retention' | 'transfer' | 'speed' | 'complexity';
  value: number;
  pillarType: string;
  contextData: Record<string, any>;
  significance: 'minor' | 'moderate' | 'major' | 'breakthrough';
}

export interface LearningVelocityData {
  currentVelocity: number; // multiplier vs baseline
  acceleration: number; // rate of velocity change
  optimalPace: number; // recommended based on neuroplasticity
  velocityHistory: VelocityPoint[];
}

export interface VelocityPoint {
  timestamp: string;
  velocity: number;
  context: string;
}

export interface AdaptiveTrend {
  trendType: 'improvement' | 'plateau' | 'decline' | 'breakthrough';
  pillarType: string;
  confidence: number; // 0-1
  duration: number; // days
  predictedContinuation: number; // days
  interventionRecommended: boolean;
}

export interface OptimalAction {
  actionType: string;
  title: string;
  description: string;
  neuroplasticRationale: string;
  estimatedImpact: number; // 1-10
  urgency: 'low' | 'medium' | 'high' | 'critical';
  pillarType: string;
}

export interface MasteryIndicator {
  skillArea: string;
  masteryLevel: number; // 0-1
  neuroplasticEvidence: string;
  timeToMastery: number; // estimated days
}

export interface BreakthroughMoment {
  timestamp: string;
  description: string;
  pillarType: string;
  neuroplasticSignificance: string;
  impactMeasure: number; // 1-10
}

export interface PredictedTimeline {
  nextMilestone: string;
  estimatedDays: number;
  confidence: number; // 0-1
  adaptationFactors: string[];
}

export interface MotivationalState {
  currentLevel: number; // 1-10
  dominantDrivers: string[];
  energyPatterns: EnergyPattern[];
  optimalInterventionTiming: string;
}

export interface EnergyPattern {
  timeOfDay: string;
  energyLevel: number; // 1-10
  optimalActivities: string[];
}

export class ProgressTrackingEngine {
  /**
   * 🎯 GET COMPREHENSIVE PROGRESS
   */
  static async getComprehensiveProgress(userId: string): Promise<ComprehensiveProgress> {
    const [
      pillarData,
      neuroplasticData,
      velocityData,
      motivationalData
    ] = await Promise.all([
      this.analyzePillarProgression(userId),
      this.extractNeuroplasticMarkers(userId),
      this.calculateLearningVelocity(userId),
      this.assessMotivationalState(userId)
    ]);

    const adaptiveTrends = await this.identifyAdaptiveTrends(userId, pillarData);
    const nextActions = await this.generateOptimalActions(userId, pillarData, adaptiveTrends);

    return {
      userId,
      pillarProgression: pillarData,
      neuroplasticMarkers: neuroplasticData,
      learningVelocity: velocityData,
      adaptiveTrends,
      nextOptimalActions: nextActions,
      motivationalState: motivationalData
    };
  }

  /**
   * 📊 ANALYZE PILLAR PROGRESSION
   */
  private static async analyzePillarProgression(userId: string): Promise<Record<string, PillarProgress>> {
    // Get all assessment rounds for user
    const { data: assessments } = await supabase
      .from('assessment_rounds')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    // Get neuroplastic progress data
    const { data: progressData } = await supabase
      .from('neuroplastic_progress_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const pillars = ['self_care', 'skills', 'talent', 'brand', 'economy'];
    const progression: Record<string, PillarProgress> = {};

    for (const pillar of pillars) {
      const pillarAssessments = assessments?.filter(a => a.pillar_type === pillar) || [];
      const pillarProgress = progressData?.filter(p => p.pillar_type === pillar) || [];
      
      progression[pillar] = await this.calculatePillarProgress(
        pillar,
        pillarAssessments,
        pillarProgress
      );
    }

    return progression;
  }

  /**
   * 🧠 CALCULATE PILLAR PROGRESS
   */
  private static async calculatePillarProgress(
    pillarType: string,
    assessments: any[],
    progressData: any[]
  ): Promise<PillarProgress> {
    const latestScore = assessments.length > 0 
      ? (assessments[assessments.length - 1].scores?.overall || 0) 
      : 0;

    // Calculate neuroplastic growth
    const neuroplasticGrowth = this.calculateNeuroplasticGrowth(progressData);
    
    // Calculate consistency
    const consistencyScore = this.calculateConsistencyScore(progressData);
    
    // Identify mastery indicators
    const masteryIndicators = this.identifyMasteryIndicators(progressData);
    
    // Find struggling areas
    const strugglingAreas = this.identifyStrugglingAreas(assessments, progressData);
    
    // Find breakthrough moments
    const breakthroughMoments = this.identifyBreakthroughMoments(progressData);
    
    // Predict timeline
    const predictedTimeline = this.predictTimeline(pillarType, latestScore, neuroplasticGrowth);

    return {
      pillarType,
      currentLevel: Math.round(latestScore),
      neuroplasticGrowth,
      consistencyScore,
      masteryIndicators,
      strugglingAreas,
      breakthroughMoments,
      predictedTimeline
    };
  }

  /**
   * 🌱 CALCULATE NEUROPLASTIC GROWTH
   */
  private static calculateNeuroplasticGrowth(progressData: any[]): number {
    if (progressData.length < 2) return 0;

    const recentData = progressData.slice(-10); // Last 10 activities
    const growthFactors = recentData.map(data => {
      const markers = data.neuroplastic_markers || {};
      return (
        (markers.consistency_score || 0) * 0.3 +
        (markers.difficulty_progression || 0) * 0.3 +
        (markers.retention_indicators || 0) * 0.2 +
        (markers.transfer_learning || 0) * 0.2
      );
    });

    return growthFactors.reduce((sum, factor) => sum + factor, 0) / growthFactors.length * 100;
  }

  /**
   * 📅 CALCULATE CONSISTENCY SCORE
   */
  private static calculateConsistencyScore(progressData: any[]): number {
    if (progressData.length === 0) return 0;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentActivities = progressData.filter(
      data => new Date(data.created_at) > last30Days
    );

    // Calculate days with activity
    const activeDays = new Set(
      recentActivities.map(activity => 
        new Date(activity.created_at).toDateString()
      )
    ).size;

    return Math.min(1, activeDays / 30);
  }

  /**
   * 🎯 IDENTIFY MASTERY INDICATORS
   */
  private static identifyMasteryIndicators(progressData: any[]): MasteryIndicator[] {
    // Analyze completion patterns and success rates
    const skillAreas = [...new Set(progressData.map(p => p.activity_type))];
    
    return skillAreas.map(skillArea => {
      const skillData = progressData.filter(p => p.activity_type === skillArea);
      const successRate = skillData.filter(
        d => d.completion_data?.success === true
      ).length / skillData.length || 0;

      const masteryLevel = Math.min(1, successRate * (skillData.length / 10));
      const timeToMastery = Math.max(7, Math.round((1 - masteryLevel) * 60));

      return {
        skillArea,
        masteryLevel,
        neuroplasticEvidence: `${Math.round(successRate * 100)}% framgångsgrad över ${skillData.length} sessioner`,
        timeToMastery
      };
    });
  }

  /**
   * ⚠️ IDENTIFY STRUGGLING AREAS
   */
  private static identifyStrugglingAreas(assessments: any[], progressData: any[]): string[] {
    const strugglingAreas: string[] = [];

    // Look for declining scores in assessments
    if (assessments.length >= 2) {
      const recent = assessments[assessments.length - 1];
      const previous = assessments[assessments.length - 2];
      
      if (recent.scores?.overall < previous.scores?.overall) {
        strugglingAreas.push('Övergripande framsteg har avtagit');
      }
    }

    // Look for low success rates in progress data
    const activityTypes = [...new Set(progressData.map(p => p.activity_type))];
    
    activityTypes.forEach(activityType => {
      const activities = progressData.filter(p => p.activity_type === activityType);
      const recentActivities = activities.slice(-5);
      const successRate = recentActivities.filter(
        a => a.completion_data?.success === true
      ).length / recentActivities.length || 0;
      
      if (successRate < 0.4) {
        strugglingAreas.push(`Låg framgångsgrad i ${activityType}`);
      }
    });

    return strugglingAreas;
  }

  /**
   * 💥 IDENTIFY BREAKTHROUGH MOMENTS
   */
  private static identifyBreakthroughMoments(progressData: any[]): BreakthroughMoment[] {
    const breakthroughs: BreakthroughMoment[] = [];

    // Look for sudden improvements or achievements
    progressData.forEach((data, index) => {
      if (index < 2) return; // Need previous data for comparison
      
      const markers = data.neuroplastic_markers || {};
      const prevMarkers = progressData[index - 1].neuroplastic_markers || {};
      
      // Check for significant improvements
      const difficultyJump = (markers.difficulty_progression || 0) - (prevMarkers.difficulty_progression || 0);
      const consistencyJump = (markers.consistency_score || 0) - (prevMarkers.consistency_score || 0);
      
      if (difficultyJump > 0.3 || consistencyJump > 0.4) {
        breakthroughs.push({
          timestamp: data.created_at,
          description: `Significant improvement in ${data.activity_type}`,
          pillarType: data.pillar_type,
          neuroplasticSignificance: `${Math.round(Math.max(difficultyJump, consistencyJump) * 100)}% förbättring`,
          impactMeasure: Math.min(10, Math.round(Math.max(difficultyJump, consistencyJump) * 20))
        });
      }
    });

    return breakthroughs.slice(-5); // Keep last 5 breakthroughs
  }

  /**
   * 🔮 PREDICT TIMELINE
   */
  private static predictTimeline(pillarType: string, currentScore: number, neuroplasticGrowth: number): PredictedTimeline {
    const targetScore = Math.min(10, currentScore + 2);
    const growthRate = Math.max(0.1, neuroplasticGrowth / 100);
    
    const estimatedDays = Math.round((targetScore - currentScore) / (growthRate * 0.1) * 7);
    const confidence = Math.min(1, neuroplasticGrowth / 50);

    return {
      nextMilestone: `Nå nivå ${targetScore} i ${pillarType}`,
      estimatedDays: Math.min(365, estimatedDays),
      confidence,
      adaptationFactors: [
        'Daglig konsistens',
        'Neuroplastisk adaptation',
        'Motivationsnivå',
        'Svårighetsgrad-anpassning'
      ]
    };
  }

  /**
   * 🌊 EXTRACT NEUROPLASTIC MARKERS  
   */
  private static async extractNeuroplasticMarkers(userId: string): Promise<NeuroplasticMarker[]> {
    const { data: progressData } = await supabase
      .from('neuroplastic_progress_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!progressData) return [];

    return progressData.map(data => {
      const markers = data.neuroplastic_markers || {};
      const avgValue = (
        (markers.consistency_score || 0) +
        (markers.difficulty_progression || 0) +
        (markers.retention_indicators || 0) +
        (markers.transfer_learning || 0)
      ) / 4;

      let significance: 'minor' | 'moderate' | 'major' | 'breakthrough' = 'minor';
      if (avgValue > 0.8) significance = 'breakthrough';
      else if (avgValue > 0.6) significance = 'major';
      else if (avgValue > 0.4) significance = 'moderate';

      return {
        timestamp: data.created_at,
        markerType: 'complexity',
        value: avgValue,
        pillarType: data.pillar_type,
        contextData: data.completion_data || {},
        significance
      };
    });
  }

  /**
   * ⚡ CALCULATE LEARNING VELOCITY
   */
  private static async calculateLearningVelocity(userId: string): Promise<LearningVelocityData> {
    const { data: profile } = await supabase
      .from('user_neuroplasticity_profiles')
      .select('profile_data')
      .eq('user_id', userId)
      .single();

    const profileData = profile?.profile_data || { learningVelocity: 1.0, adaptationHistory: [] };
    const history = profileData.adaptationHistory || [];

    // Calculate acceleration based on recent trends
    const recentVelocities = history.slice(-10).map((record: any) => record.neuroplasticGains || 0);
    const acceleration = recentVelocities.length > 5 
      ? (recentVelocities.slice(-3).reduce((sum: number, v: number) => sum + v, 0) / 3) -
        (recentVelocities.slice(0, 3).reduce((sum: number, v: number) => sum + v, 0) / 3)
      : 0;

    return {
      currentVelocity: profileData.learningVelocity,
      acceleration,
      optimalPace: Math.min(2.0, profileData.learningVelocity * 1.2),
      velocityHistory: history.slice(-20).map((record: any) => ({
        timestamp: record.timestamp,
        velocity: record.neuroplasticGains || 0,
        context: record.pillarType
      }))
    };
  }

  /**
   * 📈 IDENTIFY ADAPTIVE TRENDS
   */
  private static async identifyAdaptiveTrends(
    userId: string, 
    pillarData: Record<string, PillarProgress>
  ): Promise<AdaptiveTrend[]> {
    const trends: AdaptiveTrend[] = [];

    Object.entries(pillarData).forEach(([pillarType, progress]) => {
      // Analyze trend based on neuroplastic growth
      let trendType: 'improvement' | 'plateau' | 'decline' | 'breakthrough' = 'plateau';
      let confidence = 0.5;

      if (progress.neuroplasticGrowth > 20) {
        trendType = progress.neuroplasticGrowth > 40 ? 'breakthrough' : 'improvement';
        confidence = Math.min(1, progress.neuroplasticGrowth / 50);
      } else if (progress.neuroplasticGrowth < 5 && progress.consistencyScore < 0.3) {
        trendType = 'decline';
        confidence = 0.7;
      }

      trends.push({
        trendType,
        pillarType,
        confidence,
        duration: 14, // Estimate based on recent data
        predictedContinuation: trendType === 'improvement' ? 21 : 7,
        interventionRecommended: trendType === 'decline' || trendType === 'plateau'
      });
    });

    return trends;
  }

  /**
   * 🎯 GENERATE OPTIMAL ACTIONS
   */
  private static async generateOptimalActions(
    userId: string,
    pillarData: Record<string, PillarProgress>,
    trends: AdaptiveTrend[]
  ): Promise<OptimalAction[]> {
    const actions: OptimalAction[] = [];

    // Actions based on trends
    trends.forEach(trend => {
      if (trend.interventionRecommended) {
        actions.push({
          actionType: 'intervention',
          title: `Återuppta momentum i ${trend.pillarType}`,
          description: 'Minska svårighetsgrad och fokusera på konsistens',
          neuroplasticRationale: 'Bygger om positiva associationer och neural pathway strength',
          estimatedImpact: 7,
          urgency: trend.trendType === 'decline' ? 'high' : 'medium',
          pillarType: trend.pillarType
        });
      }
    });

    // Actions based on pillar progression
    Object.entries(pillarData).forEach(([pillarType, progress]) => {
      if (progress.strugglingAreas.length > 0) {
        actions.push({
          actionType: 'support',
          title: `Extra stöd för ${pillarType}`,
          description: `Fokusera på: ${progress.strugglingAreas.join(', ')}`,
          neuroplasticRationale: 'Targeted reinforcement för specifika neurala pathways',
          estimatedImpact: 6,
          urgency: 'medium',
          pillarType
        });
      }

      if (progress.consistencyScore > 0.8 && progress.neuroplasticGrowth > 15) {
        actions.push({
          actionType: 'advancement',
          title: `Utmana dig mer i ${pillarType}`,
          description: 'Du är redo för nästa svårighetsnivå',
          neuroplasticRationale: 'Optimal challenge zone för maximal neuroplastisk tillväxt',
          estimatedImpact: 8,
          urgency: 'low',
          pillarType
        });
      }
    });

    return actions.sort((a, b) => b.estimatedImpact - a.estimatedImpact).slice(0, 5);
  }

  /**
   * 💪 ASSESS MOTIVATIONAL STATE
   */
  private static async assessMotivationalState(userId: string): Promise<MotivationalState> {
    const { data: recentActivities } = await supabase
      .from('neuroplastic_progress_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const activityCount = recentActivities?.length || 0;
    const motivationLevel = Math.min(10, Math.max(1, (activityCount / 7) * 10));

    // Analyze energy patterns from activity timestamps
    const energyPatterns = this.analyzeEnergyPatterns(recentActivities || []);

    return {
      currentLevel: Math.round(motivationLevel),
      dominantDrivers: [
        motivationLevel > 7 ? 'Hög engagemang' : 'Behöver motivationsstöd',
        activityCount > 5 ? 'Konsistent deltagande' : 'Ojämn aktivitet'
      ],
      energyPatterns,
      optimalInterventionTiming: energyPatterns.length > 0 
        ? energyPatterns.reduce((max, pattern) => 
            pattern.energyLevel > max.energyLevel ? pattern : max
          ).timeOfDay
        : 'morning'
    };
  }

  /**
   * ⚡ ANALYZE ENERGY PATTERNS
   */
  private static analyzeEnergyPatterns(activities: any[]): EnergyPattern[] {
    const patterns: Record<string, { count: number, total: number }> = {};

    activities.forEach(activity => {
      const hour = new Date(activity.created_at).getHours();
      const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      if (!patterns[timeSlot]) {
        patterns[timeSlot] = { count: 0, total: 0 };
      }
      
      patterns[timeSlot].count++;
      patterns[timeSlot].total += activity.completion_data?.success ? 10 : 5;
    });

    return Object.entries(patterns).map(([timeOfDay, data]) => ({
      timeOfDay,
      energyLevel: Math.round(data.total / data.count),
      optimalActivities: [
        timeOfDay === 'morning' ? 'Planering och reflektion' : '',
        timeOfDay === 'afternoon' ? 'Aktiv färdighetsträning' : '',
        timeOfDay === 'evening' ? 'Återkoppling och integration' : ''
      ].filter(Boolean)
    }));
  }
}