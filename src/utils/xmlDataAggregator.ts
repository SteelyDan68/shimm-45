// Background data aggregation service for XML containers
import { supabase } from '@/integrations/supabase/client';
import { ContainerType } from '@/types/xmlContainers';

interface AggregationConfig {
  clientId: string;
  containerType: ContainerType;
  sourceTable: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export class XmlDataAggregator {
  
  static async aggregateAssessmentData(clientId: string): Promise<Record<string, any> | null> {
    try {
      // Fetch all assessment rounds for the client
      const { data: assessments, error } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assessments:', error);
        return null;
      }

      // Aggregate data into XML-ready structure
      const aggregatedData = {
        user_id: clientId,
        assessment_summary: {
          total_assessments: assessments?.length || 0,
          latest_assessment: assessments?.[0]?.created_at || null,
          average_scores: this.calculateAverageScores(assessments || []),
          progress_trend: this.calculateProgressTrend(assessments || [])
        },
        historical_assessments: assessments?.map(assessment => ({
          id: assessment.id,
          date: assessment.created_at,
          pillar_type: assessment.pillar_type,
          scores: assessment.scores,
          ai_analysis: assessment.ai_analysis
        })) || []
      };

      return aggregatedData;
    } catch (error) {
      console.error('Error aggregating assessment data:', error);
      return null;
    }
  }

  static async aggregateProgressData(clientId: string): Promise<Record<string, any> | null> {
    try {
      // Fetch path entries, tasks, and other progress indicators
      const [pathEntries, tasks] = await Promise.all([
        supabase
          .from('path_entries')
          .select('*')
          .eq('user_id', clientId)
          .order('timestamp', { ascending: false }),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', clientId)
          .order('created_at', { ascending: false })
      ]);

      if (pathEntries.error || tasks.error) {
        console.error('Error fetching progress data:', pathEntries.error || tasks.error);
        return null;
      }

      const aggregatedData = {
        user_id: clientId,
        timeline_summary: {
          total_entries: pathEntries.data?.length || 0,
          completed_tasks: tasks.data?.filter(t => t.status === 'completed').length || 0,
          active_interventions: pathEntries.data?.filter(p => p.status === 'active').length || 0,
          milestone_achievements: this.extractMilestones(pathEntries.data || [])
        },
        progress_timeline: this.buildProgressTimeline(pathEntries.data || [], tasks.data || [])
      };

      return aggregatedData;
    } catch (error) {
      console.error('Error aggregating progress data:', error);
      return null;
    }
  }

  static async aggregatePillarData(clientId: string): Promise<Record<string, any> | null> {
    try {
      // Fetch pillar assessments from attribute system and visualization data
      const [pillarAssessmentData, visualizationData] = await Promise.all([
        supabase.functions.invoke('get-user-attribute', {
          body: {
            user_id: clientId,
            attribute_key: 'pillar_assessments'
          }
        }),
        supabase
          .from('pillar_visualization_data')
          .select('*')
          .eq('user_id', clientId)
          .order('created_at', { ascending: false })
      ]);

      if (pillarAssessmentData.error || visualizationData.error) {
        console.error('Error fetching pillar data:', pillarAssessmentData.error || visualizationData.error);
        return null;
      }

      const pillarAssessments = { data: Array.isArray(pillarAssessmentData.data?.data) ? pillarAssessmentData.data.data : [] };

      const aggregatedData = {
        user_id: clientId,
        pillar_analysis: {
          assessed_pillars: this.groupByPillar(pillarAssessments.data || []),
          trend_analysis: this.analyzePillarTrends(pillarAssessments.data || []),
          recommendations: this.extractPillarRecommendations(pillarAssessments.data || [])
        },
        visualization_insights: visualizationData.data?.map(viz => ({
          pillar_key: viz.pillar_key,
          data_type: viz.data_type,
          data_points: viz.data_points,
          metadata: viz.metadata
        })) || []
      };

      return aggregatedData;
    } catch (error) {
      console.error('Error aggregating pillar data:', error);
      return null;
    }
  }

