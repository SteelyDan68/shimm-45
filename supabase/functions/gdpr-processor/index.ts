import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, reason } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing GDPR ${action} for user ${userId}`);

    if (action === 'export') {
      // Samla all användardata från alla tabeller
      const exportData = await collectUserData(supabase, userId);
      
      // Uppdatera request status
      await supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString(),
          download_url: `data:application/json;base64,${btoa(JSON.stringify(exportData, null, 2))}`,
          file_size_bytes: JSON.stringify(exportData).length,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dagar
        })
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      // Logga aktivitet
      await supabase.from('gdpr_audit_log').insert({
        user_id: userId,
        action: 'export_completed',
        details: { 
          data_size: JSON.stringify(exportData).length,
          tables_exported: Object.keys(exportData).length
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Data export completed',
          data_size: JSON.stringify(exportData).length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'delete') {
      // Kontrollera att begäran är godkänd
      const { data: deletionRequest } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single();

      if (!deletionRequest) {
        throw new Error('No approved deletion request found');
      }

      // Radera användardata från alla tabeller
      await deleteUserData(supabase, userId);

      // Uppdatera deletion request
      await supabase
        .from('data_deletion_requests')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString()
        })
        .eq('id', deletionRequest.id);

      // Logga aktivitet (sista gången för denna användare)
      await supabase.from('gdpr_audit_log').insert({
        user_id: userId,
        action: 'deletion_completed',
        details: { reason: deletionRequest.reason }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User data deletion completed' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('GDPR processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function collectUserData(supabase: any, userId: string) {
  const exportData: any = {
    export_info: {
      user_id: userId,
      export_date: new Date().toISOString(),
      data_format: 'JSON',
      retention_notice: 'This export contains all personal data we have stored about you as of the export date.'
    }
  };

  // Hämta profil
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (profile) exportData.profile = profile;
  } catch (e) {
    console.log('No profile found');
  }

  // Hämta klienter som användaren äger
  try {
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId);
    if (clients && clients.length > 0) exportData.clients = clients;
  } catch (e) {
    console.log('No clients found');
  }

  // Hämta meddelanden
  try {
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    if (messages && messages.length > 0) exportData.messages = messages;
  } catch (e) {
    console.log('No messages found');
  }

  // Hämta tasks
  try {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('created_by', userId);
    if (tasks && tasks.length > 0) exportData.tasks = tasks;
  } catch (e) {
    console.log('No tasks found');
  }

  // Hämta user roles
  try {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    if (roles && roles.length > 0) exportData.user_roles = roles;
  } catch (e) {
    console.log('No user roles found');
  }

  // Hämta GDPR-relaterad data
  try {
    const { data: consentRecords } = await supabase
      .from('user_consent_records')
      .select('*')
      .eq('user_id', userId);
    if (consentRecords && consentRecords.length > 0) exportData.consent_records = consentRecords;
  } catch (e) {
    console.log('No consent records found');
  }

  try {
    const { data: auditLogs } = await supabase
      .from('gdpr_audit_log')
      .select('*')
      .eq('user_id', userId);
    if (auditLogs && auditLogs.length > 0) exportData.gdpr_audit_logs = auditLogs;
  } catch (e) {
    console.log('No audit logs found');
  }

  return exportData;
}

async function deleteUserData(supabase: any, userId: string) {
  console.log(`Starting data deletion for user ${userId}`);

  // Radera i rätt ordning för att undvika foreign key constraints
  
  // 1. GDPR-specifika tabeller
  await supabase.from('user_consent_records').delete().eq('user_id', userId);
  await supabase.from('data_export_requests').delete().eq('user_id', userId);
  await supabase.from('data_deletion_requests').delete().eq('user_id', userId);
  
  // 2. Client-relaterad data
  const { data: userClients } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId);

  if (userClients && userClients.length > 0) {
    const clientIds = userClients.map(c => c.id);
    
    // Radera client-relaterad data
    await supabase.from('tasks').delete().in('client_id', clientIds);
    await supabase.from('path_entries').delete().in('client_id', clientIds);
    await supabase.from('assessment_rounds').delete().in('client_id', clientIds);
    await supabase.from('pillar_assessments').delete().in('client_id', clientIds);
    await supabase.from('calendar_events').delete().in('client_id', clientIds);
    await supabase.from('client_data_cache').delete().in('client_id', clientIds);
    await supabase.from('client_pillar_assignments').delete().in('client_id', clientIds);
    await supabase.from('client_pillar_activations').delete().in('client_id', clientIds);
    await supabase.from('assessment_form_assignments').delete().in('client_id', clientIds);
    await supabase.from('pillar_visualization_data').delete().in('client_id', clientIds);
  }

  // 3. Meddelanden
  await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
  
  // 4. User-specifik data
  await supabase.from('message_preferences').delete().eq('user_id', userId);
  await supabase.from('user_roles').delete().eq('user_id', userId);
  await supabase.from('organization_members').delete().eq('user_id', userId);
  
  // 5. Klienter (efter all relaterad data)
  await supabase.from('clients').delete().eq('user_id', userId);
  
  // 6. Profil
  await supabase.from('profiles').delete().eq('id', userId);
  
  // 7. GDPR audit logs (sist)
  await supabase.from('gdpr_audit_log').delete().eq('user_id', userId);

  console.log(`Data deletion completed for user ${userId}`);
}