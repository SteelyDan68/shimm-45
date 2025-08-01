import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus,
  Building2, 
  Shield, 
  Settings,
  Mail,
  Trophy,
  User,
  Eye,
  Edit3,
  Trash2,
  MoreHorizontal,
  Search,
  Crown,
  AlertCircle,
  Plus,
  Filter,
  Brain,
  Zap,
  Activity
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
import { OrganizationManager } from "../Organizations/OrganizationManager";
import type { AppRole } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { deleteUserCompletely } from "@/utils/userDeletion";
import { useNavigate } from "react-router-dom";
import { AdminUserCreation } from "./AdminUserCreation";

const roleLabels: Record<AppRole, string> = {
  superadmin: "Superadministratör",
  admin: "Administratör", 
  coach: "Coach",
  client: "Klient"
};

const roleColors: Record<AppRole, string> = {
  superadmin: "bg-gradient-to-r from-red-500 to-pink-500",
  admin: "bg-gradient-to-r from-orange-500 to-amber-500",
  coach: "bg-gradient-to-r from-blue-500 to-cyan-500",
  client: "bg-gradient-to-r from-green-500 to-emerald-500"
};

// User Card Component för drag & drop
interface UserCardProps {
  user: UnifiedUser;
  onEdit: (user: UnifiedUser) => void;
  onDelete: (userId: string) => void;
  onView: (user: UnifiedUser) => void;
  isDeleting?: boolean;
}

function UserCard({ user, onEdit, onDelete, onView, isDeleting }: UserCardProps) {
  const getRoleIcon = (roles: string[]) => {
    if (roles.includes('superadmin')) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (roles.includes('admin')) return <Shield className="h-4 w-4 text-red-500" />;
    if (roles.includes('coach')) return <Brain className="h-4 w-4 text-blue-500" />;
    return <User className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-primary cursor-move">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Namnlös'}</h4>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {getRoleIcon(user.roles)}
              <Badge variant="outline" className="text-xs">
                {roleLabels[user.roles[0] as AppRole] || 'Okänd roll'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(user)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(user.id)}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function CentralUserManager() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { 
    users, 
    loading, 
    stats, 
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
  
  // State för användarhantering
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // State för filtrering och sökning
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  // Callback when user is created successfully
  const handleUserCreated = () => {
    refetch();
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

      if (result.errors && result.errors.length > 0) {
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
      {/* Modern Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Användaradministration
          </h2>
          <p className="text-muted-foreground">Moderniserad och hierarkisk hantering av användare och system</p>
        </div>
        <div className="flex gap-2">
          <AdminUserCreation onUserCreated={handleUserCreated} />
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Totalt användare</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Aktiva</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">Coaches</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.byRole.coach}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-700 dark:text-orange-300">Klienter</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.byRole.client}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarkisk Tab Structure - Endast 3 huvudkategorier */}
      <Tabs defaultValue="people" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-1 h-14 bg-muted/50">
          <TabsTrigger 
            value="people" 
            className="flex flex-col items-center gap-1 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">👥 Människor</span>
            <span className="text-xs text-muted-foreground">Users • Onboarding • Invites</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="system" 
            className="flex flex-col items-center gap-1 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-medium">🏢 System</span>
            <span className="text-xs text-muted-foreground">Organizations • Roles • GDPR</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="automation" 
            className="flex flex-col items-center gap-1 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Zap className="h-5 w-5" />
            <span className="text-sm font-medium">⚙️ Automation</span>
            <span className="text-xs text-muted-foreground">Gamification • AI • Health</span>
          </TabsTrigger>
        </TabsList>

        {/* 👥 MÄNNISKOR - Tab Content */}
        <TabsContent value="people" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Vänster Sidopanel - Navigation & Filters */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Filter & Sök</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Sök användare..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrera roll" />
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
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Inaktiv</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Sub-navigation för Människor */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Navigering</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Alla användare ({stats.total})
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Onboarding
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Inbjudningar
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Höger Huvudinnehåll - User Cards med mer utrymme */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Användare ({filteredUsers.length})</CardTitle>
                      <CardDescription>Drag och släpp för att organisera användare</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Bulk åtgärder
                      </Button>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Exportera
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
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
                    <div className="grid gap-3">
                      {filteredUsers.map((user) => (
                        <UserCard
                          key={user.id}
                          user={user}
                          onEdit={(user) => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}
                          onView={(user) => {
                            setSelectedUser(user);
                            setIsFullProfileDialogOpen(true);
                          }}
                          onDelete={handleDeleteUser}
                          isDeleting={deletingUserId === user.id}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Expandable sections for Onboarding and Invitations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Onboarding Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OnboardingWorkflow />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Inbjudningshantering
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SendInvitationForm />
                <InvitationList />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 🏢 SYSTEM - Tab Content */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Organizations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organisationer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byOrganization).map(([org, count]) => (
                    <div key={org} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{org}</h4>
                        <p className="text-sm text-muted-foreground">{count} användare</p>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                  
                  {Object.keys(stats.byOrganization).length === 0 && (
                    <div className="text-center py-8">
                      <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Inga organisationer</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Roles */}
            {canManageRoles && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Rollhantering
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${roleColors[role as AppRole]}`} />
                          <span className="font-medium">{label}</span>
                        </div>
                        <Badge variant="outline">{stats.byRole[role as AppRole]} användare</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* GDPR */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    GDPR & Säkerhet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GDPRAdminPanel />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ⚙️ AUTOMATION - Tab Content */}
        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gamification */}
            {canAccessGamification && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Gamification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminGamificationPanel />
                </CardContent>
              </Card>
            )}

            {/* System Health & AI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Automation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">AI Assistants</h4>
                      <p className="text-sm text-muted-foreground">Stefan AI & automatisering</p>
                    </div>
                    <Badge variant="default">Aktiv</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Health Monitoring</h4>
                      <p className="text-sm text-muted-foreground">System hälsoövervakning</p>
                    </div>
                    <Badge variant="default">Aktiv</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Auto Reports</h4>
                      <p className="text-sm text-muted-foreground">Automatiska rapporter</p>
                    </div>
                    <Badge variant="secondary">Inaktiv</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}