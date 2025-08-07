import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import type { Organization, OrganizationMember, OrganizationFilters, OrganizationStats } from '@/types/organizations';

export const useOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrganizationFilters>({
    search: '',
    status: 'all',
    industry: 'all'
  });
  
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;
      setOrganizations((data || []).map(org => ({
        ...org,
        address: org.address as any || {},
        settings: org.settings as any || {}
      })));
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta organisationer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `);

      if (error) throw error;
      setMembers(data as any || []);
    } catch (error: any) {
      console.error('Error fetching members:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
    fetchMembers();
  }, [fetchOrganizations, fetchMembers]);

  const createOrganization = useCallback(async (orgData: Partial<Organization>) => {
    if (!user || !isAdmin()) {
      toast({
        title: "Ingen behörighet",
        description: "Du har inte behörighet att skapa organisationer",
        variant: "destructive"
      });
      return false;
    }

    try {
      if (!orgData.name || !orgData.slug) {
        throw new Error('Name and slug are required');
      }

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: orgData.name,
          slug: orgData.slug,
          description: orgData.description,
          website: orgData.website,
          logo_url: orgData.logo_url,
          contact_email: orgData.contact_email,
          contact_phone: orgData.contact_phone,
          address: orgData.address,
          settings: orgData.settings,
          status: orgData.status || 'active',
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await fetchOrganizations();
      toast({
        title: "Organisation skapad",
        description: `${orgData.name} har skapats`
      });
      return data;
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa organisation",
        variant: "destructive"
      });
      return false;
    }
  }, [user, isAdmin, fetchOrganizations, toast]);

  const updateOrganization = useCallback(async (id: string, updates: Partial<Organization>) => {
    if (!isAdmin()) {
      toast({
        title: "Ingen behörighet", 
        description: "Du har inte behörighet att uppdatera organisationer",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchOrganizations();
      toast({
        title: "Organisation uppdaterad",
        description: "Ändringar har sparats"
      });
      return true;
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera organisation",
        variant: "destructive"
      });
      return false;
    }
  }, [isAdmin, fetchOrganizations, toast]);

  const deleteOrganization = useCallback(async (id: string) => {
    if (!isAdmin()) {
      toast({
        title: "Ingen behörighet",
        description: "Du har inte behörighet att ta bort organisationer", 
        variant: "destructive"
      });
      return false;
    }

    try {
      // First remove all members
      await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', id);

      // Then delete the organization
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchOrganizations();
      await fetchMembers();
      toast({
        title: "Organisation borttagen",
        description: "Organisationen har tagits bort"
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort organisation",
        variant: "destructive"
      });
      return false;
    }
  }, [isAdmin, fetchOrganizations, fetchMembers, toast]);

  const addMember = useCallback(async (organizationId: string, userId: string, role: OrganizationMember['role'] = 'client') => {
    if (!isAdmin()) {
      toast({
        title: "Ingen behörighet",
        description: "Du har inte behörighet att lägga till medlemmar",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: organizationId,
          user_id: userId,
          role,
          invited_by: user?.id,
          joined_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await fetchMembers();
      toast({
        title: "Medlem tillagd",
        description: "Användaren har lagts till i organisationen"
      });
      return true;
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till medlem",
        variant: "destructive"
      });
      return false;
    }
  }, [isAdmin, user, fetchMembers, toast]);

  const removeMember = useCallback(async (organizationId: string, userId: string) => {
    if (!isAdmin()) {
      toast({
        title: "Ingen behörighet",
        description: "Du har inte behörighet att ta bort medlemmar",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchMembers();
      toast({
        title: "Medlem borttagen",
        description: "Användaren har tagits bort från organisationen"
      });
      return true;
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort medlem",
        variant: "destructive"
      });
      return false;
    }
  }, [isAdmin, fetchMembers, toast]);

  const updateUserOrganization = useCallback(async (userId: string, organizationName: string) => {
    if (!isAdmin()) {
      toast({
        title: "Ingen behörighet",
        description: "Du har inte behörighet att uppdatera användarorganisationer",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ organization: organizationName })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Organisation uppdaterad",
        description: "Användarens organisation har uppdaterats"
      });
      return true;
    } catch (error: any) {
      console.error('Error updating user organization:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera användarorganisation",
        variant: "destructive"
      });
      return false;
    }
  }, [isAdmin, toast]);

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         org.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || org.status === filters.status;
    const matchesIndustry = filters.industry === 'all' || org.settings?.industry === filters.industry;
    
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const stats: OrganizationStats = {
    total: organizations.length,
    active: organizations.filter(o => o.status === 'active').length,
    inactive: organizations.filter(o => o.status === 'inactive').length,
    prospects: organizations.filter(o => o.status === 'prospect').length,
    byIndustry: organizations.reduce((acc, org) => {
      const industry = org.settings?.industry || 'Ej angivet';
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const getOrganizationMembers = useCallback((organizationId: string) => {
    return members.filter(m => m.organization_id === organizationId);
  }, [members]);

  const getUserOrganizations = useCallback((userId: string) => {
    const userMemberships = members.filter(m => m.user_id === userId);
    return organizations.filter(org => 
      userMemberships.some(m => m.organization_id === org.id)
    );
  }, [members, organizations]);

  return {
    organizations: filteredOrganizations,
    allOrganizations: organizations,
    members,
    loading,
    filters,
    setFilters,
    stats,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    addMember,
    removeMember,
    updateUserOrganization,
    getOrganizationMembers,
    getUserOrganizations,
    refetch: fetchOrganizations
  };
};