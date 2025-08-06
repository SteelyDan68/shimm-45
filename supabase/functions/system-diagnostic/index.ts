import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 System Diagnostic Function Started');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  try {
    const functions = [
      'create-user',
      'send-invitation'
    ];

    const diagnostics = {
      timestamp: new Date().toISOString(),
      functions_status: functions,
      environment: {
        SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'SET' : 'MISSING',
        SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'MISSING',
      },
      health: 'OK'
    };

    console.log('✅ System diagnostic completed:', diagnostics);

    return new Response(JSON.stringify(diagnostics), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ System diagnostic error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error?.message || "System diagnostic failed",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);