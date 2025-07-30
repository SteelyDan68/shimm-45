import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

export interface AnalyticsFilters {
  period: '7d' | '30d' | '90d' | '1y';
  startDate?: Date;
  endDate?: Date;
}

export interface BarrierTrend {
  date: string;
  count: number;
  types: Record<string, number>;
}

export interface TaskProgress {
  date: string;
  completed: number;
  created: number;
  pending: number;
}

export interface VelocityPoint {
  date: string;
  score: number;
  rank: string;
}

export interface SentimentTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  average: number;
}

export interface ProblemArea {
  area: string;
  count: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface FunctionalResourceTrend {
  date: string;
  functionalAccessCount: number; // Antal "ja" svar på funktionstillgångsfrågor
  subjectiveOpportunitiesAvg: number; // Genomsnitt 1-5 för subjektiva möjligheter
  hasRegularSupport: boolean; // Om de har någon att prata med regelbundet
  relationshipComments: string; // Sammanställd kommentar från relationsfrågor
}

export interface AnalyticsData {
  barrierTrends: BarrierTrend[];
  taskProgress: TaskProgress[];
  velocityTrends: VelocityPoint[];
  sentimentTrends: SentimentTrend[];
  problemAreas: ProblemArea[];
  functionalResources: FunctionalResourceTrend[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    averageVelocity: number;
    currentVelocity: number;
    mostCommonBarrier: string;
  };
}

export const useAnalytics = (clientId?: string) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({ period: '30d' });
  const { toast } = useToast();

  const getDateRange = () => {
    if (filters.startDate && filters.endDate) {
      return { start: filters.startDate, end: filters.endDate };
    }

    const end = new Date();
    let start: Date;

    switch (filters.period) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      case '1y':
        start = subDays(end, 365);
        break;
      default:
        start = subDays(end, 30);
    }

