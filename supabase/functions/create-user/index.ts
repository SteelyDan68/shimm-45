import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  profile_data: {
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    date_of_birth?: string;
    bio?: string;
  };
  roles: string[];
  send_invitation?: boolean;
  notify_user?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Create user request received');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📝 Parsing create user request...');
    const requestData: CreateUserRequest = await req.json();
    
    console.log(`👤 Creating user: ${requestData.email}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create user in auth.users
    console.log('🔐 Creating auth user...');
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    console.log('✅ Auth user created:', authUser.user?.id);

    // Create profile
    console.log('👤 Creating user profile...');
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: authUser.user!.id,
        email: requestData.email,
        first_name: requestData.profile_data.first_name,
        last_name: requestData.profile_data.last_name,
        phone: requestData.profile_data.phone || null,
        bio: requestData.profile_data.bio || null,
        date_of_birth: requestData.profile_data.date_of_birth || null,
        // address är jsonb, så vi sätter det korrekt
        address: requestData.profile_data.address ? {
          street: requestData.profile_data.address,
          city: requestData.profile_data.city || '',
          postal_code: requestData.profile_data.postal_code || '',
          country: requestData.profile_data.country || ''
        } : null,
      });

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      // Try to clean up auth user
      await supabaseClient.auth.admin.deleteUser(authUser.user!.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // Add roles
    console.log('🎭 Adding user roles...');
    for (const role of requestData.roles) {
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: authUser.user!.id,
          role: role,
        });

      if (roleError) {
        console.error(`❌ Role ${role} assignment failed:`, roleError);
      }
    }

    console.log('✅ User created successfully');

    return new Response(JSON.stringify({
      success: true,
      message: `Användare ${requestData.email} skapad framgångsrikt`,
      user_id: authUser.user!.id,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("💥 Critical error in create-user:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error?.message || "Ett fel uppstod vid skapandet av användare"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);