/**
 * ========================================================
 * UNIFIED USER OPERATIONS - SINGLE SOURCE OF TRUTH
 * ========================================================
 * 
 * This edge function replaces ALL the old client_id based functions
 * Everything now uses user_id consistently
 * Handles all user operations through roles and relationships
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { resolveUser, buildUserContext } from '../_shared/unified-user-resolver.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, operation, data } = await req.json();

    console.log('=== UNIFIED USER OPERATIONS ===');
    console.log('User ID:', user_id);
    console.log('Operation:', operation);

    if (!user_id) {
      throw new Error('user_id is required - Single Source of Truth!');
    }

    // Resolve user data first
    const userData = await resolveUser(user_id, supabase);
    if (!userData) {
      throw new Error('User not found');
    }

    let result: any = null;

    switch (operation) {
      case 'get_user_data':
        // Get all data for a user from the new unified tables
        const { data: userDataCache, error: cacheError } = await supabase
          .from('user_data_cache')
          .select('*')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false });

        if (cacheError) throw cacheError;

        result = {
          userData,
          dataCache: userDataCache || [],
          totalItems: userDataCache?.length || 0
        };
        break;

      case 'get_user_timeline':
        // Get user's timeline/path entries
        const { data: timelineData, error: timelineError } = await supabase
          .from('path_entries')
          .select('*')
          .eq('user_id', user_id)
          .order('timestamp', { ascending: false });

        if (timelineError) throw timelineError;

        result = {
          userData,
          timeline: timelineData || []
        };
        break;

      case 'get_user_relationships':
        // Get coaching relationships for this user
        result = {
          userData,
          relationships: {
            asCoach: userData.coach_relationships,
            asClient: userData.client_relationships
          }
        };
        break;

      case 'update_user_data':
        // Update user data in cache
        const { data: updateResult, error: updateError } = await supabase
          .from('user_data_cache')
          .upsert({
            user_id: user_id,
            data_type: data.data_type,
            data: data.data,
            metadata: data.metadata || {},
            updated_at: new Date().toISOString()
          });

        if (updateError) throw updateError;

        result = {
          success: true,
          updated: updateResult
        };
        break;

      case 'create_path_entry':
        // Create new timeline entry
        const { data: pathResult, error: pathError } = await supabase
          .from('path_entries')
          .insert({
            user_id: user_id,
            created_by: data.created_by || user_id,
            type: data.type,
            title: data.title,
            details: data.details,
            content: data.content,
            status: data.status || 'completed',
            ai_generated: data.ai_generated || false,
            visible_to_client: data.visible_to_client !== false,
            created_by_role: data.created_by_role || 'system',
            metadata: data.metadata || {}
          })
          .select()
          .single();

        if (pathError) throw pathError;

        result = {
          success: true,
          pathEntry: pathResult
        };
        break;

      case 'aggregate_user_data':
        // Aggregate all user data containers
        const { data: containers, error: containerError } = await supabase
          .from('user_data_containers')
          .select('*')
          .eq('user_id', user_id);

        if (containerError) throw containerError;

        // Aggregate pillar activations
        const { data: pillars, error: pillarError } = await supabase
          .from('user_pillar_activations')
          .select('*')
          .eq('user_id', user_id);

        if (pillarError) throw pillarError;

        result = {
          userData,
          containers: containers || [],
          pillars: pillars || [],
          summary: {
            totalContainers: containers?.length || 0,
            activePillars: pillars?.filter(p => p.is_active).length || 0
          }
        };
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    console.log('Operation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in unified user operations:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});