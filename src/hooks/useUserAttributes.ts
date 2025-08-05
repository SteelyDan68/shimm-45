import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useUserAttributes = (userId?: string) => {
  const [attributes, setAttributes] = useState<UserAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch user attributes
  const fetchAttributes = useCallback(async (targetUserId?: string) => {
    if (!targetUserId && !userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_attributes')
        .select('*')
        .eq('user_id', targetUserId || userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert database data to our interface format
      const convertedData: UserAttribute[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        attribute_key: item.attribute_key,
        attribute_value: item.attribute_value,
        attribute_type: item.attribute_type as UserAttribute['attribute_type'],
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by
      }));
      
      setAttributes(convertedData);
    } catch (error: any) {
      console.error('Error fetching user attributes:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta användarattribut",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Set user attribute
  const setAttribute = useCallback(async (
    targetUserId: string,
    attribute: UserAttributeInput
  ) => {
    try {
      const { error } = await supabase.rpc('set_user_attribute', {
        _user_id: targetUserId,
        _attribute_key: attribute.attribute_key,
        _attribute_value: attribute.attribute_value,
        _attribute_type: attribute.attribute_type || 'property'
      });

      if (error) throw error;

      await fetchAttributes(targetUserId);
      
      toast({
        title: "Attribut uppdaterat",
        description: `${attribute.attribute_key} har uppdaterats`
      });

      return true;
    } catch (error: any) {
      console.error('Error setting attribute:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera attribut",
        variant: "destructive"
      });
      return false;
    }
  }, [fetchAttributes, toast]);

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

  // Remove attribute (set inactive)
  const removeAttribute = useCallback(async (
    targetUserId: string,
    attributeKey: string
  ) => {
    try {
      const { error } = await supabase
        .from('user_attributes')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', targetUserId)
        .eq('attribute_key', attributeKey);

      if (error) throw error;

      await fetchAttributes(targetUserId);
      
      toast({
        title: "Attribut borttaget",
        description: `${attributeKey} har tagits bort`
      });

      return true;
    } catch (error: any) {
      console.error('Error removing attribute:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort attribut",
        variant: "destructive"
      });
      return false;
    }
  }, [fetchAttributes, toast]);

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

  // Get attribute value from loaded attributes
  const getLoadedAttributeValue = useCallback((attributeKey: string) => {
    const attribute = attributes.find(attr => attr.attribute_key === attributeKey);
    return attribute?.attribute_value || null;
  }, [attributes]);

  // Initialize data
  useEffect(() => {
    if (userId) {
      fetchAttributes(userId);
    }
  }, [userId, fetchAttributes]);

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
    refetch: fetchAttributes
  };
};