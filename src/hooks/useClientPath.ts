import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PathEntry, PathFilters, CreatePathEntryData } from '@/types/clientPath';

export const useClientPath = (clientId?: string) => {
  const [entries, setEntries] = useState<PathEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PathFilters>({});
  const { toast } = useToast();

  const fetchEntries = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('path_entries')
        .select('*')
        .eq('client_id', clientId)
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filters.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }
      if (filters.aiGenerated !== undefined) {
        query = query.eq('ai_generated', filters.aiGenerated);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries((data || []) as PathEntry[]);
    } catch (error: any) {
      console.error('Error fetching path entries:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta timeline-poster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async (entryData: CreatePathEntryData): Promise<PathEntry | null> => {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('path_entries')
        .insert([{
          ...entryData,
          created_by: user.id,
          timestamp: entryData.timestamp || new Date().toISOString(),
          status: entryData.status || 'planned',
          ai_generated: entryData.ai_generated || false,
          visible_to_client: entryData.visible_to_client || false,
          created_by_role: entryData.created_by_role || 'user'
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Timeline-post skapad"
      });

      fetchEntries(); // Refresh the list
      return data as PathEntry;
    } catch (error: any) {
      console.error('Error creating path entry:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa timeline-post",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateEntry = async (id: string, updates: Partial<PathEntry>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('path_entries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Timeline-post uppdaterad"
      });

      fetchEntries(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('Error updating path entry:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera timeline-post",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteEntry = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('path_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Timeline-post raderad"
      });

      fetchEntries(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('Error deleting path entry:', error);
      toast({
        title: "Fel",
        description: "Kunde inte radera timeline-post",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [clientId, filters]);

  return {
    entries,
    loading,
    filters,
    setFilters,
    createEntry,
    updateEntry,
    deleteEntry,
    refreshEntries: fetchEntries
  };
};