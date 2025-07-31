import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const diagnostics = {
      hasApiKey: !!resendApiKey,
      keyLength: resendApiKey?.length || 0,
      keyStartsWithRe: resendApiKey?.startsWith('re_') || false,
      keyPreview: resendApiKey ? `${resendApiKey.substring(0, 5)}...` : 'None'
    };

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'No RESEND_API_KEY found', 
          diagnostics 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    // Test email send
    const result = await resend.emails.send({
      from: "SHIMM <onboarding@resend.dev>",
      to: ["stefan.hallgren@gmail.com"],
      subject: "Test från SHIMM",
      html: `
        <div style="font-family: sans-serif;">
          <h1>Test e-post</h1>
          <p>Detta är ett test för att verifiera att Resend fungerar korrekt.</p>
          <p>Diagnostik: ${JSON.stringify(diagnostics, null, 2)}</p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        diagnostics,
        result 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        name: error.name
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);