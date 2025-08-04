import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

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

    const { targetUserId, newPassword, sendResetEmail }: PasswordResetRequest = await req.json();

    // Validate input
    if (!targetUserId) {
      throw new Error('Target user ID is required');
    }

    if (!newPassword && !sendResetEmail) {
      throw new Error('Either newPassword or sendResetEmail must be provided');
    }

    // Validate admin permissions using our database function
    const { data: validationResult, error: validationError } = await supabaseClient
      .rpc('validate_admin_action', {
        _admin_id: adminUser.id,
        _action_type: sendResetEmail ? 'password_reset_email' : 'password_reset_direct',
        _target_user_id: targetUserId
      });

    if (validationError || !validationResult) {
      throw new Error('Admin validation failed: ' + (validationError?.message || 'Unauthorized'));
    }

    let result;

    if (sendResetEmail) {
      // Send password reset email
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: '', // Email will be looked up automatically by user ID
        options: {
          redirectTo: `${supabaseUrl.replace('supabase.co', 'lovableproject.com')}/reset-password`
        }
      });

      if (error) {
        throw new Error(`Failed to generate reset link: ${error.message}`);
      }

      result = { 
        success: true, 
        message: 'Password reset email sent',
        resetLink: data.properties?.action_link
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