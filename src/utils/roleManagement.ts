/**
 * 🛠️ ROLE MANAGEMENT UTILITIES
 * Verktyg för säker hantering av roller och behörigheter
 */

import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Import role matrix from system integrity config
const ROLE_MATRIX = {
  superadmin: { name: "Superadmin", level: 100, permissions: ["FULL_SYSTEM_ACCESS"], dataAccess: { scope: "UNLIMITED" }, description: "Full systemadministratör med obegränsad åtkomst" },
  admin: { name: "Admin", level: 80, permissions: ["MANAGE_USERS"], dataAccess: { scope: "ORGANIZATION_WIDE" }, description: "Systemadministratör för organisationen" },
  coach: { name: "Coach", level: 60, permissions: ["VIEW_ASSIGNED_CLIENTS"], dataAccess: { scope: "ASSIGNED_CLIENTS_ONLY" }, description: "Professionell coach som arbetar med tilldelade klienter" },
  client: { name: "Klient", level: 40, permissions: ["VIEW_OWN_PROFILE"], dataAccess: { scope: "OWN_DATA_ONLY" }, description: "Slutanvändare som genomgår personlig utveckling" }
};

export type AppRole = 'superadmin' | 'admin' | 'coach' | 'client';

export interface RoleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface UserRoleContext {
  userId: string;
  currentRoles: AppRole[];
  permissions: string[];
  dataAccessScope: string;
  securityLevel: number;
}

/**
 * 🔐 ROLE VALIDATION SYSTEM
 */
export class RoleValidator {
  
  /**
   * Validera rollkombination för säkerhet och logik
   */
  static validateRoleAssignment(
    userId: string, 
    newRoles: AppRole[], 
    currentRoles: AppRole[] = []
  ): RoleValidationResult {
    const result: RoleValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    // 1. Kontrollera ogiltiga rollkombinationer
    if (newRoles.includes('superadmin') && newRoles.length > 1) {
      result.warnings.push('Superadmin behöver normalt inte andra roller - har redan full åtkomst');
    }

    // 2. Kontrollera rollhierarki
    const hasAdmin = newRoles.includes('admin');
    const hasCoach = newRoles.includes('coach');  
    const hasClient = newRoles.includes('client');

    if (hasAdmin && hasClient) {
      result.warnings.push('Kombination admin + client är ovanlig - överväg separata konton');
    }

    if (hasCoach && hasAdmin) {
      result.recommendations.push('Coach med admin-rättigheter - överväg att begränsa till specifika funktioner');
    }

    // 3. Säkerhetskontroller
    if (newRoles.includes('superadmin') && !currentRoles.includes('superadmin')) {
      result.warnings.push('SÄKERHETSVARNING: Superadmin-roll läggs till - kräver extra validering');
    }

    // 4. Dataintegritetscontroller
    if (newRoles.length === 0) {
      result.errors.push('Användare måste ha minst en roll');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Få rollkontext för användare
   */
  static async getUserRoleContext(userId: string): Promise<UserRoleContext | null> {
    try {
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;

      const roles = rolesData?.map(r => r.role) as AppRole[] || [];
      const primaryRole = this.getPrimaryRole(roles);
      const roleDefinition = ROLE_MATRIX[primaryRole];

      return {
        userId,
        currentRoles: roles,
        permissions: roleDefinition?.permissions || [],
        dataAccessScope: roleDefinition?.dataAccess.scope || 'NONE',
        securityLevel: roleDefinition?.level || 0
      };
    } catch (error) {
      console.error('Error getting user role context:', error);
      return null;
    }
  }

  /**
   * Bestäm primär roll baserat på hierarki
   */
  static getPrimaryRole(roles: AppRole[]): AppRole {
    if (roles.includes('superadmin')) return 'superadmin';
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('coach')) return 'coach';
    if (roles.includes('client')) return 'client';
    return 'client'; // Fallback
  }
}

/**
 * 🔧 ROLE MANAGEMENT OPERATIONS
 */
export class RoleManager {
  
  /**
   * Säkert tilldela roller till användare
   */
  static async assignRole(
    userId: string, 
    role: AppRole,
    assignedBy: string,
    justification?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Hämta nuvarande roller
      const { data: currentRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const currentRolesList = currentRoles?.map(r => r.role) as AppRole[] || [];

      // 2. Validera rolltilldelning
      const validation = RoleValidator.validateRoleAssignment(
        userId, 
        [...currentRolesList, role], 
        currentRolesList
      );

      if (!validation.isValid) {
        return { 
          success: false, 
          message: `Rollvalidering misslyckades: ${validation.errors.join(', ')}` 
        };
      }

      // 3. Kontrollera om rollen redan finns
      if (currentRolesList.includes(role)) {
        return { 
          success: false, 
          message: `Användare har redan rollen ${role}` 
        };
      }

      // 4. Tilldela rollen
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString()
        });

