import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WelcomeAssessmentData, WelcomeAssessmentResult } from '@/types/welcomeAssessment';
import { useToast } from '@/hooks/use-toast';

export const useWelcomeAssessment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitWelcomeAssessment = useCallback(async (
    assessmentData: WelcomeAssessmentData,
    isDraft: boolean = false
  ): Promise<WelcomeAssessmentResult | null> => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att göra bedömningen",
        variant: "destructive",
      });
      return null;
    }

    setSubmitting(true);
    try {
      // Om det är ett utkast, spara bara utan AI-analys
      if (isDraft) {
        // För utkast - spara bara utan AI-analys
        console.log('Saving draft...');
        return null; // Vi behöver inte spara utkast för nu
      }
      // First, call the AI analysis function
      const { data: aiResult, error: aiError } = await supabase.functions.invoke(
        'analyze-welcome-assessment',
        {
          body: {
            user_id: user.id,
            assessment_data: assessmentData,
          },
        }
      );

      if (aiError) {
        console.error('AI analysis error:', aiError);
        toast({
          title: "AI-analys misslyckades",
          description: "Bedömningen sparades men utan AI-analys",
          variant: "destructive",
        });
      }

      // Save the assessment to database
      const { data: savedAssessment, error: saveError } = await supabase
        .from('welcome_assessments')
        .insert({
          user_id: user.id,
          wheel_of_life_scores: assessmentData.wheelOfLife,
          adaptive_questions: assessmentData.adaptiveQuestions,
          free_text_responses: assessmentData.freeTextResponses,
          quick_wins: assessmentData.quickWins,
          ai_analysis: aiResult?.analysis || null,
          recommendations: aiResult?.recommendations || {},
          overall_score: aiResult?.overall_score || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (saveError) {
        console.error('Save error:', saveError);
        toast({
          title: "Fel",
          description: "Kunde inte spara bedömningen",
          variant: "destructive",
        });
        return null;
      }

      // Update user journey state  
      await supabase
        .from('user_journey_states')
        .upsert({
          user_id: user.id,
          current_phase: 'ai_analysis_complete',
          completed_assessments: ['welcome'],
          next_recommended_assessment: aiResult?.next_recommended_pillar || 'self_care',
          journey_progress: 25,
          last_activity_at: new Date().toISOString(),
          metadata: {
            welcome_completed_at: new Date().toISOString(),
            ai_analysis_completed_at: new Date().toISOString(),
            lowest_wheel_areas: aiResult?.lowest_areas || [],
            highest_wheel_areas: aiResult?.highest_areas || [],
            assessment_insights_available: true,
          },
        });

      // Create Stefan interaction
      await supabase
        .from('stefan_interactions')
        .insert({
          user_id: user.id,
          interaction_type: 'assessment_completion',
          stefan_persona: 'mentor',
          context_data: {
            assessment_type: 'welcome',
            overall_score: aiResult?.overall_score,
            key_insights: aiResult?.key_insights || [],
          },
          message_content: aiResult?.stefan_message || null,
        });

      toast({
        title: "Bedömning slutförd!",
        description: "Din välkomstbedömning har sparats och analyserats",
      });

      return savedAssessment;
    } catch (error) {
      console.error('Welcome assessment submission error:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel inträffade",
        variant: "destructive",
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [user, toast]);

  const getLatestWelcomeAssessment = useCallback(async (): Promise<WelcomeAssessmentResult | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('welcome_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching welcome assessment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching welcome assessment:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const hasCompletedWelcomeAssessment = useCallback(async (): Promise<boolean> => {
    const assessment = await getLatestWelcomeAssessment();
    return !!assessment;
  }, [getLatestWelcomeAssessment]);

  return {
    loading,
    submitting,
    submitWelcomeAssessment,
    getLatestWelcomeAssessment,
    hasCompletedWelcomeAssessment,
  };
};