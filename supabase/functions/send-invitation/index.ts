import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role?: string;
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role = 'client', inviterName }: InvitationRequest = await req.json();

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with the user's session
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Create invitation in database
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email,
        invited_role: role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (invitationError) {
      throw invitationError;
    }

    // Generate invitation URL
    const baseUrl = req.headers.get('origin') || 'https://gcoorbcglxczmukzcmqs.supabase.co';
    const invitationUrl = `${baseUrl}/invitation/${invitation.token}`;

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "SHIMM <onboarding@resend.dev>",
      to: [email],
      subject: `Inbjudan till SHIMM från ${inviterName || 'teamet'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">Välkommen till SHIMM!</h1>
          
          <p>Hej!</p>
          
          <p>Du har bjudits in att gå med i SHIMM av ${inviterName || 'teamet'}. För att komma igång, klicka på länken nedan för att skapa ditt konto:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Skapa konto
            </a>
          </div>
          
          <p>Eller kopiera och klistra in denna länk i din webbläsare:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${invitationUrl}
          </p>
          
          <p><strong>Obs:</strong> Denna inbjudan är giltig i 7 dagar.</p>
          
          <p>Vi ser fram emot att ha dig med i teamet!</p>
          
          <p>Vänliga hälsningar,<br>SHIMM-teamet</p>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationId: invitation.id,
        invitationUrl 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);