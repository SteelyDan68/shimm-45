import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserPath } from '@/hooks/useUserPath';
import type { PathEntry } from '@/types/clientPath';

export interface UserAttribute {
  id: string;
  user_id: string;
  attribute_key: string;
  attribute_value: any;
  attribute_type: 'role' | 'property' | 'config' | 'metadata' | 'relationship';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface UserAttributeInput {
  attribute_key: string;
  attribute_value: any;
  attribute_type?: 'role' | 'property' | 'config' | 'metadata' | 'relationship';
}

/**
 * ⚠️ DEPRECATED - MIGRATED TO PATH_ENTRIES SYSTEM
 * 
 * Denna hook har migrerats för att läsa från path_entries istället för user_attributes
 * för att säkerställa datakonsekvens i hela systemet.
 */
export const useUserAttributes = (userId?: string) => {
  const [attributes, setAttributes] = useState<UserAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Use path_entries as the new source of truth
  const { entries: pathEntries, loading: pathLoading } = useUserPath(userId);

  // Convert path_entries to attribute-like structure for backwards compatibility
  const convertPathEntriesToAttributes = useCallback(() => {
    if (!pathEntries) return;

    console.log('📦 useUserAttributes: Converting', pathEntries.length, 'path entries to attributes format');
    
    const attributeList: UserAttribute[] = [];
    
    pathEntries.forEach((entry: PathEntry) => {
      // Extract role information from metadata
      if (entry.metadata?.created_by_role) {
        attributeList.push({
          id: `${entry.id}_role`,
          user_id: entry.user_id,
          attribute_key: `role_${entry.metadata.created_by_role}`,
          attribute_value: entry.metadata.created_by_role,
          attribute_type: 'role',
          is_active: true,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          created_by: entry.created_by
        });
      }

      // Extract pillar-related attributes
      if (entry.metadata?.pillar_type) {
        attributeList.push({
          id: `${entry.id}_pillar`,
          user_id: entry.user_id,
          attribute_key: `pillar_${entry.metadata.pillar_type}`,
          attribute_value: entry.metadata.pillar_type,
          attribute_type: 'property',
          is_active: entry.status === 'completed',
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          created_by: entry.created_by
        });
      }

      // General context attributes from entry types
      if (entry.type) {
        attributeList.push({
          id: `${entry.id}_context`,
          user_id: entry.user_id,
          attribute_key: 'context',
          attribute_value: entry.type,
          attribute_type: 'config',
          is_active: true,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          created_by: entry.created_by
        });
      }
    });

    // Remove duplicates and keep most recent
    const uniqueAttributes = attributeList.reduce((acc, attr) => {
      const key = `${attr.attribute_key}_${attr.attribute_value}`;
      if (!acc[key] || new Date(attr.created_at) > new Date(acc[key].created_at)) {
        acc[key] = attr;
      }
      return acc;
    }, {} as Record<string, UserAttribute>);

    setAttributes(Object.values(uniqueAttributes));
    console.log('✅ useUserAttributes: Converted to', Object.values(uniqueAttributes).length, 'attributes');
  }, [pathEntries]);

  // Update attributes when path entries change
  useEffect(() => {
    convertPathEntriesToAttributes();
  }, [convertPathEntriesToAttributes]);

  // Set loading state based on path loading
  useEffect(() => {
    setLoading(pathLoading);
  }, [pathLoading]);

  // Set user attribute (now creates path entries instead of user_attributes)
  const setAttribute = useCallback(async (
    targetUserId: string,
    attribute: UserAttributeInput
  ) => {
    try {
      console.log('⚠️ useUserAttributes.setAttribute: Creating path entry instead of user_attribute');
      
      // Create a path entry instead of user_attribute
      const { error } = await supabase
        .from('path_entries')
        .insert({
          user_id: targetUserId,
          created_by: targetUserId, // Required field
          type: 'manual_note',
          title: `Attribute: ${attribute.attribute_key}`,
          details: `Value: ${JSON.stringify(attribute.attribute_value)}`,
          status: 'completed',
          ai_generated: false,
          visible_to_client: false,
          created_by_role: 'system',
          metadata: {
            attribute_key: attribute.attribute_key,
            attribute_value: attribute.attribute_value,
            attribute_type: attribute.attribute_type || 'property',
            legacy_migration: true
          }
        });

      if (error) throw error;
      
      toast({
        title: "Attribut lagrat",
        description: `${attribute.attribute_key} har lagrats som path entry`
      });

      return true;
    } catch (error: any) {
      console.error('Error setting attribute as path entry:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lagra attribut",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Get specific attribute value
  const getAttribute = useCallback(async (
    targetUserId: string,
    attributeKey: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('get_user_attribute', {
        _user_id: targetUserId,
        _attribute_key: attributeKey
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error getting attribute:', error);
      return null;
    }
  }, []);

  // Check if user has specific attribute
  const hasAttribute = useCallback(async (
    targetUserId: string,
    attributeKey: string,
    attributeValue?: any
  ) => {
    try {
      const { data, error } = await supabase.rpc('has_user_attribute', {
        _user_id: targetUserId,
        _attribute_key: attributeKey,
        _attribute_value: attributeValue || null
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error checking attribute:', error);
      return false;
    }
  }, []);

  // Remove attribute (mark path entries as inactive)
  const removeAttribute = useCallback(async (
    targetUserId: string,
    attributeKey: string
  ) => {
    try {
      console.log('⚠️ useUserAttributes.removeAttribute: Marking path entries as completed');
      
      // Mark relevant path entries as completed to "remove" attribute
      const { error } = await supabase
        .from('path_entries')
        .update({ 
          status: 'completed',
          details: `Attribute removed: ${attributeKey}`,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', targetUserId)
        .eq('metadata->>attribute_key', attributeKey);

      if (error) throw error;
      
      toast({
        title: "Attribut borttaget",
        description: `${attributeKey} har tagits bort från path entries`
      });

      return true;
    } catch (error: any) {
      console.error('Error removing attribute from path entries:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort attribut",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Get users with specific attribute
  const getUsersWithAttribute = useCallback(async (
    attributeKey: string,
    attributeValue?: any
  ) => {
    try {
      const { data, error } = await supabase.rpc('get_users_with_attribute', {
        _attribute_key: attributeKey,
        _attribute_value: attributeValue || null
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error getting users with attribute:', error);
      return [];
    }
  }, []);

  // Helper functions for common attribute patterns
  const setClientContext = useCallback(async (targetUserId: string) => {
    return setAttribute(targetUserId, {
      attribute_key: 'context',
      attribute_value: 'client',
      attribute_type: 'config'
    });
  }, [setAttribute]);

  const setCoachContext = useCallback(async (targetUserId: string) => {
    return setAttribute(targetUserId, {
      attribute_key: 'context',
      attribute_value: 'coach',
      attribute_type: 'config'
    });
  }, [setAttribute]);

  const setUserProperty = useCallback(async (
    targetUserId: string,
    propertyKey: string,
    propertyValue: any
  ) => {
    return setAttribute(targetUserId, {
      attribute_key: propertyKey,
      attribute_value: propertyValue,
      attribute_type: 'property'
    });
  }, [setAttribute]);

  const isClientUser = useCallback(async (targetUserId: string) => {
    try {
      const { data, error } = await supabase.rpc('user_has_client_context', {
        _user_id: targetUserId
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error checking client context:', error);
      return false;
    }
  }, []);

  // Get filtered attributes by type
  const getAttributesByType = useCallback((type: UserAttribute['attribute_type']) => {
    return attributes.filter(attr => attr.attribute_type === type);
  }, [attributes]);

  // Get attribute value from loaded attributes (converted from path entries)
  const getLoadedAttributeValue = useCallback((attributeKey: string) => {
    const attribute = attributes.find(attr => attr.attribute_key === attributeKey);
    return attribute?.attribute_value || null;
  }, [attributes]);

  return {
    attributes,
    loading,
    setAttribute,
    getAttribute,
    hasAttribute,
    removeAttribute,
    getUsersWithAttribute,
    setClientContext,
    setCoachContext,
    setUserProperty,
    isClientUser,
    getAttributesByType,
    getLoadedAttributeValue,
    refetch: convertPathEntriesToAttributes
  };
};