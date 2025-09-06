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
      // 🎯 SPRINT 1 FIX: Use UniversalAssessmentProcessor instead of fragmented approach
      console.log('🚀 Using Universal Assessment Processor for insight assessment');

      const { UniversalAssessmentProcessor } = await import('@/services/UniversalAssessmentProcessor');
      
      const result = await UniversalAssessmentProcessor.processAssessmentToPedagogicalOutput({
        userId: clientId || '',
        pillarType: 'insight_assessment',
        assessmentData: {
          scores: assessmentData.scores,
          functionalAccess: assessmentData.functionalAccess,
          subjectiveOpportunities: assessmentData.subjectiveOpportunities,
          relationships: assessmentData.relationships,
          comments: assessmentData.comments
        },
        scores: assessmentData.scores,
        comments: assessmentData.comments
      });

      if (!result.success) {
        throw new Error(result.error || 'Universal assessment processing failed');
      }

      // ✅ SPRINT 1 SUCCESS: Universal processor handled everything
      const assessmentResult: AssessmentResult = {
        analysis: result.output?.analysis || 'Assessment processed successfully',
        assessment_scores: assessmentData.scores,
        comments: assessmentData.comments
      };

      setLastResult(assessmentResult);

      // UX POLICY COMPLIANCE: Clear success feedback with next steps
      toast({
        title: "🎉 Självskattning Slutförd!",
        description: "Din personliga analys med pedagogisk utvecklingsplan är nu klar!"
      });

      // Show immediate next step if available
      if (result.output?.actionPlan.immediate.length) {
        setTimeout(() => {
          toast({
            title: "📋 Börja Idag",
            description: result.output!.actionPlan.immediate[0],
            duration: 8000
          });
        }, 2000);
      }

      console.log('✅ Insight Assessment completed with Universal Processor');
      return assessmentResult;

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