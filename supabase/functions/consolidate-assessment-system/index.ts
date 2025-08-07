import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('userId is required');
    }

    console.log('🔄 Starting consolidation for user:', userId);

    // Hitta assessment rounds som saknar AI-analys
    const { data: incompleteAssessments, error: fetchError } = await supabaseClient
      .from('assessment_rounds')
      .select('id, user_id, pillar_type, answers, scores')
      .eq('user_id', userId)
      .or('ai_analysis.is.null,ai_analysis.eq.')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching incomplete assessments:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${incompleteAssessments?.length || 0} incomplete assessments`);

    let processedCount = 0;
    let errors: string[] = [];

    for (const assessment of incompleteAssessments || []) {
      try {
        console.log(`🔄 Processing assessment ${assessment.id} (${assessment.pillar_type})`);

        // Anropa AI-analysering
        const analysisResponse = await supabaseClient.functions.invoke('analyze-pillar-module', {
          body: {
            pillar_type: assessment.pillar_type,
            user_id: assessment.user_id,
            answers: assessment.answers,
            scores: assessment.scores
          }
        });

        if (analysisResponse.error) {
          console.error(`❌ AI analysis failed for ${assessment.id}:`, analysisResponse.error);
          errors.push(`AI analysis failed for ${assessment.pillar_type}: ${analysisResponse.error.message}`);
          continue;
        }

        // Skapa actionables
        const actionablesResponse = await supabaseClient.functions.invoke('enhanced-ai-planning', {
          body: {
            user_id: assessment.user_id,
            pillar_type: assessment.pillar_type,
            assessment_scores: assessment.scores,
            ai_analysis: analysisResponse.data?.ai_analysis || 'Analysis completed'
          }
        });

        if (actionablesResponse.error) {
          console.warn(`⚠️ Actionables creation failed for ${assessment.id}:`, actionablesResponse.error);
          // Detta är inte kritiskt, fortsätt ändå
        }

        processedCount++;
        console.log(`✅ Successfully processed assessment ${assessment.id}`);

      } catch (error: any) {
        console.error(`❌ Error processing assessment ${assessment.id}:`, error);
        errors.push(`Failed to process ${assessment.pillar_type}: ${error.message}`);
      }
    }

    const result = {
      success: true,
      processedCount,
      totalIncomplete: incompleteAssessments?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processed ${processedCount} of ${incompleteAssessments?.length || 0} incomplete assessments`
    };

    console.log('✅ Consolidation complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Consolidation failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to consolidate assessment system'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});