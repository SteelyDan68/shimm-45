/**
 * 🔄 TOTAL PILLAR RESET EDGE FUNCTION
 * 
 * Anropar total_pillar_reset function för komplett systemrengöring
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    console.log(`🔄 TOTAL RESET: Starting complete system reset for user ${userId}`);

    if (!userId) {
      throw new Error('userId is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Call the total pillar reset function
    const { data: resetResult, error: resetError } = await supabase
      .rpc('total_pillar_reset', {
        p_user_id: userId
      });

    if (resetError) {
      console.error('❌ Total reset error:', resetError);
      throw resetError;
    }

    console.log('✅ Total reset completed:', resetResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'KOMPLETT SYSTEMRESET genomfört. All utvecklingsdata raderad.',
        reset_result: resetResult,
        user_id: userId,
        ready_for_fresh_start: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Error in total-pillar-reset:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});