      if (error) throw error;

      // 5. Logga åtgärden
      await this.logRoleAction('assign', userId, role, assignedBy, justification);

      return { success: true, message: `Rollen ${role} har tilldelats` };

    } catch (error: any) {
      console.error('Error assigning role:', error);
      return { 
        success: false, 
        message: `Fel vid rolltilldelning: ${error.message}` 
      };
    }
  }

  /**
   * Säkert ta bort roller från användare
   */
  static async removeRole(
    userId: string, 
    role: AppRole,
    removedBy: string,
    justification?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Kontrollera att användaren inte tappar alla roller
      const { data: currentRoles } = await supabase
        .from('user_roles') 
        .select('role')
        .eq('user_id', userId);

      const currentRolesList = currentRoles?.map(r => r.role) as AppRole[] || [];
      
      if (currentRolesList.length <= 1) {
        return {
          success: false,
          message: 'Kan inte ta bort sista rollen - användare måste ha minst en roll'
        };
      }

      // 2. Ta bort rollen
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      // 3. Logga åtgärden
      await this.logRoleAction('remove', userId, role, removedBy, justification);

      return { success: true, message: `Rollen ${role} har tagits bort` };

    } catch (error: any) {
      console.error('Error removing role:', error);
      return { 
        success: false, 
        message: `Fel vid borttagning av roll: ${error.message}` 
      };
    }
  }

  /**
   * Migrera användare från en roll till en annan
   */
  static async migrateRole(
    userId: string,
    fromRole: AppRole,
    toRole: AppRole, 
    migratedBy: string,
    justification?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Validera migration
      const { data: currentRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const currentRolesList = currentRoles?.map(r => r.role) as AppRole[] || [];
      
      if (!currentRolesList.includes(fromRole)) {
        return {
          success: false,
          message: `Användaren har inte rollen ${fromRole} att migrera från`
        };
      }

      // 2. Ta bort gammal roll
      const removeResult = await this.removeRole(userId, fromRole, migratedBy, `Migration från ${fromRole} till ${toRole}: ${justification || ''}`);
      
      if (!removeResult.success) {
        return removeResult;
      }

      // 3. Lägg till ny roll
      const assignResult = await this.assignRole(userId, toRole, migratedBy, `Migration från ${fromRole} till ${toRole}: ${justification || ''}`);
      
      return {
        success: assignResult.success,
        message: assignResult.success 
          ? `Migration från ${fromRole} till ${toRole} slutförd`
          : assignResult.message
      };

    } catch (error: any) {
      console.error('Error migrating role:', error);
      return {
        success: false,
        message: `Fel vid rollmigration: ${error.message}`
      };
    }
  }

  /**
   * Logga rollåtgärder för audit trail
   */
  private static async logRoleAction(
    action: 'assign' | 'remove' | 'migrate',
    userId: string,
    role: AppRole,
    performedBy: string,
    justification?: string
  ): Promise<void> {
    try {
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: performedBy,
          action: `role_${action}`,
          target_user_id: userId,
          details: {
            role: role,
            justification: justification || 'Ingen motivering angiven',
            timestamp: new Date().toISOString(),
            security_level: ROLE_MATRIX[role]?.level || 0
          }
        });
    } catch (error) {
      console.error('Error logging role action:', error);
    }
  }

  /**
   * Få rollstatistik för system
   */
  static async getRoleStatistics(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role');

      if (error) throw error;

      const stats: Record<string, number> = {
        superadmin: 0,
        admin: 0, 
        coach: 0,
        client: 0
      };

      data?.forEach(roleRecord => {
        if (stats.hasOwnProperty(roleRecord.role)) {
          stats[roleRecord.role]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting role statistics:', error);
      return {};
    }
  }
}

/**
 * 🎭 UI HELPERS FOR ROLE DISPLAY
 */
export class RoleUIHelpers {
  
  static getRoleDisplayInfo(role: AppRole): {
    name: string;
    color: string;
    icon: string;
    description: string;
  } {
    const roleInfo = ROLE_MATRIX[role];
    
    return {
      name: roleInfo?.name || role,
      color: this.getRoleColor(role),
      icon: this.getRoleIcon(role),
      description: roleInfo?.description || 'Okänd roll'
    };
  }

  private static getRoleColor(role: AppRole): string {
    const colors = {
      superadmin: 'bg-red-500',
      admin: 'bg-blue-500', 
      coach: 'bg-green-500',
      client: 'bg-purple-500'
    };
    return colors[role] || 'bg-gray-500';
  }

  private static getRoleIcon(role: AppRole): string {
    const icons = {
      superadmin: '👑',
      admin: '🔧',
      coach: '🎯', 
      client: '🌟'
    };
    return icons[role] || '👤';
  }
}

// Export all utilities
export default { RoleValidator, RoleManager, RoleUIHelpers };