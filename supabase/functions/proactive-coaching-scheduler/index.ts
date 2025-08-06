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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, user_id } = await req.json();

    if (action === 'schedule_check') {
      // Proactive coaching check logic
      const { data: recentActivity } = await supabase
        .from('stefan_interventions')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      const daysSince = recentActivity?.[0] 
        ? Math.floor((Date.now() - new Date(recentActivity[0].created_at).getTime()) / (24 * 60 * 60 * 1000))
        : 30;

      if (daysSince > 7) {
        await supabase.from('stefan_interventions').insert({
          user_id,
          trigger_type: 'proactive_check',
          content: `Hej! Det har gått ${daysSince} dagar sedan vi pratades. Hur mår du?`,
          priority: 'medium'
        });
      }

      return new Response(JSON.stringify({ success: true, days_since: daysSince }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});