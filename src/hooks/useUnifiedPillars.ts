import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type PillarKey = 'self_care' | 'economy' | 'career' | 'relationships' | 'fun_recreation' | 'physical_environment';

export interface PillarDefinition {
  key: PillarKey;
  name: string;
  description: string;
  icon: string;
  color: string;
  questions: PillarQuestion[];
  maxScore: number;
}

export interface PillarQuestion {
  id: string;
  text: string;
  type: 'scale' | 'boolean' | 'text';
  weight: number;
  options?: string[];
}

export interface PillarActivation {
  pillar_key: PillarKey;
  user_id: string;
  is_active: boolean;
  activated_at: string;
  activated_by: string;
  deactivated_at?: string;
  settings?: any;
}

export interface PillarAssessment {
  id: string;
  user_id: string;
  pillar_key: PillarKey;
  answers: Record<string, any>;
  scores: Record<string, number>;
  total_score: number;
  completed_at: string;
  ai_analysis?: string;
}

export interface PillarProgress {
  pillar_key: PillarKey;
  current_score: number;
  previous_score?: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  last_assessment: string;
  assessment_count: number;
}

const PILLAR_DEFINITIONS: Record<PillarKey, PillarDefinition> = {
  self_care: {
    key: 'self_care',
    name: 'Egenvård',
    description: 'Din fysiska och mentala hälsa',
    icon: 'Heart',
    color: 'bg-pink-500',
    maxScore: 10,
    questions: [
      { id: 'sleep', text: 'Hur nöjd är du med din sömnkvalitet?', type: 'scale', weight: 1.2 },
      { id: 'exercise', text: 'Hur ofta tränar du per vecka?', type: 'scale', weight: 1.0 },
      { id: 'nutrition', text: 'Hur bra känns din kost?', type: 'scale', weight: 1.1 },
      { id: 'stress', text: 'Hur väl hanterar du stress?', type: 'scale', weight: 1.3 },
      { id: 'mindfulness', text: 'Ägnar du tid åt reflektion/meditation?', type: 'boolean', weight: 0.8 }
    ]
  },
  economy: {
    key: 'economy',
    name: 'Ekonomi',
    description: 'Din ekonomiska situation och framtidsplanering',
    icon: 'DollarSign',
    color: 'bg-green-500',
    maxScore: 10,
    questions: [
      { id: 'budget', text: 'Har du kontroll på din budget?', type: 'scale', weight: 1.2 },
      { id: 'savings', text: 'Sparar du regelbundet?', type: 'scale', weight: 1.1 },
      { id: 'debt', text: 'Hur hanterar du eventuella skulder?', type: 'scale', weight: 1.3 },
      { id: 'financial_goals', text: 'Har du tydliga ekonomiska mål?', type: 'scale', weight: 1.0 },
      { id: 'investment', text: 'Investerar du för framtiden?', type: 'boolean', weight: 0.9 }
    ]
  },
  career: {
    key: 'career',
    name: 'Karriär',
    description: 'Din professionella utveckling och arbetsliv',
    icon: 'Briefcase',
    color: 'bg-blue-500',
    maxScore: 10,
    questions: [
      { id: 'job_satisfaction', text: 'Hur nöjd är du med ditt arbete?', type: 'scale', weight: 1.3 },
      { id: 'growth', text: 'Utvecklas du professionellt?', type: 'scale', weight: 1.1 },
      { id: 'work_life_balance', text: 'Hur är balansen mellan arbete och fritid?', type: 'scale', weight: 1.2 },
      { id: 'skills', text: 'Utvecklar du nya kompetenser?', type: 'scale', weight: 1.0 },
      { id: 'network', text: 'Bygger du professionella relationer?', type: 'boolean', weight: 0.8 }
    ]
  },
  relationships: {
    key: 'relationships',
    name: 'Relationer',
    description: 'Dina förhållanden med familj, vänner och partner',
    icon: 'Users',
    color: 'bg-purple-500',
    maxScore: 10,
    questions: [
      { id: 'family', text: 'Hur starka är dina familjeband?', type: 'scale', weight: 1.2 },
      { id: 'friends', text: 'Hur nöjd är du med dina vänskaper?', type: 'scale', weight: 1.1 },
      { id: 'romantic', text: 'Hur mår din kärleksrelation?', type: 'scale', weight: 1.3 },
      { id: 'social_life', text: 'Är du aktiv socialt?', type: 'scale', weight: 1.0 },
      { id: 'communication', text: 'Kommunicerar du öppet?', type: 'boolean', weight: 0.9 }
    ]
  },
  fun_recreation: {
    key: 'fun_recreation',
    name: 'Nöje & Rekreation',
    description: 'Dina hobbyer, intressen och fritidsaktiviteter',
    icon: 'Gamepad2',
    color: 'bg-orange-500',
    maxScore: 10,
    questions: [
      { id: 'hobbies', text: 'Ägnar du tid åt hobbyer?', type: 'scale', weight: 1.1 },
      { id: 'creativity', text: 'Uttrycker du din kreativitet?', type: 'scale', weight: 1.0 },
      { id: 'travel', text: 'Reser och utforskar du?', type: 'scale', weight: 0.9 },
      { id: 'entertainment', text: 'Njuter du av underhållning?', type: 'scale', weight: 0.8 },
      { id: 'new_experiences', text: 'Söker du nya upplevelser?', type: 'boolean', weight: 1.2 }
    ]
  },
  physical_environment: {
    key: 'physical_environment',
    name: 'Fysisk Miljö',
    description: 'Ditt hem, arbetsplats och omgivning',
    icon: 'Home',
    color: 'bg-teal-500',
    maxScore: 10,
    questions: [
      { id: 'home_comfort', text: 'Trivs du hemma?', type: 'scale', weight: 1.2 },
      { id: 'organization', text: 'Är ditt hem organiserat?', type: 'scale', weight: 1.0 },
      { id: 'workspace', text: 'Fungerar din arbetsplats bra?', type: 'scale', weight: 1.1 },
      { id: 'neighborhood', text: 'Gillar du ditt område?', type: 'scale', weight: 0.9 },
      { id: 'nature_access', text: 'Har du tillgång till natur?', type: 'boolean', weight: 0.8 }
    ]
  }
};

