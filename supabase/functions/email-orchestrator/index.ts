import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'welcome' | 'assessment-reminder' | 'coach-client-message' | 'system-alert';
  recipients: string | string[];
  data: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipients, data }: EmailRequest = await req.json();

    if (!type || !recipients) {
      throw new Error("Email type and recipients are required");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Route to appropriate email function
    let functionName: string;
    let payload: any;

    switch (type) {
      case 'welcome':
        functionName = 'send-welcome-email';
        payload = {
          to: typeof recipients === 'string' ? recipients : recipients[0],
          firstName: data.firstName,
          role: data.role,
          inviterName: data.inviterName
        };
        break;

      case 'assessment-reminder':
        functionName = 'send-assessment-reminder';
        payload = {
          to: typeof recipients === 'string' ? recipients : recipients[0],
          firstName: data.firstName,
          assessmentType: data.assessmentType,
          pillarName: data.pillarName,
          daysOverdue: data.daysOverdue,
          dashboardUrl: data.dashboardUrl
        };
        break;

      case 'coach-client-message':
        functionName = 'send-coach-client-message';
        payload = {
          to: typeof recipients === 'string' ? recipients : recipients[0],
          fromEmail: data.fromEmail,
          fromName: data.fromName,
          clientName: data.clientName,
          coachName: data.coachName,
          message: data.message,
          messageType: data.messageType,
          urgent: data.urgent,
          context: data.context
        };
        break;

      case 'system-alert':
        functionName = 'send-system-alert';
        payload = {
          to: recipients,
          alertType: data.alertType,
          title: data.title,
          message: data.message,
          severity: data.severity,
          systemComponent: data.systemComponent,
          errorDetails: data.errorDetails,
          affectedUsers: data.affectedUsers,
          actionRequired: data.actionRequired,
          resolvedAt: data.resolvedAt
        };
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Call the specific email function
    const { data: result, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });

    if (error) {
      throw error;
    }

    // Log email activity
    await supabase.from('email_logs').insert({
      email_type: type,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      function_name: functionName,
      status: 'sent',
      message_ids: result?.messageId ? [result.messageId] : result?.messageIds || [],
      payload_data: payload,
      sent_at: new Date().toISOString()
    });

    console.log(`Email sent successfully via ${functionName}:`, result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        type,
        function: functionName,
        result
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in email orchestrator:", error);
    
    // Try to log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase.from('email_logs').insert({
        email_type: 'error',
        recipients: [],
        function_name: 'email-orchestrator',
        status: 'failed',
        error_message: error.message,
        sent_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email",
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