import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from '@/providers/UnifiedAuthProvider';

interface RoleContextValidation {
  valid: boolean;
  has_from_role: boolean;
  has_to_role: boolean;
  user_id: string;
  from_role: AppRole;
  to_role: AppRole;
  validated_at: string;
}

export const useRoleContextSwitcher = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [currentContext, setCurrentContext] = useState<AppRole | null>(null);

  const validateRoleSwitch = useCallback(async (fromRole: AppRole, toRole: AppRole): Promise<boolean> => {
    if (!user?.id) return false;

    setIsValidating(true);
    try {
      const { data, error } = await supabase
        .rpc('validate_role_context_switch', {
          _user_id: user.id,
          _from_role: fromRole,
          _to_role: toRole
        });

      if (error) throw error;

      const validation = data as unknown as RoleContextValidation;
      
      if (!validation.valid) {
        if (!validation.has_from_role) {
          toast({
            title: "Otillåten rollbyte",
            description: `Du har inte längre rollen ${fromRole}`,
            variant: "destructive"
          });
        } else if (!validation.has_to_role) {
          toast({
            title: "Otillåten rollbyte", 
            description: `Du har inte rollen ${toRole}`,
            variant: "destructive"
          });
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating role switch:', error);
      toast({
        title: "Fel",
        description: "Kunde inte validera rollbyte",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [user?.id, toast]);

  const switchToRole = useCallback(async (newRole: AppRole) => {
    if (!user?.id) return false;
    
    // Validate if user has the target role
    if (!hasRole(newRole)) {
      toast({
        title: "Otillåten rollbyte",
        description: `Du har inte rollen ${newRole}`,
        variant: "destructive"
      });
      return false;
    }

    const currentRole = currentContext || 'client' as AppRole;
    
    // Validate the context switch
    const isValid = await validateRoleSwitch(currentRole, newRole);
    
    if (isValid) {
      setCurrentContext(newRole);
      toast({
        title: "Rollbyte genomfört",
        description: `Du arbetar nu som ${newRole}`,
        variant: "default"
      });
      return true;
    }
    
    return false;
  }, [user?.id, currentContext, hasRole, validateRoleSwitch, toast]);

  const getAvailableRoles = useCallback((): AppRole[] => {
    if (!user?.id) return [];
    
    const roles: AppRole[] = [];
    if (hasRole('superadmin')) roles.push('superadmin');
    if (hasRole('admin')) roles.push('admin');
    if (hasRole('coach')) roles.push('coach');
    if (hasRole('client')) roles.push('client');
    
    return roles;
  }, [user?.id, hasRole]);

  const getCurrentRole = useCallback((): AppRole => {
    return currentContext || 'client';
  }, [currentContext]);

  const canAccessClientData = useCallback((clientId: string): boolean => {
    if (!user?.id) return false;
    
    // Superadmin god mode
    if (hasRole('superadmin')) return true;
    
    // Admin access
    if (hasRole('admin')) return true;
    
    // Self access
    if (user.id === clientId) return true;
    
    // Coach access (would need to check coach_client_assignments)
    // This is a simplified check - full implementation would query the DB
    if (hasRole('coach') && currentContext === 'coach') return true;
    
    return false;
  }, [user?.id, hasRole, currentContext]);

  return {
    currentContext: getCurrentRole(),
    availableRoles: getAvailableRoles(),
    isValidating,
    switchToRole,
    validateRoleSwitch,
    canAccessClientData
  };
};