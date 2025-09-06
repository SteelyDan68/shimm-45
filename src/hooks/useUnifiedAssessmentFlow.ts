/**
 * 🎯 UNIFIED ASSESSMENT FLOW HOOK - SPRINT 1 KRITISK FIX  
 * Ersätter fragmenterade assessment hooks med unified data flow
 * Integrerar UniversalAssessmentProcessor för pedagogisk output
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { UniversalAssessmentProcessor, AssessmentInput, PedagogicalOutput } from '@/services/UniversalAssessmentProcessor';

export interface UnifiedAssessmentResult {
  success: boolean;
  assessmentRoundId?: string;
  pedagogicalOutput?: PedagogicalOutput;
  error?: string;
}

export const useUnifiedAssessmentFlow = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<UnifiedAssessmentResult | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  /**
   * 🎯 SUBMIT ASSESSMENT - Unified entry point för alla assessments
   */
  const submitAssessment = useCallback(async (
    pillarType: string,
    assessmentData: Record<string, any>,
    scores: Record<string, number>,
    comments?: string
  ): Promise<UnifiedAssessmentResult> => {
    if (!user) {
      const error = 'Ingen användare inloggad';
      toast({
        title: "Autentiseringsfel",
        description: error,
        variant: "destructive"
      });
      return { success: false, error };
    }

    setIsProcessing(true);
    
    try {
      console.log(`🚀 Starting unified assessment flow for ${pillarType}`);

      // Create assessment input for universal processor
      const assessmentInput: AssessmentInput = {
        userId: user.id,
        pillarType,
        assessmentData,
        scores,
        comments
      };

      // Process through Universal Assessment Processor
      const result = await UniversalAssessmentProcessor.processAssessmentToPedagogicalOutput(
        assessmentInput
      );

      if (!result.success) {
        throw new Error(result.error || 'Assessment processing failed');
      }

      // Success feedback according to UX policies
      const successResult: UnifiedAssessmentResult = {
        success: true,
        pedagogicalOutput: result.output
      };

      setLastResult(successResult);

      // UX Policy: NEVER LEAVE USER HANGING - Clear success feedback
      toast({
        title: "🎉 Assessment Slutförd!",
        description: `Din ${pillarType} bedömning har analyserats och din personliga utvecklingsplan är klar.`,
        duration: 6000
      });

      // UX Policy: PEDAGOGICAL GUIDANCE - Show next steps
      if (result.output?.actionPlan.immediate.length) {
        setTimeout(() => {
          toast({
            title: "📋 Nästa Steg",
            description: `Börja idag: ${result.output!.actionPlan.immediate[0]}`,
            duration: 8000
          });
        }, 2000);
      }

      // UX Policy: PROGRESS FEEDBACK - Show where they are in journey  
      if (result.output?.pedagogicalGuidance.nextMilestones.length) {
        setTimeout(() => {
          toast({
            title: "🎯 Ditt Mål",
            description: `Nästa milstolpe: ${result.output!.pedagogicalGuidance.nextMilestones[0]}`,
            duration: 10000
          });
        }, 4000);
      }

      console.log('✅ Unified assessment flow completed successfully');
      return successResult;

    } catch (error) {
      console.error('❌ Unified assessment flow failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Okänt fel uppstod';
      const errorResult: UnifiedAssessmentResult = {
        success: false,
        error: errorMessage
      };

      setLastResult(errorResult);

      // UX Policy: EMOTIONAL DESIGN - Empathetic error handling
      toast({
        title: "Assessment temporärt otillgänglig",
        description: "Vi arbetar med att lösa problemet. Dina svar är sparade och du kan fortsätta senare.",
        variant: "destructive",
        duration: 8000
      });

      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, [user, toast]);

  /**
   * 📊 GET ASSESSMENT RESULTS - Hämta pedagogisk output
   */
  const getAssessmentResults = useCallback(async (
    pillarType: string
  ): Promise<PedagogicalOutput | null> => {
    if (!user) return null;

    try {
      // Get latest assessment round for this pillar
      const { data: assessmentData, error } = await (await import('@/integrations/supabase/client')).supabase
        .from('assessment_rounds')
        .select('ai_analysis')
        .eq('user_id', user.id)
        .eq('pillar_type', pillarType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !assessmentData?.ai_analysis) {
        return null;
      }

      // Parse pedagogical output
      return JSON.parse(assessmentData.ai_analysis);
    } catch (error) {
      console.error('Error getting assessment results:', error);
      return null;
    }
  }, [user]);

  /**
   * 📈 GET PROGRESS OVERVIEW - Unified progress tracking
   */
  const getProgressOverview = useCallback(async () => {
    if (!user) return null;

    try {
      // Get all completed assessments
      const { data: assessments, error } = await (await import('@/integrations/supabase/client')).supabase
        .from('assessment_rounds')
        .select('pillar_type, scores, created_at, ai_analysis')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate overall progress
      const pillarProgress = assessments?.reduce((acc, assessment) => {
        const pillar = assessment.pillar_type;
        const scores = assessment.scores as any;
        const overallScore = scores?.overall || 0;
        
        if (!acc[pillar] || new Date(assessment.created_at) > new Date(acc[pillar].lastAssessment)) {
          acc[pillar] = {
            score: overallScore,
            lastAssessment: assessment.created_at,
            hasPedagogicalOutput: !!assessment.ai_analysis
          };
        }
        return acc;
      }, {} as Record<string, any>) || {};

      const completedPillars = Object.keys(pillarProgress).length;
      const avgScore = Object.values(pillarProgress)
        .reduce((sum: number, pillar: any) => sum + (pillar.score || 0), 0) / completedPillars || 0;

      return {
        completedAssessments: assessments?.length || 0,
        completedPillars,
        averageScore: Math.round(avgScore * 10) / 10,
        pillarProgress,
        lastActivity: assessments?.[0]?.created_at
      };
    } catch (error) {
      console.error('Error getting progress overview:', error);
      return null;
    }
  }, [user]);

  /**
   * 🎯 VALIDATE ASSESSMENT READINESS - Check if user is ready for assessment
   */
  const validateAssessmentReadiness = useCallback(async (pillarType: string) => {
    if (!user) return { ready: false, reason: 'Ingen användare inloggad' };

    try {
      // Check if recent assessment exists (within 7 days)
      const { data: recentAssessment } = await (await import('@/integrations/supabase/client')).supabase
        .from('assessment_rounds')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('pillar_type', pillarType)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .single();

      if (recentAssessment) {
        return {
          ready: false,
          reason: 'Du har redan genomfört denna assessment inom en vecka. Vänta tills nästa vecka för bäst utvecklingsspårning.'
        };
      }

      return { ready: true, reason: 'Redo för assessment' };
    } catch (error) {
      // No recent assessment found - ready to proceed
      return { ready: true, reason: 'Redo för assessment' };
    }
  }, [user]);

  return {
    // States
    isProcessing,
    lastResult,
    
    // Actions  
    submitAssessment,
    getAssessmentResults,
    getProgressOverview,
    validateAssessmentReadiness,
    
    // Reset state
    clearLastResult: () => setLastResult(null)
  };
};