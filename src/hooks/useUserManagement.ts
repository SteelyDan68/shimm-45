import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserAttributes } from './useUserAttributes';

export interface UserManagementOperations {
  assignRole: (userId: string, role: string) => Promise<boolean>;
  removeRole: (userId: string, role: string) => Promise<boolean>;
  createCoachClientRelationship: (coachId: string, clientId: string) => Promise<boolean>;
  removeCoachClientRelationship: (coachId: string, clientId: string) => Promise<boolean>;
  bulkAssignRoles: (userIds: string[], role: string) => Promise<boolean>;
  transferClient: (clientId: string, fromCoachId: string, toCoachId: string) => Promise<boolean>;
}

export const useUserManagement = (): UserManagementOperations => {
  const { toast } = useToast();
  const { setAttribute, removeAttribute } = useUserAttributes();

  const assignRole = useCallback(async (userId: string, role: string): Promise<boolean> => {
    try {
      const success = await setAttribute(userId, {
        attribute_key: `role_${role}`,
        attribute_value: true,
        attribute_type: 'role'
      });

      if (success) {
        toast({
          title: "Roll tilldelad",
          description: `Användaren har fått rollen ${role}`
        });
      }

      return success;
    } catch (error) {
      console.error('Error assigning role:', error);
      return false;
    }
  }, [setAttribute, toast]);

  const removeRole = useCallback(async (userId: string, role: string): Promise<boolean> => {
    try {
      const success = await removeAttribute(userId, `role_${role}`);

      if (success) {
        toast({
          title: "Roll borttagen",
          description: `Rollen ${role} har tagits bort från användaren`
        });
      }

      return success;
    } catch (error) {
      console.error('Error removing role:', error);
      return false;
    }
  }, [removeAttribute, toast]);

  const createCoachClientRelationship = useCallback(async (
    coachId: string, 
    clientId: string
  ): Promise<boolean> => {
    try {
      // Set coach-client relationship in both directions
      const coachSuccess = await setAttribute(coachId, {
        attribute_key: `client_${clientId}`,
        attribute_value: {
          relationship_type: 'coaching',
          assigned_at: new Date().toISOString(),
          is_active: true
        },
        attribute_type: 'relationship'
      });

      const clientSuccess = await setAttribute(clientId, {
        attribute_key: `coach_${coachId}`,
        attribute_value: {
          relationship_type: 'coaching',
          assigned_at: new Date().toISOString(),
          is_active: true
        },
        attribute_type: 'relationship'
      });

      if (coachSuccess && clientSuccess) {
        toast({
          title: "Coach-klient relation skapad",
          description: "Relationen har etablerats framgångsrikt"
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error creating coach-client relationship:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa coach-klient relation",
        variant: "destructive"
      });
      return false;
    }
  }, [setAttribute, toast]);

  const removeCoachClientRelationship = useCallback(async (
    coachId: string, 
    clientId: string
  ): Promise<boolean> => {
    try {
      const coachSuccess = await removeAttribute(coachId, `client_${clientId}`);
      const clientSuccess = await removeAttribute(clientId, `coach_${coachId}`);

      if (coachSuccess && clientSuccess) {
        toast({
          title: "Coach-klient relation borttagen",
          description: "Relationen har avslutats"
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error removing coach-client relationship:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort coach-klient relation",
        variant: "destructive"
      });
      return false;
    }
  }, [removeAttribute, toast]);

  const bulkAssignRoles = useCallback(async (
    userIds: string[], 
    role: string
  ): Promise<boolean> => {
    try {
      const promises = userIds.map(userId => assignRole(userId, role));
      const results = await Promise.all(promises);
      
      const successCount = results.filter(Boolean).length;
      
      toast({
        title: "Massrollstilldelning slutförd",
        description: `${successCount} av ${userIds.length} användare fick rollen ${role}`
      });

      return successCount === userIds.length;
    } catch (error) {
      console.error('Error in bulk role assignment:', error);
      return false;
    }
  }, [assignRole, toast]);

  const transferClient = useCallback(async (
    clientId: string,
    fromCoachId: string,
    toCoachId: string
  ): Promise<boolean> => {
    try {
      // Remove old relationship
      await removeCoachClientRelationship(fromCoachId, clientId);
      
      // Create new relationship
      const success = await createCoachClientRelationship(toCoachId, clientId);

      if (success) {
        toast({
          title: "Klient överförd",
          description: "Klienten har överförts till ny coach"
        });
      }

      return success;
    } catch (error) {
      console.error('Error transferring client:', error);
      toast({
        title: "Fel",
        description: "Kunde inte överföra klient",
        variant: "destructive"
      });
      return false;
    }
  }, [createCoachClientRelationship, removeCoachClientRelationship, toast]);

  return {
    assignRole,
    removeRole,
    createCoachClientRelationship,
    removeCoachClientRelationship,
    bulkAssignRoles,
    transferClient
  };
};