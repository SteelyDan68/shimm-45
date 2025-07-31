import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserDeletionResult {
  user_found: boolean;
  deleted_profile: boolean;
  deleted_roles: number;
  deleted_assessments: number;
  deleted_tasks: number;
  deleted_messages: number;
  deleted_other_data: number;
  errors: string[];
}

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

    const result: UserDeletionResult = {
      user_found: false,
      deleted_profile: false,
      deleted_roles: 0,
      deleted_assessments: 0,
      deleted_tasks: 0,
      deleted_messages: 0,
      deleted_other_data: 0,
      errors: []
    };

    // 1. Find the user by name or email
    const { data: user, error: findError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .or(`email.ilike.%${identifier}%, first_name.ilike.%${identifier}%, last_name.ilike.%${identifier}%`)
      .single();

    if (findError || !user) {
      console.log(`❌ User not found: ${identifier}`);
      result.errors.push(`User not found: ${identifier}`);
      return new Response(
        JSON.stringify(result),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    result.user_found = true;
    const userId = user.id;
    const userName = `${user.first_name} ${user.last_name}`;
    
    console.log(`✅ Found user: ${userName} (${user.email}) - ID: ${userId}`);

    // Log the deletion request for GDPR compliance
    await supabase
      .from('gdpr_audit_log')
      .insert({
        action: 'user_deletion_initiated',
        user_id: userId,
        details: {
          initiated_by: admin_user_id,
          target_user: userName,
          target_email: user.email,
          deletion_reason: 'Administrative deletion via system interface'
        }
      });

    // 2. Delete all related data in the correct order to respect foreign key constraints

    // Delete assessment form assignments
    const { count: assessmentAssignmentsCount, error: assessmentAssignmentsError } = await supabase
      .from('assessment_form_assignments')
      .delete({ count: 'exact' })
      .eq('client_id', userId);
    
    if (assessmentAssignmentsError) {
      result.errors.push(`Failed to delete assessment form assignments: ${assessmentAssignmentsError.message}`);
    } else {
      result.deleted_other_data += assessmentAssignmentsCount || 0;
      console.log(`🗑️ Deleted ${assessmentAssignmentsCount} assessment form assignments for ${userName}`);
    }

    // Delete assessment rounds
    const { count: assessmentRoundsCount, error: assessmentRoundsError } = await supabase
      .from('assessment_rounds')
      .delete({ count: 'exact' })
      .eq('client_id', userId);
    
    if (assessmentRoundsError) {
      result.errors.push(`Failed to delete assessment rounds: ${assessmentRoundsError.message}`);
    } else {
      result.deleted_assessments += assessmentRoundsCount || 0;
      console.log(`🗑️ Deleted ${assessmentRoundsCount} assessment rounds for ${userName}`);
    }

    // Delete calendar events
    const { count: calendarEventsCount, error: calendarEventsError } = await supabase
      .from('calendar_events')
      .delete({ count: 'exact' })
      .eq('client_id', userId);
    
    if (calendarEventsError) {
      result.errors.push(`Failed to delete calendar events: ${calendarEventsError.message}`);
    } else {
      result.deleted_other_data += calendarEventsCount || 0;
      console.log(`🗑️ Deleted ${calendarEventsCount} calendar events for ${userName}`);
    }

    // Delete client data cache
    const { count: clientDataCacheCount, error: clientDataCacheError } = await supabase
      .from('client_data_cache')
      .delete({ count: 'exact' })
      .eq('client_id', userId);
    
    if (clientDataCacheError) {
      result.errors.push(`Failed to delete client data cache: ${clientDataCacheError.message}`);
    } else {
      result.deleted_other_data += clientDataCacheCount || 0;
      console.log(`🗑️ Deleted ${clientDataCacheCount} client data cache entries for ${userName}`);
    }

    // Delete client data containers
    const { count: clientDataContainersCount, error: clientDataContainersError } = await supabase
      .from('client_data_containers')
      .delete({ count: 'exact' })
      .eq('client_id', userId);
    
    if (clientDataContainersError) {
      result.errors.push(`Failed to delete client data containers: ${clientDataContainersError.message}`);
    } else {
      result.deleted_other_data += clientDataContainersCount || 0;
      console.log(`🗑️ Deleted ${clientDataContainersCount} client data containers for ${userName}`);
    }

    // Delete path entries
    const { count: pathEntriesCount, error: pathEntriesError } = await supabase
      .from('path_entries')
      .delete({ count: 'exact' })
      .eq('client_id', userId);
    
    if (pathEntriesError) {
      result.errors.push(`Failed to delete path entries: ${pathEntriesError.message}`);
    } else {
      result.deleted_other_data += pathEntriesCount || 0;
      console.log(`🗑️ Deleted ${pathEntriesCount} path entries for ${userName}`);
    }

    // Delete pillar assessments
    const { count: pillarAssessmentsCount, error: assessmentsError } = await supabase
      .from('pillar_assessments')
      .delete({ count: 'exact' })
      .eq('client_id', userId);
    
    if (assessmentsError) {
      result.errors.push(`Failed to delete pillar assessments: ${assessmentsError.message}`);
    } else {
      result.deleted_assessments += pillarAssessmentsCount || 0;
      console.log(`🗑️ Deleted ${pillarAssessmentsCount} pillar assessments for ${userName}`);
    }

    // Delete tasks
    const { count: tasksCount, error: tasksError } = await supabase
      .from('tasks')
      .delete({ count: 'exact' })
      .eq('client_id', userId);
    
    if (tasksError) {
      result.errors.push(`Failed to delete tasks: ${tasksError.message}`);
    } else {
      result.deleted_tasks += tasksCount || 0;
      console.log(`🗑️ Deleted ${tasksCount} tasks for ${userName}`);
    }

    // Delete messages (as sender or receiver)
    const { count: messagesCount, error: messagesError } = await supabase
      .from('messages')
      .delete({ count: 'exact' })
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    
    if (messagesError) {
      result.errors.push(`Failed to delete messages: ${messagesError.message}`);
    } else {
      result.deleted_messages += messagesCount || 0;
      console.log(`🗑️ Deleted ${messagesCount} messages for ${userName}`);
    }

    // Delete user relationships (as coach or client)
    const { count: relationshipsCount, error: relationshipsError } = await supabase
      .from('user_relationships')
      .delete({ count: 'exact' })
      .or(`coach_id.eq.${userId},client_id.eq.${userId}`);
    
    if (relationshipsError) {
      result.errors.push(`Failed to delete user relationships: ${relationshipsError.message}`);
    } else {
      result.deleted_other_data += relationshipsCount || 0;
      console.log(`🗑️ Deleted ${relationshipsCount} user relationships for ${userName}`);
    }

    // Delete invitations (sent by user)
    const { count: invitationsCount, error: invitationsError } = await supabase
      .from('invitations')
      .delete({ count: 'exact' })
      .eq('invited_by', userId);
    
    if (invitationsError) {
      result.errors.push(`Failed to delete invitations: ${invitationsError.message}`);
    } else {
      result.deleted_other_data += invitationsCount || 0;
      console.log(`🗑️ Deleted ${invitationsCount} invitations for ${userName}`);
    }

    // Delete training data
    const { count: trainingDataCount, error: trainingDataError } = await supabase
      .from('training_data_stefan')
      .delete({ count: 'exact' })
      .eq('user_id', userId);
    
    if (trainingDataError) {
      result.errors.push(`Failed to delete training data: ${trainingDataError.message}`);
    } else {
      result.deleted_other_data += trainingDataCount || 0;
      console.log(`🗑️ Deleted ${trainingDataCount} training data entries for ${userName}`);
    }

    // Delete user roles
    const { count: rolesCount, error: rolesError } = await supabase
      .from('user_roles')
      .delete({ count: 'exact' })
      .eq('user_id', userId);
    
    if (rolesError) {
      result.errors.push(`Failed to delete user roles: ${rolesError.message}`);
    } else {
      result.deleted_roles += rolesCount || 0;
      console.log(`🗑️ Deleted ${rolesCount} user roles for ${userName}`);
    }

    // Delete from clients table by user_id (primary relationship)
    const { count: clientsCount, error: clientsError } = await supabase
      .from('clients')
      .delete({ count: 'exact' })
      .eq('user_id', userId);
    
    if (clientsError) {
      result.errors.push(`Failed to delete clients: ${clientsError.message}`);
    } else {
      result.deleted_other_data += clientsCount || 0;
      console.log(`🗑️ Deleted ${clientsCount} client records for ${userName}`);
    }

    // Also delete from clients table by email (fallback for legacy data)
    const { count: legacyClientsCount, error: legacyError } = await supabase
      .from('clients')
      .delete({ count: 'exact' })
      .eq('email', user.email);
    
    if (legacyError) {
      console.log(`ℹ️ No legacy client data found by email for ${userName}`);
    } else if (legacyClientsCount && legacyClientsCount > 0) {
      result.deleted_other_data += legacyClientsCount;
      console.log(`🗑️ Deleted ${legacyClientsCount} legacy client records by email for ${userName}`);
    }

    // 3. Finally, delete the profile
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (deleteProfileError) {
      result.errors.push(`Failed to delete profile: ${deleteProfileError.message}`);
    } else {
      result.deleted_profile = true;
      console.log(`🗑️ Deleted profile for ${userName}`);
    }

    // Log completion
    await supabase
      .from('gdpr_audit_log')
      .insert({
        action: 'user_deletion_completed',
        user_id: admin_user_id, // Log against admin since user is deleted
        details: {
          target_user: userName,
          target_email: user.email,
          deletion_result: result,
          completion_status: result.errors.length === 0 ? 'success' : 'partial_failure'
        }
      });

    console.log(`🎉 User deletion completed for ${userName}. Errors: ${result.errors.length}`);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('User deletion failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'User deletion failed', 
        details: error.message,
        user_found: false,
        deleted_profile: false,
        deleted_roles: 0,
        deleted_assessments: 0,
        deleted_tasks: 0,
        deleted_messages: 0,
        deleted_other_data: 0,
        errors: [error.message]
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});