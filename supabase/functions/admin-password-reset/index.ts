import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  targetUserId: string;
  newPassword?: string;
  sendResetEmail?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🔐 Admin password reset request received');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create client for user validation
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '');

    // Get admin user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user: adminUser }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !adminUser) {
      throw new Error('Invalid authentication');
    }

    const body = await req.json();
    const targetUserId: string = body.targetUserId;
    const newPassword: string | undefined = body.newPassword;
    const sendResetEmail: boolean | undefined = body.sendResetEmail;
    const targetEmail: string | undefined = body.targetEmail;
    const redirectTo: string | undefined = body.redirectTo;

    // Validate input
    if (!targetUserId) {
      throw new Error('Target user ID is required');
    }

    if (!newPassword && !sendResetEmail) {
      throw new Error('Either newPassword or sendResetEmail must be provided');
    }

    // Validate permissions: superadmin/admin OR self OR coach-of-client
    const { data: isSuper } = await supabaseClient.rpc('has_role', {
      _user_id: adminUser.id,
      _role: 'superadmin'
    });
    const { data: isAdminRole } = await supabaseClient.rpc('has_role', {
      _user_id: adminUser.id,
      _role: 'admin'
    });
    const isSelf = adminUser.id === targetUserId;
    const { data: isCoachRel } = await supabaseClient.rpc('is_coach_of_client', {
      _coach_id: adminUser.id,
      _client_id: targetUserId
    });

    if (!isSuper && !isAdminRole && !isSelf && !isCoachRel) {
      throw new Error('Unauthorized: insufficient permissions');
    }

    let result;

    if (sendResetEmail) {
      // Resolve email if not provided
      let email = targetEmail;
      if (!email) {
        const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
        if (userErr || !userData?.user?.email) {
          throw new Error('Could not resolve target user email');
        }
        email = userData.user.email as string;
      }

      // Generate password reset link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });

      if (linkError || !linkData?.properties?.action_link) {
        throw new Error(`Failed to generate reset link: ${linkError?.message || 'no link returned'}`);
      }

      // Send via Resend
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        throw new Error('RESEND_API_KEY not configured');
      }
      const resend = new Resend(resendApiKey);
      const actionLink = linkData.properties.action_link as string;

      await resend.emails.send({
        from: 'Security <no-reply@resend.dev>',
        to: [email],
        subject: 'Återställ ditt lösenord',
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
            <h2>Lösenordsåterställning</h2>
            <p>Hej ${email.split('@')[0]}, du (eller en administratör) har begärt att återställa ditt lösenord.</p>
            <p><a href="${actionLink}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px">Återställ lösenord</a></p>
            <p>Om du inte begärt detta kan du ignorera detta meddelande.</p>
          </div>
        `,
      });

      result = {
        success: true,
        message: 'Password reset email sent via Resend',
        resetLink: actionLink
      };
    } else {
      // Direct password reset
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: newPassword
      });

      if (error) {
        throw new Error(`Failed to update password: ${error.message}`);
      }

      result = {
        success: true,
        message: 'Password updated successfully',
        userId: data.user?.id
      };
    }

    console.log('✅ Admin password reset completed successfully');

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in admin password reset:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Ett fel uppstod vid lösenordsåterställning",
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);