import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus,
  Building2, 
  Shield, 
  Brain,
  Mail,
  Trophy,
  User,
  Settings,
  Eye,
  Edit3,
  Trash2,
  Key,
  MoreHorizontal,
  Search,
  Filter,
  Crown,
  AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUnifiedUserData, type UnifiedUser } from "@/hooks/useUnifiedUserData";
import { useUnifiedPermissions } from "@/hooks/useUnifiedPermissions";
import { OnboardingWorkflow } from "../Admin/OnboardingWorkflow";
import { AdminGamificationPanel } from "../Admin/AdminGamificationPanel";
import { SendInvitationForm } from "../InvitationSystem/SendInvitationForm";
import { InvitationList } from "../InvitationSystem/InvitationList";
import { PasswordManagement } from "./PasswordManagement";
import { MultiRoleManager } from "./MultiRoleManager";
import { GDPRAdminPanel } from "../Admin/GDPRAdminPanel";
import type { AppRole } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { deleteUserCompletely } from "@/utils/userDeletion";
import { supabase } from "@/integrations/supabase/client";
import { validateEmail, validatePasswordStrength, sanitizeText } from "@/utils/inputSanitization";
import { useNavigate } from "react-router-dom";
import { MobileUserCard } from "@/components/ui/mobile-table";

const roleLabels: Record<AppRole, string> = {
  superadmin: "Superadministratör",
  admin: "Administratör", 
  coach: "Coach",
  client: "Klient"
};

const roleColors: Record<AppRole, string> = {
  superadmin: "bg-red-500",
  admin: "bg-orange-500",
  coach: "bg-teal-500",
  client: "bg-yellow-500"
};

