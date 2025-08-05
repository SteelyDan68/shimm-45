import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SystemAlertRequest {
  to: string | string[];
  alertType: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  systemComponent?: string;
  errorDetails?: string;
  affectedUsers?: number;
  actionRequired?: string;
  resolvedAt?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      alertType,
      title,
      message,
      severity,
      systemComponent,
      errorDetails,
      affectedUsers,
      actionRequired,
      resolvedAt
    }: SystemAlertRequest = await req.json();

    if (!to || !title || !message) {
      throw new Error("Required fields: to, title, message");
    }

    const recipients = Array.isArray(to) ? to : [to];
    const isCritical = severity === 'critical' || severity === 'high';
    const isResolved = !!resolvedAt;
    
    const getAlertIcon = () => {
      if (isResolved) return '✅';
      switch (alertType) {
        case 'error': return '🚨';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        case 'success': return '✅';
        default: return '🔔';
      }
    };

    const getColorScheme = () => {
      if (isResolved) return { primary: '#22c55e', bg: '#f0fdf4', light: '#dcfce7' };
      switch (alertType) {
        case 'error': return { primary: '#ef4444', bg: '#fef2f2', light: '#fee2e2' };
        case 'warning': return { primary: '#f59e0b', bg: '#fffbeb', light: '#fef3c7' };
        case 'info': return { primary: '#3b82f6', bg: '#eff6ff', light: '#dbeafe' };
        case 'success': return { primary: '#22c55e', bg: '#f0fdf4', light: '#dcfce7' };
        default: return { primary: '#6366f1', bg: '#f8fafc', light: '#e2e8f0' };
      }
    };

    const colors = getColorScheme();
    const alertIcon = getAlertIcon();
    
    const subjectLine = isResolved 
      ? `${alertIcon} LÖST: ${title}`
      : `${alertIcon} ${severity.toUpperCase()}: ${title}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subjectLine}</title>
          <style>
            body { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #0f172a; }
            .container { max-width: 600px; margin: 0 auto; background: #1e293b; color: #e2e8f0; }
            .header { background: linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #1e293b; }
            .footer { background: #0f172a; padding: 20px 30px; text-align: center; color: #64748b; }
            .alert-box { background: ${colors.bg}; color: #1e293b; border-left: 4px solid ${colors.primary}; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .code-block { background: #0f172a; color: #e2e8f0; border: 1px solid #334155; padding: 15px; border-radius: 6px; font-family: 'Monaco', monospace; font-size: 13px; overflow-x: auto; margin: 15px 0; }
            .status-badge { display: inline-block; background: ${colors.primary}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin: 5px 0; }
            .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; }
            .btn { display: inline-block; background: ${colors.primary}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">
                ${alertIcon} SHIMMS System Alert
              </h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                ${isResolved ? 'Problem löst' : `Severity: ${severity.toUpperCase()}`}
              </p>
            </div>
            
            <div class="content">
              <div style="margin-bottom: 20px;">
                <span class="status-badge">${alertType.toUpperCase()}</span>
                <span class="status-badge">${severity.toUpperCase()}</span>
                ${isResolved ? '<span class="status-badge" style="background: #22c55e;">RESOLVED</span>' : ''}
              </div>
              
              <h2 style="color: ${colors.primary}; margin-top: 0;">${title}</h2>
              
              <div class="alert-box">
                <strong>📋 Beskrivning:</strong><br>
                ${message}
              </div>
              
              <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #e2e8f0;">🔧 System Information</h3>
                
                <div class="metric">
                  <span><strong>Timestamp:</strong></span>
                  <span>${new Date().toISOString()}</span>
                </div>
                
                ${systemComponent ? 
                  `<div class="metric">
                    <span><strong>Component:</strong></span>
                    <span>${systemComponent}</span>
                  </div>` : ''
                }
                
                <div class="metric">
                  <span><strong>Alert Type:</strong></span>
                  <span>${alertType}</span>
                </div>
                
                <div class="metric">
                  <span><strong>Severity:</strong></span>
                  <span>${severity}</span>
                </div>
                
                ${affectedUsers ? 
                  `<div class="metric">
                    <span><strong>Affected Users:</strong></span>
                    <span>${affectedUsers}</span>
                  </div>` : ''
                }
                
                ${resolvedAt ? 
                  `<div class="metric">
                    <span><strong>Resolved At:</strong></span>
                    <span>${resolvedAt}</span>
                  </div>` : ''
                }
              </div>
              
              ${errorDetails ? 
                `<div>
                  <h3 style="color: #ef4444;">🐛 Error Details:</h3>
                  <div class="code-block">
                    ${errorDetails}
                  </div>
                </div>` : ''
              }
              
              ${actionRequired && !isResolved ? 
                `<div style="background: #7c2d12; border: 1px solid #ea580c; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="color: #fed7aa; margin-top: 0;">⚡ Action Required:</h3>
                  <p style="color: #fed7aa; margin-bottom: 0;">${actionRequired}</p>
                </div>` : ''
              }
              
              ${isResolved ? 
                `<div style="background: #14532d; border: 1px solid #22c55e; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
                  <h3 style="color: #bbf7d0; margin-top: 0;">✅ Problem Resolved</h3>
                  <p style="color: #bbf7d0; margin-bottom: 0;">This issue has been successfully resolved at ${resolvedAt}</p>
                </div>` : 
                `<div style="text-align: center; margin: 25px 0;">
                  <a href="${Deno.env.get('SUPABASE_URL') || 'https://gcoorbcglxczmukzcmqs.supabase.co'}/administration" class="btn">
                    Open Admin Dashboard
                  </a>
                </div>`
              }
              
              <div style="background: #1e293b; border-left: 4px solid #64748b; padding: 15px; margin: 25px 0;">
                <strong style="color: #cbd5e1;">📊 System Status:</strong><br>
                <span style="color: #94a3b8;">
                  This alert was automatically generated by SHIMMS monitoring system. 
                  ${isResolved ? 'All systems are now operational.' : 'Please investigate and take appropriate action.'}
                </span>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>SHIMMS</strong> System Monitoring</p>
              <p style="font-size: 12px; margin: 5px 0;">
                Alert ID: ${Date.now().toString(36)} | 
                Severity: ${severity.toUpperCase()} | 
                Type: ${alertType.toUpperCase()}
              </p>
              <p style="font-size: 11px; color: #64748b;">
                This is an automated system alert. Do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponses = await Promise.all(
      recipients.map(email => 
        resend.emails.send({
          from: "SHIMMS System <system@resend.dev>",
          to: [email],
          subject: subjectLine,
          html: emailHtml,
        })
      )
    );

    console.log("System alert sent successfully:", emailResponses);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageIds: emailResponses.map(r => r.data?.id),
        recipients: recipients.length,
        alertType,
        severity,
        isResolved
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error sending system alert:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send system alert",
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