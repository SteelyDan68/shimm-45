import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Admin create user function called at:', new Date().toISOString());

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Initialize regular client to verify the requesting user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify the requesting user's token and get their info
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking admin privileges for user:', user.id);
    console.log('Using Supabase admin client for role check');
    
    // Check if the requesting user has admin privileges using admin client (bypasses RLS)
    const { data: userRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    console.log('Role query result:', { userRoles, roleError });

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions: ' + roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User roles found:', userRoles);
    const hasAdminRole = userRoles?.some(r => ['superadmin', 'admin'].includes(r.role));
    console.log('Has admin role:', hasAdminRole, 'for user:', user.id);
    console.log('Checking roles:', userRoles?.map(r => r.role));
    
    if (!hasAdminRole) {
      console.error('Unauthorized user creation attempt by user:', user.id);
      console.error('Available roles:', userRoles?.map(r => r.role));
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient privileges to create users',
          debug: `User ${user.id} has roles: ${userRoles?.map(r => r.role).join(', ') || 'none'}`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, firstName, lastName, role }: CreateUserRequest = requestBody;

    // Input validation
    if (!email || !password || !firstName || !lastName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role is one of the allowed values
    const allowedRoles = ['superadmin', 'admin', 'manager', 'editor', 'organization', 'client', 'user'];
    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists in both auth.users and profiles
    console.log('Checking if user already exists with email:', email);
    
    // Check auth.users table
    const { data: existingUser, error: existingUserError } = await supabaseAdmin.auth.admin.listUsers();
    if (existingUserError) {
      console.error('Error checking existing users:', existingUserError);
      return new Response(
        JSON.stringify({ error: 'Kunde inte kontrollera befintliga användare' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authUserExists = existingUser.users.some(u => u.email === email);
    console.log('Auth user exists:', authUserExists);

    // Check profiles table for any leftover profiles
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing profiles:', profileCheckError);
      return new Response(
        JSON.stringify({ error: 'Kunde inte kontrollera befintliga profiler' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profileExists = existingProfile !== null;
    console.log('Profile exists:', profileExists);

    if (authUserExists || profileExists) {
      console.log('User or profile already exists with email:', email);
      
      // If profile exists but auth user doesn't, clean up the orphaned profile
      if (profileExists && !authUserExists) {
        console.log('Cleaning up orphaned profile for:', email);
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('email', email);
        console.log('Orphaned profile cleaned up, proceeding with user creation');
      } else {
        return new Response(
          JSON.stringify({ error: `En användare med email ${email} existerar redan` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create user using admin client - the profile will be created automatically by the trigger
    console.log('Creating user with email:', email);
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    });

    if (createError) {
      console.error('User creation error:', createError);
      return new Response(
        JSON.stringify({ error: 'Kunde inte skapa användare: ' + createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Kunde inte skapa användare' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully, ID:', newUser.user.id);

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that the profile was created by the trigger
    const { data: createdProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('id', newUser.user.id)
      .single();

    if (profileCheckError) {
      console.error('Profile not created by trigger:', profileCheckError);
      // Clean up the created user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Profil skapades inte automatiskt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile created by trigger:', createdProfile);

    // Assign role using admin client
    const { error: roleAssignError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_id: newUser.user.id,
        role: role
      }]);

    if (roleAssignError) {
      console.error('Role assignment error:', roleAssignError);
      // Attempt to clean up
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to assign user role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully:', { userId: newUser.user.id, email, role, createdBy: user.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);