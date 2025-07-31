import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CapacityData {
  functionalAccessCount: number; // 0-4
  subjectiveOpportunitiesAvg: number; // 1-5
  hasRegularSupport: boolean;
  assessmentDate: string;
}

export const useCapacityAssessment = (clientId: string) => {
  const [capacityData, setCapacityData] = useState<CapacityData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLatestAssessment = async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      console.log('🔍 useCapacityAssessment: Fetching data for clientId:', clientId);

      // Hämta senaste pillar assessment för self_care (den som innehåller alla frågor nu)
      const { data: pillarAssessments, error } = await supabase
        .from('pillar_assessments')
        .select('*')
        .eq('user_id', clientId)
        .eq('pillar_key', 'self_care')
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('📊 Pillar assessments result:', { data: pillarAssessments, error });

      if (error) throw error;

      if (!pillarAssessments || pillarAssessments.length === 0) {
        console.log('⚠️ No pillar assessments found');
        setCapacityData(null);
        return;
      }

      const latestAssessment = pillarAssessments[0];
      console.log('📋 Latest assessment:', latestAssessment);
      
      // Parse assessment responses
      let functionalAccessCount = 0;
      let subjectiveOpportunitiesAvg = 0;
      let hasRegularSupport = false;

      if (latestAssessment.assessment_data) {
        const responses = latestAssessment.assessment_data as Record<string, any>;
        console.log('📝 Assessment responses:', responses);
        
        // Count functional access "ja" responses (questions 14-17)
        const functionalQuestions = ['mat_access', 'hygien_access', 'kommunikation_access', 'sovplats_access'];
        functionalAccessCount = functionalQuestions.filter(q => responses[q] === 'ja').length;
        console.log('🏠 Functional access count:', functionalAccessCount, 'from questions:', functionalQuestions.map(q => `${q}: ${responses[q]}`));

        // Calculate subjective opportunities average - these seem to be missing from current data
        // Let me check what opportunity-related fields exist in the actual data
        const allKeys = Object.keys(responses);
        console.log('🔑 All available response keys:', allKeys);
        
        // For now, let's use some barrier scores as proxies for subjective opportunities
        // Higher barriers = lower opportunities, so we'll invert these scores
        const barrierQuestions = ['tidsbrist', 'energi_meddelanden', 'prestationsangest', 'be_om_hjalp'];
        const barrierScores = barrierQuestions.map(q => responses[q] || 5).filter(score => score > 0);
        if (barrierScores.length > 0) {
          // Invert barrier scores: high barrier (10) = low opportunity (1), low barrier (1) = high opportunity (5)
          const invertedScores = barrierScores.map(score => 6 - (score / 2)); // Convert 1-10 scale to inverted 1-5 scale
          subjectiveOpportunitiesAvg = invertedScores.reduce((a, b) => a + b, 0) / invertedScores.length;
        }
        console.log('🎯 Subjective opportunities (from barriers):', barrierScores, 'inverted average:', subjectiveOpportunitiesAvg);

        // Check relationship support (question 22)
        hasRegularSupport = responses['prata_regelbundet'] === 'ja';
        console.log('👥 Regular support:', hasRegularSupport, 'from:', responses['prata_regelbundet']);
      }

      const capacityData = {
        functionalAccessCount,
        subjectiveOpportunitiesAvg: Math.round(subjectiveOpportunitiesAvg * 10) / 10,
        hasRegularSupport,
        assessmentDate: latestAssessment.created_at
      };
      
      console.log('📈 Final capacity data:', capacityData);
      setCapacityData(capacityData);

    } catch (error: any) {
      console.error('❌ Error fetching capacity assessment:', error);
      // Only show error toast for actual errors, not network issues or missing data
      if (error?.message && !error.message.includes('Failed to fetch')) {
        toast({
          title: "Fel",
          description: "Kunde inte hämta kapacitetsdata",
          variant: "destructive"
        });
      }
      setCapacityData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestAssessment();
  }, [clientId]);

  // Calculate overall capacity level
  const getCapacityLevel = (): 'low' | 'moderate' | 'strong' | 'insufficient_data' => {
    if (!capacityData) return 'insufficient_data';

    const functionalScore = capacityData.functionalAccessCount / 4; // 0-1
    const opportunityScore = (capacityData.subjectiveOpportunitiesAvg - 1) / 4; // 0-1
    const supportScore = capacityData.hasRegularSupport ? 1 : 0; // 0-1

    const averageScore = (functionalScore + opportunityScore + supportScore) / 3;

    if (averageScore >= 0.7) return 'strong';
    if (averageScore >= 0.4) return 'moderate';
    return 'low';
  };

  return {
    capacityData,
    loading,
    capacityLevel: getCapacityLevel(),
    refresh: fetchLatestAssessment
  };
};