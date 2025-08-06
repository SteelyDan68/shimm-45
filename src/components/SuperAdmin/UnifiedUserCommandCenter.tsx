/**
 * 🌟 UNIFIED USER COMMAND CENTER - Complete User Management Solution
 * 
 * Komplett användarhanteringssystem med alla funktioner:
 * - Skapa användare & bjuda in användare
 * - Tilldela & ändra roller
 * - Hantera coach-tilldelningar
 * - Fullständig profilhantering
 * - Säker radering av användare
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Mail,
  MoreHorizontal,
  Brain,
  ExternalLink,
  UserCheck,
  Crown,
  Phone,
  MapPin,
  Calendar,
  Settings,
  Eye,
  Save,
  X,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { CreateUserForm } from './CreateUserForm';
import { InviteUserForm } from './InviteUserForm';
import { UserProfileEditor } from './UserProfileEditor';
import { UserRoleManager } from './UserRoleManager';
import { CoachAssignmentManager } from './CoachAssignmentManager';
import { deleteUserCompletely } from '@/utils/userDeletion';

interface UserExtended {
  id: string;
  name?: string;
  email: string;
  roles?: string[];
  primary_role?: string;
  coach_id?: string;
  created_at?: string;
  updated_at?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  date_of_birth?: string;
  bio?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  job_title?: string;
  organization?: string;
  personal_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  is_active?: boolean;
  deactivated_at?: string;
  deactivated_by?: string;
  deactivation_reason?: string;
}

interface UserManagementStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  recentlyCreated: number;
  activeCoaches: number;
  activeClients: number;
}

export const UnifiedUserCommandCenter: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('active'); // Default visa bara aktiva
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const { user: currentUser, hasRole } = useAuth();
  const { users, loading, refreshUsers } = useUsers();
  
  // Cast users to extended interface for full functionality
  const extendedUsers = users as UserExtended[];
  const { toast } = useToast();

  // Permission checks
  const isSuperAdmin = hasRole('superadmin');
  const isAdmin = hasRole('admin');
  const isCoach = hasRole('coach');
  const canManageRoles = isSuperAdmin || isAdmin;
  const canCreateUsers = isSuperAdmin || isAdmin;
  const canDeleteUsers = isSuperAdmin;

  // Filtered users
  const filteredUsers = useMemo(() => {
    return extendedUsers.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || 
        user.roles?.includes(roleFilter) ||
        user.primary_role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [extendedUsers, searchTerm, roleFilter]);

  // Enhanced stats
  const stats: UserManagementStats = useMemo(() => {
    const totalUsers = extendedUsers.length;
    const usersByRole = extendedUsers.reduce((acc, user) => {
      const role = user.primary_role || 'user';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const recentlyCreated = extendedUsers.filter(user => {
      if (!user.created_at) return false;
      const created = new Date(user.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length;

    return { 
      totalUsers, 
      usersByRole, 
      recentlyCreated,
      activeCoaches: usersByRole.coach || 0,
      activeClients: usersByRole.client || 0
    };
  }, [extendedUsers]);

  // Handle user selection for detailed view
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setActiveTab('profile');
  };

  // Handle user soft deletion with confirmation
  const handleDeleteUser = async (userId: string) => {
    if (!canDeleteUsers) {
      toast({
        title: "Otillräckliga behörigheter",
        description: "Endast superadmins kan radera användare",
        variant: "destructive"
      });
      return;
    }

    const userToDelete = extendedUsers.find(u => u.id === userId);
    if (!userToDelete) {
      toast({
        title: "Fel",
        description: "Användaren kunde inte hittas",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Är du säker på att du vill inaktivera användaren "${userToDelete.email}"? Användaren kommer att markeras som inaktiv men kan återaktiveras senare. För fullständig GDPR-radering, använd GDPR-modulen.`)) {
      return;
    }
    
    try {
      setDeletingUserId(userId);
      
      // Call the soft deletion function
      const { softDeleteUser } = await import('@/utils/userSoftDelete');
      const result = await softDeleteUser(userId, 'admin_deactivation');

      if (!result.success) {
        toast({
          title: "Fel vid inaktivering",
          description: result.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Användare inaktiverad",
          description: `Användaren ${userToDelete.email} har inaktiverats och kan återaktiveras vid behov`,
        });
      }
      
      // Refresh the user list to reflect changes
      refreshUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast({
        title: "Fel",
        description: "Kunde inte inaktivera användaren",
        variant: "destructive"
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  // Handle user reactivation
  const handleReactivateUser = async (userId: string) => {
    if (!canDeleteUsers) {
      toast({
        title: "Otillräckliga behörigheter",
        description: "Endast superadmins kan återaktivera användare",
        variant: "destructive"
      });
      return;
    }

    const userToReactivate = extendedUsers.find(u => u.id === userId);
    if (!userToReactivate) {
      toast({
        title: "Fel",
        description: "Användaren kunde inte hittas",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Är du säker på att du vill återaktivera användaren "${userToReactivate.email}"?`)) {
      return;
    }
    
    try {
      setDeletingUserId(userId);
      
      // Call the reactivation function
      const { reactivateUser } = await import('@/utils/userSoftDelete');
      const result = await reactivateUser(userId);

      if (!result.success) {
        toast({
          title: "Fel vid återaktivering",
          description: result.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Användare återaktiverad",
          description: `Användaren ${userToReactivate.email} har återaktiverats`,
        });
      }
      
      // Refresh the user list to reflect changes
      refreshUsers();
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast({
        title: "Fel",
        description: "Kunde inte återaktivera användaren",
        variant: "destructive"
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Okänt';
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const selectedUser = selectedUserId ? extendedUsers.find(u => u.id === selectedUserId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p>Laddar användare...</p>
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
            <Crown className="h-8 w-8 text-primary" />
            Unified User Command Center
          </h1>
          <p className="text-muted-foreground">
            Komplett användarhantering - Skapa, hantera, tilldela roller och mycket mer
          </p>
        </div>

        <div className="flex gap-2">
          {canCreateUsers && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Skapa Användare
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Skapa Ny Användare</DialogTitle>
                  </DialogHeader>
                  <CreateUserForm onSuccess={refreshUsers} />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Bjud In
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bjud In Användare</DialogTitle>
                  </DialogHeader>
                  <InviteUserForm onSuccess={refreshUsers} />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala Användare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Superadmins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersByRole.superadmin || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersByRole.admin || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coaches</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCoaches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nya denna vecka</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentlyCreated}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="profile" disabled={!selectedUser}>
            {selectedUser ? `${selectedUser.name || selectedUser.email}` : 'Välj användare'}
          </TabsTrigger>
          <TabsTrigger value="roles" disabled={!selectedUser}>Roller</TabsTrigger>
          <TabsTrigger value="assignments" disabled={!selectedUser}>Tilldelningar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Sök och Filtrera Användare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Sök användare..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrera efter roll" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla roller</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="client">Klient</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    Lista
                  </Button>
                  <Button 
                    variant={viewMode === 'cards' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('cards')}
                  >
                    Kort
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Display */}
          <Card>
            <CardHeader>
              <CardTitle>Användare ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === 'list' ? (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleUserSelect(user.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            user.name?.charAt(0) || user.email.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                            {user.phone && (
                              <>
                                <Phone className="h-3 w-3 ml-2" />
                                {user.phone}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                          {user.roles?.map(role => (
                            <Badge key={role} variant="outline">{role}</Badge>
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUserSelect(user.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Redigera Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { handleUserSelect(user.id); setActiveTab('roles'); }}>
                              <Shield className="h-4 w-4 mr-2" />
                              Hantera Roller
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/intelligence-hub?userId=${user.id}`}>
                                <Brain className="h-4 w-4 mr-2" />
                                Intelligence Hub
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Link>
                            </DropdownMenuItem>
                            {canDeleteUsers && (
                              <>
                                {user.is_active ? (
                                  <DropdownMenuItem 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); }}
                                    className="text-amber-600"
                                    disabled={deletingUserId === user.id}
                                  >
                                    {deletingUserId === user.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600 mr-2"></div>
                                        Inaktiverar...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Inaktivera
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={(e) => { e.stopPropagation(); handleReactivateUser(user.id); }}
                                    className="text-green-600"
                                    disabled={deletingUserId === user.id}
                                  >
                                    {deletingUserId === user.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-2"></div>
                                        Återaktiverar...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Återaktivera
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => (
                    <Card 
                      key={user.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleUserSelect(user.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              user.name?.charAt(0) || user.email.charAt(0)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{user.name || user.email}</h4>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {user.roles?.map(role => (
                            <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Skapad: {formatDate(user.created_at)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          {selectedUser && (
            <UserProfileEditor 
              user={selectedUser} 
              onUpdate={refreshUsers}
              canEdit={canManageRoles || selectedUser.id === currentUser?.id}
            />
          )}
        </TabsContent>

        <TabsContent value="roles">
          {selectedUser && (
            <UserRoleManager 
              user={selectedUser} 
              onUpdate={refreshUsers}
              canManageRoles={canManageRoles}
            />
          )}
        </TabsContent>

        <TabsContent value="assignments">
          {selectedUser && (
            <CoachAssignmentManager 
              user={selectedUser} 
              onUpdate={refreshUsers}
              canManageAssignments={canManageRoles}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};