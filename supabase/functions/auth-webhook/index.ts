import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import React from 'npm:react@18.3.1';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { AuthEmail } from './_templates/auth-email.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('AUTH_WEBHOOK_SECRET') as string;

const handler = async (req: Request): Promise<Response> => {
  console.log('Auth webhook request received');

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // If no webhook secret is set, skip verification (for development)
    let webhookData;
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      webhookData = wh.verify(payload, headers) as {
        user: { email: string };
        email_data: {
          token: string;
          token_hash: string;
          redirect_to: string;
          email_action_type: string;
        };
      };
    } else {
      console.log('No webhook secret set, parsing payload directly');
      webhookData = JSON.parse(payload);
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = webhookData;

    console.log(`Processing ${email_action_type} email for ${user.email}`);

    // Render the email template
    const html = await renderAsync(
      React.createElement(AuthEmail, {
        supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
        token,
        token_hash,
        redirect_to,
        email_action_type,
      })
    );

    // Send the email
    const emailResponse = await resend.emails.send({
      from: 'Plattformen <auth@resend.dev>',
      to: [user.email],
      subject: getEmailSubject(email_action_type),
      html,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw emailResponse.error;
    }

    console.log('Auth email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in auth webhook:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);

function getEmailSubject(actionType: string): string {
  switch (actionType) {
    case 'signup':
      return 'Bekräfta din e-postadress';
    case 'recovery':
      return 'Återställ ditt lösenord';
    case 'magiclink':
      return 'Din inloggningslänk';
    default:
      return 'Bekräfta din åtgärd';
  }
}