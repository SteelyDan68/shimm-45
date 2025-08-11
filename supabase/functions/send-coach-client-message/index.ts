import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CoachClientMessageRequest {
  to: string;
  fromEmail: string;
  fromName: string;
  clientName?: string;
  coachName?: string;
  message: string;
  messageType: 'coach-to-client' | 'client-to-coach' | 'general';
  urgent?: boolean;
  context?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      fromEmail,
      fromName,
      clientName,
      coachName,
      message, 
      messageType,
      urgent = false,
      context
    }: CoachClientMessageRequest = await req.json();

    if (!to || !fromEmail || !fromName || !message) {
      throw new Error("Required fields: to, fromEmail, fromName, message");
    }

    const isCoachToClient = messageType === 'coach-to-client';
    const subjectPrefix = urgent ? '🚨 BRÅDSKANDE:' : '💬';
    
    const subjectLine = isCoachToClient 
      ? `${subjectPrefix} Meddelande från din coach ${coachName || fromName}`
      : `${subjectPrefix} Meddelande från ${clientName || fromName}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subjectLine}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: ${urgent ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #059669, #0d9488)'}; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; }
            .message-box { background: #f8fafc; border-left: 4px solid ${isCoachToClient ? '#059669' : '#3b82f6'}; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 15px 0; }
            .metadata { background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
            .urgent-banner { background: #fef2f2; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">
                ${urgent ? '🚨 Brådskande meddelande' : '💬 Nytt meddelande'}
              </h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                via SHIMMS Kommunikationscenter
              </p>
            </div>
            
            <div class="content">
              ${urgent ? 
                `<div class="urgent-banner">
                  <strong style="color: #dc2626;">⚠️ Detta meddelande är markerat som brådskande</strong><br>
                  <span style="color: #7f1d1d;">Vänligen prioritera att läsa och svara på detta meddelande.</span>
                </div>` : ''
              }
              
              <div class="metadata">
                <strong>Från:</strong> ${fromName} (${fromEmail})<br>
                ${isCoachToClient ? 
                  `<strong>Till klient:</strong> ${clientName || 'dig'}` : 
                  `<strong>Till coach:</strong> ${coachName || 'din coach'}`
                }<br>
                <strong>Typ:</strong> ${messageType === 'coach-to-client' ? 'Coach kommunikation' : 
                                      messageType === 'client-to-coach' ? 'Klient feedback' : 'Allmän kommunikation'}<br>
                ${context ? `<strong>Kontext:</strong> ${context}<br>` : ''}
                <strong>Skickat:</strong> ${new Date().toLocaleDateString('sv-SE', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              
              <div class="message-box">
                <h3 style="margin-top: 0; color: ${isCoachToClient ? '#059669' : '#1d4ed8'};">
                  ${isCoachToClient ? '🎯 Meddelande från din coach:' : '💭 Meddelande från klient:'}
                </h3>
                <div style="white-space: pre-wrap; font-size: 16px; line-height: 1.5;">
                  ${message}
                </div>
              </div>
              
              <div style="background: ${isCoachToClient ? '#ecfdf5' : '#eff6ff'}; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin-top: 0; color: ${isCoachToClient ? '#059669' : '#1d4ed8'};">
                  📱 Svara direkt i SHIMMS:
                </h3>
                <p style="margin-bottom: 15px;">
                  Logga in på SHIMMS för att svara på detta meddelande och fortsätta konversationen säkert.
                </p>
                <p style="text-align: center;">
                  <a href="${Deno.env.get('SUPABASE_URL') || 'https://gcoorbcglxczmukzcmqs.supabase.co'}/messages" class="btn">
                    Öppna meddelanden
                  </a>
                </p>
              </div>
              
              ${isCoachToClient ? 
                `<div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 25px 0;">
                  <strong>💡 Tips från din coach:</strong><br>
                  Ta dig tid att reflektera över meddelandet och svara när du känner dig redo. Din utvecklingsresa är en process som tar tid.
                </div>` :
                `<div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0;">
                  <strong>👨‍💼 Coach-information:</strong><br>
                  Detta meddelande kommer från en av dina klienter. Använd SHIMMS plattformen för att ge genomtänkta och professionella svar.
                </div>`
              }
            </div>
            
            <div class="footer">
              <p><strong>SHIMMS</strong> - Säker kommunikation för utveckling</p>
              <p style="font-size: 12px; margin: 5px 0;">
                Detta meddelande skickades via SHIMMS säkra meddelandesystem. 
                <a href="#" style="color: #059669;">Hantera notifieringar</a>
              </p>
              <p style="font-size: 11px; color: #94a3b8;">
                Svara inte direkt på detta email - använd SHIMMS plattformen för säker kommunikation.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `${Deno.env.get('RESEND_FROM_NAME') || 'SHIMMS'} ${isCoachToClient ? 'Coach' : 'Klient'} <${Deno.env.get('RESEND_FROM_EMAIL') || 'messages@resend.dev'}>`,
      to: [to],
      subject: subjectLine,
      html: emailHtml,
      replyTo: fromEmail,
    });

    console.log("Coach-client message sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        to,
        from: fromEmail,
        messageType,
        urgent
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error sending coach-client message:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send coach-client message",
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