  // Helper methods for data processing
  private static calculateAverageScores(assessments: any[]): Record<string, number> {
    if (!assessments.length) return {};
    
    const scoresByPillar: Record<string, number[]> = {};
    
    assessments.forEach(assessment => {
      if (assessment.scores && typeof assessment.scores === 'object') {
        Object.entries(assessment.scores).forEach(([key, value]) => {
          if (typeof value === 'number') {
            if (!scoresByPillar[key]) scoresByPillar[key] = [];
            scoresByPillar[key].push(value);
          }
        });
      }
    });

    const averages: Record<string, number> = {};
    Object.entries(scoresByPillar).forEach(([pillar, scores]) => {
      averages[pillar] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    return averages;
  }

  private static calculateProgressTrend(assessments: any[]): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (assessments.length < 2) return 'insufficient_data';
    
    // Simple trend calculation based on latest vs earlier assessments
    const recent = assessments.slice(0, Math.ceil(assessments.length / 2));
    const earlier = assessments.slice(Math.ceil(assessments.length / 2));
    
    const recentAvg = this.getOverallAverage(recent);
    const earlierAvg = this.getOverallAverage(earlier);
    
    if (recentAvg > earlierAvg * 1.1) return 'improving';
    if (recentAvg < earlierAvg * 0.9) return 'declining';
    return 'stable';
  }

  private static getOverallAverage(assessments: any[]): number {
    if (!assessments.length) return 0;
    
    let totalScore = 0;
    let scoreCount = 0;
    
    assessments.forEach(assessment => {
      if (assessment.scores && typeof assessment.scores === 'object') {
        Object.values(assessment.scores).forEach(score => {
          if (typeof score === 'number') {
            totalScore += score;
            scoreCount++;
          }
        });
      }
    });

    return scoreCount > 0 ? totalScore / scoreCount : 0;
  }

  private static extractMilestones(pathEntries: any[]): any[] {
    return pathEntries
      .filter(entry => entry.type === 'milestone' || entry.metadata?.milestone === true)
      .map(entry => ({
        id: entry.id,
        title: entry.title,
        date: entry.timestamp,
        status: entry.status,
        details: entry.details
      }));
  }

  private static buildProgressTimeline(pathEntries: any[], tasks: any[]): any[] {
    // Combine path entries and tasks into a unified timeline
    const timelineItems = [
      ...pathEntries.map(entry => ({
        type: 'path_entry',
        id: entry.id,
        timestamp: entry.timestamp,
        title: entry.title,
        status: entry.status,
        content: entry.content || entry.details
      })),
      ...tasks.map(task => ({
        type: 'task',
        id: task.id,
        timestamp: task.created_at,
        title: task.title,
        status: task.status,
        content: task.description
      }))
    ];

    return timelineItems.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private static groupByPillar(assessments: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    assessments.forEach(assessment => {
      const pillarKey = assessment.pillar_key;
      if (!grouped[pillarKey]) grouped[pillarKey] = [];
      grouped[pillarKey].push(assessment);
    });

    return grouped;
  }

  private static analyzePillarTrends(assessments: any[]): Record<string, string> {
    const trends: Record<string, string> = {};
    const grouped = this.groupByPillar(assessments);
    
    Object.entries(grouped).forEach(([pillarKey, pillarAssessments]) => {
      trends[pillarKey] = this.calculateProgressTrend(pillarAssessments);
    });

    return trends;
  }

  private static extractPillarRecommendations(assessments: any[]): any[] {
    return assessments
      .filter(assessment => assessment.ai_analysis)
      .map(assessment => ({
        pillar_key: assessment.pillar_key,
        date: assessment.created_at,
        analysis: assessment.ai_analysis,
        insights: assessment.insights
      }));
  }
}