import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Service role client bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function emergencyAdminSetup(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🚨 Emergency admin setup for user: ${userId}`)

    // First, ensure the user has a profile (especially for Stefan)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: 'stefan.hallgren@gmail.com',
        first_name: 'Stefan',
        last_name: 'Hallgren',
        organization: 'Stefan Hallgren Consulting',
        job_title: 'Superadmin & Systemutvecklare',
        bio: 'Grundare och huvudutvecklare av systemet. Ansvarig för teknisk utveckling och systemadministration.',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()

    if (profileError) {
      console.error('Error creating/updating profile:', profileError)
      return { success: false, error: profileError.message }
    }

    console.log('✅ Profile created/updated:', profile)

    // Remove any existing roles for this user
    const { error: deleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting existing roles:', deleteError)
    }

    // Add superadmin role using service role (bypasses RLS)
    const { error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'superadmin',
        assigned_by: userId,
        assigned_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error inserting superadmin role:', insertError)
      return { success: false, error: insertError.message }
    }

    // Ensure message preferences exist
    const { error: prefsError } = await supabaseAdmin
      .from('message_preferences')
      .upsert({
        user_id: userId,
        email_notifications: true,
        internal_notifications: true,
        auto_ai_assistance: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (prefsError) {
      console.log('Warning: Could not create message preferences:', prefsError)
    }

    console.log('✅ Superadmin role successfully created')
    return { success: true }

  } catch (error: any) {
    console.error('Emergency admin setup failed:', error)
    return { success: false, error: error.message }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }

    const result = await emergencyAdminSetup(userId)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    )
  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )
  }
})