export function CentralUserManager() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { 
    users, 
    allUsers, 
    loading, 
    stats, 
    updateUser, 
    deleteUser, 
    updateUserRole, 
    refetch 
  } = useUnifiedUserData();
  
  const {
    canManageUsers,
    canManageRoles,
    canAccessGamification,
    isAdmin,
    isSuperAdmin
  } = useUnifiedPermissions();

  // State för dialogs
  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFullProfileDialogOpen, setIsFullProfileDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  
  // State för användarhantering
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  
  // State för filtrering och sökning
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // State för ny användare
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'client' as AppRole
  });

  // Filtrerade användare
  const filteredUsers = users.filter(user => {
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter as AppRole);
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 16; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    setNewUserData(prev => ({ ...prev, password }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!validateEmail(newUserData.email)) {
        throw new Error('Ogiltig e-postadress');
      }

      const passwordValidation = validatePasswordStrength(newUserData.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Lösenordet uppfyller inte kraven: ${passwordValidation.errors.join(', ')}`);
      }

      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: sanitizeText(newUserData.email.toLowerCase().trim()),
          password: newUserData.password,
          firstName: sanitizeText(newUserData.firstName.trim()),
          lastName: sanitizeText(newUserData.lastName.trim()),
          role: newUserData.role
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Användare skapad",
          description: `Användare ${newUserData.email} har skapats framgångsrikt.`,
        });

        setNewUserData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'client'
        });
        setIsCreateUserDialogOpen(false);
        refetch();
      } else {
        throw new Error(data.error || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa användare",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      toast({
        title: "Fel",
        description: "Användare kunde inte hittas",
        variant: "destructive"
      });
      return;
    }

    const identifier = userToDelete.email || `${userToDelete.first_name} ${userToDelete.last_name}`;
    
    if (!window.confirm(`Är du säker på att du vill ta bort användaren ${identifier}? Denna åtgärd raderar all relaterad data inklusive klientprofiler, uppgifter, meddelanden och bedömningar. Denna åtgärd kan inte ångras.`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const result = await deleteUserCompletely(identifier);

      if (result.errors.length > 0) {
        console.error('Deletion errors:', result.errors);
        toast({
          title: "Delvis fel vid borttagning",
          description: `Vissa data kunde inte tas bort: ${result.errors.join(', ')}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Användare borttagen",
          description: `Användaren och all relaterad data har tagits bort från systemet`
        });
      }

      refetch();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort användare: " + error.message,
        variant: "destructive"
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingRoleUserId(userId);
    try {
      await updateUserRole(userId, newRole);
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const getRoleIcon = (roles: string[]) => {
    if (roles.includes('superadmin')) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (roles.includes('admin')) return <Shield className="h-4 w-4 text-red-500" />;
    if (roles.includes('coach')) return <Brain className="h-4 w-4 text-blue-500" />;
    return <User className="h-4 w-4 text-gray-500" />;
  };

  const getRoleBadge = (roles: string[]) => {
    const primaryRole = roles.includes('superadmin') ? 'superadmin' :
                       roles.includes('admin') ? 'admin' :
                       roles.includes('coach') ? 'coach' : 'client';
    
    const variants = {
      superadmin: 'destructive',
      admin: 'secondary',
      coach: 'default',
      client: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[primaryRole as keyof typeof variants]}>
        {roleLabels[primaryRole as AppRole]}
      </Badge>
    );
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center space-y-4">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen behörighet</h3>
            <p className="text-muted-foreground">Du har inte behörighet att hantera användare.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Laddar användarsystem...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Central Användaradministration</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Konsoliderad hantering av alla användare, roller och funktioner</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateUserDialogOpen(true)} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Skapa användare</span>
            <span className="sm:hidden">Skapa</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Totalt</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Aktiva</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Klienter</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.byRole.client}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Coaches</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.byRole.coach}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-1">
          <TabsTrigger value="users" className="flex items-center gap-1 text-xs sm:text-sm">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Användare</span>
            <span className="sm:hidden">User</span>
            <span className="hidden lg:inline">({stats.total})</span>
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-1 text-xs sm:text-sm">
            <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Onboarding</span>
            <span className="sm:hidden">Onb</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-1 text-xs sm:text-sm">
            <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Inbjudningar</span>
            <span className="sm:hidden">Inv</span>
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-1 text-xs sm:text-sm">
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Organisationer</span>
            <span className="sm:hidden">Org</span>
          </TabsTrigger>
          {canAccessGamification && (
            <TabsTrigger value="gamification" className="flex items-center gap-1 text-xs sm:text-sm">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Gamification</span>
              <span className="sm:hidden">Game</span>
            </TabsTrigger>
          )}
          {canManageRoles && (
            <TabsTrigger value="roles" className="flex items-center gap-1 text-xs sm:text-sm">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Roller</span>
              <span className="sm:hidden">Role</span>
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="gdpr" className="flex items-center gap-1 text-xs sm:text-sm">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>GDPR</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Alla användare</CardTitle>
              <CardDescription>
                Centraliserad hantering av alla användare i systemet
              </CardDescription>
              
              {/* Filters */}
              <div className="flex flex-col gap-3 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Sök användare..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
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
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Inaktiv</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Inga användare hittades</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                      ? "Inga användare matchar dina filter"
                      : "Inga användare finns registrerade"
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Användare</TableHead>
                          <TableHead>Roll</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Senast inloggad</TableHead>
                          <TableHead>Registrerad</TableHead>
                          <TableHead>Åtgärder</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {getRoleIcon(user.roles)}
                                <div>
                                  <div className="font-medium">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Namnlös'}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              {getRoleBadge(user.roles)}
                            </TableCell>
                            
                            <TableCell>
                              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                {user.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                              </Badge>
                            </TableCell>
                            
                            <TableCell>
                              <div className="text-sm">
                                {user.last_login_at 
                                  ? new Date(user.last_login_at).toLocaleDateString('sv-SE')
                                  : 'Aldrig'
                                }
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="text-sm">
                                {user.created_at 
                                  ? new Date(user.created_at).toLocaleDateString('sv-SE')
                                  : 'Okänt'
                                }
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user);
                                    setIsFullProfileDialogOpen(true);
                                  }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visa profil
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    navigate(`/user/${user.id}`);
                                  }}>
                                    <Key className="h-4 w-4 mr-2" />
                                    Gå till profil
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user);
                                    setIsEditDialogOpen(true);
                                  }}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Redigera
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-destructive"
                                    disabled={deletingUserId === user.id}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {deletingUserId === user.id ? 'Raderar...' : 'Ta bort'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-3">
                    {filteredUsers.map((user) => (
                      <MobileUserCard
                        key={user.id}
                        user={user}
                        onViewProfile={(user) => {
                          setSelectedUser(user);
                          setIsFullProfileDialogOpen(true);
                        }}
                        onEditUser={(user) => {
                          setSelectedUser(user);
                          setIsEditDialogOpen(true);
                        }}
                        onDeleteUser={handleDeleteUser}
                        onNavigateToProfile={(userId) => navigate(`/user/${userId}`)}
                        isDeleting={deletingUserId === user.id}
                        getRoleBadge={getRoleBadge}
                        getRoleIcon={getRoleIcon}
                      />
                    ))}
                  </div>
                </>
              )}
              
              <div className="mt-4 text-sm text-muted-foreground">
                Visar {filteredUsers.length} av {users.length} användare
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding">
          <OnboardingWorkflow />
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SendInvitationForm />
            <InvitationList />
          </div>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Organisationsöversikt</CardTitle>
              <CardDescription>
                Visa och hantera organisationer baserat på användardata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Organisationer baserade på användarnas registrerade organisationer.
                </p>
                
                <div className="grid gap-3">
                  {Object.entries(stats.byOrganization).map(([org, count]) => (
                    <div key={org} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{org}</h4>
                          <p className="text-sm text-muted-foreground">{count} användare</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{count}</Badge>
                        <Button variant="outline" size="sm" disabled>
                          Hantera
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {Object.keys(stats.byOrganization).length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Inga organisationer registrerade ännu</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gamification Tab */}
        {canAccessGamification && (
          <TabsContent value="gamification">
            <AdminGamificationPanel />
          </TabsContent>
        )}

        {/* Roles Tab */}
        {canManageRoles && (
          <TabsContent value="roles">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(roleLabels).map(([role, label]) => (
                <Card key={role}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${roleColors[role as AppRole]}`} />
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {role === 'superadmin' && 'Full systemåtkomst och kontroll'}
                        {role === 'admin' && 'Administrativ åtkomst och användarhantering'}
                        {role === 'client' && 'Klientåtkomst och personlig utveckling'}
                        {role === 'coach' && 'Coach och vägledning av klienter'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {stats.byRole[role as AppRole]} användare
                        </span>
                        {role === 'superadmin' && <Shield className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {/* GDPR Tab */}
        {isAdmin && (
          <TabsContent value="gdpr">
            <GDPRAdminPanel />
          </TabsContent>
        )}
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Skapa ny användare</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Förnamn</Label>
                <Input
                  id="firstName"
                  value={newUserData.firstName}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Efternamn</Label>
                <Input
                  id="lastName"
                  value={newUserData.lastName}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Lösenord</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  placeholder="Minst 8 tecken"
                />
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generera
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="role">Roll</Label>
              <Select 
                value={newUserData.role} 
                onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value as AppRole }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj roll" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateUserDialogOpen(false)}
              >
                Avbryt
              </Button>
              <Button type="submit">
                Skapa användare
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera användare</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">Förnamn</Label>
                  <Input 
                    id="editFirstName" 
                    defaultValue={selectedUser.first_name || ''} 
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Efternamn</Label>
                  <Input 
                    id="editLastName" 
                    defaultValue={selectedUser.last_name || ''} 
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editOrganization">Organisation</Label>
                <Input 
                  id="editOrganization" 
                  defaultValue={selectedUser.organization || ''} 
                />
              </div>
              <div>
                <Label>Roller</Label>
                <MultiRoleManager
                  userId={selectedUser.id}
                  currentRoles={selectedUser.roles}
                  onRolesUpdated={refetch}
                  disabled={updatingRoleUserId === selectedUser.id}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={() => setIsEditDialogOpen(false)}>
                  Spara ändringar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Profile Dialog */}
      <Dialog open={isFullProfileDialogOpen} onOpenChange={setIsFullProfileDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Fullständig profil - {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {(selectedUser.first_name?.[0] || '') + (selectedUser.last_name?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">
                        {selectedUser.first_name} {selectedUser.last_name}
                      </h3>
                      <p className="text-muted-foreground">{selectedUser.email}</p>
                      {selectedUser.phone && (
                        <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {selectedUser.roles.map(role => (
                          <Badge key={role} variant="outline">
                            {roleLabels[role as AppRole]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Tools */}
              {(isAdmin || isSuperAdmin) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Admin Verktyg
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      <PasswordManagement
                        userId={selectedUser.id}
                        userEmail={selectedUser.email || ''}
                        userName={`${selectedUser.first_name} ${selectedUser.last_name}`}
                      />
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteUser(selectedUser.id)}
                        disabled={deletingUserId === selectedUser.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingUserId === selectedUser.id ? 'Raderar...' : 'Radera användare'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}