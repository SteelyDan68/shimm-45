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
      
      // Use attribute system for path entries
      const { data, error } = await supabase.functions.invoke('get-user-attribute', {
        body: {
          user_id: userId,
          attribute_key: 'path_entries'
        }
      });

      if (error) throw error;
      
      let entries = data?.attribute_value || [];

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

      // Get current path entries from attribute system
      const currentEntries = await supabase.functions.invoke('get-user-attribute', {
        body: {
          user_id: entryData.user_id,
          attribute_key: 'path_entries'
        }
      });

      const entries = currentEntries.data?.attribute_value || [];
      
      const newEntry = {
        id: crypto.randomUUID(),
        ...entryData,
        created_by: user.id,
        timestamp: entryData.timestamp || new Date().toISOString(),
        status: entryData.status || 'planned',
        ai_generated: entryData.ai_generated || false,
        visible_to_client: entryData.visible_to_client || false,
        created_by_role: entryData.created_by_role || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      entries.push(newEntry);

      const { error } = await supabase.functions.invoke('update-user-attribute', {
        body: {
          user_id: entryData.user_id,
          attribute_key: 'path_entries',
          attribute_value: entries
        }
      });

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Timeline-post skapad"
      });

      fetchEntries(); // Refresh the list
      return newEntry as PathEntry;
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
      // Get current path entries from attribute system
      const currentEntries = await supabase.functions.invoke('get-user-attribute', {
        body: {
          user_id: userId,
          attribute_key: 'path_entries'
        }
      });

      const entries = currentEntries.data?.attribute_value || [];
      const entryIndex = entries.findIndex((entry: any) => entry.id === id);
      
      if (entryIndex === -1) throw new Error('Entry not found');

      entries[entryIndex] = {
        ...entries[entryIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.functions.invoke('update-user-attribute', {
        body: {
          user_id: userId,
          attribute_key: 'path_entries',
          attribute_value: entries
        }
      });

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
      // Get current path entries from attribute system
      const currentEntries = await supabase.functions.invoke('get-user-attribute', {
        body: {
          user_id: userId,
          attribute_key: 'path_entries'
        }
      });

      const entries = currentEntries.data?.attribute_value || [];
      const updatedEntries = entries.filter((entry: any) => entry.id !== id);

      const { error } = await supabase.functions.invoke('update-user-attribute', {
        body: {
          user_id: userId,
          attribute_key: 'path_entries',
          attribute_value: updatedEntries
        }
      });

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