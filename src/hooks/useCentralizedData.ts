import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUserPath } from '@/hooks/useUserPath';
import { usePillarOrchestration } from '@/hooks/usePillarOrchestration';
import { usePillarJourney } from '@/hooks/usePillarJourney';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { PathEntry, PillarType } from '@/types/clientPath';

/**
 * 🎯 CENTRALIZED DATA HOOK
 * 
 * SINGLE SOURCE OF TRUTH för alla UI-komponenter
 * Eliminerar ALL fragmentering och säkerställer:
 * - path_entries som ENDA datakälla
 * - Real-time UI uppdateringar
 * - Konsistent pillar progression
 * - Zero data inconsistencies
 */

export interface CentralizedPillarData {
  pillar_type: PillarType;
  pillar_name: string;
  total_entries: number;
  completion_score: number;
  latest_assessment_score?: number;
  latest_activity_date?: string;
  is_active: boolean;
  progress_percentage: number;
}

export interface CentralizedSystemMetrics {
  total_pillars: number;
  completed_pillars: number;
  active_pillars: number;
  overall_completion: number;
  total_path_entries: number;
  this_week_entries: number;
  assessment_scores: Record<PillarType, number | null>;
  pillar_summaries: CentralizedPillarData[];
}

export const useCentralizedData = (targetUserId?: string) => {
  const { user } = useAuth();
  const userId = targetUserId || user?.id;
  const { toast } = useToast();
  
  // Use existing hooks that are ALREADY migrated to path_entries
  const { 
    entries: pathEntries, 
    loading: pathLoading, 
    refreshEntries 
  } = useUserPath(userId);
  
  const {
    pillarProgress,
    loading: pillarLoading,
    refreshProgress: refreshPillarData
  } = usePillarOrchestration();
  
  const {
    activeJourneys,
    completedJourneys,
    loading: journeyLoading,
    refreshJourneys
  } = usePillarJourney(userId);

  const [metrics, setMetrics] = useState<CentralizedSystemMetrics>({
    total_pillars: 0,
    completed_pillars: 0,
    active_pillars: 0,
    overall_completion: 0,
    total_path_entries: 0,
    this_week_entries: 0,
    assessment_scores: {} as Record<PillarType, number | null>,
    pillar_summaries: []
  });

  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 🎯 CORE COMPUTATION: Transform path_entries to unified metrics
  const computeMetrics = useCallback(() => {
    if (!pathEntries || pathEntries.length === 0) {
      console.log('🔄 CentralizedData: No path entries, resetting metrics');
      setMetrics({
        total_pillars: 0,
        completed_pillars: 0,
        active_pillars: 0,
        overall_completion: 0,
        total_path_entries: 0,
        this_week_entries: 0,
        assessment_scores: {} as Record<PillarType, number | null>,
        pillar_summaries: []
      });
      return;
    }

    console.log('🔄 CentralizedData: Computing metrics from', pathEntries.length, 'path entries');

    // Group entries by pillar_type
    const pillarGroups: Record<string, PathEntry[]> = {};
    const assessmentScores: Record<PillarType, number | null> = {} as Record<PillarType, number | null>;

    pathEntries.forEach(entry => {
      const pillarType = entry.metadata?.pillar_type;
      if (pillarType) {
        if (!pillarGroups[pillarType]) {
          pillarGroups[pillarType] = [];
        }
        pillarGroups[pillarType].push(entry);

        // Extract assessment scores
        if (entry.type === 'assessment' && entry.metadata?.assessment_score) {
          assessmentScores[pillarType as PillarType] = entry.metadata.assessment_score;
        }
      }
    });

    // Compute pillar summaries
    const pillarSummaries: CentralizedPillarData[] = Object.entries(pillarGroups).map(([pillarType, entries]) => {
      const assessmentEntries = entries.filter(e => e.type === 'assessment');
      const completedEntries = entries.filter(e => e.status === 'completed');
      const totalEntries = entries.length;
      
      const completionScore = totalEntries > 0 ? (completedEntries.length / totalEntries) * 100 : 0;
      const latestAssessment = assessmentEntries
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      return {
        pillar_type: pillarType as PillarType,
        pillar_name: getPillarDisplayName(pillarType as PillarType),
        total_entries: totalEntries,
        completion_score: completionScore,
        latest_assessment_score: latestAssessment?.metadata?.assessment_score || null,
        latest_activity_date: entries
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp,
        is_active: completionScore > 0 && completionScore < 100,
        progress_percentage: completionScore
      };
    });

    // Overall metrics
    const totalPillars = pillarSummaries.length;
    const completedPillars = pillarSummaries.filter(p => p.completion_score >= 100).length;
    const activePillars = pillarSummaries.filter(p => p.is_active).length;
    const overallCompletion = totalPillars > 0 
      ? pillarSummaries.reduce((sum, p) => sum + p.completion_score, 0) / totalPillars 
      : 0;

    // This week entries
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekEntries = pathEntries.filter(entry => 
      new Date(entry.timestamp) >= oneWeekAgo
    ).length;

    const newMetrics: CentralizedSystemMetrics = {
      total_pillars: totalPillars,
      completed_pillars: completedPillars,
      active_pillars: activePillars,
      overall_completion: overallCompletion,
      total_path_entries: pathEntries.length,
      this_week_entries: thisWeekEntries,
      assessment_scores: assessmentScores,
      pillar_summaries: pillarSummaries
    };

    console.log('✅ CentralizedData: Computed metrics:', newMetrics);
    setMetrics(newMetrics);
  }, [pathEntries]);

  // Helper function to get display names
  const getPillarDisplayName = (pillarType: PillarType): string => {
    const names: Record<PillarType, string> = {
      'self_care': 'Self Care',
      'skills': 'Skills',
      'talent': 'Talent',
      'brand': 'Brand',
      'economy': 'Economy'
    };
    return names[pillarType] || pillarType;
  };

  // Compute metrics when data changes
  useEffect(() => {
    computeMetrics();
    setLastRefresh(new Date());
  }, [computeMetrics]);

  // Update loading state
  useEffect(() => {
    setLoading(pathLoading || pillarLoading || journeyLoading);
  }, [pathLoading, pillarLoading, journeyLoading]);

  // 🔄 REFRESH ALL DATA
  const refreshAllData = useCallback(async () => {
    console.log('🔄 CentralizedData: Refreshing all data sources...');
    try {
      await Promise.all([
        refreshEntries(),
        refreshPillarData(),
        refreshJourneys()
      ]);
      setLastRefresh(new Date());
      
      toast({
        title: "Data uppdaterad",
        description: "Alla metriker har hämtats från databasen"
      });
    } catch (error) {
      console.error('❌ CentralizedData: Refresh error:', error);
      toast({
        title: "Fel vid uppdatering",
        description: "Kunde inte hämta senaste data",
        variant: "destructive"
      });
    }
  }, [refreshEntries, refreshPillarData, refreshJourneys, toast]);

  // 🔍 SPECIFIC PILLAR DATA
  const getPillarData = useCallback((pillarType: PillarType): CentralizedPillarData | null => {
    return metrics.pillar_summaries.find(p => p.pillar_type === pillarType) || null;
  }, [metrics.pillar_summaries]);

  // 📊 UI HELPER METHODS
  const isHealthy = useCallback((): boolean => {
    return metrics.overall_completion > 50 && metrics.active_pillars > 0;
  }, [metrics.overall_completion, metrics.active_pillars]);

  const hasIssues = useCallback((): boolean => {
    return metrics.active_pillars === 0 && metrics.total_pillars > 0;
  }, [metrics.active_pillars, metrics.total_pillars]);

  // 🎯 PUBLIC API
  return {
    // Core data
    metrics,
    pathEntries,
    pillarProgress,
    activeJourneys,
    completedJourneys,
    
    // Loading states
    loading,
    lastRefresh,
    
    // Actions
    refreshAllData,
    getPillarData,
    
    // UI helpers
    isHealthy: isHealthy(),
    hasIssues: hasIssues(),
    
    // Individual loaders for granular control
    pathLoading,
    pillarLoading,
    journeyLoading
  };
};