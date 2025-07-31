import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { MessageNotification } from './_templates/message-notification.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendMessageNotificationRequest {
  receiverEmail: string;
  senderName: string;
  subject?: string;
  messageContent: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Send message notification request received');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { receiverEmail, senderName, subject, messageContent }: SendMessageNotificationRequest = await req.json();
    console.log(`Sending message notification to ${receiverEmail} from ${senderName}`);

    // Truncate message content for preview
    const messagePreview = messageContent.length > 150 
      ? messageContent.substring(0, 150) + '...' 
      : messageContent;

    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || 'https://your-app.com';

    // Render the email template
    const html = await renderAsync(
      React.createElement(MessageNotification, {
        senderName,
        subject,
        messagePreview,
        appUrl,
      })
    );

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "Plattformen <notifications@resend.dev>",
      to: [receiverEmail],
      subject: `Nytt meddelande från ${senderName}${subject ? ` - ${subject}` : ''}`,
      html,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log("Message notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Meddelandenotifiering skickad",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-message-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Ett fel uppstod vid skickandet av notifiering"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);