import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: string;
  custom_message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, custom_message = '' }: InvitationRequest = await req.json();
    
    console.log(`Sending invitation to: ${email} as ${role}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Ogiltig e-postadress');
    }

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create invitation
    const { data: invitation, error: createError } = await supabaseClient
      .from('invitations')
      .insert({
        email,
        invited_role: role,
        invited_by: '9065f42b-b9cc-4252-b73f-4374c6286b5e', // Admin user ID
        expires_at: expiresAt.toISOString(),
      })
      .select('id, token')
      .single();

    if (createError) {
      console.error('Database error:', createError);
      throw new Error('Kunde inte skapa inbjudan');
    }

    if (!invitation?.token) {
      throw new Error('Ingen token genererades');
    }

    // Create invitation URL
    const appUrl = 'https://00a0d53e-45e2-45a5-8d70-ae3e74d84396.lovableproject.com';
    const invitationUrl = `${appUrl}/invitation-signup?token=${invitation.token}`;

    // Simple HTML email
    const html = `
      <h1>Välkommen till HappyMinds!</h1>
      <p>Du har blivit inbjuden som <strong>${role === 'client' ? 'klient' : role}</strong>.</p>
      ${custom_message ? `<p><strong>Meddelande:</strong> ${custom_message}</p>` : ''}
      <p>
        <a href="${invitationUrl}" style="background: #007bff; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; display: inline-block;">
          Acceptera inbjudan
        </a>
      </p>
      <p>Länk: ${invitationUrl}</p>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "HappyMinds <noreply@shimms.com>",
      to: [email],
      subject: "Inbjudan till HappyMinds",
      html,
    });

    if (emailResponse.error) {
      console.log('Email error (might be domain restriction):', emailResponse.error);
      
      // Return success even if email fails due to domain restrictions
      return new Response(JSON.stringify({ 
        success: true,
        message: `Inbjudan skapad för ${email}`,
        invitation_url: invitationUrl,
        note: 'E-post kanske inte skickades pga domänrestriktioner'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Invitation sent successfully');

    return new Response(JSON.stringify({ 
      success: true,
      message: `Inbjudan skickad till ${email}`,
      invitation_id: invitation.id,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Invitation error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error?.message || "Ett fel uppstod"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);