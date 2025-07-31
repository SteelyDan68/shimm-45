import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, 
  UserPlus,
  Building2, 
  Shield, 
  Brain,
  Mail,
  Trophy,
  User,
  Settings
} from "lucide-react";
import { useUnifiedUserData, type UnifiedUser } from "@/hooks/useUnifiedUserData";
import { useUnifiedPermissions } from "@/hooks/useUnifiedPermissions";
import { UserTable } from "../UserManagement/UserTable";
import { AdminUserCreation } from "../AdminUserCreation";
import { PasswordManagement } from "../UserManagement/PasswordManagement";
import { OnboardingWorkflow } from "../Admin/OnboardingWorkflow";
import { AdminGamificationPanel } from "../Admin/AdminGamificationPanel";
import { SendInvitationForm } from "../InvitationSystem/SendInvitationForm";
import { InvitationList } from "../InvitationSystem/InvitationList";
import type { AppRole } from "@/hooks/useAuth";

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

export function UnifiedUserManager() {
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

  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFullProfileDialogOpen, setIsFullProfileDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);

  const openEditDialog = (user: UnifiedUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const openFullProfileDialog = (user: UnifiedUser) => {
    setSelectedUser(user);
    setIsFullProfileDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Är du säker på att du vill ta bort denna användare? Denna åtgärd kan inte ångras.')) {
      return;
    }

    setDeletingUserId(userId);
    try {
      await deleteUser(userId);
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

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center">
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Användarsystem</h2>
          <p className="text-muted-foreground">Centraliserad hantering av alla användare och funktioner</p>
        </div>
        <AdminUserCreation onUserCreated={refetch} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Totalt</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aktiva</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Klienter</p>
                <p className="text-2xl font-bold">{stats.byRole.client}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Coaches</p>
                <p className="text-2xl font-bold">{stats.byRole.coach}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Alla användare ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Onboarding ({stats.byRole.client})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Inbjudningar
          </TabsTrigger>
          {canAccessGamification && (
            <TabsTrigger value="gamification" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Gamification
            </TabsTrigger>
          )}
          {canManageRoles && (
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roller & Behörigheter
            </TabsTrigger>
          )}
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <UserTable
            users={users}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            onEditUser={openEditDialog}
            onViewProfile={openFullProfileDialog}
            onDeleteUser={handleDeleteUser}
            onRoleChange={handleRoleChange}
            deletingUserId={deletingUserId}
            updatingRoleUserId={updatingRoleUserId}
          />
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
      </Tabs>

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
              {/* User Info Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
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

              {/* Progress Overview */}
              {selectedUser.roles?.includes('client') && (
                <Card>
                  <CardHeader>
                    <CardTitle>Framsteg & Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                          selectedUser.onboarding_completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-medium">Onboarding</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.onboarding_completed ? 'Genomförd' : 'Ej påbörjad'}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                          selectedUser.assessment_completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <Shield className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-medium">Assessment</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.assessment_completed ? 'Genomförd' : 'Ej påbörjad'}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                          (selectedUser.habits_active || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <Trophy className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-medium">Vanor</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.habits_active || 0} aktiva
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Password Management for admins */}
              {(isAdmin || isSuperAdmin) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Hanteringsverktyg
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PasswordManagement 
                      userId={selectedUser.id}
                      userEmail={selectedUser.email || ''}
                      userName={`${selectedUser.first_name} ${selectedUser.last_name}`}
                    />
                  </CardContent>
                </Card>
              )}

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