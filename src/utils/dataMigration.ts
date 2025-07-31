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
    
    console.log('Legacy clients found:', legacyClients);

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
    
    console.log('Existing profiles:', existingProfiles);

    if (profilesError) {
      result.errors.push(`Failed to fetch existing profiles: ${profilesError.message}`);
      return result;
    }

    const existingEmails = new Set(existingProfiles?.map(p => p.email) || []);

    // 3. Migrate each client by creating auth users first
    for (const client of legacyClients) {
      try {
        // Skip if profile already exists
        if (existingEmails.has(client.email)) {
          console.log(`⏭️  Skipping ${client.name} - profile already exists`);
          result.skipped++;
          continue;
        }

        console.log(`🔄 Migrating ${client.name} (${client.email})`);

        // First, create auth user with temporary password
        const tempPassword = crypto.randomUUID().substring(0, 12) + "!A1";
        
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: client.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: client.name?.split(' ')[0] || '',
            last_name: client.name?.split(' ').slice(1).join(' ') || '',
            migrated_from_legacy: true,
            legacy_client_id: client.id
          }
        });

        if (authError) {
          console.error(`Failed to create auth user for ${client.name}:`, authError);
          result.errors.push(`Failed to create auth user for ${client.name}: ${authError.message}`);
          continue;
        }

        if (!authUser.user) {
          result.errors.push(`No user returned for ${client.name}`);
          continue;
        }

        console.log(`✅ Created auth user for ${client.name} with ID: ${authUser.user.id}`);

        // Now update the profile that was automatically created
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
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
          })
          .eq('id', authUser.user.id);

        if (updateError) {
          console.error(`Failed to update profile for ${client.name}:`, updateError);
          result.errors.push(`Failed to update profile for ${client.name}: ${updateError.message}`);
          continue;
        }

        // Assign client role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authUser.user.id,
            role: 'client'
          });

        if (roleError) {
          console.error(`Failed to assign role for ${client.name}:`, roleError);
          result.errors.push(`Failed to assign role for ${client.name}: ${roleError.message}`);
          continue;
        }

        console.log(`✅ Successfully migrated ${client.name} to profiles system`);
        result.migrated++;

      } catch (error: any) {
        console.error(`Error migrating ${client.name}:`, error);
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