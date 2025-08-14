import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, pillarKey } = await req.json()

    if (!userId || !pillarKey) {
      throw new Error('User ID and pillar key are required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call the cleanup_pillar_assessments_on_retake database function
    const { data, error } = await supabase.rpc('cleanup_pillar_assessments_on_retake', {
      p_user_id: userId,
      p_pillar_type: pillarKey
    })

    if (error) {
      console.error('Database function error:', error)
      throw error
    }

    console.log('✅ Single pillar cleanup completed:', data)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Pillar ${pillarKey} cleanup completed successfully`,
        data: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Pillar cleanup error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})