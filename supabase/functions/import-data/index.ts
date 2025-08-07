import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportRequest {
  data: any;
  type: 'analytics' | 'users' | 'assessments' | 'backup';
  userId: string;
  timestamp: string;
  options?: {
    overwrite?: boolean;
    validate?: boolean;
    dryRun?: boolean;
  };
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

    const { data, type, userId, timestamp, options = {} }: ImportRequest = await req.json()
    
    console.log(`📥 Starting import: ${type} by user ${userId}`)

    const results = {
      imported: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    // Validate data structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format');
    }

    // Process import based on type
    switch (type) {
      case 'analytics':
        if (data.events && Array.isArray(data.events)) {
          for (const event of data.events) {
            try {
              if (options.dryRun) {
                results.imported++;
                continue;
              }

              const { error } = await supabaseClient
                .from('analytics_events')
                .upsert(event, {
                  onConflict: 'id'
                });

              if (error) throw error;
              results.imported++;
              
            } catch (eventError) {
              console.error('Error importing event:', eventError);
              results.errors++;
              results.details.push({
                type: 'event',
                id: event.id,
                error: eventError.message
              });
            }
          }
        }

        if (data.metrics && Array.isArray(data.metrics)) {
          for (const metric of data.metrics) {
            try {
              if (options.dryRun) {
                results.imported++;
                continue;
              }

              const { error } = await supabaseClient
                .from('analytics_metrics')
                .upsert(metric, {
                  onConflict: 'id'
                });

              if (error) throw error;
              results.imported++;
              
            } catch (metricError) {
              console.error('Error importing metric:', metricError);
              results.errors++;
              results.details.push({
                type: 'metric',
                id: metric.id,
                error: metricError.message
              });
            }
          }
        }
        break;

      case 'users':
        if (data.users && Array.isArray(data.users)) {
          for (const user of data.users) {
            try {
              if (options.dryRun) {
                results.imported++;
                continue;
              }

              // Check if user already exists
              const { data: existing } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('email', user.email)
                .single();

              if (existing && !options.overwrite) {
                results.skipped++;
                continue;
              }

              const { error } = await supabaseClient
                .from('profiles')
                .upsert(user, {
                  onConflict: 'email'
                });

              if (error) throw error;
              results.imported++;
              
            } catch (userError) {
              console.error('Error importing user:', userError);
              results.errors++;
              results.details.push({
                type: 'user',
                email: user.email,
                error: userError.message
              });
            }
          }
        }

        if (data.roles && Array.isArray(data.roles)) {
          for (const role of data.roles) {
            try {
              if (options.dryRun) {
                results.imported++;
                continue;
              }

              const { error } = await supabaseClient
                .from('user_roles')
                .upsert(role, {
                  onConflict: 'user_id,role'
                });

              if (error) throw error;
              results.imported++;
              
            } catch (roleError) {
              console.error('Error importing role:', roleError);
              results.errors++;
              results.details.push({
                type: 'role',
                id: role.id,
                error: roleError.message
              });
            }
          }
        }
        break;

      case 'assessments':
        if (data.assessment_rounds && Array.isArray(data.assessment_rounds)) {
          for (const assessment of data.assessment_rounds) {
            try {
              if (options.dryRun) {
                results.imported++;
                continue;
              }

              const { error } = await supabaseClient
                .from('assessment_rounds')
                .upsert(assessment, {
                  onConflict: 'id'
                });

              if (error) throw error;
              results.imported++;
              
            } catch (assessmentError) {
              console.error('Error importing assessment:', assessmentError);
              results.errors++;
              results.details.push({
                type: 'assessment',
                id: assessment.id,
                error: assessmentError.message
              });
            }
          }
        }

        if (data.templates && Array.isArray(data.templates)) {
          for (const template of data.templates) {
            try {
              if (options.dryRun) {
                results.imported++;
                continue;
              }

              const { error } = await supabaseClient
                .from('assessment_templates')
                .upsert(template, {
                  onConflict: 'id'
                });

              if (error) throw error;
              results.imported++;
              
            } catch (templateError) {
              console.error('Error importing template:', templateError);
              results.errors++;
              results.details.push({
                type: 'template',
                id: template.id,
                error: templateError.message
              });
            }
          }
        }
        break;

      case 'backup':
        // Handle full backup restoration
        const tables = ['profiles', 'user_roles', 'assessment_rounds', 'analytics_events', 'analytics_metrics'];
        
        for (const table of tables) {
          if (data[table] && Array.isArray(data[table])) {
            for (const record of data[table]) {
              try {
                if (options.dryRun) {
                  results.imported++;
                  continue;
                }

                const { error } = await supabaseClient
                  .from(table)
                  .upsert(record, {
                    onConflict: 'id'
                  });

                if (error) throw error;
                results.imported++;
                
              } catch (recordError) {
                console.error(`Error importing ${table} record:`, recordError);
                results.errors++;
                results.details.push({
                  type: table,
                  id: record.id,
                  error: recordError.message
                });
              }
            }
          }
        }
        break;

      default:
        throw new Error(`Unknown import type: ${type}`);
    }

    // Log the import operation
    if (!options.dryRun) {
      await supabaseClient
        .from('admin_audit_log')
        .insert({
          admin_user_id: userId,
          action: 'data_import',
          details: {
            import_type: type,
            timestamp,
            results,
            options,
            dry_run: options.dryRun || false
          }
        });
    }

    console.log(`✅ Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        type,
        results,
        timestamp: new Date().toISOString(),
        dry_run: options.dryRun || false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Import failed:', error)
    
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