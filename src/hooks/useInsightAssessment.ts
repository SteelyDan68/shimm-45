import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssessmentScores {
  [key: string]: number;
}

interface AssessmentData {
  scores: AssessmentScores;
  comments?: string;
  functionalAccess?: Record<string, string>;
  subjectiveOpportunities?: Record<string, number>;
  relationships?: Record<string, { answer: string; comment: string }>;
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
            comments: assessmentData.comments,
            functional_access: assessmentData.functionalAccess,
            subjective_opportunities: assessmentData.subjectiveOpportunities,
            relationships: assessmentData.relationships
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

      // Format assessment details including all sections
      let assessmentDetails = `Självskattning av hinder inom 13 områden:\n\n${Object.entries(assessmentData.scores)
        .map(([area, score]) => `${area}: ${score}/10`)
        .join('\n')}`;

      if (assessmentData.functionalAccess) {
        assessmentDetails += `\n\n🟠 Funktionstillgång:\n${Object.entries(assessmentData.functionalAccess)
          .map(([question, answer]) => `${question}: ${answer}`)
          .join('\n')}`;
      }

      if (assessmentData.subjectiveOpportunities) {
        assessmentDetails += `\n\n🟣 Subjektiva möjligheter:\n${Object.entries(assessmentData.subjectiveOpportunities)
          .map(([question, score]) => `${question}: ${score}/5`)
          .join('\n')}`;
      }

      if (assessmentData.relationships) {
        assessmentDetails += `\n\n🟢 Relationer:\n${Object.entries(assessmentData.relationships)
          .map(([question, data]) => `${question}: ${data.answer}${data.comment ? ` (${data.comment})` : ''}`)
          .join('\n')}`;
      }

      if (assessmentData.comments) {
        assessmentDetails += `\n\nKommentarer: ${assessmentData.comments}`;
      }

      const pathEntryData = {
        client_id: clientId,
        created_by: user.id,
        type: 'assessment' as const,
        title: 'Självskattning genomförd',
        details: assessmentDetails,
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