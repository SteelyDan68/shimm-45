import { supabase } from '@/integrations/supabase/client';

interface ConsolidationResult {
  success: boolean;
  assessments_processed: number;
  ai_analyses_generated: number;
  actionables_created: number;
  errors: string[];
}

export const consolidateAssessmentSystems = async (userId: string): Promise<ConsolidationResult> => {
  const result: ConsolidationResult = {
    success: false,
    assessments_processed: 0,
    ai_analyses_generated: 0,
    actionables_created: 0,
    errors: []
  };

  try {
    // 1. Hitta alla assessment_rounds utan AI-analys
    const { data: incompleteRounds, error: queryError } = await supabase
      .from('assessment_rounds')
      .select('*')
      .eq('user_id', userId)
      .is('ai_analysis', null);

    if (queryError) {
      result.errors.push(`Query error: ${queryError.message}`);
      return result;
    }

    console.log(`🔄 Found ${incompleteRounds?.length || 0} incomplete assessment rounds for user ${userId}`);

    // 2. För varje incomplete round, regenerera AI-analys och actionables
    for (const round of incompleteRounds || []) {
        try {
          result.assessments_processed++;

          const scores = round.scores as any || {};
          const calculatedScore = scores?.overall || scores?.[round.pillar_type] || 0;
        // Anropa analyze-pillar-module för att generera AI-analys
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
          'analyze-pillar-module',
          {
            body: {
              pillar_key: round.pillar_type,
              assessment_data: round.answers,
              calculated_score: calculatedScore,
              user_id: userId,
              assessment_round_id: round.id,
              consolidation_mode: true
            }
          }
        );

        if (aiError) {
          result.errors.push(`AI analysis failed for ${round.pillar_type}: ${aiError.message}`);
          continue;
        }

        if (aiResponse?.analysis) {
          // Uppdatera assessment_rounds med AI-analys
          const { error: updateError } = await supabase
            .from('assessment_rounds')
            .update({ ai_analysis: aiResponse.analysis })
            .eq('id', round.id);

          if (!updateError) {
            result.ai_analyses_generated++;

            // Skapa path_entry för synlighet i UserAnalytics
            await supabase
              .from('path_entries')
              .insert({
                user_id: userId,
                created_by: userId,
                type: 'recommendation',
                title: `${round.pillar_type} Assessment AI-Analys (Konsoliderad)`,
                details: aiResponse.analysis,
                ai_generated: true,
                timestamp: new Date().toISOString(),
                metadata: {
                  pillar_type: round.pillar_type,
                  assessment_score: calculatedScore,
                  assessment_round_id: round.id,
                  consolidation_regenerated: true
                }
              });

            // Generera actionables via enhanced-ai-planning
            try {
              const { error: actionableError } = await supabase.functions.invoke(
                'enhanced-ai-planning',
                {
                  body: {
                    user_id: userId,
                    preferences: {
                      intensity: 'moderate',
                      duration: 4,
                      frequency: 'few-times-week'
                    },
                    assessment_data: round.answers,
                    context_data: {
                      pillar_focus: round.pillar_type,
                      assessment_score: calculatedScore,
                      ai_analysis: aiResponse.analysis,
                      consolidation_mode: true
                    }
                  }
                }
              );

              if (!actionableError) {
                result.actionables_created++;
              } else {
                result.errors.push(`Actionables failed for ${round.pillar_type}: ${actionableError.message}`);
              }
            } catch (actionableErr) {
              result.errors.push(`Actionables error for ${round.pillar_type}: ${actionableErr}`);
            }
          } else {
            result.errors.push(`Update failed for ${round.pillar_type}: ${updateError.message}`);
          }
        }
      } catch (roundError) {
        result.errors.push(`Processing failed for ${round.pillar_type}: ${roundError}`);
      }
    }

    result.success = result.assessments_processed > 0 && result.errors.length === 0;
    
    console.log('🎯 Consolidation complete:', result);
    return result;

  } catch (error) {
    result.errors.push(`Critical error: ${error}`);
    console.error('💥 Consolidation failed:', error);
    return result;
  }
};