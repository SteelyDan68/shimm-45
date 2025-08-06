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
    
    const { email, password, firstName, lastName, role, extendedProfile }: CreateUserRequest = requestBody;
    
    console.log(`Creating user: ${email} with role: ${role}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate password if not provided
    const userPassword = password || Math.random().toString(36).slice(-12) + 'A1!';

    // 1. Create auth user
    console.log('Creating auth user...');
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    console.log('Auth user created successfully:', authUser.user!.id);

    // 2. Create profile
    console.log('Creating profile...');
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: authUser.user!.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: extendedProfile?.phone || '',
        organization: extendedProfile?.organization || '',
        job_title: extendedProfile?.job_title || '',
        bio: extendedProfile?.bio || '',
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // Clean up auth user
      await supabaseClient.auth.admin.deleteUser(authUser.user!.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    console.log('Profile created successfully');

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