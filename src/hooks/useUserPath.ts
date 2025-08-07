import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PathEntry, PathFilters, CreatePathEntryData } from '@/types/clientPath';

export const useUserPath = (userId?: string) => {
  const [entries, setEntries] = useState<PathEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PathFilters>({});
  const { toast } = useToast();

  const fetchEntries = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Use dedicated path_entries table for optimal performance
      const { data, error } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      let entries = data || [];

      // Apply filters
      if (filters.type && filters.type.length > 0) {
        entries = entries.filter((entry: any) => filters.type!.includes(entry.type));
      }
      if (filters.status && filters.status.length > 0) {
        entries = entries.filter((entry: any) => filters.status!.includes(entry.status));
      }
      if (filters.startDate) {
        entries = entries.filter((entry: any) => new Date(entry.timestamp) >= filters.startDate!);
      }
      if (filters.endDate) {
        entries = entries.filter((entry: any) => new Date(entry.timestamp) <= filters.endDate!);
      }
      if (filters.aiGenerated !== undefined) {
        entries = entries.filter((entry: any) => entry.ai_generated === filters.aiGenerated);
      }

      // Sort by timestamp descending
      entries.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setEntries(entries as PathEntry[]);
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

      const newEntry = {
        ...entryData,
        created_by: user.id,
        timestamp: entryData.timestamp || new Date().toISOString(),
        status: entryData.status || 'planned',
        ai_generated: entryData.ai_generated || false,
        visible_to_client: entryData.visible_to_client || false,
        created_by_role: entryData.created_by_role || 'user'
      };

      const { data, error } = await supabase
        .from('path_entries')
        .insert(newEntry)
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
        .eq('id', id)
        .eq('user_id', userId);

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
        .eq('id', id)
        .eq('user_id', userId);

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
  }, [userId, filters]);

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