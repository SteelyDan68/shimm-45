import { supabase } from '@/integrations/supabase/client';

export interface MigrationResult {
  migrated: number;
  skipped: number;
  errors: string[];
}

/**
 * Professional data migration: Move all clients from legacy 'clients' table 
 * to the new 'profiles' table with proper roles
 */
export async function migrateClientsToProfiles(): Promise<MigrationResult> {
  const result: MigrationResult = {
    migrated: 0,
    skipped: 0,
    errors: []
  };

  try {
    console.log('🔄 Starting client migration to profiles...');

    // 1. Get all clients from legacy table
    const { data: legacyClients, error: legacyError } = await supabase
      .from('clients')
      .select('*');

    if (legacyError) {
      result.errors.push(`Failed to fetch legacy clients: ${legacyError.message}`);
      return result;
    }

    if (!legacyClients || legacyClients.length === 0) {
      console.log('✅ No legacy clients to migrate');
      return result;
    }

    console.log(`📊 Found ${legacyClients.length} legacy clients to migrate`);

    // 2. Get existing profiles to avoid duplicates
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email, id');

    if (profilesError) {
      result.errors.push(`Failed to fetch existing profiles: ${profilesError.message}`);
      return result;
    }

    const existingEmails = new Set(existingProfiles?.map(p => p.email) || []);

    // 3. Migrate each client
    for (const client of legacyClients) {
      try {
        // Skip if profile already exists
        if (existingEmails.has(client.email)) {
          console.log(`⏭️  Skipping ${client.name} - profile already exists`);
          result.skipped++;
          continue;
        }

        // Create profile entry
        const profileData = {
          email: client.email,
          first_name: client.name?.split(' ')[0] || '',
          last_name: client.name?.split(' ').slice(1).join(' ') || '',
          status: client.status || 'active',
          organization: client.category || null,
          preferences: {
            // Migrate legacy data to preferences
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
        };

        // Insert into profiles
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([profileData])
          .select('id')
          .single();

        if (insertError) {
          result.errors.push(`Failed to create profile for ${client.name}: ${insertError.message}`);
          continue;
        }

        // Assign client role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: newProfile.id,
            role: 'client'
          }]);

        if (roleError) {
          result.errors.push(`Failed to assign role for ${client.name}: ${roleError.message}`);
          continue;
        }

        console.log(`✅ Migrated ${client.name} to profiles system`);
        result.migrated++;

      } catch (error: any) {
        result.errors.push(`Error migrating ${client.name}: ${error.message}`);
      }
    }

    console.log(`🎉 Migration complete: ${result.migrated} migrated, ${result.skipped} skipped`);
    
    if (result.errors.length > 0) {
      console.error('❌ Migration errors:', result.errors);
    }

    return result;

  } catch (error: any) {
    result.errors.push(`Migration failed: ${error.message}`);
    return result;
  }
}

/**
 * Verify migration by checking if all clients now exist in profiles
 */
export async function verifyMigration(): Promise<{ legacy: number; profiles: number; withRoles: number }> {
  const { data: legacyClients } = await supabase.from('clients').select('id');
  const { data: profiles } = await supabase.from('profiles').select('id');
  
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'client');

  return {
    legacy: legacyClients?.length || 0,
    profiles: profiles?.length || 0,
    withRoles: userRoles?.length || 0
  };
}