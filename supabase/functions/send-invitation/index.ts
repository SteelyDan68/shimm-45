import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
    console.log('🚀 Send Invitation Function Started - Version 2.1');
    
    const { email, role, custom_message = '' }: InvitationRequest = await req.json();
    
    console.log(`Sending invitation to: ${email} as ${role}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Ogiltig e-postadress');
    }

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    console.log('Creating invitation in database...');
    
    // Create invitation
    let { data: invitation, error: createError } = await supabaseClient
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
      
      // Handle duplicate invitation
      if (createError.code === '23505') {
        console.log('Duplicate invitation detected, updating existing...');
        
        // Update existing invitation
        const { data: updatedInvitation, error: updateError } = await supabaseClient
          .from('invitations')
          .update({
            expires_at: expiresAt.toISOString(),
            status: 'pending'
          })
          .eq('email', email)
          .eq('status', 'pending')
          .select('id, token')
          .single();
          
        if (updateError) {
          throw new Error('Kunde inte uppdatera befintlig inbjudan');
        }
        
        invitation = updatedInvitation;
      } else {
        throw new Error('Kunde inte skapa inbjudan');
      }
    }

    if (!invitation?.token) {
      throw new Error('Ingen token genererades');
    }

    console.log('Invitation created successfully:', invitation.id);

    // Create invitation URL
    const appUrl = 'https://00a0d53e-45e2-45a5-8d70-ae3e74d84396.lovableproject.com';
    const invitationUrl = `${appUrl}/invitation-signup?token=${invitation.token}`;

    console.log('Sending email via Resend...');

    // Send email via Resend
    try {
      const emailResponse = await resend.emails.send({
        from: 'HappyMinds <noreply@send.shimms.com>',
        to: [email],
        subject: `Inbjudan till HappyMinds - ${role}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
              Välkommen till HappyMinds!
            </h1>
            
            <p style="font-size: 16px; line-height: 1.5; color: #555;">
              Du har blivit inbjuden att gå med i HappyMinds som <strong>${role}</strong>.
            </p>
            
            ${custom_message ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                <p style="margin: 0; font-style: italic;">${custom_message}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;
                        display: inline-block;">
                Acceptera inbjudan
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Eller kopiera och klistra in denna länk i din webbläsare:
            </p>
            <p style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd; 
                      word-break: break-all; font-size: 12px;">
              ${invitationUrl}
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Denna inbjudan är giltig i 7 dagar. Om du inte har begärt denna inbjudan kan du ignorera detta e-postmeddelande.
            </p>
          </div>
        `,
      });

      console.log('Email sent successfully:', emailResponse);

      return new Response(JSON.stringify({ 
        success: true,
        message: `Inbjudan skickad till ${email}`,
        invitation_id: invitation.id,
        invitation_url: invitationUrl,
        email_sent: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Email failed but invitation was created, so it's partial success
      return new Response(JSON.stringify({ 
        success: true,
        message: `Inbjudan skapad men e-post kunde inte skickas till ${email}`,
        invitation_id: invitation.id,
        invitation_url: invitationUrl,
        email_sent: false,
        email_error: emailError.message
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("❌ Invitation error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error?.message || "Ett fel uppstod vid skickande av inbjudan"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);