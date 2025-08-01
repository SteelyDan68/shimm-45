import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Users, 
  UserPlus,
  Shield, 
  Brain,
  User,
  Settings,
  Eye,
  Edit3,
  Trash2,
  Search,
  Crown,
  AlertCircle,
  ArrowRight,
  MousePointer,
  Zap,
  Plus,
  UserCheck,
  UserX,
  ChevronDown
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useUnifiedUserData, type UnifiedUser } from "@/hooks/useUnifiedUserData";
import { useUnifiedPermissions } from "@/hooks/useUnifiedPermissions";
import { PasswordManagement } from "./PasswordManagement";
import { MultiRoleManager } from "./MultiRoleManager";
import type { AppRole } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { deleteUserCompletely } from "@/utils/userDeletion";
import { useNavigate } from "react-router-dom";
import { AdminUserCreation } from "./AdminUserCreation";

// Interfaces for the new system
interface SortableUserCardProps {
  user: UnifiedUser;
  onViewProfile: (user: UnifiedUser) => void;
  onEditUser: (user: UnifiedUser) => void;
  onDeleteUser: (userId: string) => void;
  isDeleting: boolean;
  isSelected: boolean;
  onSelect: (user: UnifiedUser) => void;
}

interface UserWorkspacePanelProps {
  title: string;
  users: UnifiedUser[];
  selectedUsers: UnifiedUser[];
  onUserSelect: (user: UnifiedUser) => void;
  onUserAction: (action: string, user: UnifiedUser) => void;
  isLoading?: boolean;
}

