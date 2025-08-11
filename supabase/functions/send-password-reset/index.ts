import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  redirectTo?: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, redirectTo, name }: RequestBody = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendApiKey || !supabaseUrl || !serviceKey) {
      throw new Error('Missing configuration for Resend or Supabase');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Generate recovery link via Supabase Admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: redirectTo ? { redirectTo } : undefined,
    });

    if (linkError || !linkData?.properties?.action_link) {
      throw new Error(`Failed to generate reset link: ${linkError?.message || 'no link returned'}`);
    }

    const actionLink = linkData.properties.action_link as string;

    // Send email via Resend
    const resend = new Resend(resendApiKey);
    const subject = 'Återställ ditt lösenord';
    const recipientName = name || email.split('@')[0];

    const emailResponse = await resend.emails.send({
      from: 'Security <no-reply@resend.dev>',
      to: [email],
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2>Hej ${recipientName},</h2>
          <p>Vi fick en begäran om att återställa ditt lösenord.</p>
          <p>Klicka på knappen nedan för att välja ett nytt lösenord:</p>
          <p>
            <a href="${actionLink}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px">Återställ lösenord</a>
          </p>
          <p>Om du inte begärde detta kan du ignorera detta e‑postmeddelande.</p>
        </div>
      `,
    });

    console.log('Resend response', emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error('❌ Error in send-password-reset:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
