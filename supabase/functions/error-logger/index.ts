import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  context?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const errorReport: ErrorReport = await req.json();
      
      // Validate required fields
      if (!errorReport.errorId || !errorReport.message) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: errorId, message' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user info from auth header if available
      const authHeader = req.headers.get('authorization');
      let userId = null;
      
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id;
      }

      // Store error in database
      const { error: dbError } = await supabase
        .from('error_logs')
        .insert({
          error_id: errorReport.errorId,
          user_id: userId,
          message: errorReport.message,
          stack_trace: errorReport.stack,
          context: errorReport.context,
          user_agent: errorReport.userAgent,
          url: errorReport.url,
          timestamp: errorReport.timestamp,
          created_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Database error:', dbError);
        return new Response(
          JSON.stringify({ error: 'Failed to store error log' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log critical errors to console for immediate attention
      if (errorReport.context?.includes('Critical') || errorReport.message.includes('Critical')) {
        console.error('🚨 CRITICAL ERROR LOGGED:', {
          errorId: errorReport.errorId,
          userId,
          message: errorReport.message,
          url: errorReport.url,
          timestamp: errorReport.timestamp
        });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Error logged successfully',
          errorId: errorReport.errorId 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error logging function failed:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});