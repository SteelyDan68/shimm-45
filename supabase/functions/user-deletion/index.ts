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

    const { identifier, admin_user_id } = await req.json();

    if (!identifier) {
      return new Response(
        JSON.stringify({ error: 'Identifier (email or name) is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔍 Starting comprehensive user deletion for: ${identifier}`);
    console.log(`🔐 Initiated by admin: ${admin_user_id}`);

    // Find user by email or name
    let userToDelete = null;
    let searchField = '';
    
    // First try to find by email
    const { data: userByEmail } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', identifier)
      .maybeSingle();

    if (userByEmail) {
      userToDelete = userByEmail;
      searchField = 'email';
    } else {
      // Try to find by name (first_name + last_name)
      const { data: usersByName } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${identifier}%, last_name.ilike.%${identifier}%`)
        .limit(5);

      if (usersByName && usersByName.length === 1) {
        userToDelete = usersByName[0];
        searchField = 'name';
      } else if (usersByName && usersByName.length > 1) {
        return new Response(
          JSON.stringify({ 
            error: 'Multiple users found with that name. Please use email address for exact match.',
            found_users: usersByName.map(u => ({ id: u.id, name: `${u.first_name} ${u.last_name}`, email: u.email }))
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    if (!userToDelete) {
      console.log(`❌ User not found: ${identifier}`);
      return new Response(
        JSON.stringify({ 
          error: 'User not found',
          searched_for: identifier
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Found user: ${userToDelete.first_name} ${userToDelete.last_name} (${userToDelete.email}) - ID: ${userToDelete.id}`);

    // Use the new comprehensive deletion function
    console.log('🧹 Starting comprehensive cleanup using delete_user_completely function...');
    
    try {
      const { data: deletionResult, error: deletionError } = await supabase
        .rpc('delete_user_completely', { user_uuid: userToDelete.id });

      if (deletionError) {
        console.error('❌ Database deletion error:', deletionError);
        return new Response(
          JSON.stringify({ 
            error: 'Database deletion failed: ' + deletionError.message,
            user_id: userToDelete.id
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('✅ Database cleanup completed:', deletionResult);

      // Delete from auth.users as well
      console.log('🔐 Deleting from auth.users...');
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userToDelete.id);
      
      if (authDeleteError) {
        console.error('⚠️ Auth deletion failed (user may not exist in auth):', authDeleteError);
        // Don't fail the whole operation for this
      } else {
        console.log('✅ Successfully deleted from auth.users');
      }

      // Log the successful deletion for audit purposes
      await supabase
        .from('gdpr_audit_log')
        .insert({
          action: 'user_deletion_complete',
          user_id: admin_user_id, // The admin who performed the deletion
          details: {
            deleted_user_id: userToDelete.id,
            deleted_user_email: userToDelete.email,
            deleted_user_name: `${userToDelete.first_name} ${userToDelete.last_name}`,
            deletion_method: 'comprehensive_cleanup_function',
            database_result: deletionResult
          }
        });

      console.log(`🎉 Complete deletion successful for user: ${userToDelete.email}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: `User ${userToDelete.email} has been completely deleted from all systems.`,
          user_deleted: {
            id: userToDelete.id,
            email: userToDelete.email,
            name: `${userToDelete.first_name} ${userToDelete.last_name}`
          },
          deletion_details: deletionResult
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('💥 Unexpected error during deletion:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Unexpected error during deletion: ' + error.message,
          user_id: userToDelete.id
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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