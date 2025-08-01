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
  extendedProfile?: {
    personnummer?: string;
    phone?: string;
    address?: {
      street?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
    bio?: string;
    organization?: string;
    job_title?: string;
    instagram_handle?: string;
    youtube_handle?: string;
    tiktok_handle?: string;
    facebook_handle?: string;
    twitter_handle?: string;
    snapchat_handle?: string;
  };
  sendInviteEmail?: boolean;
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

    console.log('Admin check passed, proceeding to parse request body...');

    // Parse and validate request body
    let requestBody;
    try {
      console.log('Attempting to parse request body...');
      requestBody = await req.json();
      console.log('Request body parsed successfully:', { email: requestBody?.email, role: requestBody?.role });
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting fields from request body...');
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      extendedProfile,
      sendInviteEmail = false 
    }: CreateUserRequest = requestBody;
    console.log('Fields extracted:', { 
      email, 
      firstName, 
      lastName, 
      role, 
      hasPassword: !!password,
      hasExtendedProfile: !!extendedProfile,
      sendInviteEmail 
    });

    // Input validation
    console.log('Performing input validation...');
    if (!email || !password || !firstName || !lastName || !role) {
      console.error('Missing required fields:', { email: !!email, password: !!password, firstName: !!firstName, lastName: !!lastName, role: !!role });
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

    // Validate personnummer if provided
    if (extendedProfile?.personnummer) {
      const cleaned = extendedProfile.personnummer.replace(/\D/g, '');
      if (cleaned.length !== 12 || !/^\d{12}$/.test(cleaned)) {
        return new Response(
          JSON.stringify({ error: 'Personnummer must be 12 digits' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate role is one of the allowed values
    const allowedRoles = ['superadmin', 'admin', 'coach', 'client', 'user'];
    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists and clean up any ghost references
    console.log('Checking if user already exists with email:', email);
    
    // First, clean up any potential ghost references for this email
    console.log('Performing cleanup of any ghost references...');
    try {
      const { error: cleanupError } = await supabaseAdmin
        .rpc('cleanup_user_references', { target_email: email });
      
      if (cleanupError) {
        console.error('Cleanup error (non-critical):', cleanupError);
        console.error('Cleanup error details:', JSON.stringify(cleanupError, null, 2));
        // Continue anyway - cleanup failure shouldn't block user creation
      } else {
        console.log('Ghost reference cleanup completed successfully');
      }
    } catch (cleanupErr) {
      console.log('Cleanup failed (continuing anyway):', cleanupErr);
    }
    
    // Check auth.users table using admin listUsers and force delete if needed
    const { data: existingUser, error: existingUserError } = await supabaseAdmin.auth.admin.listUsers();
    if (existingUserError) {
      console.error('Error checking existing users:', existingUserError);
      return new Response(
        JSON.stringify({ error: 'Kunde inte kontrollera befintliga användare' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingAuthUser = existingUser.users.find(u => u.email === email);
    if (existingAuthUser) {
      console.log('Found existing auth user, attempting to delete:', existingAuthUser.id);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
      if (deleteError) {
        console.error('Failed to delete existing auth user:', deleteError);
        return new Response(
          JSON.stringify({ 
            error: `Kunde inte ta bort befintlig användare med email ${email}. Kontakta systemadministratör.`,
            details: { deleteError: deleteError.message }
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Successfully deleted existing auth user');
    }

    // Check profiles table for any leftover profiles after cleanup
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (profileCheckError) {
      console.error('Error checking existing profiles:', profileCheckError);
      return new Response(
        JSON.stringify({ error: 'Kunde inte kontrollera befintliga profiler' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingProfile) {
      console.log('Found existing profile, attempting to delete:', existingProfile.id);
      const { error: deleteProfileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', existingProfile.id);
      
      if (deleteProfileError) {
        console.error('Failed to delete existing profile:', deleteProfileError);
        return new Response(
          JSON.stringify({ 
            error: `Kunde inte ta bort befintlig profil för ${email}. Kontakta systemadministratör.`,
            details: { deleteError: deleteProfileError.message }
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Successfully deleted existing profile');
    }

    console.log('User cleanup complete, ready to create new user');

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

    // Wait longer for the trigger to create the profile
    console.log('Waiting for trigger to create profile...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Increased to 500ms

    // Verify that the profile was created by the trigger - try multiple times
    let createdProfile = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!createdProfile && attempts < maxAttempts) {
      attempts++;
      console.log(`Profile verification attempt ${attempts}/${maxAttempts}`);
      
      const { data: profileData, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', newUser.user.id)
        .maybeSingle();

      if (profileCheckError) {
        console.error(`Profile check error on attempt ${attempts}:`, profileCheckError);
        if (attempts === maxAttempts) {
          // Clean up the created user
          console.log('Max attempts reached, cleaning up user...');
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          return new Response(
            JSON.stringify({ error: 'Profil skapades inte automatiskt: ' + profileCheckError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }
      
      createdProfile = profileData;
      if (createdProfile) {
        console.log('Profile created successfully by trigger:', createdProfile);
        break;
      } else {
        console.log(`Profile not found on attempt ${attempts}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    if (!createdProfile) {
      console.error('Profile was not created by trigger after all attempts');
      // Clean up the created user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Profil skapades inte automatiskt av databasutlösaren' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile with extended information if provided
    if (extendedProfile) {
      console.log('Updating profile with extended information...');
      
      const profileUpdateData: any = {};
      
      if (extendedProfile.personnummer) {
        profileUpdateData.profile_metadata = {
          personnummer: extendedProfile.personnummer
        };
      }
      
      if (extendedProfile.phone) profileUpdateData.phone = extendedProfile.phone;
      if (extendedProfile.bio) profileUpdateData.bio = extendedProfile.bio;
      if (extendedProfile.organization) profileUpdateData.organization = extendedProfile.organization;
      if (extendedProfile.job_title) profileUpdateData.job_title = extendedProfile.job_title;
      
      // Address information
      if (extendedProfile.address) {
        profileUpdateData.address = extendedProfile.address;
      }
      
      // Social media handles
      if (extendedProfile.instagram_handle) profileUpdateData.instagram_handle = extendedProfile.instagram_handle;
      if (extendedProfile.youtube_handle) profileUpdateData.youtube_handle = extendedProfile.youtube_handle;
      if (extendedProfile.tiktok_handle) profileUpdateData.tiktok_handle = extendedProfile.tiktok_handle;
      if (extendedProfile.facebook_handle) profileUpdateData.facebook_handle = extendedProfile.facebook_handle;
      if (extendedProfile.twitter_handle) profileUpdateData.twitter_handle = extendedProfile.twitter_handle;
      if (extendedProfile.snapchat_handle) profileUpdateData.snapchat_handle = extendedProfile.snapchat_handle;

      if (Object.keys(profileUpdateData).length > 0) {
        const { error: profileUpdateError } = await supabaseAdmin
          .from('profiles')
          .update(profileUpdateData)
          .eq('id', newUser.user.id);

        if (profileUpdateError) {
          console.error('Error updating profile with extended data:', profileUpdateError);
          // Don't fail the entire operation, just log the error
        } else {
          console.log('Profile updated with extended information successfully');
        }
      }
    }

    // Ta bort eventuell automatiskt skapad 'user' roll först
    console.log('Removing any default user role before assigning specified role...');
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', newUser.user.id)
      .eq('role', 'user');

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