    return { start, end };
  };

  const fetchAnalytics = async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const { start, end } = getDateRange();

      // Fetch path entries for barrier analysis
      const { data: pathEntries, error: pathError } = await supabase
        .from('path_entries')
        .select('*')
        .eq('client_id', clientId)
        .gte('timestamp', start.toISOString())
        .lte('timestamp', end.toISOString())
        .order('timestamp', { ascending: true });

      if (pathError) throw pathError;

      // Fetch tasks for progress analysis
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch client for velocity history (simulated for now)
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('velocity_score, created_at')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      // Process barrier trends
      const barrierTrends = processBarrierTrends(pathEntries || []);
      
      // Process task progress
      const taskProgress = processTaskProgress(tasks || []);
      
      // Process velocity trends (simulated data based on current score)
      const velocityTrends = processVelocityTrends(client?.velocity_score || 50, start, end);
      
      // Process sentiment trends (simulated for now)
      const sentimentTrends = processSentimentTrends(start, end);
      
      // Analyze problem areas
      const problemAreas = analyzeProblemAreas(pathEntries || []);

      // Process functional resources
      const functionalResources = processFunctionalResources(pathEntries || []);

      // Calculate summary statistics
      const summary = calculateSummary(tasks || [], client?.velocity_score || 50, problemAreas);

      setData({
        barrierTrends,
        taskProgress,
        velocityTrends,
        sentimentTrends,
        problemAreas,
        functionalResources,
        summary
      });

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta analysdata",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processBarrierTrends = (entries: any[]): BarrierTrend[] => {
    const dailyData: Record<string, { count: number; types: Record<string, number> }> = {};

    entries.forEach(entry => {
      const date = format(new Date(entry.timestamp), 'yyyy-MM-dd');
      if (!dailyData[date]) {
        dailyData[date] = { count: 0, types: {} };
      }

      if (entry.type === 'assessment' && entry.details?.includes('hinder')) {
        dailyData[date].count++;
        const barrier = extractBarrierType(entry.details);
        dailyData[date].types[barrier] = (dailyData[date].types[barrier] || 0) + 1;
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      count: data.count,
      types: data.types
    }));
  };

  const processTaskProgress = (tasks: any[]): TaskProgress[] => {
    const dailyData: Record<string, { completed: number; created: number; pending: number }> = {};

    tasks.forEach(task => {
      const createdDate = format(new Date(task.created_at), 'yyyy-MM-dd');
      if (!dailyData[createdDate]) {
        dailyData[createdDate] = { completed: 0, created: 0, pending: 0 };
      }
      dailyData[createdDate].created++;

      if (task.completed_at) {
        const completedDate = format(new Date(task.completed_at), 'yyyy-MM-dd');
        if (!dailyData[completedDate]) {
          dailyData[completedDate] = { completed: 0, created: 0, pending: 0 };
        }
        dailyData[completedDate].completed++;
      } else {
        dailyData[createdDate].pending++;
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data
    }));
  };

  const processVelocityTrends = (currentScore: number, start: Date, end: Date): VelocityPoint[] => {
    const points: VelocityPoint[] = [];
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Simulate velocity changes over time
    for (let i = 0; i <= days; i += Math.max(1, Math.floor(days / 10))) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const variance = Math.random() * 20 - 10; // ±10 variation
      const score = Math.max(0, Math.min(100, currentScore + variance));
      const rank = score >= 80 ? 'A' : score >= 60 ? 'B' : 'C';
      
      points.push({
        date: format(date, 'yyyy-MM-dd'),
        score: Math.round(score),
        rank
      });
    }

    return points;
  };

  const processSentimentTrends = (start: Date, end: Date): SentimentTrend[] => {
    const points: SentimentTrend[] = [];
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Simulate sentiment data
    for (let i = 0; i <= days; i += Math.max(1, Math.floor(days / 7))) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const positive = Math.random() * 40 + 30; // 30-70%
      const negative = Math.random() * 20 + 5;  // 5-25%
      const neutral = 100 - positive - negative;
      
      points.push({
        date: format(date, 'yyyy-MM-dd'),
        positive: Math.round(positive),
        neutral: Math.round(neutral),
        negative: Math.round(negative),
        average: Math.round(positive - negative) // Sentiment score
      });
    }

    return points;
  };

  const analyzeProblemAreas = (entries: any[]): ProblemArea[] => {
    const areas: Record<string, number> = {};
    const total = entries.length;

    entries.forEach(entry => {
      if (entry.type === 'assessment' && entry.details) {
        const area = extractProblemArea(entry.details);
        areas[area] = (areas[area] || 0) + 1;
      }
    });

    return Object.entries(areas)
      .map(([area, count]) => ({
        area,
        count,
        percentage: Math.round((count / total) * 100),
        trend: 'stable' as const // Simplified for now
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const processFunctionalResources = (entries: any[]): FunctionalResourceTrend[] => {
    const assessmentEntries = entries.filter(entry => 
      entry.type === 'assessment' && entry.details?.includes('Funktionstillgång')
    );

    return assessmentEntries.map(entry => {
      const date = format(new Date(entry.timestamp), 'yyyy-MM-dd');
      
      // Parse functional access count (antal "ja" svar)
      let functionalAccessCount = 0;
      const functionalMatches = entry.details.match(/🟠 Funktionstillgång:\n(.*?)(?=\n\n|$)/s);
      if (functionalMatches) {
        const functionalText = functionalMatches[1];
        functionalAccessCount = (functionalText.match(/: ja/g) || []).length;
      }

      // Parse subjective opportunities average
      let subjectiveOpportunitiesAvg = 0;
      const subjectiveMatches = entry.details.match(/🟣 Subjektiva möjligheter:\n(.*?)(?=\n\n|$)/s);
      if (subjectiveMatches) {
        const subjectiveText = subjectiveMatches[1];
        const scores = subjectiveText.match(/: (\d+)\/5/g);
        if (scores) {
          const values = scores.map(s => parseInt(s.match(/(\d+)\/5/)?.[1] || '0'));
          subjectiveOpportunitiesAvg = values.reduce((a, b) => a + b, 0) / values.length;
        }
      }

      // Parse relationship support
      let hasRegularSupport = false;
      let relationshipComments = '';
      const relationshipMatches = entry.details.match(/🟢 Relationer:\n(.*?)(?=\n\n|$)/s);
      if (relationshipMatches) {
        const relationshipText = relationshipMatches[1];
        hasRegularSupport = relationshipText.includes('prata med regelbundet?: ja');
        
        // Extract comments from relationships
        const commentMatches = relationshipText.match(/\(([^)]+)\)/g);
        if (commentMatches) {
          relationshipComments = commentMatches.map(m => m.slice(1, -1)).join('; ');
        }
      }

      return {
        date,
        functionalAccessCount,
        subjectiveOpportunitiesAvg: Math.round(subjectiveOpportunitiesAvg * 10) / 10,
        hasRegularSupport,
        relationshipComments
      };
    });
  };

  const calculateSummary = (tasks: any[], velocityScore: number, problemAreas: ProblemArea[]) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      averageVelocity: velocityScore,
      currentVelocity: velocityScore,
      mostCommonBarrier: problemAreas[0]?.area || 'Inga hinder registrerade'
    };
  };

  const extractBarrierType = (details: string): string => {
    // Simplified barrier extraction
    if (details.toLowerCase().includes('tid')) return 'Tidsbrist';
    if (details.toLowerCase().includes('motivation')) return 'Motivation';
    if (details.toLowerCase().includes('kunskap')) return 'Kunskapsbrist';
    if (details.toLowerCase().includes('resurser')) return 'Resursbrist';
    return 'Övrigt';
  };

  const extractProblemArea = (details: string): string => {
    // Simplified problem area extraction
    if (details.toLowerCase().includes('träning')) return 'Träning';
    if (details.toLowerCase().includes('kost')) return 'Kost';
    if (details.toLowerCase().includes('sömn')) return 'Sömn';
    if (details.toLowerCase().includes('stress')) return 'Stress';
    if (details.toLowerCase().includes('motivation')) return 'Motivation';
    return 'Allmänt';
  };

  useEffect(() => {
    fetchAnalytics();
  }, [clientId, filters]);

  return {
    data,
    loading,
    filters,
    setFilters,
    refreshData: fetchAnalytics
  };
};