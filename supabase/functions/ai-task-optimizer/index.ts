import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id,
      assessment_data,
      current_actionables,
      optimization_type
    } = await req.json();

    if (!user_id) {
      throw new Error('Missing required field: user_id');
    }

    console.log('🎯 AI Task Optimizer för user:', user_id);
    console.log('📊 Current actionables count:', current_actionables?.length || 0);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hämta nuvarande uppgifter
    const { data: existingTasks } = await supabase
      .from('calendar_actionables')
      .select('*')
      .eq('user_id', user_id)
      .eq('completion_status', 'pending');

    const activeTasks = existingTasks || [];
    
    // Kontrollera om användaren har för många aktiva uppgifter
    if (activeTasks.length > 15) {
      console.log('🚨 För många aktiva uppgifter:', activeTasks.length);
      
      // Skjut upp låg-prioritetsuppgifter
      const lowPriorityTasks = activeTasks
        .filter(t => t.priority === 'low')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(0, Math.max(1, activeTasks.length - 12));

      for (const task of lowPriorityTasks) {
        await supabase
          .from('calendar_actionables')
          .update({ 
            completion_status: 'deferred',
            user_notes: `Automatiskt uppskjuten för att minska kognitiv belastning - ${new Date().toLocaleDateString('sv-SE')}`
          })
          .eq('id', task.id);
      }

      console.log('✅ Uppskjöt', lowPriorityTasks.length, 'låg-prioritetsuppgifter');
    }

    // AI-baserad prioritering baserat på assessment data
    if (assessment_data && assessment_data.length > 0) {
      const systemPrompt = `Du är Stefan, en AI-coach som optimerar uppgiftsprioriteringar baserat på neuroplastiska principer och användarens assessment-resultat.

NEUROPLASTISKA PRINCIPER FÖR PRIORITERING:
- 60/40 Regel: 60% bekväma uppgifter, 40% utmanande
- Gradual progression: Höj svårighetsgraden stegvis
- Cognitive load management: Max 10-12 aktiva uppgifter samtidigt
- Success momentum: Prioritera uppgifter som bygger självförtroende

ASSESSMENT CONTEXT:
${assessment_data.map(a => `- ${a.pillar_type}: Score ${JSON.stringify(a.scores)} - ${a.ai_analysis?.substring(0, 150)}...`).join('\n')}`;

      const userPrompt = `Analysera och optimera prioriteringar för ${activeTasks.length} aktiva uppgifter.

NUVARANDE UPPGIFTER (efter reduktion):
${activeTasks.slice(0, 15).map(t => `- ID: ${t.id}, Title: "${t.title}", Priority: ${t.priority}, Pillar: ${t.pillar_key}`).join('\n')}

OPTIMERINGSREGLER:
1. Basera prioritering på assessment-scores (låga scores = högre prioritet)
2. Balansera: Max 30% hög prioritet, 40% medium, 30% låg
3. Säkerställ neuroplastisk balans (60% bekväma, 40% utmanande)
4. Fokusera på utvecklingsområden som har störst påverkan

Returnera ENDAST giltig JSON:
{
  "updated_priorities": [
    {
      "actionable_id": "uuid-här",
      "new_priority": "high|medium|low",
      "reasoning": "Kortfattad förklaring baserat på assessment"
    }
  ],
  "optimization_summary": "Sammanfattning av gjorda optimeringar"
}`;

      const availability = await aiService.checkAvailability();
      if (availability.openai || availability.gemini) {
        const aiResponse = await aiService.generateResponse([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ], {
          maxTokens: 2000,
          temperature: 0.3,
          model: 'gpt-4o-mini'
        });

        if (aiResponse.success) {
          try {
            const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const optimizationResult = JSON.parse(jsonMatch[0]);
              
              console.log('✅ AI Prioritering klar:', optimizationResult.optimization_summary);
              
              return new Response(JSON.stringify({
                success: true,
                updated_priorities: optimizationResult.updated_priorities || [],
                summary: optimizationResult.optimization_summary,
                tasks_deferred: lowPriorityTasks?.length || 0,
                active_tasks_count: Math.min(activeTasks.length, 12)
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          } catch (parseError) {
            console.error('Parse error:', parseError);
          }
        }
      }
    }

    // Fallback: Grundläggande prioritering utan AI
    const basicPrioritization = activeTasks.slice(0, 12).map(task => {
      let newPriority = task.priority;
      
      // Basera på pillar-typ och skapelsedatum
      if (task.pillar_key === 'self_care' || task.pillar_key === 'health') {
        newPriority = 'high';
      } else if (new Date(task.created_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        // Gamla uppgifter får lägre prioritet
        newPriority = task.priority === 'high' ? 'medium' : 'low';
      }

      return {
        actionable_id: task.id,
        new_priority: newPriority,
        reasoning: 'Baserad på pillar-typ och ålder'
      };
    });

    return new Response(JSON.stringify({
      success: true,
      updated_priorities: basicPrioritization,
      summary: 'Grundläggande prioriteringsoptimering genomförd (utan AI)',
      tasks_deferred: lowPriorityTasks?.length || 0,
      active_tasks_count: Math.min(activeTasks.length, 12)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in ai-task-optimizer:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});