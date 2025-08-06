import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UnifiedInvitationRequest {
  emails: string | string[]; // Stöder både singular och plural
  role: string;
  invitedBy?: string;
  custom_message?: string;
  expires_in_days?: number;
  send_email?: boolean;
}

interface InvitationResult {
  email: string;
  success: boolean;
  invitation_id?: string;
  invitation_token?: string;
  invitation_url?: string;
  email_id?: string;
  error?: string;
  dev_mode?: boolean;
}

const generateSimpleEmailTemplate = (params: {
  email: string;
  role: string;
  invitedBy: string;
  customMessage: string;
  invitationUrl: string;
  expiresInDays: number;
}) => {
  const { email, role, invitedBy, customMessage, invitationUrl, expiresInDays } = params;
  
  const roleText = role === 'client' ? 'klient' : 
                   role === 'admin' ? 'administratör' : 
                   role === 'coach' ? 'coach' : 'användare';

  return `
<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inbjudan till plattformen</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0;
        }
        .content { 
            background: white;
            padding: 30px 20px; 
            border: 1px solid #e1e5e9;
            border-top: none;
            border-radius: 0 0 8px 8px;
        }
        .button { 
            display: inline-block; 
            padding: 14px 28px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
            font-weight: 600;
            text-align: center;
        }
        .button:hover { background: #5a6fd8; }
        .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            font-size: 14px; 
            color: #6c757d;
            border-radius: 6px;
            margin-top: 20px;
        }
        .custom-message {
            background: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        .invite-details {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Du har fått en inbjudan!</h1>
        <p>Välkommen till vår plattform</p>
    </div>
    
    <div class="content">
        <h2>Hej ${email}!</h2>
        
        <p>Du har blivit inbjuden av <strong>${invitedBy}</strong> att gå med i vår plattform som <strong>${roleText}</strong>.</p>
        
        ${customMessage ? `
        <div class="custom-message">
            <h3>📝 Personligt meddelande:</h3>
            <p>${customMessage}</p>
        </div>
        ` : ''}
        
        <div class="invite-details">
            <h3>🔑 Inbjudningsdetaljer:</h3>
            <ul>
                <li><strong>Roll:</strong> ${roleText}</li>
                <li><strong>Inbjuden av:</strong> ${invitedBy}</li>
                <li><strong>Giltig i:</strong> ${expiresInDays} dagar</li>
            </ul>
        </div>
        
        <p>Klicka på knappen nedan för att acceptera inbjudan och skapa ditt konto:</p>
        
        <div style="text-align: center;">
            <a href="${invitationUrl}" class="button">✨ Acceptera inbjudan</a>
        </div>
        
        <p><small>Om knappen inte fungerar, kopiera och klistra in följande länk i din webbläsare:</small></p>
        <p style="word-break: break-all; font-size: 12px; color: #6c757d;">${invitationUrl}</p>
    </div>
    
    <div class="footer">
        <p>Denna inbjudan går ut om ${expiresInDays} dagar från idag.</p>
        <p>Om du inte förväntade dig denna inbjudan kan du säkert ignorera detta e-postmeddelande.</p>
    </div>
</body>
</html>`;
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Unified Invitation System - Request received');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody: UnifiedInvitationRequest = await req.json();
    const { 
      emails, 
      role, 
      invitedBy = 'Administratör',
      custom_message = '',
      expires_in_days = 7,
      send_email = true
    } = requestBody;
    
    // Normalisera emails till array
    const emailArray = Array.isArray(emails) ? emails : [emails];
    const appUrl = 'https://00a0d53e-45e2-45a5-8d70-ae3e74d84396.lovableproject.com';
    
    console.log(`📧 Processing ${emailArray.length} invitations for role: ${role}`);

    if (emailArray.length === 0) {
      throw new Error('Minst en e-postadress krävs');
    }

    // Validera alla e-postadresser
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailArray.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      throw new Error(`Ogiltiga e-postadresser: ${invalidEmails.join(', ')}`);
    }

    const results: InvitationResult[] = [];
    const errors: string[] = [];

    // Bearbeta varje e-postadress
    for (const email of emailArray) {
      try {
        console.log(`👤 Processing invitation for: ${email}`);

        // Kontrollera befintlig inbjudan
        const { data: existingInvitation } = await supabaseClient
          .from('invitations')
          .select('id, token, status, expires_at')
          .eq('email', email)
          .eq('status', 'pending')
          .gte('expires_at', new Date().toISOString())
          .maybeSingle();

        let invitation;
        
        if (existingInvitation) {
          console.log(`♻️ Reusing existing valid invitation for: ${email}`);
          invitation = existingInvitation;
        } else {
          console.log(`🆕 Creating new invitation for: ${email}`);
          
          // Rensa gamla inbjudningar först
          await supabaseClient
            .from('invitations')
            .delete()
            .eq('email', email)
            .eq('status', 'pending');
          
          // Beräkna utgångsdatum
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + expires_in_days);
          
          // Skapa ny inbjudan
          const { data: newInvitation, error: createError } = await supabaseClient
            .from('invitations')
            .insert({
              email,
              invited_role: role,
              invited_by: '9065f42b-b9cc-4252-b73f-4374c6286b5e',
              expires_at: expiresAt.toISOString(),
              token: '', // Genereras av trigger
            })
            .select('id, token')
            .single();

          if (createError) {
            console.error(`❌ Database error for ${email}:`, createError);
            errors.push(`${email}: ${createError.message}`);
            continue;
          }
          
          invitation = newInvitation;
        }

        if (!invitation?.token) {
          console.error(`❌ Missing token for ${email}:`, invitation);
          errors.push(`${email}: Inbjudan saknar token`);
          continue;
        }

        const invitationUrl = `${appUrl}/invitation-signup?token=${invitation.token}`;
        
        // Skicka e-post om begärt
        let emailResult = null;
        if (send_email) {
          const html = generateSimpleEmailTemplate({
            email,
            role,
            invitedBy,
            customMessage: custom_message,
            invitationUrl,
            expiresInDays: expires_in_days
          });

          try {
            const emailResponse = await resend.emails.send({
              from: "Plattformen <onboarding@resend.dev>",
              to: [email],
              subject: `🎉 Inbjudan till plattformen som ${role === 'client' ? 'klient' : role}`,
              html,
            });

            if (emailResponse.error) {
              console.warn(`⚠️ Email delivery issue for ${email}:`, emailResponse.error);
              
              // Hantera development mode elegantly
              if (emailResponse.error.message?.includes('API key is invalid') ||
                  emailResponse.error.message?.includes('testing emails') || 
                  emailResponse.error.message?.includes('verify a domain')) {
                
                console.log(`🧪 Development mode for ${email}: Invitation created, email restricted`);
                emailResult = { dev_mode: true, note: 'Email begränsad i development mode' };
              } else {
                throw new Error(`Email fel: ${emailResponse.error.message}`);
              }
            } else {
              console.log(`✅ Email sent successfully to ${email}`);
              emailResult = { email_id: emailResponse.data?.id };
            }
          } catch (emailError: any) {
            console.error(`❌ Email error for ${email}:`, emailError);
            errors.push(`${email}: ${emailError.message}`);
            continue;
          }
        }

        // Framgångsrikt resultat
        results.push({
          email,
          success: true,
          invitation_id: invitation.id,
          invitation_token: invitation.token,
          invitation_url: invitationUrl,
          ...(emailResult || {})
        });

        console.log(`✅ Successfully processed invitation for: ${email}`);

      } catch (error: any) {
        console.error(`❌ Error processing ${email}:`, error);
        errors.push(`${email}: ${error.message}`);
      }
    }

    // Sammanfatta resultat
    const totalSent = results.length;
    const totalErrors = errors.length;
    const totalRequested = emailArray.length;

    console.log(`📊 Summary: ${totalSent} sent, ${totalErrors} errors, ${totalRequested} requested`);

    if (totalErrors === totalRequested) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Alla inbjudningar misslyckades: ${errors.join('; ')}`
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const message = totalErrors > 0 
      ? `${totalSent} av ${totalRequested} inbjudningar lyckades. Fel: ${errors.join('; ')}`
      : `Alla ${totalSent} inbjudningar behandlades framgångsrikt`;

    return new Response(JSON.stringify({ 
      success: totalSent > 0,
      message,
      results,
      errors: totalErrors > 0 ? errors : undefined,
      summary: {
        total_requested: totalRequested,
        successful: totalSent,
        failed: totalErrors,
        success_rate: `${Math.round((totalSent / totalRequested) * 100)}%`
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Critical error in unified invitation system:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Ett kritiskt fel uppstod vid behandling av inbjudningar"
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);