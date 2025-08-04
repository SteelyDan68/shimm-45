import { supabase } from '@/integrations/supabase/client';

export interface SystemDiagnosisResult {
  database: {
    connected: boolean;
    tables: string[];
    profiles_count: number;
    roles_count: number;
    errors: string[];
  };
  authentication: {
    working: boolean;
    current_user: any;
    session_valid: boolean;
    errors: string[];
  };
  permissions: {
    user_has_roles: boolean;
    superadmin_exists: boolean;
    role_system_working: boolean;
    errors: string[];
  };
  components: {
    user_manager_loading: boolean;
    admin_creation_working: boolean;
    critical_errors: string[];
  };
  recommendations: string[];
}

/**
 * Comprehensive system diagnosis - checks all critical system functions
 */
export async function runSystemDiagnosis(): Promise<SystemDiagnosisResult> {
  const result: SystemDiagnosisResult = {
    database: {
      connected: false,
      tables: [],
      profiles_count: 0,
      roles_count: 0,
      errors: []
    },
    authentication: {
      working: false,
      current_user: null,
      session_valid: false,
      errors: []
    },
    permissions: {
      user_has_roles: false,
      superadmin_exists: false,
      role_system_working: false,
      errors: []
    },
    components: {
      user_manager_loading: false,
      admin_creation_working: false,
      critical_errors: []
    },
    recommendations: []
  };

  console.log('🔍 Initiating comprehensive system diagnosis...');

  // 1. Database Connection Test
  try {
    console.log('📊 Testing database connection...');
    
    // Test profiles table
    const { data: profiles, error: profilesError, count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    
    if (profilesError) {
      result.database.errors.push(`Profiles table error: ${profilesError.message}`);
    } else {
      result.database.connected = true;
      result.database.profiles_count = profilesCount || 0;
      result.database.tables.push('profiles');
      console.log(`✅ Profiles table: ${profilesCount} records`);
    }

    // Test user_roles table
    const { data: roles, error: rolesError, count: rolesCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact' });
    
    if (rolesError) {
      result.database.errors.push(`User roles table error: ${rolesError.message}`);
    } else {
      result.database.roles_count = rolesCount || 0;
      result.database.tables.push('user_roles');
      console.log(`✅ User roles table: ${rolesCount} records`);
    }

    // Test other critical tables
    const criticalTables = [
      { name: 'tasks', exists: false },
      { name: 'messages', exists: false },
      { name: 'invitations', exists: false },
      { name: 'pillar_assessments', exists: false }
    ];
    
    // Test tasks table
    try {
      const { error } = await supabase.from('tasks').select('id').limit(1);
      if (!error) {
        result.database.tables.push('tasks');
        criticalTables[0].exists = true;
      }
    } catch (err) {
      result.database.errors.push('Tasks table not accessible');
    }

    // Test messages table
    try {
      const { error } = await supabase.from('messages_v2').select('id').limit(1);
      if (!error) {
        result.database.tables.push('messages_v2');
        criticalTables[1].exists = true;
      }
    } catch (err) {
      result.database.errors.push('Messages table not accessible');
    }

    // Test invitations table
    try {
      const { error } = await supabase.from('invitations').select('id').limit(1);
      if (!error) {
        result.database.tables.push('invitations');
        criticalTables[2].exists = true;
      }
    } catch (err) {
      result.database.errors.push('Invitations table not accessible');
    }

    // Test pillar_assessments table
    try {
      const { error } = await supabase.from('pillar_assessments').select('id').limit(1);
      if (!error) {
        result.database.tables.push('pillar_assessments');
        criticalTables[3].exists = true;
      }
    } catch (err) {
      result.database.errors.push('Pillar assessments table not accessible');
    }

  } catch (error: any) {
    result.database.errors.push(`Database connection failed: ${error.message}`);
    console.error('❌ Database connection failed:', error);
  }

  // 2. Authentication Test
  try {
    console.log('🔐 Testing authentication system...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      result.authentication.errors.push(`Session error: ${sessionError.message}`);
    } else if (session?.user) {
      result.authentication.working = true;
      result.authentication.session_valid = true;
      result.authentication.current_user = {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at
      };
      console.log(`✅ Authentication working for: ${session.user.email}`);
    } else {
      result.authentication.errors.push('No active session found');
      console.log('⚠️ No active session');
    }

  } catch (error: any) {
    result.authentication.errors.push(`Authentication test failed: ${error.message}`);
    console.error('❌ Authentication test failed:', error);
  }

  // 3. Permissions & Role System Test
  try {
    console.log('👑 Testing permission system...');
    
    if (result.authentication.current_user) {
      // Check if current user has roles
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', result.authentication.current_user.id);
      
      if (roleError) {
        result.permissions.errors.push(`Role check error: ${roleError.message}`);
      } else {
        result.permissions.user_has_roles = (userRoles?.length || 0) > 0;
        console.log(`✅ User has ${userRoles?.length || 0} roles`);
      }

      // Check if superadmin exists in system
      const { data: superadmins, error: superError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'superadmin');
      
      if (superError) {
        result.permissions.errors.push(`Superadmin check error: ${superError.message}`);
      } else {
        result.permissions.superadmin_exists = (superadmins?.length || 0) > 0;
        result.permissions.role_system_working = true;
        console.log(`✅ Found ${superadmins?.length || 0} superadmin(s)`);
      }
    }

  } catch (error: any) {
    result.permissions.errors.push(`Permission test failed: ${error.message}`);
    console.error('❌ Permission test failed:', error);
  }

  // 4. Component Health Check
  try {
    console.log('🧩 Testing component health...');
    
    // This is a basic check - in a real scenario we'd test component rendering
    result.components.user_manager_loading = result.database.connected && result.authentication.working;
    result.components.admin_creation_working = result.permissions.role_system_working && result.authentication.working;
    
  } catch (error: any) {
    result.components.critical_errors.push(`Component test failed: ${error.message}`);
  }

  // 5. Generate Recommendations
  if (result.database.profiles_count === 0) {
    result.recommendations.push('⚠️ No users found in database - consider creating initial superadmin user');
  }
  
  if (result.database.roles_count === 0) {
    result.recommendations.push('⚠️ No roles assigned - assign superadmin role to initial user');
  }
  
  if (!result.permissions.superadmin_exists) {
    result.recommendations.push('🚨 CRITICAL: No superadmin exists - system cannot be administered');
  }
  
  if (result.database.errors.length > 0) {
    result.recommendations.push('🔧 Database issues detected - check Supabase connection and RLS policies');
  }
  
  if (!result.authentication.working) {
    result.recommendations.push('🔐 Authentication issues - verify Supabase configuration');
  }

  if (result.database.connected && result.authentication.working && result.permissions.role_system_working) {
    result.recommendations.push('✅ System appears healthy - all core functions operational');
  }

  console.log('📋 System diagnosis complete!');
  return result;
}

/**
 * Quick health check for critical system functions
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    // Test database connection
    const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
    if (dbError) return false;

    // Test authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) return false;

    // Test basic user role system
    if (session?.user) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .limit(1);
      if (roleError) return false;
    }

    return true;
  } catch {
    return false;
  }
}