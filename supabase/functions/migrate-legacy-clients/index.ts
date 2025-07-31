import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Starting legacy clients migration via edge function...')

    // Get all clients from legacy table
    const { data: legacyClients, error: legacyError } = await supabaseAdmin
      .from('clients')
      .select('*')

    if (legacyError) {
      console.error('Failed to fetch legacy clients:', legacyError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch legacy clients', details: legacyError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!legacyClients || legacyClients.length === 0) {
      console.log('✅ No legacy clients to migrate')
      return new Response(
        JSON.stringify({ migrated: 0, skipped: 0, errors: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📊 Found ${legacyClients.length} legacy clients to migrate:`, legacyClients.map(c => c.name))

    // Get existing profiles to avoid duplicates
    const { data: existingProfiles } = await supabaseAdmin
      .from('profiles')
      .select('email, id')

    const existingEmails = new Set(existingProfiles?.map(p => p.email) || [])
    console.log('Existing profile emails:', Array.from(existingEmails))

    const result = {
      migrated: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // Migrate each client
    for (const client of legacyClients) {
      try {
        console.log(`Processing client: ${client.name} (${client.email})`)
        
        // Skip if profile already exists
        if (existingEmails.has(client.email)) {
          console.log(`⏭️  Skipping ${client.name} - profile already exists`)
          result.skipped++
          continue
        }

        // Generate a unique ID for the profile
        const profileId = crypto.randomUUID()
        
        // Create profile entry
        const profileData = {
          id: profileId,
          email: client.email,
          first_name: client.name?.split(' ')[0] || '',
          last_name: client.name?.split(' ').slice(1).join(' ') || '',
          status: client.status || 'active',
          organization: client.category || null,
          preferences: {
            legacy_client_data: {
              original_id: client.id,
              user_id: client.user_id,
              category: client.category,
              instagram_handle: client.instagram_handle,
              profile_metadata: client.profile_metadata,
              logic_state: client.logic_state,
              velocity_score: client.velocity_score,
              custom_fields: client.custom_fields,
              migrated_at: new Date().toISOString()
            }
          }
        }

        // Insert into profiles using admin client (bypasses RLS)
        const { data: newProfile, error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert(profileData)
          .select('id')
          .single()

        if (insertError) {
          console.error(`Failed to create profile for ${client.name}:`, insertError)
          result.errors.push(`Failed to create profile for ${client.name}: ${insertError.message}`)
          continue
        }

        // Assign client role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newProfile.id,
            role: 'client'
          })

        if (roleError) {
          console.error(`Failed to assign role for ${client.name}:`, roleError)
          result.errors.push(`Failed to assign role for ${client.name}: ${roleError.message}`)
          continue
        }

        console.log(`✅ Migrated ${client.name} to profiles system`)
        result.migrated++

      } catch (error: any) {
        console.error(`Error migrating ${client.name}:`, error)
        result.errors.push(`Error migrating ${client.name}: ${error.message}`)
      }
    }

    console.log(`🎉 Migration complete: ${result.migrated} migrated, ${result.skipped} skipped`)
    
    if (result.errors.length > 0) {
      console.error('❌ Migration errors:', result.errors)
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Migration failed:', error)
    return new Response(
      JSON.stringify({ error: 'Migration failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})