import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssessmentReminderRequest {
  to: string;
  firstName?: string;
  assessmentType: string;
  pillarName?: string;
  daysOverdue?: number;
  dashboardUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      firstName, 
      assessmentType, 
      pillarName, 
      daysOverdue = 0,
      dashboardUrl 
    }: AssessmentReminderRequest = await req.json();

    if (!to || !assessmentType) {
      throw new Error("Email address and assessment type are required");
    }

    const isOverdue = daysOverdue > 0;
    const urgencyLevel = daysOverdue > 7 ? 'hög' : daysOverdue > 3 ? 'medium' : 'låg';
    
    const subjectLine = isOverdue 
      ? `⚠️ Påminnelse: ${assessmentType} väntar (${daysOverdue} dagar)`
      : `🎯 Dags för din ${assessmentType}`;

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
            .header { background: ${isOverdue ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)'}; color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; }
            .btn { display: inline-block; background: ${isOverdue ? '#ef4444' : '#6366f1'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .alert { background: ${isOverdue ? '#fef2f2' : '#eff6ff'}; border-left: 4px solid ${isOverdue ? '#ef4444' : '#3b82f6'}; padding: 15px; margin: 25px 0; border-radius: 4px; }
            .progress-item { display: flex; align-items: center; margin: 15px 0; padding: 10px; background: #f8fafc; border-radius: 6px; }
            .progress-icon { width: 32px; height: 32px; border-radius: 50%; background: #e0e7ff; color: #6366f1; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">
                ${isOverdue ? '⚠️ Påminnelse' : '🎯 Utvecklingsmöjlighet'}
              </h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                Din ${assessmentType} väntar på dig
              </p>
            </div>
            
            <div class="content">
              <h2>Hej ${firstName || 'där'}! 👋</h2>
              
              ${isOverdue ? 
                `<p><strong>Din ${assessmentType} är ${daysOverdue} dagar försenad.</strong> Det är viktigt att hålla utvecklingsprocessen igång för att få bästa resultat.</p>` :
                `<p>Det är dags att slutföra din <strong>${assessmentType}</strong> för att fortsätta din utvecklingsresa.</p>`
              }
              
              ${pillarName ? `<p><strong>Utvecklingsområde:</strong> ${pillarName}</p>` : ''}
              
              <div class="alert">
                <h3 style="margin-top: 0; color: ${isOverdue ? '#dc2626' : '#1d4ed8'};">
                  ${isOverdue ? '🚨 Varför är detta viktigt?' : '💡 Varför göra detta nu?'}
                </h3>
                <ul style="margin-bottom: 0;">
                  <li>Håller dig på rätt spår mot dina mål</li>
                  <li>Ger personliga utvecklingsrekommendationer</li>
                  <li>Bygger momentum i din utvecklingsresa</li>
                  <li>Hjälper din coach att stödja dig bättre</li>
                </ul>
              </div>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin-top: 0; color: #6366f1;">📈 Vad händer efter din bedömning:</h3>
                
                <div class="progress-item">
                  <div class="progress-icon">1</div>
                  <div>
                    <strong>AI-analys</strong><br>
                    <span style="color: #64748b;">Personliga insikter baserat på dina svar</span>
                  </div>
                </div>
                
                <div class="progress-item">
                  <div class="progress-icon">2</div>
                  <div>
                    <strong>Handlingsplan</strong><br>
                    <span style="color: #64748b;">Konkreta steg framåt för din utveckling</span>
                  </div>
                </div>
                
                <div class="progress-item">
                  <div class="progress-icon">3</div>
                  <div>
                    <strong>Coach-stöd</strong><br>
                    <span style="color: #64748b;">Din coach får värdefulla insikter för att stödja dig</span>
                  </div>
                </div>
              </div>
              
              <p style="text-align: center;">
                <a href="${dashboardUrl || `${Deno.env.get('SUPABASE_URL')}/client-dashboard`}" class="btn">
                  ${isOverdue ? 'Slutför bedömning nu' : 'Starta bedömning'}
                </a>
              </p>
              
              <p style="font-size: 14px; color: #64748b; text-align: center;">
                Beräknad tid: ~10-15 minuter
              </p>
              
              ${isOverdue && urgencyLevel === 'hög' ? 
                `<div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;">
                  <strong style="color: #dc2626;">⏰ Högt prioriterade:</strong><br>
                  <span style="color: #7f1d1d;">Kontakta din coach om du behöver stöd med att slutföra denna bedömning.</span>
                </div>` : ''
              }
            </div>
            
            <div class="footer">
              <p><strong>SHIMMS</strong> - Tillsammans bygger vi din framtid</p>
              <p style="font-size: 12px; margin: 5px 0;">
                Du får detta meddelande eftersom du har en aktiv utvecklingsplan. 
                <a href="#" style="color: #6366f1;">Hantera notifieringar</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `${Deno.env.get('RESEND_FROM_NAME') || 'SHIMMS Assessment'} <${Deno.env.get('RESEND_FROM_EMAIL') || 'assessments@resend.dev'}>`,
      to: [to],
      subject: subjectLine,
      html: emailHtml,
    });

    console.log("Assessment reminder sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        to,
        assessmentType,
        isOverdue,
        urgencyLevel
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error sending assessment reminder:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send assessment reminder",
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