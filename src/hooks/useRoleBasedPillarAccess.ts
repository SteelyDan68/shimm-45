/**
 * 🔐 ROLE-BASED PILLAR ACCESS HOOK
 * 
 * Wrapper för useUniversalPillarAccess med rollspecifik logik
 * Hanterar olika användningsfall beroende på användarens roll
 */

import { useMemo } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUniversalPillarAccess, type UniversalPillarAccessReturn } from './useUniversalPillarAccess';
import { usePillarRetake } from './usePillarRetake';
import { PillarKey } from '@/types/sixPillarsModular';

type AccessLevel = 'none' | 'view' | 'edit' | 'admin';

export interface RoleBasedPillarAccess extends UniversalPillarAccessReturn {
  // Role-specific info
  userRole: string;
  accessLevel: AccessLevel;
  contextInfo: string;
  
  // Role-specific helpers
  canManageAllUsers: boolean;
  canViewOtherUsers: boolean;
  isViewingOwnData: boolean;
  
  // Additional functionality
  retakePillar?: (pillarKey: PillarKey) => Promise<void>;
}

export const useRoleBasedPillarAccess = (targetUserId?: string): RoleBasedPillarAccess => {
  const { user, hasRole, isSuperAdmin } = useAuth();
  const universalAccess = useUniversalPillarAccess(targetUserId);
  const { retakePillar } = usePillarRetake(targetUserId);

  // Determine user role and access level
  const { userRole, accessLevel, contextInfo } = useMemo(() => {
    if (!user) {
      return {
        userRole: 'none',
        accessLevel: 'none' as AccessLevel,
        contextInfo: 'Ej inloggad'
      };
    }

    if (isSuperAdmin) {
      return {
        userRole: 'superadmin',
        accessLevel: 'admin' as AccessLevel,
        contextInfo: 'Superadmin - Full systemkontroll'
      };
    }

    if (hasRole('admin')) {
      return {
        userRole: 'admin',
        accessLevel: 'admin' as AccessLevel,
        contextInfo: 'Admin - Kan hantera alla användare'
      };
    }

    if (hasRole('coach')) {
      const isViewingOwnData = !targetUserId || targetUserId === user.id;
      return {
        userRole: 'coach',
        accessLevel: 'edit' as AccessLevel,
        contextInfo: isViewingOwnData 
          ? 'Coach - Visar egen data' 
          : 'Coach - Visar klientdata'
      };
    }

    if (hasRole('client')) {
      const isViewingOwnData = !targetUserId || targetUserId === user.id;
      return {
        userRole: 'client',
        accessLevel: isViewingOwnData ? 'edit' : 'none' as AccessLevel,
        contextInfo: isViewingOwnData 
          ? 'Klient - Egen utveckling'
          : 'Klient - Kan ej visa andras data'
      };
    }

    return {
      userRole: 'user',
      accessLevel: 'view' as AccessLevel,
      contextInfo: 'Grundanvändare'
    };
  }, [user, isSuperAdmin, hasRole, targetUserId]);

  // Role-specific capabilities
  const canManageAllUsers = accessLevel === 'admin';
  const canViewOtherUsers = accessLevel === 'admin' || (accessLevel === 'edit' && userRole === 'coach');
  const isViewingOwnData = !targetUserId || targetUserId === user?.id;

  return {
    ...universalAccess,
    
    // Role-specific info
    userRole,
    accessLevel,
    contextInfo,
    
    // Role-specific helpers
    canManageAllUsers,
    canViewOtherUsers,
    isViewingOwnData,
    
    // Additional functionality
    retakePillar: retakePillar
  };
};