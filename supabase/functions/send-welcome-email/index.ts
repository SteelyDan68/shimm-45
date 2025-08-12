import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  to: string;
  firstName?: string;
  role?: string;
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, firstName, role, inviterName }: WelcomeEmailRequest = await req.json();

    if (!to) {
      throw new Error("Email address is required");
    }

    const roleDisplayName = role === 'client' ? 'Klient' : 
                          role === 'coach' ? 'Coach' : 
                          role === 'admin' ? 'Administratör' : 'Användare';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Välkommen till SHIMMS</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; }
            .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .feature { display: flex; align-items: center; margin: 20px 0; }
            .feature-icon { background: #ede9fe; color: #6366f1; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">Välkommen till SHIMMS! 🎉</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">
                Din personliga utvecklingsresa börjar här
              </p>
            </div>
            
            <div class="content">
              <h2>Hej ${firstName || 'där'}! 👋</h2>
              
              <p>Vi är glada att välkomna dig till SHIMMS - din plattform för personlig och professionell utveckling.</p>
              
              <p><strong>Din roll:</strong> ${roleDisplayName}</p>
              ${inviterName ? `<p><strong>Inbjuden av:</strong> ${inviterName}</p>` : ''}
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin-top: 0; color: #6366f1;">🚀 Kom igång direkt:</h3>
                
                <div class="feature">
                  <div class="feature-icon">1</div>
                  <div>
                    <strong>Slutför din profil</strong><br>
                    <span style="color: #64748b;">Lägg till personlig information för en bättre upplevelse</span>
                  </div>
                </div>
                
                <div class="feature">
                  <div class="feature-icon">2</div>
                  <div>
                    <strong>Utforska de Sex Pelarna</strong><br>
                    <span style="color: #64748b;">Självvård, Kompetens, Talang, Varumärke, Ekonomi, Öppet spår</span>
                  </div>
                </div>
                
                <div class="feature">
                  <div class="feature-icon">3</div>
                  <div>
                    <strong>Starta din första bedömning</strong><br>
                    <span style="color: #64748b;">Få personliga rekommendationer baserat på dina mål</span>
                  </div>
                </div>
              </div>
              
              <p style="text-align: center;">
                <a href="https://00a0d53e-45e2-45a5-8d70-ae3e74d84396.lovableproject.com/auth" class="btn">
                  Logga in på SHIMMS
                </a>
              </p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0;">
                <strong>💡 Tips:</strong> Bokmärk denna sida för snabb åtkomst till ditt personliga utvecklingscenter.
              </div>
            </div>
            
            <div class="footer">
              <p><strong>SHIMMS</strong> - Din partner för personlig utveckling</p>
              <p style="font-size: 12px; margin: 5px 0;">
                Detta mail går inte att svara på.
              </p>
              <p style="font-size: 12px; margin: 5px 0;">
                Om du inte begärde detta konto kan du ignorera detta meddelande.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `${Deno.env.get('RESEND_FROM_NAME') || 'SHIMMS'} <${Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@resend.dev'}>`,
      to: [to],
      subject: `Välkommen till SHIMMS, ${firstName || 'ditt utvecklingscentrum väntar'}!`,
      html: emailHtml,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        to,
        role: roleDisplayName 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send welcome email",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);