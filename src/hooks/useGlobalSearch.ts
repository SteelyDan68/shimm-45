import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SearchResult {
  id: string;
  type: 'user' | 'message' | 'task' | 'calendar' | 'assessment' | 'path_entry' | 'stefan' | 'organization';
  title: string;
  subtitle?: string;
  content?: string;
  metadata?: Record<string, any>;
  relevance_score?: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  url?: string;
}

export interface SearchFilters {
  types?: SearchResult['type'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
  status?: string;
  tags?: string[];
}

export interface UseGlobalSearchReturn {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  clearResults: () => void;
  recentSearches: string[];
  addToRecent: (query: string) => void;
  clearRecent: () => void;
}

export const useGlobalSearch = (): UseGlobalSearchReturn => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('shimm_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });

  const { user, roles } = useAuth();
  const { toast } = useToast();

  const isAdmin = useMemo(() => 
    roles.includes('superadmin') || roles.includes('admin'), 
    [roles]
  );

  const isCoach = useMemo(() => 
    roles.includes('coach'), 
    [roles]
  );

  const addToRecent = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q !== query);
      const updated = [query, ...filtered].slice(0, 10);
      localStorage.setItem('shimm_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('shimm_recent_searches');
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setTotalResults(0);
  }, []);

  const searchProfiles = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, job_title, organization, client_category, created_at')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,organization.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      return (data || []).map(profile => ({
        id: profile.id,
        type: 'user' as const,
        title: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Okänd användare',
        subtitle: profile.job_title || profile.organization || profile.email,
        content: `${profile.client_category || ''} - ${profile.organization || ''}`,
        metadata: { category: profile.client_category, organization: profile.organization },
        created_at: profile.created_at,
        url: `/user/${profile.id}`
      }));
    } catch (error) {
      toast({
        title: "Sökfel",
        description: "Kunde inte söka i profiler",
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);

  const searchMessages = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, subject, content, created_at, sender_id, receiver_id,
          sender:profiles!messages_sender_id_fkey(first_name, last_name),
          receiver:profiles!messages_receiver_id_fkey(first_name, last_name)
        `)
        .or(`subject.ilike.%${query}%,content.ilike.%${query}%`)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;

      return (data || []).map(message => ({
        id: message.id,
        type: 'message' as const,
        title: message.subject || 'Meddelande utan ämne',
        subtitle: `Till/Från: ${
          message.sender_id === user.id 
            ? `${(message.receiver as any)?.first_name} ${(message.receiver as any)?.last_name}`.trim()
            : `${(message.sender as any)?.first_name} ${(message.sender as any)?.last_name}`.trim()
        }`,
        content: message.content?.substring(0, 200) + (message.content?.length > 200 ? '...' : ''),
        created_at: message.created_at,
        url: `/messages?messageId=${message.id}`
      }));
    } catch (error) {
      toast({
        title: "Sökfel",
        description: "Kunde inte söka i meddelanden",
        variant: "destructive"
      });
      return [];
    }
  }, [user, toast]);

  const searchTasks = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!user) return [];

    try {
      let queryBuilder = supabase
        .from('tasks')
        .select('id, title, description, status, priority, deadline, created_at, user_id')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      // Filter based on user role
      if (!isAdmin) {
        queryBuilder = queryBuilder.eq('user_id', user.id);
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;

      return (data || []).map(task => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        subtitle: `Status: ${task.status} | Prioritet: ${task.priority}`,
        content: task.description?.substring(0, 150) + (task.description?.length > 150 ? '...' : ''),
        metadata: { 
          status: task.status, 
          priority: task.priority, 
          deadline: task.deadline 
        },
        created_at: task.created_at,
        user_id: task.user_id,
        url: `/tasks?taskId=${task.id}`
      }));
    } catch (error) {
      toast({
        title: "Sökfel",
        description: "Kunde inte söka i uppgifter",
        variant: "destructive"
      });
      return [];
    }
  }, [user, isAdmin, toast]);

  const searchCalendarEvents = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!user) return [];

    try {
      let queryBuilder = supabase
        .from('calendar_events')
        .select('id, title, description, event_date, category, created_at, user_id')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      if (!isAdmin) {
        queryBuilder = queryBuilder.eq('user_id', user.id);
      }

      const { data, error } = await queryBuilder
        .order('event_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map(event => ({
        id: event.id,
        type: 'calendar' as const,
        title: event.title,
        subtitle: `${event.category} - ${new Date(event.event_date).toLocaleDateString('sv-SE')}`,
        content: event.description?.substring(0, 150) + (event.description?.length > 150 ? '...' : ''),
        metadata: { 
          category: event.category, 
          event_date: event.event_date 
        },
        created_at: event.created_at,
        user_id: event.user_id,
        url: `/calendar?eventId=${event.id}`
      }));
    } catch (error) {
      toast({
        title: "Sökfel",
        description: "Kunde inte söka i kalenderhändelser",
        variant: "destructive"
      });
      return [];
    }
  }, [user, isAdmin, toast]);

  const searchAssessments = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!user) return [];

    try {
      let queryBuilder = supabase
        .from('assessment_rounds')
        .select('id, pillar_type, ai_analysis, created_at, user_id')
        .or(`pillar_type.ilike.%${query}%,ai_analysis.ilike.%${query}%`);

      if (!isAdmin) {
        queryBuilder = queryBuilder.eq('user_id', user.id);
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map(assessment => ({
        id: assessment.id,
        type: 'assessment' as const,
        title: `${assessment.pillar_type} Bedömning`,
        subtitle: `Genomförd: ${new Date(assessment.created_at).toLocaleDateString('sv-SE')}`,
        content: assessment.ai_analysis?.substring(0, 150) + (assessment.ai_analysis?.length > 150 ? '...' : ''),
        metadata: { pillar_type: assessment.pillar_type },
        created_at: assessment.created_at,
        user_id: assessment.user_id,
        url: `/client-assessment/${assessment.user_id}?assessmentId=${assessment.id}`
      }));
    } catch (error) {
      toast({
        title: "Sökfel",
        description: "Kunde inte söka i bedömningar",
        variant: "destructive"
      });
      return [];
    }
  }, [user, isAdmin, toast]);

  const searchOrganizations = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!isAdmin && !isCoach) return [];

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, description, contact_email, website, created_at')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      return (data || []).map(org => ({
        id: org.id,
        type: 'organization' as const,
        title: org.name,
        subtitle: org.contact_email || org.website || '',
        content: org.description?.substring(0, 150) + (org.description?.length > 150 ? '...' : ''),
        created_at: org.created_at,
        url: `/administration?tab=organizations&orgId=${org.id}`
      }));
    } catch (error) {
      toast({
        title: "Sökfel",
        description: "Kunde inte söka i organisationer",
        variant: "destructive"
      });
      return [];
    }
  }, [isAdmin, isCoach, toast]);

  const search = useCallback(async (query: string, filters?: SearchFilters) => {
    if (!query.trim() || query.length < 2) {
      clearResults();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchPromises: Promise<SearchResult[]>[] = [];
      const allowedTypes = filters?.types || ['user', 'message', 'task', 'calendar', 'assessment', 'organization'];

      if (allowedTypes.includes('user')) {
        searchPromises.push(searchProfiles(query));
      }
      
      if (allowedTypes.includes('message')) {
        searchPromises.push(searchMessages(query));
      }
      
      if (allowedTypes.includes('task')) {
        searchPromises.push(searchTasks(query));
      }
      
      if (allowedTypes.includes('calendar')) {
        searchPromises.push(searchCalendarEvents(query));
      }
      
      if (allowedTypes.includes('assessment')) {
        searchPromises.push(searchAssessments(query));
      }
      
      if (allowedTypes.includes('organization')) {
        searchPromises.push(searchOrganizations(query));
      }

      const searchResults = await Promise.all(searchPromises);
      const combinedResults = searchResults.flat();

      // Apply additional filters
      let filteredResults = combinedResults;

      if (filters?.dateRange) {
        filteredResults = filteredResults.filter(result => {
          const resultDate = new Date(result.created_at || result.updated_at || Date.now());
          return resultDate >= filters.dateRange!.start && resultDate <= filters.dateRange!.end;
        });
      }

      if (filters?.userId) {
        filteredResults = filteredResults.filter(result => result.user_id === filters.userId);
      }

      // Sort by relevance (simple text matching score for now)
      const queryLower = query.toLowerCase();
      filteredResults.forEach(result => {
        let score = 0;
        const titleLower = result.title.toLowerCase();
        const contentLower = (result.content || '').toLowerCase();

        // Exact matches get highest score
        if (titleLower === queryLower) score += 100;
        else if (titleLower.includes(queryLower)) score += 50;
        
        if (contentLower.includes(queryLower)) score += 25;

        // Boost recent results
        const daysSinceCreation = result.created_at 
          ? (Date.now() - new Date(result.created_at).getTime()) / (1000 * 60 * 60 * 24)
          : 999;
        score += Math.max(0, 30 - daysSinceCreation);

        result.relevance_score = score;
      });

      filteredResults.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

      setResults(filteredResults);
      setTotalResults(filteredResults.length);
      addToRecent(query);

    } catch (error) {
      const errorMsg = 'Ett fel inträffade vid sökning';
      setError(errorMsg);
      toast({
        title: "Sökfel",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    searchProfiles, searchMessages, searchTasks, 
    searchCalendarEvents, searchAssessments, searchOrganizations,
    addToRecent, toast
  ]);

  return {
    results,
    isLoading,
    error,
    totalResults,
    search,
    clearResults,
    recentSearches,
    addToRecent,
    clearRecent
  };
};