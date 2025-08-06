import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, admin_user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔄 Starting reactivation for user: ${user_id}`);
    console.log(`🔐 Initiated by admin: ${admin_user_id}`);

    // Find user to verify they exist and are inactive
    const { data: userToReactivate, error: userError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, is_active')
      .eq('id', user_id)
      .single();

    if (userError || !userToReactivate) {
      console.log(`❌ User not found: ${user_id}`);
      return new Response(
        JSON.stringify({ 
          error: 'User not found',
          user_id: user_id
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (userToReactivate.is_active) {
      console.log(`⚠️ User already active: ${user_id}`);
      return new Response(
        JSON.stringify({ 
          error: 'User is already active',
          user_id: user_id,
          email: userToReactivate.email
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Found inactive user: ${userToReactivate.first_name} ${userToReactivate.last_name} (${userToReactivate.email}) - ID: ${userToReactivate.id}`);

    // Use the reactivation function
    console.log('🔄 Starting reactivation using reactivate_user function...');
    
    const { data: reactivateResult, error: reactivateError } = await supabase
      .rpc('reactivate_user', { user_uuid: user_id });

    if (reactivateError) {
      console.error('❌ Reactivation error:', reactivateError);
      return new Response(
        JSON.stringify({ 
          error: 'Reactivation failed: ' + reactivateError.message,
          user_id: user_id
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Reactivation completed:', reactivateResult);

    console.log(`🎉 Reactivation successful for user: ${userToReactivate.email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `User ${userToReactivate.email} has been reactivated successfully.`,
        user_reactivated: {
          id: userToReactivate.id,
          email: userToReactivate.email,
          name: `${userToReactivate.first_name} ${userToReactivate.last_name}`
        },
        result: reactivateResult
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Request processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Request processing failed: ' + error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});