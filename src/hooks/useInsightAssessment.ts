import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssessmentScores {
  [key: string]: number;
}

interface AssessmentData {
  scores: AssessmentScores;
  comments?: string;
}

interface AssessmentResult {
  analysis: string;
  assessment_scores: AssessmentScores;
  comments?: string;
}

export const useInsightAssessment = (clientId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<AssessmentResult | null>(null);
  const { toast } = useToast();

  const submitAssessment = async (
    assessmentData: AssessmentData,
    clientName: string,
    clientId?: string
  ): Promise<AssessmentResult | null> => {
    setIsSubmitting(true);

    try {
      // 1. First get AI analysis
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-assessment',
        {
          body: {
            client_id: clientId,
            client_name: clientName,
            assessment_scores: assessmentData.scores,
            comments: assessmentData.comments
          }
        }
      );

      if (analysisError) {
        throw new Error(`AI analys misslyckades: ${analysisError.message}`);
      }

      const aiAnalysis = analysisData.analysis;

      // 2. Create path_entry with assessment data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ingen autentiserad användare');

      const pathEntryData = {
        client_id: clientId,
        created_by: user.id,
        type: 'assessment' as const,
        title: 'Självskattning genomförd',
        details: `Självskattning av hinder inom 13 områden:\n\n${Object.entries(assessmentData.scores)
          .map(([area, score]) => `${area}: ${score}/10`)
          .join('\n')}${assessmentData.comments ? `\n\nKommentarer: ${assessmentData.comments}` : ''}`,
        status: 'completed' as const,
        ai_generated: false,
        timestamp: new Date().toISOString()
      };

      const { error: pathError } = await supabase
        .from('path_entries')
        .insert([pathEntryData]);

      if (pathError) {
        console.error('Path entry error:', pathError);
        throw new Error(`Kunde inte spara assessment: ${pathError.message}`);
      }

      // 3. Create AI-generated path_entry with recommendations
      const aiPathEntryData = {
        client_id: clientId,
        created_by: user.id,
        type: 'recommendation' as const,
        title: 'AI-analys och rekommendationer',
        details: aiAnalysis,
        status: 'planned' as const,
        ai_generated: true,
        timestamp: new Date().toISOString()
      };

      const { error: aiPathError } = await supabase
        .from('path_entries')
        .insert([aiPathEntryData]);

      if (aiPathError) {
        console.error('AI path entry error:', aiPathError);
        // Don't throw here - the assessment is already saved
        toast({
          title: "Varning",
          description: "Assessment sparad men AI-rekommendationer kunde inte sparas",
          variant: "destructive"
        });
      }

      const result: AssessmentResult = {
        analysis: aiAnalysis,
        assessment_scores: assessmentData.scores,
        comments: assessmentData.comments
      };

      setLastResult(result);

      toast({
        title: "Bra jobbat! 🎉",
        description: "Din självskattning är genomförd och din personliga analys är klar!"
      });

      return result;

    } catch (error: any) {
      console.error('Assessment submission error:', error);
      toast({
        title: "Fel vid assessment",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitAssessment,
    isSubmitting,
    lastResult,
    setLastResult
  };
};