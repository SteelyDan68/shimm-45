import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Brain, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { useIntelligenceHub } from '@/hooks/useIntelligenceHub';
import { useUniversalPillarAccess } from '@/hooks/useUniversalPillarAccess';

interface User {
  id: string;
  name?: string;
  email: string;
  roles?: string[];
}

export const IntelligenceHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get('userId');
  const activeTab = searchParams.get('tab') || 'overview';
  
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { user: currentUser } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { loadProfile, searchLoading } = useIntelligenceHub();
  const { 
    pillarProgress, 
    stats, 
    loading: pillarLoading,
    canView: canViewPillars 
  } = useUniversalPillarAccess(selectedUserId || undefined);

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Set selected user when userId param changes
  useEffect(() => {
    if (selectedUserId && users.length > 0) {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [selectedUserId, users]);

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user || null);
    setSearchParams({ userId, tab: activeTab });
  };

  const handleTabChange = (tab: string) => {
    if (selectedUserId) {
      setSearchParams({ userId: selectedUserId, tab });
    }
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p>Laddar Intelligence Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Intelligence Hub
          </h1>
          <p className="text-muted-foreground">
            Analysera användarens utveckling, pillar-progress och AI-insikter
          </p>
        </div>
      </div>

      {/* User Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Välj användare att analysera
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök användare..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedUserId || ''} onValueChange={handleUserSelect}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Välj användare" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {filteredUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>{user.name || user.email}</span>
                      {user.roles && user.roles.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {user.roles[0]}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">{selectedUser.name || selectedUser.email}</h3>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              {selectedUser.roles && (
                <div className="flex gap-2 mt-2">
                  {selectedUser.roles.map(role => (
                    <Badge key={role} variant="outline">{role}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Intelligence Content */}
      {selectedUser && (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="pillars">Pillar Progress</TabsTrigger>
            <TabsTrigger value="insights">AI Insikter</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pillar Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {canViewPillars ? `${stats?.active_pillars || 0}/6` : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aktiva pillars
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Genomsnitt Poäng</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {canViewPillars ? `${stats?.overall_progress?.toFixed(1) || '0.0'}/10` : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Genomsnittlig progress
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Senaste Aktivitet</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.total_completed || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Totala assessments
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Senaste Utveckling</CardTitle>
              </CardHeader>
              <CardContent>
                {pillarLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse">Laddar data...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pillarProgress.length > 0 ? (
                      pillarProgress.slice(0, 3).map((pillar, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{pillar.pillar_key}</h4>
                            <p className="text-sm text-muted-foreground">
                              Progress: {pillar.progress_percentage || 0}%
                            </p>
                          </div>
                          <Badge variant={pillar.is_active ? 'default' : 'secondary'}>
                            {pillar.is_active ? '✅ Aktiv' : '⏸️ Inaktiv'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Ingen pillar-data tillgänglig för denna användare
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pillars" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detaljerad Pillar Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {!canViewPillars ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Du har inte behörighet att se pillar-data för denna användare
                  </p>
                ) : pillarLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse">Laddar pillar-data...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pillarProgress.map((pillar, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{pillar.pillar_key}</h3>
                          <Badge variant="outline">{pillar.progress_percentage || 0}%</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${pillar.progress_percentage || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Status: {pillar.is_active ? '✅ Aktiv' : '⏸️ Inaktiv'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Genererade Insikter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  AI-insikter kommer att implementeras här
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detaljerad Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Analytisk data kommer att implementeras här
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!selectedUser && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Välj en användare</h3>
            <p className="text-muted-foreground">
              Använd sökfältet ovan för att hitta och välja en användare att analysera
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};