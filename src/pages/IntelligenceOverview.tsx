import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Brain, 
  Search, 
  Users, 
  Eye, 
  TrendingUp,
  Database,
  Filter,
  BarChart3,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { HelpTooltip } from '@/components/HelpTooltip';

interface UserWithData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  client_category?: string;
  client_status?: string;
  velocity_score?: number;
  dataPoints: number;
  lastActivity?: string;
  hasPillarData: boolean;
  hasIntelligenceData: boolean;
}

export function IntelligenceOverview() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<UserWithData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'with_data' | 'active'>('all');

  const stats = {
    totalUsers: users.length,
    usersWithData: users.filter(u => u.dataPoints > 0).length,
    activeUsers: users.filter(u => u.client_status === 'active').length,
    avgDataPoints: Math.round(users.reduce((acc, u) => acc + u.dataPoints, 0) / users.length || 0)
  };

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, selectedFilter, users]);

  const loadUsers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Hämta alla användare med profiler
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Berika med datapoints från olika källor
      const enrichedUsers = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Räkna path entries
          const { count: pathEntries } = await supabase
            .from('path_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          // Räkna pillar assessments
          const { count: pillarAssessments } = await supabase
            .from('pillar_assessments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          // Räkna intelligence cache data (disabled due to recursive type issue)
          const intelligenceData = 0;

          // Senaste aktivitet
          const { data: lastActivity } = await supabase
            .from('path_entries')
            .select('created_at')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: profile.id,
            email: profile.email || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            client_category: profile.client_category,
            client_status: profile.client_status,
            velocity_score: profile.velocity_score,
            dataPoints: (pathEntries || 0) + (intelligenceData || 0),
            lastActivity: lastActivity?.created_at,
            hasPillarData: (pillarAssessments || 0) > 0,
            hasIntelligenceData: (intelligenceData || 0) > 0
          } as UserWithData;
        })
      );

      setUsers(enrichedUsers);
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte ladda användare: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Sök filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (selectedFilter === 'with_data') {
      filtered = filtered.filter(user => user.dataPoints > 0);
    } else if (selectedFilter === 'active') {
      filtered = filtered.filter(user => user.client_status === 'active');
    }

    setFilteredUsers(filtered);
  };

  const getDisplayName = (user: UserWithData) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.email;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (!hasRole('admin') && !hasRole('superadmin') && !hasRole('coach')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Åtkomst nekad</h3>
              <p className="text-muted-foreground">Du har inte behörighet att se Intelligence-översikten.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Laddar användare...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Intelligence-översikt
                  <HelpTooltip content="Bläddra bland alla användare och se deras Intelligence-data, pillar-analyser och utvecklingsinsikter" />
                </CardTitle>
                <p className="text-muted-foreground">
                  Utforska användardata och utvecklingsinsikter för alla klienter
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.usersWithData}
              </div>
              <p className="text-sm text-muted-foreground">Användare med data</p>
              <Badge variant="outline" className="mt-1">
                av {stats.totalUsers} totalt
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala användare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registrerade användare</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Med Intelligence-data</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersWithData}</div>
            <p className="text-xs text-muted-foreground">Har insamlad data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva användare</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Aktiv status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomsnitt datapunkter</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDataPoints}</div>
            <p className="text-xs text-muted-foreground">Per användare</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Sök och filtrera användare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Sök användare..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('all')}
                size="sm"
              >
                Alla
              </Button>
              <Button 
                variant={selectedFilter === 'with_data' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('with_data')}
                size="sm"
              >
                Med data
              </Button>
              <Button 
                variant={selectedFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('active')}
                size="sm"
              >
                Aktiva
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Visar {filteredUsers.length} av {users.length} användare
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {user.first_name?.[0] || user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{getDisplayName(user)}</CardTitle>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {user.client_status && (
                  <Badge className={getStatusColor(user.client_status)}>
                    {user.client_status}
                  </Badge>
                )}
                {user.client_category && (
                  <Badge variant="outline">
                    {user.client_category}
                  </Badge>
                )}
                {user.velocity_score && (
                  <Badge variant="secondary">
                    Velocity: {user.velocity_score}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Datapunkter:</span>
                  <span className="font-medium">{user.dataPoints}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pillar-data:</span>
                  {user.hasPillarData ? (
                    <Badge variant="default" className="text-xs">Ja</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Nej</Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Intelligence-data:</span>
                  {user.hasIntelligenceData ? (
                    <Badge variant="default" className="text-xs">Ja</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Nej</Badge>
                  )}
                </div>
                
                {user.lastActivity && (
                  <div className="text-xs text-muted-foreground">
                    Senaste aktivitet: {new Date(user.lastActivity).toLocaleDateString('sv-SE')}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/intelligence/${user.id}`)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Intelligence
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/user/${user.id}`)}
                  className="flex-1"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Profil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga användare hittades</h3>
              <p className="text-muted-foreground">
                Prova att ändra söktermen eller filter för att se fler användare.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}