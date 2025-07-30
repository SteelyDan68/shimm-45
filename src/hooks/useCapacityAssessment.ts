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

      // Hämta senaste pillar assessment för self_care (den som innehåller alla frågor nu)
      const { data: pillarAssessments, error } = await supabase
        .from('pillar_assessments')
        .select('*')
        .eq('client_id', clientId)
        .eq('pillar_key', 'self_care')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!pillarAssessments || pillarAssessments.length === 0) {
        setCapacityData(null);
        return;
      }

      const latestAssessment = pillarAssessments[0];
      
      // Parse assessment responses
      let functionalAccessCount = 0;
      let subjectiveOpportunitiesAvg = 0;
      let hasRegularSupport = false;

      if (latestAssessment.assessment_data) {
        const responses = latestAssessment.assessment_data as Record<string, any>;
        
        // Count functional access "ja" responses (questions 14-17)
        const functionalQuestions = ['praktisk_hjalp', 'emotionellt_stod', 'kunskapsstod', 'fysisk_narvaro'];
        functionalAccessCount = functionalQuestions.filter(q => responses[q] === 'ja').length;

        // Calculate subjective opportunities average (questions 18-21)
        const opportunityQuestions = ['egen_tid', 'energi', 'motivation', 'framtidstro'];
        const opportunityScores = opportunityQuestions.map(q => responses[q] || 0).filter(score => score > 0);
        if (opportunityScores.length > 0) {
          subjectiveOpportunitiesAvg = opportunityScores.reduce((a, b) => a + b, 0) / opportunityScores.length;
        }

        // Check relationship support (question 22)
        hasRegularSupport = responses['prata_med_regelbundet'] === 'ja';
      }

      setCapacityData({
        functionalAccessCount,
        subjectiveOpportunitiesAvg: Math.round(subjectiveOpportunitiesAvg * 10) / 10,
        hasRegularSupport,
        assessmentDate: latestAssessment.created_at
      });

    } catch (error: any) {
      console.error('Error fetching capacity assessment:', error);
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