import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Users, 
  Filter,
  Loader2,
  User,
  Star,
  TrendingUp,
  Clock
} from 'lucide-react';

interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
  last_login_at: string | null;
  activity_level: 'high' | 'medium' | 'low';
  progress_score: number;
  role: string;
}

interface EnhancedIntelligenceSearchPanelProps {
  onProfileSelect: (userId: string) => void;
  selectedUserId: string | null;
}

export function EnhancedIntelligenceSearchPanel({ 
  onProfileSelect, 
  selectedUserId 
}: EnhancedIntelligenceSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'high_progress'>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
  }, [filter]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          last_login_at,
          user_roles!inner(role)
        `)
        .neq('id', user?.id); // Exclude current user

      // Apply filters
      if (filter === 'active') {
        query = query.gte('last_login_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      }

      const { data, error } = await query.order('first_name');

      if (error) throw error;

      // Transform data with mock intelligence metrics
      const transformedProfiles: UserProfile[] = data.map(profile => ({
        id: profile.id,
        display_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null,
        email: profile.email,
        last_login_at: profile.last_login_at,
        activity_level: profile.last_login_at && 
          new Date(profile.last_login_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) 
          ? 'high' 
          : profile.last_login_at && 
            new Date(profile.last_login_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ? 'medium' 
          : 'low',
        progress_score: Math.floor(Math.random() * 100), // Mock score
        role: (profile as any).user_roles?.role || 'client'
      }));

      // Filter by search query
      const filteredProfiles = transformedProfiles.filter(profile =>
        profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Apply progress filter
      const finalProfiles = filter === 'high_progress' 
        ? filteredProfiles.filter(p => p.progress_score > 70)
        : filteredProfiles;

      setProfiles(finalProfiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda profiler",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Sök klienter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Alla
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('active')}
            >
              <Clock className="h-3 w-3 mr-1" />
              Aktiva
            </Button>
            <Button
              variant={filter === 'high_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('high_progress')}
            >
              <Star className="h-3 w-3 mr-1" />
              Topp
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Laddar...</span>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Inga matchande profiler' : 'Inga profiler tillgängliga'}
              </p>
            </div>
          ) : (
            profiles.map((profile) => (
              <Card 
                key={profile.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedUserId === profile.id 
                    ? 'ring-2 ring-purple-500 border-purple-200' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => onProfileSelect(profile.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {profile.display_name || 'Namnlös användare'}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {profile.email}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getActivityColor(profile.activity_level)}`}
                          >
                            {profile.activity_level === 'high' && 'Hög aktivitet'}
                            {profile.activity_level === 'medium' && 'Medel'}
                            {profile.activity_level === 'low' && 'Låg aktivitet'}
                          </Badge>
                          
                          <span className={`text-xs font-medium ${getProgressColor(profile.progress_score)}`}>
                            {profile.progress_score}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-2">
                      <TrendingUp className={`h-4 w-4 ${getProgressColor(profile.progress_score)}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Totalt:</span>
            <span className="font-medium">{profiles.length} profiler</span>
          </div>
          <div className="flex justify-between">
            <span>Filter:</span>
            <span className="font-medium capitalize">{filter}</span>
          </div>
        </div>
      </div>
    </div>
  );
}