export const useUnifiedPillars = (userId?: string) => {
  const [activations, setActivations] = useState<PillarActivation[]>([]);
  const [assessments, setAssessments] = useState<PillarAssessment[]>([]);
  const [progress, setProgress] = useState<PillarProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get pillar definitions
  const getPillarDefinitions = useCallback(() => {
    return PILLAR_DEFINITIONS;
  }, []);

  // Fetch user's pillar data - CRITICAL FIX: Use path_entries instead of user_attributes
  const fetchPillarData = useCallback(async (targetUserId?: string) => {
    if (!targetUserId && !userId) return;
    
    const fetchUserId = targetUserId || userId;
    setLoading(true);

    try {
      // Get pillar assessments from path_entries (REAL DATA)
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', fetchUserId!)
        .eq('type', 'assessment')
        .order('created_at', { ascending: false });

      if (assessmentError) throw assessmentError;

      // Get pillar activations from path_entries
      const { data: activationData, error: activationError } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', fetchUserId!)
        .eq('type', 'action')
        .ilike('title', '%pelare:%')
        .order('created_at', { ascending: false });

      if (activationError) throw activationError;

      // Convert to expected format
      const processedActivations: PillarActivation[] = (activationData || []).map(entry => ({
        pillar_key: (entry.metadata as any)?.pillar_key,
        user_id: entry.user_id,
        is_active: (entry.metadata as any)?.action === 'activate',
        activated_at: entry.created_at,
        activated_by: entry.created_by,
        settings: {}
      })).filter(a => a.pillar_key);

      const processedAssessments: PillarAssessment[] = (assessmentData || []).map(entry => ({
        id: entry.id,
        user_id: entry.user_id,
        pillar_key: (entry.metadata as any)?.pillar_key,
        answers: (entry.metadata as any)?.assessment_data || {},
        scores: {},
        total_score: (entry.metadata as any)?.assessment_score || 0,
        completed_at: entry.created_at,
        ai_analysis: entry.content || undefined
      })).filter(a => a.pillar_key);

      setActivations(processedActivations);
      setAssessments(processedAssessments);

      // Calculate progress from real assessments
      const progressData = calculateProgress(processedAssessments);
      setProgress(progressData);

    } catch (error) {
      console.error('Error fetching pillar data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta pillar-data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Calculate progress from assessments
  const calculateProgress = useCallback((assessmentData: PillarAssessment[]): PillarProgress[] => {
    const progressMap: Record<PillarKey, PillarProgress> = {} as any;

    Object.keys(PILLAR_DEFINITIONS).forEach(pillarKey => {
      const pillarAssessments = assessmentData
        .filter(a => a.pillar_key === pillarKey as PillarKey)
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

      if (pillarAssessments.length > 0) {
        const latest = pillarAssessments[0];
        const previous = pillarAssessments[1];
        
        const change = previous ? latest.total_score - previous.total_score : 0;
        const trend = change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable';

        progressMap[pillarKey as PillarKey] = {
          pillar_key: pillarKey as PillarKey,
          current_score: latest.total_score,
          previous_score: previous?.total_score,
          trend,
          change,
          last_assessment: latest.completed_at,
          assessment_count: pillarAssessments.length
        };
      }
    });

    return Object.values(progressMap);
  }, []);

  // Activate pillar for user - FIXED to use path_entries
  const activatePillar = useCallback(async (targetUserId: string, pillarKey: PillarKey) => {
    try {
      const { error } = await supabase
        .from('path_entries')
        .insert({
          user_id: targetUserId,
          created_by: targetUserId,
          timestamp: new Date().toISOString(),
          type: 'action',
          title: `Aktiverad pelare: ${pillarKey}`,
          details: `Pelare ${pillarKey} aktiverad för utvecklingsresa`,
          status: 'completed',
          ai_generated: false,
          visible_to_client: true,
          metadata: {
            pillar_key: pillarKey,
            action: 'activate',
            activated_at: new Date().toISOString()
          }
        });

      if (error) throw error;
      
      await fetchPillarData(targetUserId);
      toast({
        title: "Pillar aktiverad",
        description: `${PILLAR_DEFINITIONS[pillarKey].name} har aktiverats`
      });

      return true;
    } catch (error) {
      console.error('Error activating pillar:', error);
      toast({
        title: "Fel",
        description: "Kunde inte aktivera pillar",
        variant: "destructive"
      });
      return false;
    }
  }, [fetchPillarData, toast]);

  // Deactivate pillar - FIXED to use path_entries
  const deactivatePillar = useCallback(async (targetUserId: string, pillarKey: PillarKey) => {
    try {
      const { error } = await supabase
        .from('path_entries')
        .insert({
          user_id: targetUserId,
          created_by: targetUserId,
          timestamp: new Date().toISOString(),
          type: 'action',
          title: `Deaktiverad pelare: ${pillarKey}`,
          details: `Pelare ${pillarKey} deaktiverad`,
          status: 'completed',
          ai_generated: false,
          visible_to_client: true,
          metadata: {
            pillar_key: pillarKey,
            action: 'deactivate',
            deactivated_at: new Date().toISOString()
          }
        });

      if (error) throw error;
      
      await fetchPillarData(targetUserId);
      toast({
        title: "Pillar inaktiverad",
        description: `${PILLAR_DEFINITIONS[pillarKey].name} har inaktiverats`
      });

      return true;
    } catch (error) {
      console.error('Error deactivating pillar:', error);
      return false;
    }
  }, [fetchPillarData, toast]);

  // Submit assessment - FIXED to use path_entries
  const submitAssessment = useCallback(async (
    targetUserId: string,
    pillarKey: PillarKey,
    answers: Record<string, any>
  ) => {
    try {
      const pillarDef = PILLAR_DEFINITIONS[pillarKey];
      const scores: Record<string, number> = {};
      let totalScore = 0;

      // Calculate scores
      pillarDef.questions.forEach(question => {
        const answer = answers[question.id];
        let score = 0;

        if (question.type === 'scale') {
          score = (answer || 0) * question.weight;
        } else if (question.type === 'boolean') {
          score = answer ? 5 * question.weight : 0;
        }

        scores[question.id] = score;
        totalScore += score;
      });

      // Normalize to 0-10 scale
      const maxPossibleScore = pillarDef.questions.reduce((sum, q) => 
        sum + (q.type === 'scale' ? 10 : 5) * q.weight, 0
      );
      totalScore = (totalScore / maxPossibleScore) * 10;

      const { error } = await supabase
        .from('path_entries')
        .insert({
          user_id: targetUserId,
          created_by: targetUserId,
          timestamp: new Date().toISOString(),
          type: 'assessment',
          title: `Bedömning: ${pillarKey}`,
          details: `Slutförd bedömning för pelare ${pillarKey}`,
          status: 'completed',
          ai_generated: false,
          visible_to_client: true,
          metadata: {
            pillar_key: pillarKey,
            assessment_score: totalScore,
            assessment_data: answers,
            insights: {},
            completed: true
          }
        });

      if (error) throw error;
      
      await fetchPillarData(targetUserId);
      toast({
        title: "Bedömning slutförd",
        description: `Din bedömning för ${pillarDef.name} har sparats`
      });

      return true;
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara bedömning",
        variant: "destructive"
      });
      return false;
    }
  }, [fetchPillarData, toast]);

  // Check if pillar is active
  const isPillarActive = useCallback((pillarKey: PillarKey) => {
    return activations.some(a => a.pillar_key === pillarKey && a.is_active);
  }, [activations]);

  // Get latest assessment for pillar
  const getLatestAssessment = useCallback((pillarKey: PillarKey) => {
    return assessments
      .filter(a => a.pillar_key === pillarKey)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
  }, [assessments]);

  // Get progress for pillar
  const getPillarProgress = useCallback((pillarKey: PillarKey) => {
    return progress.find(p => p.pillar_key === pillarKey);
  }, [progress]);

  // Initialize on component mount
  useEffect(() => {
    if (userId) {
      fetchPillarData(userId);
    }
  }, [userId, fetchPillarData]);

  return {
    pillarDefinitions: PILLAR_DEFINITIONS,
    activations,
    assessments,
    progress,
    loading,
    getPillarDefinitions,
    activatePillar,
    deactivatePillar,
    submitAssessment,
    isPillarActive,
    getLatestAssessment,
    getPillarProgress,
    refetch: fetchPillarData
  };
};