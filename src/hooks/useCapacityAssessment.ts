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

      // Hämta senaste assessment path entry
      const { data: pathEntries, error } = await supabase
        .from('path_entries')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'assessment')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!pathEntries || pathEntries.length === 0) {
        setCapacityData(null);
        return;
      }

      const latestAssessment = pathEntries[0];
      
      // Parse assessment details
      let functionalAccessCount = 0;
      let subjectiveOpportunitiesAvg = 0;
      let hasRegularSupport = false;

      if (latestAssessment.details) {
        // Parse functional access count (antal "ja" svar)
        const functionalMatches = latestAssessment.details.match(/🟠 Funktionstillgång:\n(.*?)(?=\n\n|$)/s);
        if (functionalMatches) {
          const functionalText = functionalMatches[1];
          functionalAccessCount = (functionalText.match(/: ja/gi) || []).length;
        }

        // Parse subjective opportunities average
        const subjectiveMatches = latestAssessment.details.match(/🟣 Subjektiva möjligheter:\n(.*?)(?=\n\n|$)/s);
        if (subjectiveMatches) {
          const subjectiveText = subjectiveMatches[1];
          const scores = subjectiveText.match(/: (\d+)\/5/g);
          if (scores && scores.length > 0) {
            const values = scores.map(s => parseInt(s.match(/(\d+)\/5/)?.[1] || '0'));
            subjectiveOpportunitiesAvg = values.reduce((a, b) => a + b, 0) / values.length;
          }
        }

        // Parse relationship support
        const relationshipMatches = latestAssessment.details.match(/🟢 Relationer:\n(.*?)(?=\n\n|$)/s);
        if (relationshipMatches) {
          const relationshipText = relationshipMatches[1];
          hasRegularSupport = relationshipText.toLowerCase().includes('prata med regelbundet?: ja');
        }
      }

      setCapacityData({
        functionalAccessCount,
        subjectiveOpportunitiesAvg: Math.round(subjectiveOpportunitiesAvg * 10) / 10,
        hasRegularSupport,
        assessmentDate: latestAssessment.timestamp
      });

    } catch (error: any) {
      console.error('Error fetching capacity assessment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta kapacitetsdata",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestAssessment();
  }, [clientId]);

  // Calculate overall capacity level
  const getCapacityLevel = (): 'low' | 'moderate' | 'strong' => {
    if (!capacityData) return 'low';

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