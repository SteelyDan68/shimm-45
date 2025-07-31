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

    // Check if user already exists
    console.log('Checking if user already exists with email:', email);
    const { data: existingUser, error: existingUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (existingUserError) {
      console.error('Error checking existing users:', existingUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userAlreadyExists = existingUser.users.some(u => u.email === email);
    if (userAlreadyExists) {
      console.log('User already exists with email:', email);
      return new Response(
        JSON.stringify({ error: `En användare med email ${email} existerar redan` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user using admin client
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
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create profile using admin client
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: newUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName
      }]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Attempt to clean up the created user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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