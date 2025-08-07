import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DataCollectionRequest {
  jobId: string;
  timestamp: string;
  force_refresh?: boolean;
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

    const { jobId, timestamp, force_refresh }: DataCollectionRequest = await req.json()
    
    console.log(`🔄 Starting data collection job: ${jobId} at ${timestamp}`)

    // Get job configuration
    let jobConfig: any = {};
    switch (jobId) {
      case '1':
        jobConfig = {
          name: 'Daily User Analytics Sync',
          tables: ['analytics_events', 'profiles'],
          type: 'analytics'
        };
        break;
      case '2':
        jobConfig = {
          name: 'Assessment Backup',
          tables: ['assessment_rounds', 'assessment_states'],
          type: 'backup'
        };
        break;
      case '3':
        jobConfig = {
          name: 'Real-time Event Processing',
          tables: ['analytics_events'],
          type: 'realtime'
        };
        break;
      default:
        throw new Error(`Unknown job ID: ${jobId}`);
    }

    let totalRecords = 0;
    let processedRecords = 0;
    const results = [];

    // Process each table in the job
    for (const table of jobConfig.tables) {
      console.log(`📊 Processing table: ${table}`)
      
      try {
        // Get record count
        const { count, error: countError } = await supabaseClient
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (countError) throw countError;
        
        totalRecords += count || 0;

        // Get actual data for processing
        const { data, error } = await supabaseClient
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000); // Process in batches

        if (error) throw error;

        processedRecords += data?.length || 0;

        // Process the data based on job type
        if (jobConfig.type === 'analytics') {
          // Aggregate analytics data
          const today = new Date().toISOString().split('T')[0];
          
          if (table === 'analytics_events' && data) {
            // Aggregate events by type
            const eventCounts = data.reduce((acc: any, event: any) => {
              acc[event.event] = (acc[event.event] || 0) + 1;
              return acc;
            }, {});

            // Store aggregated data
            for (const [eventType, count] of Object.entries(eventCounts)) {
              await supabaseClient
                .from('analytics_aggregations')
                .upsert({
                  date: today,
                  event_type: eventType,
                  event_count: count,
                  user_count: data.filter((e: any) => e.event === eventType && e.user_id).length
                }, {
                  onConflict: 'date,event_type'
                });
            }
          }
        }

        results.push({
          table,
          records: data?.length || 0,
          status: 'success'
        });

        console.log(`✅ Processed ${data?.length || 0} records from ${table}`);

      } catch (tableError) {
        console.error(`❌ Error processing table ${table}:`, tableError);
        results.push({
          table,
          records: 0,
          status: 'error',
          error: tableError.message
        });
      }
    }

    // Log the job execution
    await supabaseClient
      .from('admin_audit_log')
      .insert({
        action: 'data_collection_job',
        details: {
          job_id: jobId,
          job_name: jobConfig.name,
          total_records: totalRecords,
          processed_records: processedRecords,
          results,
          timestamp,
          force_refresh
        }
      });

    console.log(`🎯 Data collection job ${jobId} completed. Processed ${processedRecords}/${totalRecords} records`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        jobName: jobConfig.name,
        totalRecords,
        processedRecords,
        results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Data collection failed:', error)
    
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