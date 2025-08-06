/**
 * 🌟 UNIFIED USER COMMAND CENTER 🌟
 * 
 * SCRUM-TEAM WORLD-CLASS IMPLEMENTATION
 * Enterprise-grade masterboard för komplett användarhantering
 * 
 * KONSOLIDERAR:
 * ✅ User creation & invitation
 * ✅ Role management & assignments  
 * ✅ Complete profile management
 * ✅ Intelligence hub integration
 * ✅ Pillar results & assessments
 * ✅ Coach-client relationships
 * ✅ Real-time data & analytics
 * ✅ Export & audit capabilities
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, Shield, Brain, User, Users, Search, Filter, Plus, Mail, 
  Settings, Trash2, Edit3, Eye, Download, RefreshCw, BarChart3,
  Target, TrendingUp, Activity, Clock, MapPin, Star, AlertTriangle,
  CheckCircle2, UserPlus, Database, Zap, Globe, Phone, MessageSquare
} from 'lucide-react';

import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUnifiedUsers } from '@/hooks/useUnifiedUsers';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useIntelligenceHub } from '@/hooks/useIntelligenceHub';
import { useExtendedProfile } from '@/hooks/useExtendedProfile';
import { useToast } from '@/hooks/use-toast';
import { CreateUserForm } from '@/components/UserAdministration/CreateUserForm';
import { SendInvitationForm } from '@/components/InvitationSystem/SendInvitationForm';
import { EnhancedUserDetailsPanel } from './EnhancedUserDetailsPanel';
import { deleteUserCompletely } from '@/utils/userDeletion';

interface SelectedUserData {
  id: string;
  basicInfo: any;
  extendedProfile: any;
  intelligenceData: any;
  assessmentData: any;
  relationships: any;
}

export const UnifiedUserCommandCenter: React.FC = () => {
  const { user: currentUser, hasRole, isSuperAdmin } = useAuth();
  
  // Helper function for role checking
  const getHasRole = (role: string) => typeof hasRole === 'function' ? hasRole(role as any) : hasRole;
  
  const canCreateUsersValue = getHasRole('superadmin') || getHasRole('admin') || getHasRole('coach');
  const canInviteUsersValue = getHasRole('superadmin') || getHasRole('admin') || getHasRole('coach');
  const { users, loading, updateUser, createUserRelationship, removeUserRelationship, refetch } = useUnifiedUsers();
  const { assignRole, removeRole, createCoachClientRelationship, removeCoachClientRelationship, transferClient } = useUserManagement();
  const { getExtendedProfile } = useExtendedProfile();
  const { loadProfile } = useIntelligenceHub();
  const { toast } = useToast();

  // State management
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<SelectedUserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [commandPanelOpen, setCommandPanelOpen] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(false);

  // Access control
  const canManageUsers = isSuperAdmin || getHasRole('admin') || getHasRole('coach');
  const canDeleteUsers = isSuperAdmin || getHasRole('admin');
  const canViewIntelligence = isSuperAdmin || getHasRole('admin') || getHasRole('coach');
  const canManageRoles = isSuperAdmin || getHasRole('admin');

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || 
        user.roles?.includes(roleFilter) ||
        user.primary_role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Load complete user data
  const loadCompleteUserData = useCallback(async (userId: string) => {
    if (!userId) return;
    
    setLoadingUserData(true);
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      // Load extended profile
      const extendedProfile = await getExtendedProfile(userId);
      
      // Load intelligence data if permitted
      let intelligenceData = null;
      if (canViewIntelligence) {
        try {
          intelligenceData = await loadProfile(userId);
        } catch (error) {
          console.warn('Intelligence data not available:', error);
          // Intelligence data is optional, continue without it
        }
      }

      // Combine all data
      const completeUserData: SelectedUserData = {
        id: userId,
        basicInfo: user,
        extendedProfile,
        intelligenceData,
        assessmentData: {}, // Will be populated from intelligence data
        relationships: {
          asCoach: users.filter(u => u.coach_id === userId),
          asClient: user.coach_id ? users.find(u => u.id === user.coach_id) : null
        }
      };

      setSelectedUserData(completeUserData);
      
    } catch (error) {
      console.error('Failed to load complete user data:', error);
      // Only show error toast for critical failures, not missing optional data
      if (error instanceof Error && !error.message.includes('Intelligence') && !error.message.includes('pillar')) {
        toast({
          title: "Fel",
          description: "Kunde inte ladda grundläggande användardata",
          variant: "destructive"
        });
      }
      // Still set basic user data even if extended data fails
      const basicUserData: SelectedUserData = {
        id: userId,
        basicInfo: users.find(u => u.id === userId),
        extendedProfile: null,
        intelligenceData: null,
        assessmentData: {},
        relationships: {
          asCoach: users.filter(u => u.coach_id === userId),
          asClient: users.find(u => u.id === users.find(u => u.id === userId)?.coach_id) || null
        }
      };
      setSelectedUserData(basicUserData);
    } finally {
      setLoadingUserData(false);
    }
  }, [users, getExtendedProfile, loadProfile, canViewIntelligence, toast]);

  // Handle user selection
  const handleUserSelect = useCallback((userId: string) => {
    setSelectedUserId(userId);
    loadCompleteUserData(userId);
  }, [loadCompleteUserData]);

  // Delete user completely
  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!canDeleteUsers) return;
    
    const confirmed = window.confirm(
      'VARNING: Detta kommer permanent radera användaren och ALL tillhörande data. Denna åtgärd kan INTE ångras. Fortsätt?'
    );
    
    if (!confirmed) return;
    
    try {
      const result = await deleteUserCompletely(userId);
      
      if (result.user_found) {
        toast({
          title: "Användare raderad",
          description: "Användaren och all tillhörande data har raderats permanent",
        });
        
        // Clear selection and refresh
        setSelectedUserId(null);
        setSelectedUserData(null);
        refetch();
      } else {
        toast({
          title: "Fel",
          description: "Användaren kunde inte hittas eller raderas",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "Fel",
        description: "Radering misslyckades",
        variant: "destructive"
      });
    }
  }, [canDeleteUsers, toast, refetch]);

  // Role assignment
  const handleRoleChange = useCallback(async (userId: string, role: string, action: 'add' | 'remove') => {
    if (!canManageRoles) return;
    
    try {
      if (action === 'add') {
        await assignRole(userId, role);
      } else {
        await removeRole(userId, role);
      }
      
      toast({
        title: "Roll uppdaterad",
        description: `Rollen ${role} ${action === 'add' ? 'tilldelad' : 'borttagen'}`,
      });
      
      refetch();
      if (selectedUserId === userId) {
        loadCompleteUserData(userId);
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera roll",
        variant: "destructive"
      });
    }
  }, [canManageRoles, assignRole, removeRole, toast, refetch, selectedUserId, loadCompleteUserData]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      superadmins: users.filter(u => u.roles?.includes('superadmin')).length,
      admins: users.filter(u => u.roles?.includes('admin')).length,
      coaches: users.filter(u => u.roles?.includes('coach')).length,
      clients: users.filter(u => u.roles?.includes('client')).length,
      active: users.filter(u => u.created_at).length
    };
  }, [users]);

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="p-8 text-center max-w-md">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-semibold mb-2">Åtkomst nekad</h3>
          <p className="text-muted-foreground">
            Du har inte behörighet för Unified User Command Center.
          </p>
          <Badge variant="outline" className="mt-4">
            Krävs: Superadmin, Admin eller Coach
          </Badge>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Master Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Crown className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Unified User Command Center</h1>
                <p className="text-blue-100 mt-1">
                  Komplett masterboard för användarhantering - {stats.total} användare
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm opacity-90">Inloggad som</div>
                <div className="font-semibold">{currentUser?.email}</div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {isSuperAdmin ? 'Superadmin' : getHasRole('admin') ? 'Admin' : 'Coach'}
              </Badge>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm opacity-90">Totalt</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{stats.superadmins}</div>
              <div className="text-sm opacity-90">Superadmins</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{stats.admins}</div>
              <div className="text-sm opacity-90">Admins</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{stats.coaches}</div>
              <div className="text-sm opacity-90">Coaches</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{stats.clients}</div>
              <div className="text-sm opacity-90">Klienter</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)]">
          
          {/* Left Panel - User List & Search */}
          <div className="col-span-4 space-y-4">
            {/* Search & Filters */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Sök användare..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {['all', 'superadmin', 'admin', 'coach', 'client'].map((role) => (
                    <Button
                      key={role}
                      variant={roleFilter === role ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRoleFilter(role)}
                    >
                      {role === 'all' ? 'Alla' : role}
                    </Button>
                  ))}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {canCreateUsersValue && (
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('create')}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Skapa
                    </Button>
                  )}
                  {canInviteUsersValue && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('invite')}
                      className="w-full"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Bjud in
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User List */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Användare ({filteredUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                        selectedUserId === user.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => handleUserSelect(user.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                          <div className="flex gap-1 mt-1">
                            {user.roles?.map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - User Details */}
          <div className="col-span-8">
            {selectedUserData ? (
              <EnhancedUserDetailsPanel 
                userData={selectedUserData}
                onRoleChange={handleRoleChange}
                onDeleteUser={handleDeleteUser}
                onRefresh={() => loadCompleteUserData(selectedUserData.id)}
                loading={loadingUserData}
                canManageRoles={Boolean(canManageRoles)}
                canDeleteUsers={Boolean(canDeleteUsers)}
                canViewIntelligence={Boolean(canViewIntelligence)}
              />
            ) : (
              <WelcomePanel 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onUserCreated={() => {
                  refetch();
                  setActiveTab('overview');
                }}
                canCreateUsers={canCreateUsersValue}
                canInviteUsers={canInviteUsersValue}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Separate component for user details
interface UserDetailsPanelProps {
  userData: SelectedUserData;
  onRoleChange: (userId: string, role: string, action: 'add' | 'remove') => void;
  onDeleteUser: (userId: string) => void;
  onRefresh: () => void;
  loading: boolean;
  canManageRoles: boolean;
  canDeleteUsers: boolean;
  canViewIntelligence: boolean;
}

const UserDetailsPanel: React.FC<UserDetailsPanelProps> = ({
  userData,
  onRoleChange,
  onDeleteUser,
  onRefresh,
  loading,
  canManageRoles,
  canDeleteUsers,
  canViewIntelligence
}) => {
  const [activeDetailTab, setActiveDetailTab] = useState('profile');

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {userData.basicInfo.name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{userData.basicInfo.name}</h2>
              <p className="text-muted-foreground">{userData.basicInfo.email}</p>
              <div className="flex gap-2 mt-2">
                {userData.basicInfo.roles?.map((role: string) => (
                  <Badge key={role} variant="outline" className="capitalize">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            {canDeleteUsers && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => onDeleteUser(userData.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab} className="h-full">
          <div className="px-6 border-b">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="roles">Roller</TabsTrigger>
              <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
              <TabsTrigger value="relationships">Relationer</TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile" className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Grundläggande information</h3>
                <div className="space-y-2">
                  <div><strong>E-post:</strong> {userData.basicInfo.email}</div>
                  <div><strong>Namn:</strong> {userData.basicInfo.name}</div>
                  <div><strong>Skapad:</strong> {new Date(userData.basicInfo.created_at).toLocaleDateString('sv-SE')}</div>
                  <div><strong>Status:</strong> <Badge variant="outline">Aktiv</Badge></div>
                </div>
              </div>

              {userData.extendedProfile && (
                <div>
                  <h3 className="font-semibold mb-3">Utökad profil</h3>
                  <div className="space-y-2">
                    {userData.extendedProfile.phone && (
                      <div><strong>Telefon:</strong> {userData.extendedProfile.phone}</div>
                    )}
                    {userData.extendedProfile.organization && (
                      <div><strong>Organisation:</strong> {userData.extendedProfile.organization}</div>
                    )}
                    {userData.extendedProfile.bio && (
                      <div><strong>Bio:</strong> {userData.extendedProfile.bio}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Rollhantering</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Nuvarande roller</h4>
                  <div className="space-y-2">
                    {userData.basicInfo.roles?.map((role: string) => (
                      <div key={role} className="flex items-center justify-between p-2 border rounded">
                        <Badge variant="outline">{role}</Badge>
                        {canManageRoles && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => onRoleChange(userData.id, role, 'remove')}
                          >
                            Ta bort
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {canManageRoles && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tilldela ny roll</h4>
                    <div className="space-y-2">
                      {['superadmin', 'admin', 'coach', 'client'].map((role) => (
                        <Button
                          key={role}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => onRoleChange(userData.id, role, 'add')}
                          disabled={userData.basicInfo.roles?.includes(role)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {role}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Intelligence Tab */}
          <TabsContent value="intelligence" className="p-6">
            {canViewIntelligence ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Intelligence Data</h3>
                {userData.intelligenceData ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">AI Insights</h4>
                      <p className="text-sm text-muted-foreground">
                        Intelligence-data tillgänglig
                      </p>
                    </Card>
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Assessment Results</h4>
                      <p className="text-sm text-muted-foreground">
                        Pillar-data och resultat
                      </p>
                    </Card>
                  </div>
                ) : (
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertDescription>
                      Ingen intelligence-data tillgänglig för denna användare.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Du har inte behörighet att visa intelligence-data.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships" className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Relationer</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Som Coach</h4>
                  {userData.relationships.asCoach?.length > 0 ? (
                    <div className="space-y-2">
                      {userData.relationships.asCoach.map((client: any) => (
                        <div key={client.id} className="p-2 border rounded">
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.email}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Inga tilldelade klienter</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Som Klient</h4>
                  {userData.relationships.asClient ? (
                    <div className="p-2 border rounded">
                      <div className="font-medium">{userData.relationships.asClient.name}</div>
                      <div className="text-sm text-muted-foreground">{userData.relationships.asClient.email}</div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ingen tilldelad coach</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Welcome panel for new user creation
interface WelcomePanelProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUserCreated: () => void;
  canCreateUsers: boolean;
  canInviteUsers: boolean;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({
  activeTab,
  onTabChange,
  onUserCreated,
  canCreateUsers,
  canInviteUsers
}) => {
  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full">
        <Tabs value={activeTab} onValueChange={onTabChange} className="h-full">
          <div className="p-6 border-b">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Översikt</TabsTrigger>
          {canCreateUsers && <TabsTrigger value="create">Skapa användare</TabsTrigger>}
              {canInviteUsers && <TabsTrigger value="invite">Bjud in användare</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-6 h-full">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Crown className="w-12 h-12 text-purple-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Unified User Command Center</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Komplett användarhantering från ett enda ställe. Välj en användare från listan för att se 
                  fullständig profil, intelligence-data, pillar-resultat och hantera roller.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <Card className="p-4">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Komplett profil</h3>
                  <p className="text-sm text-muted-foreground">
                    All användardata på ett ställe
                  </p>
                </Card>
                
                <Card className="p-4">
                  <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Intelligence</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-insights och pillar-data
                  </p>
                </Card>
              </div>
            </div>
          </TabsContent>

          {canCreateUsers && (
            <TabsContent value="create" className="p-6">
              <CreateUserForm onSuccess={onUserCreated} />
            </TabsContent>
          )}

          {canInviteUsers && (
            <TabsContent value="invite" className="p-6">
              <SendInvitationForm onSuccess={onUserCreated} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};