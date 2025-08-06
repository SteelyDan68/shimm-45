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

    const { user_id, reason, admin_user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔄 Starting soft delete for user: ${user_id}`);
    console.log(`🔐 Initiated by admin: ${admin_user_id}`);

    // Find user to verify they exist and are active
    const { data: userToDeactivate, error: userError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, is_active')
      .eq('id', user_id)
      .single();

    if (userError || !userToDeactivate) {
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

    if (!userToDeactivate.is_active) {
      console.log(`⚠️ User already deactivated: ${user_id}`);
      return new Response(
        JSON.stringify({ 
          error: 'User is already deactivated',
          user_id: user_id,
          email: userToDeactivate.email
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Found user: ${userToDeactivate.first_name} ${userToDeactivate.last_name} (${userToDeactivate.email}) - ID: ${userToDeactivate.id}`);

    // Use the soft delete function
    console.log('🔄 Starting soft deletion using soft_delete_user function...');
    
    const { data: softDeleteResult, error: softDeleteError } = await supabase
      .rpc('soft_delete_user', { 
        user_uuid: user_id, 
        deactivation_reason: reason || 'admin_action'
      });

    if (softDeleteError) {
      console.error('❌ Soft delete error:', softDeleteError);
      return new Response(
        JSON.stringify({ 
          error: 'Soft delete failed: ' + softDeleteError.message,
          user_id: user_id
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Soft delete completed:', softDeleteResult);

    console.log(`🎉 Soft delete successful for user: ${userToDeactivate.email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `User ${userToDeactivate.email} has been deactivated successfully.`,
        user_deactivated: {
          id: userToDeactivate.id,
          email: userToDeactivate.email,
          name: `${userToDeactivate.first_name} ${userToDeactivate.last_name}`
        },
        result: softDeleteResult
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