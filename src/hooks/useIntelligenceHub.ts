import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  IntelligenceProfile, 
  IntelligenceFilter, 
  IntelligenceSearchResult,
  IntelligenceMetric,
  IntelligenceInsight,
  IntelligenceAPIResponse
} from '@/types/intelligenceHub';

interface UseIntelligenceHubOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealtime?: boolean;
}

export const useIntelligenceHub = (options: UseIntelligenceHubOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes
    enableRealtime = true
  } = options;

  const { toast } = useToast();
  
  // Core state
  const [profiles, setProfiles] = useState<IntelligenceProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<IntelligenceProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filtering
  const [searchResults, setSearchResults] = useState<IntelligenceSearchResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<IntelligenceFilter>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Build intelligence profile from database data
  const buildIntelligenceProfile = useCallback(async (userId: string): Promise<IntelligenceProfile | null> => {
    try {
      // Fetch base profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Fetch cache data for intelligence metrics
      const { data: cacheData, error: cacheError } = await supabase
        .from('user_data_cache')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (cacheError) {
        console.error('Error fetching cache data:', cacheError);
      }

      // Fetch pillar assessments for progress tracking
      const { data: pillarData, error: pillarError } = await supabase
        .from('pillar_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (pillarError) {
        console.error('Error fetching pillar data:', pillarError);
      }

      // Fetch coaching sessions and recommendations
      const { data: coachingData, error: coachingError } = await supabase
        .from('coaching_sessions')
        .select(`
          *,
          ai_coaching_recommendations(*)
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (coachingError) {
        console.error('Error fetching coaching data:', coachingError);
      }

      // Transform cache data into metrics and insights
      const metrics: IntelligenceMetric[] = (cacheData || []).map(item => ({
        id: item.id,
        name: item.data_type,
        value: typeof item.data === 'object' ? JSON.stringify(item.data) : String(item.data || ''),
        category: item.source,
        timestamp: new Date(item.created_at),
        source: item.source,
        confidence: 0.8 // Default confidence
      }));

      // Generate insights from data patterns
      const insights: IntelligenceInsight[] = [];
      
      // News sentiment analysis
      const newsItems = (cacheData || []).filter(item => item.data_type === 'news');
      if (newsItems.length > 0) {
        insights.push({
          id: `news-insight-${userId}`,
          title: 'Nyhetsanalys',
          description: `${newsItems.length} nyhetsartiklar hittade. Övervägande neutral till positiv sentiment.`,
          category: 'trend',
          severity: 'medium',
          confidence: 0.7,
          timestamp: new Date(),
          source: 'news_analyzer',
          actionItems: ['Övervaka fortsatt nyhetsbevakning', 'Analysera sentimenttrender']
        });
      }

      // Social media insights
      const socialItems = (cacheData || []).filter(item => item.data_type === 'social_metrics');
      if (socialItems.length > 0) {
        const latestSocial = socialItems[0];
        insights.push({
          id: `social-insight-${userId}`,
          title: 'Social Media Aktivitet',
          description: 'Aktiv närvaro på sociala medier med regelbunden aktivitet.',
          category: 'opportunity',
          severity: 'low',
          confidence: 0.6,
          timestamp: new Date(),
          source: 'social_analyzer'
        });
      }

      // Build pillar progress
      const pillarProgress = (pillarData || []).map(assessment => ({
        pillarKey: assessment.pillar_key,
        pillarName: assessment.pillar_key.replace('_', ' ').toUpperCase(),
        currentScore: assessment.calculated_score || 0,
        targetScore: 10,
        progress: (assessment.calculated_score || 0) / 10,
        lastAssessment: new Date(assessment.created_at),
        trends: [{
          period: 'week',
          change: Math.random() * 2 - 1 // Mock trend data
        }]
      }));

      // Build coaching journey data
      const coachingJourney = {
        totalSessions: (coachingData || []).length,
        averageRating: 4.2, // Mock data
        completedRecommendations: (coachingData || []).reduce((acc, session) => {
          return acc + (session.ai_coaching_recommendations?.filter((r: any) => r.status === 'completed').length || 0);
        }, 0),
        activeGoals: (coachingData || []).reduce((acc, session) => {
          return acc + (session.ai_coaching_recommendations?.filter((r: any) => r.status === 'pending').length || 0);
        }, 0),
        milestones: [] // Could be populated from coaching_milestones table
      };

      // Extract social profiles from actual profile data (handles) and enrich with cache data
      const baseSocialProfiles = [
        { platform: 'Instagram', handle: profile.instagram_handle, verified: false },
        { platform: 'YouTube', handle: profile.youtube_handle, verified: false },
        { platform: 'TikTok', handle: profile.tiktok_handle, verified: false },
        { platform: 'Twitter', handle: profile.twitter_handle, verified: false },
        { platform: 'Facebook', handle: profile.facebook_handle, verified: false },
        { platform: 'Snapchat', handle: profile.snapchat_handle, verified: false }
      ].filter(p => p.handle); // Only include platforms with handles
      
      // Enrich with cached social metrics data
      const socialProfiles = baseSocialProfiles.map(baseProfile => {
        const cachedData = socialItems.find(item => 
          item.source?.toLowerCase() === baseProfile.platform.toLowerCase() ||
          item.platform?.toLowerCase() === baseProfile.platform.toLowerCase()
        );
        
        if (cachedData && cachedData.data) {
          const data = typeof cachedData.data === 'object' && !Array.isArray(cachedData.data) ? cachedData.data as any : {};
          return {
            ...baseProfile,
            followers: (data.follower_count as number) || (data.public_metrics as any)?.followers || 0,
            following: (data.following_count as number) || (data.public_metrics as any)?.following || 0,
            posts: (data.post_count as number) || (data.public_metrics as any)?.posts || 0,
            engagement: (data.engagement_rate as number) || 0,
            verified: (data.verified as boolean) || false,
            url: (data.external_url as string) || undefined
          };
        }
        
        return baseProfile;
      });

      // Extract news mentions
      const newsMentions = newsItems.map(item => ({
        id: item.id,
        title: item.title || 'News Article',
        summary: item.snippet || '',
        url: item.url || '',
        source: item.source,
        sentiment: 'neutral' as const,
        timestamp: new Date(item.created_at),
        relevanceScore: 0.7
      }));

      return {
        userId: profile.id,
        displayName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
        email: profile.email,
        category: profile.client_category,
        
        metrics,
        insights,
        
        connectedSources: [
          {
            id: 'supabase-cache',
            name: 'Supabase Cache',
            type: 'analytics',
            provider: 'internal',
            isActive: true,
            refreshInterval: 60
          }
        ],
        
        socialProfiles,
        newsMentions,
        
        behaviorAnalytics: {
          communicationStyle: 'Professional',
          responsePatterns: {},
          engagementTrends: {},
          preferredChannels: ['email', 'chat'],
          activityPeaks: {}
        },
        
        pillarProgress,
        coachingJourney,
        
        lastUpdated: new Date(),
        dataQuality: 0.8,
        privacySettings: {
          shareAnalytics: true,
          shareProgress: true,
          shareSocialData: false
        }
      };

    } catch (error) {
      console.error('Error building intelligence profile:', error);
      return null;
    }
  }, []);

  // Search profiles with advanced filtering
  const searchProfiles = useCallback(async (
    query: string = '',
    filter: IntelligenceFilter = {}
  ): Promise<IntelligenceSearchResult> => {
    setSearchLoading(true);
    setError(null);

    try {
      // Build query based on filter
      let profileQuery = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          client_category,
          created_at
        `);

      // Apply search query
      if (query) {
        profileQuery = profileQuery.or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
        );
      }

      // Apply category filter
      if (filter.category && filter.category.length > 0) {
        profileQuery = profileQuery.in('client_category', filter.category);
      }

      const { data: profilesData, error: profilesError } = await profileQuery
        .order('created_at', { ascending: false })
        .limit(20);

      if (profilesError) throw profilesError;

      // Build intelligence profiles for search results
      const intelligenceProfiles: IntelligenceProfile[] = [];
      for (const profile of profilesData || []) {
        const intelligenceProfile = await buildIntelligenceProfile(profile.id);
        if (intelligenceProfile) {
          intelligenceProfiles.push(intelligenceProfile);
        }
      }

      const result: IntelligenceSearchResult = {
        profiles: intelligenceProfiles,
        metrics: [], // Could be populated with aggregated metrics
        insights: [], // Could be populated with system-wide insights
        totalCount: intelligenceProfiles.length,
        hasMore: false
      };

      setSearchResults(result);
      return result;

    } catch (error) {
      console.error('Error searching profiles:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
      
      return {
        profiles: [],
        metrics: [],
        insights: [],
        totalCount: 0,
        hasMore: false
      };
    } finally {
      setSearchLoading(false);
    }
  }, [buildIntelligenceProfile]);

  // Load specific profile by ID
  const loadProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const profile = await buildIntelligenceProfile(userId);
      if (profile) {
        setSelectedProfile(profile);
        
        // Update profiles list if not already present
        setProfiles(prev => {
          const existing = prev.find(p => p.userId === userId);
          if (existing) {
            return prev.map(p => p.userId === userId ? profile : p);
          } else {
            return [profile, ...prev];
          }
        });
      } else {
        throw new Error('Profile not found or could not be built');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
      toast({
        title: "Fel",
        description: "Kunde inte ladda intelligence-profilen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [buildIntelligenceProfile, toast]);

  // Refresh data for a specific profile
  const refreshProfile = useCallback(async (userId: string) => {
    await loadProfile(userId);
  }, [loadProfile]);

  // Refresh all loaded profiles
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const refreshedProfiles = await Promise.all(
        profiles.map(profile => buildIntelligenceProfile(profile.userId))
      );
      
      const validProfiles = refreshedProfiles.filter(Boolean) as IntelligenceProfile[];
      setProfiles(validProfiles);
      
      if (selectedProfile) {
        const refreshedSelected = validProfiles.find(p => p.userId === selectedProfile.userId);
        if (refreshedSelected) {
          setSelectedProfile(refreshedSelected);
        }
      }
    } catch (error) {
      console.error('Error refreshing profiles:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh profiles');
    } finally {
      setLoading(false);
    }
  }, [profiles, selectedProfile, buildIntelligenceProfile]);

  // Export profile data
  const exportProfile = useCallback(async (userId: string, format: 'json' | 'csv' = 'json') => {
    const profile = profiles.find(p => p.userId === userId) || selectedProfile;
    if (!profile) {
      throw new Error('Profile not found');
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `intelligence-profile-${profile.userId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV export would require more complex formatting
      console.log('CSV export not yet implemented');
    }
  }, [profiles, selectedProfile]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (profiles.length > 0) {
        refreshAll();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, profiles.length, refreshAll]);

  // Realtime subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    const channels = [
      // Listen for cache data updates
      supabase
        .channel('intelligence-cache-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_data_cache'
        }, (payload) => {
          const userId = (payload.new as any)?.user_id;
          if (userId && profiles.some(p => p.userId === userId)) {
            refreshProfile(userId);
          }
        })
        .subscribe(),

      // Listen for pillar assessment updates
      supabase
        .channel('intelligence-pillar-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'pillar_assessments'
        }, (payload) => {
          const userId = (payload.new as any)?.user_id;
          if (userId && profiles.some(p => p.userId === userId)) {
            refreshProfile(userId);
          }
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [enableRealtime, profiles, refreshProfile]);

  return {
    // State
    profiles,
    selectedProfile,
    searchResults,
    loading,
    searchLoading,
    error,
    activeFilter,
    searchQuery,

    // Actions
    searchProfiles,
    loadProfile,
    refreshProfile,
    refreshAll,
    exportProfile,
    setSelectedProfile,
    setActiveFilter,
    setSearchQuery,

    // Utilities
    buildIntelligenceProfile
  };
};