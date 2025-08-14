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
    const { userId, pillarKey } = await req.json();
    
    console.log(`🔄 RETAKE SYSTEM: Clearing dependencies for user ${userId}, pillar ${pillarKey}`);

    if (!userId || !pillarKey) {
      throw new Error('userId and pillarKey are required');
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

    // Call the comprehensive cleanup function that handles complete system integrity
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_pillar_assessments_on_retake', {
        p_user_id: userId,
        p_pillar_type: pillarKey
      });

    if (cleanupError) {
      console.error('❌ Cleanup error:', cleanupError);
      throw cleanupError;
    }

    console.log('✅ Retake cleanup completed:', cleanupResult);

    // Log the successful retake operation
    await supabase.from('admin_audit_log').insert({
      admin_user_id: userId,
      action: 'pillar_retake_initiated',
      target_user_id: userId,
      details: {
        pillar_key: pillarKey,
        cleanup_result: cleanupResult,
        timestamp: new Date().toISOString(),
        system_integrity: 'maintained'
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully cleared all dependencies for ${pillarKey}`,
        cleanup_summary: cleanupResult,
        pillar_key: pillarKey,
        ready_for_retake: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Error in clear-pillar-dependencies:', error);
    
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