import { createClient } from '@supabase/supabase-js'

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

    // First, remove any existing roles for this user
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
        role: 'superadmin'
      })

    if (insertError) {
      console.error('Error inserting superadmin role:', insertError)
      return { success: false, error: insertError.message }
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