// Sortable User Card Component
function SortableUserCard({ 
  user, 
  onViewProfile, 
  onEditUser, 
  onDeleteUser, 
  isDeleting, 
  isSelected,
  onSelect 
}: SortableUserCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: user.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getRoleIcon = (roles: string[]) => {
    if (roles.includes('superadmin')) return <Crown className="h-4 w-4 text-yellow-600" />;
    if (roles.includes('admin')) return <Shield className="h-4 w-4 text-red-600" />;
    if (roles.includes('coach')) return <Brain className="h-4 w-4 text-blue-600" />;
    return <User className="h-4 w-4 text-gray-600" />;
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
      <Badge variant={variants[primaryRole as keyof typeof variants]} className="text-xs">
        {primaryRole}
      </Badge>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative bg-card border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer select-none ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      } ${isDragging ? 'z-50' : ''}`}
      onClick={() => onSelect(user)}
    >
      <div className="flex items-center gap-3">
        <Checkbox 
          checked={isSelected}
          onChange={() => onSelect(user)}
          onClick={(e) => e.stopPropagation()}
        />
        
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-sm">
            {(user.first_name?.[0] || '') + (user.last_name?.[0] || '') || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {getRoleIcon(user.roles)}
            <span className="font-medium text-sm truncate">
              {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Namnlös'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          <div className="flex items-center gap-1 mt-1">
            {getRoleBadge(user.roles)}
            <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs">
              {user.status === 'active' ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(user);
            }}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEditUser(user);
            }}
            className="h-8 w-8 p-0"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteUser(user.id);
            }}
            disabled={isDeleting}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Workspace Panel Component
function UserWorkspacePanel({ 
  title, 
  users, 
  selectedUsers, 
  onUserSelect, 
  onUserAction,
  isLoading 
}: UserWorkspacePanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {title}
          <Badge variant="secondary" className="ml-auto">
            {users.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Inga användare här än</p>
          </div>
        ) : (
          <SortableContext items={users.map(u => u.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {users.map(user => (
                <SortableUserCard
                  key={user.id}
                  user={user}
                  onViewProfile={(user) => onUserAction('view', user)}
                  onEditUser={(user) => onUserAction('edit', user)}
                  onDeleteUser={(userId) => onUserAction('delete', { id: userId } as UnifiedUser)}
                  isDeleting={false}
                  isSelected={selectedUsers.some(u => u.id === user.id)}
                  onSelect={onUserSelect}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
}

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

  // Drag and Drop State
  const [activeUser, setActiveUser] = useState<UnifiedUser | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // UI State
  const [selectedUsers, setSelectedUsers] = useState<UnifiedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFullProfileDialogOpen, setIsFullProfileDialogOpen] = useState(false);
  
  // Operational State
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  
  // Filtering State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // User Organization
  const availableUsers = useMemo(() => {
    return users.filter(user => {
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
  }, [users, searchTerm, roleFilter, statusFilter]);

  const workspaceUsers = useMemo(() => {
    return selectedUsers;
  }, [selectedUsers]);

  // Event Handlers
  const handleUserCreated = () => {
    refetch();
  };

  const handleUserSelect = (user: UnifiedUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleUserAction = (action: string, user: UnifiedUser) => {
    switch (action) {
      case 'view':
        setSelectedUser(user);
        setIsFullProfileDialogOpen(true);
        break;
      case 'edit':
        setSelectedUser(user);
        setIsEditDialogOpen(true);
        break;
      case 'delete':
        if (user.id) {
          handleDeleteUser(user.id);
        }
        break;
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

      // Remove from selected users if present
      setSelectedUsers(prev => prev.filter(u => u.id !== userId));
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

  // Bulk Operations
  const handleBulkRoleAssignment = async (role: AppRole) => {
    if (selectedUsers.length === 0) return;
    
    setUpdatingRoleUserId('bulk');
    try {
      await Promise.all(
        selectedUsers.map(user => updateUserRole(user.id, role))
      );
      
      toast({
        title: "Roller uppdaterade",
        description: `${selectedUsers.length} användare har fått rollen ${role}`
      });
      
      setSelectedUsers([]);
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera alla roller",
        variant: "destructive"
      });
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!window.confirm(`Är du säker på att du vill ta bort ${selectedUsers.length} användare? Denna åtgärd kan inte ångras.`)) {
      return;
    }

    setDeletingUserId('bulk');
    try {
      await Promise.all(
        selectedUsers.map(user => 
          deleteUserCompletely(user.email || `${user.first_name} ${user.last_name}`)
        )
      );
      
      toast({
        title: "Användare borttagna",
        description: `${selectedUsers.length} användare har tagits bort`
      });
      
      setSelectedUsers([]);
      refetch();
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort alla användare",
        variant: "destructive"
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const user = users.find(u => u.id === event.active.id);
    setActiveUser(user || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveUser(null);
      return;
    }

    const user = users.find(u => u.id === active.id);
    if (user && !selectedUsers.some(u => u.id === user.id)) {
      handleUserSelect(user);
    }
    
    setActiveUser(null);
  };

  // Clear selections
  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  // Role label mapping
  const roleLabels: Record<AppRole, string> = {
    superadmin: "Superadministratör",
    admin: "Administratör", 
    coach: "Coach",
    client: "Klient"
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
          <AdminUserCreation onUserCreated={handleUserCreated} />
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
                <p className="text-xs sm:text-sm text-muted-foreground">Användare</p>
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

      {/* Modern Drag-and-Drop User Management Workspace */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {/* Workspace Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Användararbetsyta
              </CardTitle>
              <CardDescription>
                Drag användare mellan panelerna för att organisera och hantera dem effektivt
              </CardDescription>
              
              {/* Control Panel */}
              <div className="flex flex-col gap-4 mt-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Sök användare..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
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

                {/* Bulk Actions */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      {selectedUsers.length} valda
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Select onValueChange={handleBulkRoleAssignment}>
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue placeholder="Tilldela roll" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="client">Klient</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={deletingUserId === 'bulk'}
                        className="h-8"
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        Ta bort alla
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearSelection}
                        className="h-8"
                      >
                        Rensa
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Two-Column Workspace */}
          <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
            {/* Left Panel - Available Users */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <UserWorkspacePanel
                title="Tillgängliga användare"
                users={availableUsers}
                selectedUsers={selectedUsers}
                onUserSelect={handleUserSelect}
                onUserAction={handleUserAction}
                isLoading={loading}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Right Panel - Selected Users / Workspace */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Arbetsyta
                    <Badge variant="secondary" className="ml-auto">
                      {selectedUsers.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Utför åtgärder på valda användare
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ArrowRight className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Välj användare från vänster panel</p>
                      <p className="text-xs mt-1">Klicka på användare eller dra dem hit</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-0"
                          disabled={updatingRoleUserId === 'bulk'}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Hantera roller
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-0"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Redigera profiler
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 min-w-0"
                          onClick={handleBulkDelete}
                          disabled={deletingUserId === 'bulk'}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {deletingUserId === 'bulk' ? 'Raderar...' : 'Ta bort'}
                        </Button>
                      </div>

                      {/* Selected Users List */}
                      <div className="max-h-[400px] overflow-y-auto space-y-2">
                        {selectedUsers.map(user => (
                          <div
                            key={user.id}
                            className="group relative bg-muted/50 border rounded-lg p-3 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {(user.first_name?.[0] || '') + (user.last_name?.[0] || '') || '?'}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Namnlös'}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserSelect(user)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <UserX className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeUser && (
            <div className="bg-card border rounded-lg p-3 shadow-lg opacity-90 rotate-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm">
                    {(activeUser.first_name?.[0] || '') + (activeUser.last_name?.[0] || '') || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {`${activeUser.first_name || ''} ${activeUser.last_name || ''}`.trim() || 'Namnlös'}
                  </div>
                  <div className="text-xs text-muted-foreground">{activeUser.email}</div>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>


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