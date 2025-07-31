import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Building2, 
  Shield, 
  Edit3, 
  Trash2,
  MoreHorizontal,
  Crown,
  Settings,
  AlertCircle,
  Mail,
  Trophy,
  Brain,
  Key,
  User
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AdminUserCreation } from "./AdminUserCreation";
import { ClientList } from "./ClientManagement/ClientList";
import { ClientGroupManager } from "./ClientManagement/ClientGroupManager";
import { SendInvitationForm } from "./InvitationSystem/SendInvitationForm";
import { InvitationList } from "./InvitationSystem/InvitationList";
import { AdminGamificationPanel } from "./Admin/AdminGamificationPanel";
import { OnboardingWorkflow } from "./Admin/OnboardingWorkflow";
import { PasswordManagement } from "./UserManagement/PasswordManagement";
import { UserTable } from "./UserManagement/UserTable";
import { MultiRoleManager } from "./UserManagement/MultiRoleManager";
import type { Profile, AppRole } from "@/hooks/useAuth";

interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  members_count?: number;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_at: string;
}

interface ExtendedProfile extends Profile {
  roles?: AppRole[];
}

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

export function UserManagement() {
  const { toast } = useToast();
  const { isAdmin, canManageUsers, roles } = useAuth();
  const isSuperAdmin = roles.includes('superadmin');
  const adminStatus = isAdmin();
  const [users, setUsers] = useState<ExtendedProfile[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ExtendedProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFullProfileDialogOpen, setIsFullProfileDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log('UserManagement - canManageUsers:', canManageUsers);
    console.log('UserManagement - roles from useAuth:', roles);
    console.log('UserManagement - isAdmin:', isAdmin());
    console.log('UserManagement - isSuperAdmin:', isSuperAdmin);
    
    if (canManageUsers) {
      fetchUsers();
      fetchOrganizations();
    }
  }, [canManageUsers, roles]);

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      console.log('Fetched profiles:', profiles?.length, profiles?.map(p => ({
        name: `${p.first_name} ${p.last_name}`,
        email: p.email,
        id: p.id
      })));

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      console.log('Fetched user roles:', userRoles?.length, userRoles);

      // Combine users with their roles - DON'T filter out users without roles
      const usersWithRoles = profiles?.map(profile => {
        const userRolesList = userRoles?.filter(role => role.user_id === profile.id)
          .map(role => role.role)
          .filter(role => role !== 'user') as AppRole[] || [];
        
        return {
          ...profile,
          roles: userRolesList
        };
      }) || [];

      console.log('Users with roles:', usersWithRoles.length, usersWithRoles.map(u => ({
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        roles: u.roles
      })));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta användare",
        variant: "destructive"
      });
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrganizations(data || []);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta organisationer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingRoleUserId(userId);
    try {
      // Remove existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Add new role - cast to any to handle DB enum mismatch temporarily
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: newRole as any }]);

      if (insertError) throw insertError;

      toast({
        title: "Roll uppdaterad",
        description: `Användarens roll har ändrats till ${roleLabels[newRole]}`
      });

      fetchUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera användarroll",
        variant: "destructive"
      });
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    // Find the user to get their identifier for deletion
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
      // Import and use the comprehensive deletion function
      const { deleteUserCompletely } = await import('@/utils/userDeletion');
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
          description: `Användaren och all relaterad data har tagits bort från systemet. Raderade: profil (${result.deleted_profile ? 'ja' : 'nej'}), roller (${result.deleted_roles}), bedömningar (${result.deleted_assessments}), uppgifter (${result.deleted_tasks}), meddelanden (${result.deleted_messages}), övrigt (${result.deleted_other_data})`
        });
      }

      fetchUsers(); // Refresh the list
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

  const openEditDialog = (user: ExtendedProfile) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const openFullProfileDialog = (user: ExtendedProfile) => {
    setSelectedUser(user);
    setIsFullProfileDialogOpen(true);
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
            <span>Laddar användare och organisationer...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Användarhantering</h2>
          <p className="text-muted-foreground">Hantera användare, roller och organisationer</p>
        </div>
        <AdminUserCreation onUserCreated={fetchUsers} />
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Användarhantering ({users.length})
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Onboarding Workflow
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Inbjudningar
          </TabsTrigger>
          <TabsTrigger value="gamification" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Gamification
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organisationer ({organizations.length})
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roller & Behörigheter
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Alla användare</CardTitle>
              <CardDescription>
                Visa och hantera alla användare i systemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                users={users}
                isAdmin={adminStatus}
                isSuperAdmin={isSuperAdmin}
                onEditUser={openEditDialog}
                onViewProfile={openFullProfileDialog}
                onDeleteUser={deleteUser}
                onRoleChange={handleRoleChange}
                deletingUserId={deletingUserId}
                updatingRoleUserId={updatingRoleUserId}
              />
            </CardContent>
          </Card>
        </TabsContent>


        {/* Organizations Tab */}
        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Organisationer</CardTitle>
              <CardDescription>
                Hantera organisationer och deras medlemmar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Skapad</TableHead>
                    <TableHead>Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{org.slug}</TableCell>
                      <TableCell>
                        <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                          {org.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(org.created_at).toLocaleDateString('sv-SE')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(roleLabels).map(([role, label]) => (
              <Card key={role}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${roleColors[role as AppRole]}`} />
                    {label}
                  </CardTitle>
                  <CardDescription>
                    {role === 'superadmin' && 'Full systemåtkomst och kontroll'}
                    {role === 'admin' && 'Administrativ åtkomst och användarhantering'}
                     {role === 'client' && 'Klientåtkomst och rapporter'}
                     {role === 'coach' && 'Coach och vägledning av klienter'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {users.filter(u => u.roles?.includes(role as AppRole)).length} användare
                    </span>
                    {role === 'superadmin' && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>
                </CardContent>
              </Card>
            ))}
           </div>
        </TabsContent>
      
        <TabsContent value="invitations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SendInvitationForm />
            <InvitationList />
          </div>
        </TabsContent>

        <TabsContent value="gamification" className="space-y-6">
          <AdminGamificationPanel />
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <OnboardingWorkflow />
        </TabsContent>

      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera användare</DialogTitle>
            <DialogDescription>
              Ändra användarinformation och roller
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Förnamn</Label>
                  <Input 
                    id="firstName" 
                    defaultValue={selectedUser.first_name || ''} 
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Efternamn</Label>
                  <Input 
                    id="lastName" 
                    defaultValue={selectedUser.last_name || ''} 
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role">Roller</Label>
                <MultiRoleManager
                  userId={selectedUser.id}
                  currentRoles={selectedUser.roles}
                  onRolesUpdated={fetchUsers}
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
            <DialogDescription>
              Visa och hantera alla användarens profiluppgifter
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Header med avatar och grundinfo */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-lg">
                        {(selectedUser.first_name?.[0] || '') + (selectedUser.last_name?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">
                        {selectedUser.first_name} {selectedUser.last_name}
                      </h3>
                      <p className="text-muted-foreground">{selectedUser.email}</p>
                      <div className="flex gap-2 mt-2">
                        {selectedUser.roles?.map((role) => (
                          <Badge 
                            key={role} 
                            variant="secondary"
                            className={`text-white ${roleColors[role]}`}
                          >
                            {roleLabels[role]}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={selectedUser.status === 'active' ? 'default' : 'secondary'}>
                          {selectedUser.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                        {selectedUser.organization && (
                          <Badge variant="outline">{selectedUser.organization}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Skapad: {new Date(selectedUser.created_at).toLocaleDateString('sv-SE')}</p>
                      <p>Senaste inloggning: {selectedUser.last_login_at 
                        ? new Date(selectedUser.last_login_at).toLocaleDateString('sv-SE')
                        : 'Aldrig'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lösenordshantering för admin/superadmin */}
              {(adminStatus || isSuperAdmin) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Lösenordshantering
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PasswordManagement 
                      userId={selectedUser.id}
                      userEmail={selectedUser.email}
                      userName={`${selectedUser.first_name} ${selectedUser.last_name}`}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Placeholder för utökad profildata */}
              <Card>
                <CardHeader>
                  <CardTitle>Utökad profildata</CardTitle>
                  <CardDescription>
                    Här visas all profildata som användaren fyllt i via sin profil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Fullständig profildata kommer att visas här när användaren fyllt i sin utökade profil.
                    Detta inkluderar kontaktuppgifter, digital närvaro, arbetsprofil, hälsoinformation och systeminställningar.
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsFullProfileDialogOpen(false)}>
                  Stäng
                </Button>
                <Button onClick={() => {
                  setIsFullProfileDialogOpen(false);
                  openEditDialog(selectedUser);
                }}>
                  Redigera användare
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}