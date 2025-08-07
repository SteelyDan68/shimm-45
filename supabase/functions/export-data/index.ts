import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  format: 'csv' | 'json' | 'pdf';
  type: 'analytics' | 'data_collection' | 'users' | 'assessments';
  userId: string;
  timestamp: string;
  filters?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { format, type, userId, timestamp, filters }: ExportRequest = await req.json()
    
    console.log(`📦 Starting export: ${type} as ${format} for user ${userId}`)

    let exportData: any = {};
    let filename = `export_${type}_${new Date().toISOString().split('T')[0]}`;

    // Collect data based on type
    switch (type) {
      case 'analytics':
        const [eventsResponse, aggregationsResponse, metricsResponse] = await Promise.all([
          supabaseClient.from('analytics_events').select('*').order('timestamp', { ascending: false }).limit(10000),
          supabaseClient.from('analytics_aggregations').select('*').order('date', { ascending: false }).limit(1000),
          supabaseClient.from('analytics_metrics').select('*').order('recorded_at', { ascending: false }).limit(1000)
        ]);

        exportData = {
          events: eventsResponse.data || [],
          aggregations: aggregationsResponse.data || [],
          metrics: metricsResponse.data || [],
          metadata: {
            exported_at: timestamp,
            exported_by: userId,
            total_events: eventsResponse.data?.length || 0,
            total_aggregations: aggregationsResponse.data?.length || 0,
            total_metrics: metricsResponse.data?.length || 0
          }
        };
        break;

      case 'data_collection':
        const [profilesResponse, sessionsResponse, recommendationsResponse] = await Promise.all([
          supabaseClient.from('profiles').select('id, email, created_at, is_active').order('created_at', { ascending: false }),
          supabaseClient.from('ai_coaching_sessions').select('*').order('start_time', { ascending: false }).limit(5000),
          supabaseClient.from('ai_coaching_recommendations').select('*').order('created_at', { ascending: false }).limit(5000)
        ]);

        exportData = {
          profiles: profilesResponse.data || [],
          coaching_sessions: sessionsResponse.data || [],
          recommendations: recommendationsResponse.data || [],
          metadata: {
            exported_at: timestamp,
            exported_by: userId,
            total_profiles: profilesResponse.data?.length || 0,
            total_sessions: sessionsResponse.data?.length || 0,
            total_recommendations: recommendationsResponse.data?.length || 0
          }
        };
        break;

      case 'users':
        const [usersResponse, rolesResponse, attributesResponse] = await Promise.all([
          supabaseClient.from('profiles').select('*').order('created_at', { ascending: false }),
          supabaseClient.from('user_roles').select('*'),
          supabaseClient.from('user_attributes').select('*').eq('is_active', true)
        ]);

        exportData = {
          users: usersResponse.data || [],
          roles: rolesResponse.data || [],
          attributes: attributesResponse.data || [],
          metadata: {
            exported_at: timestamp,
            exported_by: userId,
            total_users: usersResponse.data?.length || 0,
            total_roles: rolesResponse.data?.length || 0,
            total_attributes: attributesResponse.data?.length || 0
          }
        };
        break;

      case 'assessments':
        const [assessmentsResponse, templatesResponse, statesResponse] = await Promise.all([
          supabaseClient.from('assessment_rounds').select('*').order('created_at', { ascending: false }),
          supabaseClient.from('assessment_templates').select('*'),
          supabaseClient.from('assessment_states').select('*').order('created_at', { ascending: false }).limit(5000)
        ]);

        exportData = {
          assessment_rounds: assessmentsResponse.data || [],
          templates: templatesResponse.data || [],
          states: statesResponse.data || [],
          metadata: {
            exported_at: timestamp,
            exported_by: userId,
            total_assessments: assessmentsResponse.data?.length || 0,
            total_templates: templatesResponse.data?.length || 0,
            total_states: statesResponse.data?.length || 0
          }
        };
        break;

      default:
        throw new Error(`Unknown export type: ${type}`);
    }

    // Format data based on requested format
    let responseData: string;
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case 'json':
        responseData = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
        break;

      case 'csv':
        // Convert to CSV (simplified - takes first table in exportData)
        const firstTable = Object.values(exportData)[0] as any[];
        if (Array.isArray(firstTable) && firstTable.length > 0) {
          const headers = Object.keys(firstTable[0]).join(',');
          const rows = firstTable.map(row => 
            Object.values(row).map(val => 
              typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
          ).join('\n');
          responseData = `${headers}\n${rows}`;
        } else {
          responseData = 'No data available';
        }
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;

      case 'pdf':
        // For PDF, we'll return JSON with a note about PDF generation
        responseData = JSON.stringify({
          ...exportData,
          note: 'PDF export feature requires additional setup. Data provided in JSON format.'
        }, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Log the export
    await supabaseClient
      .from('admin_audit_log')
      .insert({
        admin_user_id: userId,
        action: 'data_export',
        details: {
          export_type: type,
          format,
          timestamp,
          record_count: Object.values(exportData).reduce((total: number, table: any) => {
            return total + (Array.isArray(table) ? table.length : 0);
          }, 0),
          filters
        }
      });

    console.log(`✅ Export completed: ${type} as ${format}`);

    return new Response(responseData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`
      },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Export failed:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})