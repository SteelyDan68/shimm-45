import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  temporaryPassword: string;
  sendWelcomeEmail?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Admin Create User Function Started');
    
    const { 
      email, 
      firstName, 
      lastName, 
      role, 
      temporaryPassword,
      sendWelcomeEmail = true 
    }: CreateUserRequest = await req.json();
    
    console.log(`Creating user: ${email} with role: ${role}`);

    // Validate admin permissions
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Ingen behörighet - saknar autentisering');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: adminUser }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !adminUser) {
      throw new Error('Ogiltig autentisering');
    }

    // Check admin permissions
    const { data: adminRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id);

    const hasAdminRole = adminRoles?.some(r => ['admin', 'superadmin'].includes(r.role));
    if (!hasAdminRole) {
      throw new Error('Otillräcklig behörighet - endast admin/superadmin');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Ogiltig e-postadress');
    }

    // Password validation
    if (!temporaryPassword || temporaryPassword.length < 8) {
      throw new Error('Temporärt lösenord måste vara minst 8 tecken');
    }

    console.log('Creating user in auth system...');

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role,
        created_by_admin: true,
        force_password_change: true, // Flag för påtvingat lösenordsbyte
        temp_password: true
      }
    });

    if (createError) {
      console.error('User creation error:', createError);
      throw new Error(`Kunde inte skapa användare: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error('Användaren skapades inte korrekt');
    }

    console.log('User created successfully:', newUser.user.id);

    // Create profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        is_active: true,
        created_at: new Date().toISOString(),
        force_password_change: true
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail completely, profile might be created by trigger
    }

    // Assign role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role,
        assigned_by: adminUser.id,
        assigned_at: new Date().toISOString()
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      throw new Error('Användare skapad men roll kunde inte tilldelas');
    }

    // Log admin action
    await supabaseClient
      .from('admin_audit_log')
      .insert({
        admin_user_id: adminUser.id,
        action: 'manual_user_creation',
        target_user_id: newUser.user.id,
        details: {
          email: email,
          role: role,
          firstName: firstName,
          lastName: lastName,
          temporaryPassword: '***masked***',
          timestamp: new Date().toISOString()
        }
      });

    console.log('User creation completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      message: `Användare ${email} skapad framgångsrikt`,
      user_id: newUser.user.id,
      email: email,
      temporary_password: temporaryPassword,
      role: role,
      force_password_change: true
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ User creation error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error?.message || "Ett fel uppstod vid skapande av användare"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);