import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  extendedProfile?: {
    phone?: string;
    organization?: string;
    job_title?: string;
    bio?: string;
  };
  sendInviteEmail?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Create User Function Started - Version 2.0');
    
    const requestBody = await req.json();
    console.log('📥 Received request body:', JSON.stringify(requestBody, null, 2));
    
    // Support both camelCase and snake_case payloads for backward compatibility
    const email: string = requestBody.email;
    const password: string | undefined = requestBody.password;
    const firstName: string = requestBody.firstName || requestBody.first_name;
    const lastName: string = requestBody.lastName || requestBody.last_name;
    const role: string = requestBody.role || (Array.isArray(requestBody.roles) ? requestBody.roles[0] : undefined);
    const extendedProfile: CreateUserRequest['extendedProfile'] = requestBody.extendedProfile;

    if (!email || !firstName || !lastName || !role) {
      return new Response(JSON.stringify({ error: 'email, firstName, lastName och role krävs' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Creating user: ${email} with role: ${role}`);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
      return new Response(JSON.stringify({ error: 'Servern saknar nödvändiga nycklar (SUPABASE_URL/SERVICE_ROLE_KEY)' }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Verify caller is admin/superadmin using the incoming JWT
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Saknar Authorization Bearer token' }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (!ANON_KEY) {
      console.error('Missing SUPABASE_ANON_KEY for user verification');
      return new Response(JSON.stringify({ error: 'Servern saknar SUPABASE_ANON_KEY för att verifiera anroparen' }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabaseAuth = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: authData, error: getUserError } = await supabaseAuth.auth.getUser();
    if (getUserError || !authData?.user) {
      console.error('Auth getUser error:', getUserError);
      return new Response(JSON.stringify({ error: 'Kunde inte verifiera anroparen' }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Check roles
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .in('role', ['admin', 'superadmin'])
      .limit(1);

    if (rolesError) {
      console.error('Role check error:', rolesError);
      return new Response(JSON.stringify({ error: 'Kunde inte verifiera behörighet' }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Endast admin/superadmin får skapa användare' }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    // Generate password if not provided
    const userPassword = password || Math.random().toString(36).slice(-12) + 'A1!';

    // 1. Create auth user with proper metadata
    console.log('Creating auth user...');
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    console.log('Auth user created successfully:', authUser.user!.id);

    // 2. Update profile with extended data (trigger already created basic profile)
    console.log('Updating profile with extended data...');
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        phone: extendedProfile?.phone || '',
        organization: extendedProfile?.organization || '',
        job_title: extendedProfile?.job_title || '',
        bio: extendedProfile?.bio || '',
      })
      .eq('id', authUser.user!.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Clean up auth user
      await supabaseClient.auth.admin.deleteUser(authUser.user!.id);
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    console.log('Profile updated successfully');

    // 3. Add role
    console.log('Adding role...');
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authUser.user!.id,
        role: role,
      });
    
    if (roleError) {
      console.error(`Role error for ${role}:`, roleError);
      // Clean up auth user and profile
      await supabaseClient.auth.admin.deleteUser(authUser.user!.id);
      throw new Error(`Failed to add role: ${roleError.message}`);
    } else {
      console.log(`Role ${role} added successfully`);
    }

    console.log('✅ User created successfully');

    return new Response(JSON.stringify({
      success: true,
      message: `Användare ${email} skapad`,
      user_id: authUser.user!.id,
      user: { id: authUser.user!.id }, // Frontend förväntar sig detta format
      generated_password: !password ? userPassword : undefined,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Create user error:", error);
    
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