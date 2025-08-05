import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/productionLogger';

export interface IntegrityIssue {
  type: 'critical' | 'warning' | 'info';
  category: 'users' | 'permissions' | 'data' | 'authentication';
  message: string;
  action?: string;
}

export interface SystemIntegrityReport {
  status: 'healthy' | 'issues' | 'critical';
  issues: IntegrityIssue[];
  summary: string;
  recommendations: string[];
}

/**
 * Comprehensive system integrity checker
 */
export async function checkSystemIntegrity(): Promise<SystemIntegrityReport> {
  const issues: IntegrityIssue[] = [];
  logger.info('🔍 Starting comprehensive system integrity check...');

  // Check 1: User profiles without roles
  try {
    const { data: profilesWithoutRoles } = await supabase
      .from('profiles')
      .select(`
        id, 
        email, 
        first_name, 
        last_name,
        user_roles!left(role)
      `)
      .is('user_roles.role', null);

    if (profilesWithoutRoles && profilesWithoutRoles.length > 0) {
      issues.push({
        type: 'warning',
        category: 'permissions',
        message: `${profilesWithoutRoles.length} användare saknar roller`,
        action: 'Tilldela roller till användare utan roller'
      });
    }
  } catch (error) {
    issues.push({
      type: 'critical',
      category: 'users',
      message: 'Kunde inte kontrollera användarprofiler',
      action: 'Kontrollera databasanslutning'
    });
  }

  // Check 2: Superadmin exists
  try {
    const { data: superadmins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'superadmin');

    if (!superadmins || superadmins.length === 0) {
      issues.push({
        type: 'critical',
        category: 'permissions',
        message: 'Ingen superadmin finns i systemet',
        action: 'Skapa eller tilldela superadmin-roll omedelbart'
      });
    } else if (superadmins.length > 1) {
      issues.push({
        type: 'info',
        category: 'permissions',
        message: `${superadmins.length} superadmins finns`,
        action: 'Överväg att begränsa antalet superadmins'
      });
    }
  } catch (error) {
    issues.push({
      type: 'critical',
      category: 'permissions',
      message: 'Kunde inte kontrollera superadmin-status',
      action: 'Kontrollera user_roles tabellen'
    });
  }

  // Check 3: Orphaned user roles
  try {
    const { data: orphanedRoles } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role,
        profiles!inner(id)
      `)
      .is('profiles.id', null);

    if (orphanedRoles && orphanedRoles.length > 0) {
      issues.push({
        type: 'warning',
        category: 'data',
        message: `${orphanedRoles.length} föräldralösa roller funna`,
        action: 'Rensa bort roller för icke-existerande användare'
      });
    }
  } catch (error) {
    issues.push({
      type: 'warning',
      category: 'data',
      message: 'Kunde inte kontrollera föräldralösa roller'
    });
  }

  // Check 4: Duplicate user roles
  try {
    const { data: allRoles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (allRoles) {
      const duplicates = new Map<string, number>();
      allRoles.forEach(role => {
        const key = `${role.user_id}-${role.role}`;
        duplicates.set(key, (duplicates.get(key) || 0) + 1);
      });

      const duplicateCount = Array.from(duplicates.values()).filter(count => count > 1).length;
      if (duplicateCount > 0) {
        issues.push({
          type: 'warning',
          category: 'data',
          message: `${duplicateCount} duplicerade roller funna`,
          action: 'Rensa bort duplicerade roller'
        });
      }
    }
  } catch (error) {
    issues.push({
      type: 'warning',
      category: 'data',
      message: 'Kunde inte kontrollera duplicerade roller'
    });
  }

  // Check 5: Authentication status
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      issues.push({
        type: 'warning',
        category: 'authentication',
        message: 'Ingen aktiv session',
        action: 'Användaren bör logga in för full funktionalitet'
      });
    }
  } catch (error) {
    issues.push({
      type: 'critical',
      category: 'authentication',
      message: 'Autentiseringssystem ej tillgängligt',
      action: 'Kontrollera Supabase-konfiguration'
    });
  }

  // Check 6: Data consistency
  try {
    const { data: profiles, count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    const { data: roles, count: roleCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact' });

    logger.info(`📊 Found ${profileCount} profiles and ${roleCount} role assignments`);

    if (profileCount === 0) {
      issues.push({
        type: 'critical',
        category: 'users',
        message: 'Inga användarprofiler finns',
        action: 'Skapa initial användardata'
      });
    }

    if (roleCount === 0) {
      issues.push({
        type: 'critical',
        category: 'permissions',
        message: 'Inga rolltilldelningar finns',
        action: 'Tilldela roller till användare'
      });
    }

  } catch (error) {
    issues.push({
      type: 'critical',
      category: 'data',
      message: 'Kunde inte kontrollera datakonsistens',
      action: 'Kontrollera databastabeller'
    });
  }

  // Generate summary and recommendations
  const criticalIssues = issues.filter(i => i.type === 'critical').length;
  const warningIssues = issues.filter(i => i.type === 'warning').length;

  let status: 'healthy' | 'issues' | 'critical' = 'healthy';
  let summary = 'Systemet är helt friskt';

  if (criticalIssues > 0) {
    status = 'critical';
    summary = `${criticalIssues} kritiska problem hittades`;
  } else if (warningIssues > 0) {
    status = 'issues';
    summary = `${warningIssues} varningar hittades`;
  }

  const recommendations: string[] = [];
  
  if (criticalIssues > 0) {
    recommendations.push('🚨 Åtgärda kritiska problem omedelbart');
  }
  
  if (warningIssues > 0) {
    recommendations.push('⚠️ Granska och åtgärda varningar när möjligt');
  }
  
  if (issues.length === 0) {
    recommendations.push('✅ Systemet fungerar korrekt');
    recommendations.push('💡 Kör regelbundna integritetskontroller');
  }

  logger.info(`📋 Integrity check complete: ${status} with ${issues.length} issues`);

  return {
    status,
    issues,
    summary,
    recommendations
  };
}

/**
 * Fix common integrity issues automatically
 */
export async function autoFixIntegrityIssues(): Promise<{
  fixed: string[];
  failed: string[];
}> {
  const fixed: string[] = [];
  const failed: string[] = [];

  try {
    // Fix 1: Remove orphaned roles manually
    logger.info('🔧 Removing orphaned roles...');
    const { data: orphanedRoles } = await supabase
      .from('user_roles')
      .select('id, user_id')
      .not('user_id', 'in', 
        supabase.from('profiles').select('id')
      );

    if (orphanedRoles && orphanedRoles.length > 0) {
      const orphanIds = orphanedRoles.map(r => r.id);
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .in('id', orphanIds);
        
      if (!error) {
        fixed.push(`Removed ${orphanIds.length} orphaned user roles`);
      } else {
        failed.push('Failed to remove orphaned roles');
      }
    }
  } catch (error) {
    failed.push('Failed to check orphaned roles');
  }

  try {
    // Fix 2: Remove duplicate roles (manual approach)
    const { data: duplicateRoles } = await supabase
      .from('user_roles')
      .select('id, user_id, role');

    if (duplicateRoles) {
      const seen = new Set<string>();
      const toDelete: string[] = [];

      duplicateRoles.forEach(role => {
        const key = `${role.user_id}-${role.role}`;
        if (seen.has(key)) {
          toDelete.push(role.id);
        } else {
          seen.add(key);
        }
      });

      if (toDelete.length > 0) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .in('id', toDelete);

        if (!error) {
          fixed.push(`Removed ${toDelete.length} duplicate roles`);
        } else {
          failed.push('Failed to remove duplicate roles');
        }
      }
    }
  } catch (error) {
    failed.push('Failed to process duplicate roles');
  }

  return { fixed, failed };
}