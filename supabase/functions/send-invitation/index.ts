import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { InvitationEmail } from './_templates/invitation-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendInvitationRequest {
  email: string;
  role: string;
  invitedBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Send invitation request received');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, role, invitedBy }: SendInvitationRequest = await req.json();
    console.log(`Sending invitation to ${email} for role ${role} from ${invitedBy}`);

    // Get the invitation from database to get the token - try both pending and accepted
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('invitations')
      .select('token')
      .eq('email', email)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invitationError) {
      console.error('Database error when fetching invitation:', invitationError);
      throw new Error('Databasfel vid hämtning av inbjudan');
    }

    if (!invitation || !invitation.token) {
      console.error('No invitation found or token missing for email:', email);
      throw new Error('Inbjudan hittades inte eller saknar token');
    }

    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || 'https://your-app.com';

    // Render the email template
    const html = await renderAsync(
      React.createElement(InvitationEmail, {
        invitedBy,
        invitationToken: invitation.token,
        role: role === 'client' ? 'klient' : role === 'admin' ? 'administratör' : 'användare',
        appUrl,
      })
    );

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "Plattformen <onboarding@resend.dev>",
      to: [email],
      subject: `Inbjudan till plattformen från ${invitedBy}`,
      html,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Inbjudan skickad via e-post",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Ett fel uppstod vid skickandet av inbjudan"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);