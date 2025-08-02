/**
 * Central User Management Component
 * Handles user administration, roles, and relationships
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileContainer, MobileTouchButton, MobileGrid, MobileStack } from '@/components/ui/mobile-responsive';
import { ResponsiveTable } from '@/components/ui/mobile-table';

// Icons
import { 
  Users, UserPlus, UserMinus, UserCheck, User, Eye, Edit3, Trash2, Save, X, Plus, Search, Filter,
  Crown, Shield, Brain, Building2, Mail, Trophy, Settings, Activity, RefreshCw, Link, ArrowRight,
  AlertCircle, CheckCircle2, Clock, Phone, MapPin, Briefcase, Upload, Camera, Download, FileText,
  Zap, Heart, MoreHorizontal, ChevronRight, ChevronDown, Target, Workflow
} from 'lucide-react';

// Hooks & Types
import { useToast } from '@/hooks/use-toast';
import { useAuth, type AppRole } from '@/hooks/useAuth';
import { useUnifiedUserData, type UnifiedUser } from '@/hooks/useUnifiedUserData';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import { useCoachClientRelationships, type CoachClientRelationship } from '@/hooks/useCoachClientRelationships';
import { useExtendedProfile } from '@/hooks/useExtendedProfile';
import type { ExtendedProfileData } from '@/types/extendedProfile';
import { PRIMARY_ROLES, PLATFORMS, COUNTRIES } from '@/types/extendedProfile';

// Utils
import { supabase } from '@/integrations/supabase/client';
import { deleteUserCompletely } from '@/utils/userDeletion';
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';

const ROLE_CONFIG: Record<AppRole, {
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}> = {
  superadmin: {
    label: "Superadministratör",
    icon: Crown,
    description: "Full systemkontroll"
  },
  admin: {
    label: "Administratör", 
    icon: Shield,
    description: "Användarhantering"
  },
  coach: {
    label: "Coach",
    icon: Brain,
    description: "Klientcoaching"
  },
  client: {
    label: "Klient",
    icon: User,
    description: "Grundfunktioner"
  }
};


export function CentralUserManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, hasRole } = useAuth();
  const isMobile = useIsMobile();
  
  /**
   * ========================================================================
   * PERMISSIONS & ACCESS CONTROL
   * ========================================================================
   */
  const {
    canManageUsers,
    canManageRoles, 
    canAccessGamification,
    isAdmin,
    isSuperAdmin
  } = useUnifiedPermissions();

  // Master permission check
  const hasUserManagementAccess = useMemo(() => {
    return hasRole('superadmin') || hasRole('admin');
  }, [hasRole]);

  /**
   * ========================================================================
   * DATA LOADING & STATE MANAGEMENT
   * ========================================================================
   */
  const { 
    users, 
    loading: usersLoading, 
    stats, 
    refetch: refetchUsers 
  } = useUnifiedUserData();

  const {
    relationships,
    stats: relationshipStats,
    loading: relationshipsLoading,
    createRelationship,
    removeRelationship,
    transferClient,
    getClientsByCoach,
    refetch: refetchRelationships
  } = useCoachClientRelationships();

  const { 
    saveExtendedProfile, 
    getExtendedProfile, 
    uploadProfilePicture, 
    isLoading: profileLoading 
  } = useExtendedProfile();

  /**
   * ========================================================================
   * COMPONENT STATE
   * ========================================================================
   */
  
  // UI State
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // User Management State  
  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
  const [editingUser, setEditingUser] = useState<UnifiedUser | null>(null);
  const [userFormData, setUserFormData] = useState<ExtendedProfileData | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // Role Management State
  const [userRoles, setUserRoles] = useState<Record<string, AppRole[]>>({});
  const [roleOperationLoading, setRoleOperationLoading] = useState<string | null>(null);
  
  // Relationship Management State
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [relationshipFilter, setRelationshipFilter] = useState<string>('all');
  
  // Transfer Client State
  const [transferringRelationship, setTransferringRelationship] = useState<CoachClientRelationship | null>(null);
  const [newCoach, setNewCoach] = useState<string>('');
  
  // Dialog States
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // Form States
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'client' as AppRole,
    message: ''
  });

  /**
   * ========================================================================
   * COMPUTED VALUES & FILTERS
   * ========================================================================
   */
  
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const matchesSearch = 
        userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter as AppRole);
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const coaches = useMemo(() => users.filter(u => u.roles.includes('coach')), [users]);
  const clients = useMemo(() => users.filter(u => u.roles.includes('client')), [users]);
  const unassignedClients = useMemo(() => {
    const assignedIds = new Set(relationships.map(r => r.client_id));
    return clients.filter(c => !assignedIds.has(c.id));
  }, [clients, relationships]);

  const filteredRelationships = useMemo(() => {
    return relationships.filter(rel => {
      const coach = coaches.find(c => c.id === rel.coach_id);
      const client = clients.find(c => c.id === rel.client_id);
      
      const matchesSearch = searchTerm === '' || 
        coach?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCoachFilter = relationshipFilter === 'all' || rel.coach_id === relationshipFilter;
      
      return matchesSearch && matchesCoachFilter;
    });
  }, [relationships, coaches, clients, searchTerm, relationshipFilter]);

  /**
   * ========================================================================
   * DATA LOADING EFFECTS
   * ========================================================================
   */
  
  useEffect(() => {
    if (hasUserManagementAccess) {
      loadUserRoles();
    }
  }, [users, hasUserManagementAccess]);

  /**
   * ========================================================================
   * UTILITY FUNCTIONS
   * ========================================================================
   */
  
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      refetchUsers(),
      refetchRelationships(),
      loadUserRoles()
    ]);
  }, [refetchUsers, refetchRelationships]);

  /**
   * ========================================================================
   * USER ROLE MANAGEMENT FUNCTIONS
   * ========================================================================
   */
  
  const loadUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['superadmin', 'admin', 'coach', 'client']);

      if (error) throw error;

      const rolesByUser: Record<string, AppRole[]> = {};
      data?.forEach(({ user_id, role }) => {
        if (!rolesByUser[user_id]) rolesByUser[user_id] = [];
        rolesByUser[user_id].push(role as AppRole);
      });

      setUserRoles(rolesByUser);
    } catch (error) {
      console.error('Error loading user roles:', error);
    }
  };

  const addUserRole = async (userId: string, role: AppRole) => {
    if (!hasUserManagementAccess) return false;

    setRoleOperationLoading(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          assigned_by: currentUser?.id
        });

      if (error) throw error;

      toast({
        title: "Roll tillagd",
        description: `Rollen ${ROLE_CONFIG[role].label} har tilldelats användaren`
      });

      await loadUserRoles();
      await refetchUsers();
      return true;
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte tilldela roll: " + error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setRoleOperationLoading(null);
    }
  };

  const removeUserRole = async (userId: string, role: AppRole) => {
    if (!hasUserManagementAccess) return false;

    setRoleOperationLoading(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: "Roll borttagen",
        description: `Rollen ${ROLE_CONFIG[role].label} har tagits bort`
      });

      await loadUserRoles();
      await refetchUsers();
      return true;
    } catch (error: any) {
      toast({
        title: "Fel", 
        description: "Kunde inte ta bort roll: " + error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setRoleOperationLoading(null);
    }
  };

  /**
   * ========================================================================
   * USER CRUD FUNCTIONS
   * ========================================================================
   */
  
  const openUserEditDialog = async (user: UnifiedUser) => {
    setEditingUser(user);
    
    try {
      const profileData = await getExtendedProfile(user.id);
      setUserFormData(profileData);
      setIsUserDialogOpen(true);
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte ladda användardata",
        variant: "destructive"
      });
    }
  };

  const saveUserProfile = async () => {
    if (!editingUser || !userFormData) return;

    try {
      const result = await saveExtendedProfile(userFormData, editingUser.id);
      
      if (result.success) {
        toast({
          title: "Profil uppdaterad",
          description: `Profilen för ${editingUser.first_name} ${editingUser.last_name} har uppdaterats`
        });
        
        setIsUserDialogOpen(false);
        setEditingUser(null);
        setUserFormData(null);
        await refetchUsers();
      }
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte spara profil: " + error.message,
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    setDeletingUserId(userId);
    try {
      const identifier = userToDelete.email || `${userToDelete.first_name} ${userToDelete.last_name}`;
      const result = await deleteUserCompletely(identifier);

      if (result.errors && result.errors.length > 0) {
        toast({
          title: "Delvis fel vid borttagning",
          description: `Vissa data kunde inte tas bort: ${result.errors.join(', ')}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Användare borttagen",
          description: "Användaren och all relaterad data har tagits bort"
        });
      }

      await refreshAllData();
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort användare: " + error.message,
        variant: "destructive"
      });
    } finally {
      setDeletingUserId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  /**
   * ========================================================================
   * RELATIONSHIP MANAGEMENT FUNCTIONS  
   * ========================================================================
   */
  
  const handleCreateRelationship = async () => {
    if (!selectedCoach || !selectedClient) {
      toast({
        title: "Välj både coach och klient",
        description: "Du måste välja både en coach och en klient för att skapa en relation.",
        variant: "destructive",
      });
      return;
    }

    const success = await createRelationship(selectedCoach, selectedClient);
    if (success) {
      setSelectedCoach('');
      setSelectedClient('');
      setIsRelationshipDialogOpen(false);
      await refreshAllData();
    }
  };

  const handleRemoveRelationship = async (relationshipId: string) => {
    const success = await removeRelationship(relationshipId);
    if (success) {
      await refreshAllData();
    }
  };

  const handleTransferClient = async () => {
    if (!transferringRelationship || !newCoach) {
      toast({
        title: "Välj ny coach",
        description: "Du måste välja en ny coach för att flytta klienten.",
        variant: "destructive",
      });
      return;
    }

    const success = await transferClient(
      transferringRelationship.client_id,
      transferringRelationship.coach_id,
      newCoach
    );

    if (success) {
      setTransferringRelationship(null);
      setNewCoach('');
      setIsTransferDialogOpen(false);
      await refreshAllData();
    }
  };

  /**
   * ========================================================================
   * INVITATION FUNCTIONS
   * ========================================================================
   */
  
  const sendInvitation = async () => {
    if (!inviteForm.email) {
      toast({
        title: "E-post krävs",
        description: "Du måste ange en e-postadress",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate a unique token for the invitation
      const token = Array.from({length: 32}, () => Math.random().toString(36)[2]).join('');
      
      const { error } = await supabase
        .from('invitations')
        .insert({
          email: inviteForm.email,
          invited_role: inviteForm.role,
          invited_by: currentUser?.id,
          token: token,
          metadata: inviteForm.message ? { message: inviteForm.message } : {}
        });

      if (error) throw error;

      toast({
        title: "Inbjudan skickad",
        description: `En inbjudan har skickats till ${inviteForm.email}`
      });

      setInviteForm({ email: '', role: 'client', message: '' });
      setIsInviteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte skicka inbjudan: " + error.message,
        variant: "destructive"
      });
    }
  };

  /**
   * ========================================================================
   * PERMISSION GUARD
   * ========================================================================
   */
  
  if (!hasUserManagementAccess) {
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

  /**
   * ========================================================================
   * LOADING STATE
   * ========================================================================
   */
  
  if (usersLoading) {
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

  /**
   * ========================================================================
   * RENDER: MAIN UI
   * ========================================================================
   */
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Central Användarhantering
          </h2>
          <p className="text-muted-foreground">Komplett användarhantering i en modul</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAllData} disabled={usersLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
          
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Bjud in användare
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Skicka inbjudan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">E-postadress</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="anvandare@exempel.se"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Roll</Label>
                  <Select value={inviteForm.role} onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value as AppRole }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">Meddelande (valfritt)</Label>
                  <Textarea
                    id="message"
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Personligt meddelande..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={sendInvitation}>
                  <Mail className="h-4 w-4 mr-2" />
                  Skicka inbjudan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
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
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.byRole.coach || 0}</p>
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
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.byRole.client || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 gap-1 h-14 bg-muted/50">
          <TabsTrigger 
            value="users" 
            className="flex flex-col items-center gap-1 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">Användare</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="relationships" 
            className="flex flex-col items-center gap-1 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Link className="h-5 w-5" />
            <span className="text-sm font-medium">Relationer</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="system" 
            className="flex flex-col items-center gap-1 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-medium">System</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="automation" 
            className="flex flex-col items-center gap-1 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Zap className="h-5 w-5" />
            <span className="text-sm font-medium">Automation</span>
          </TabsTrigger>
        </TabsList>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filter Panel */}
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
                      {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
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
            </div>

            {/* Users List */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Användare ({filteredUsers.length})</CardTitle>
                      <CardDescription>Hantera användare och roller</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Inga användare hittades</h3>
                      <p className="text-muted-foreground">Inga användare matchar dina filter</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {filteredUsers.map((user) => (
                        <UserManagementCard 
                          key={user.id}
                          user={user}
                          userRoles={userRoles[user.id] || []}
                          onEdit={() => openUserEditDialog(user)}
                          onView={() => navigate(`/user/${user.id}`)}
                          onDelete={() => {
                            setSelectedUser(user);
                            setIsDeleteDialogOpen(true);
                          }}
                          onAddRole={(role) => addUserRole(user.id, role)}
                          onRemoveRole={(role) => removeUserRole(user.id, role)}
                          isDeleting={deletingUserId === user.id}
                          isRoleLoading={roleOperationLoading === user.id}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* RELATIONSHIPS TAB */}
        <TabsContent value="relationships" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Coach-Client Relationer</h2>
              <HelpTooltip content={helpTexts.administration.coachClientRelationships} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Crown className="h-4 w-4 text-primary" />
                <span>Coach</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 text-green-500" />
                <span>Klient</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {/* Info Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Coach-Client Relationer</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      Här ser du alla aktiva kopplingar mellan coaches och klienter. Varje klient kan bara ha en aktiv coach åt gången.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-blue-600 dark:text-blue-400">
                      <div className="flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        <span>Coach (ansvarig för klienten)</span>
                      </div>
                      <ArrowRight className="h-3 w-3" />
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Klient (får coaching)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Relationship Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Link className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Totalt relationer</p>
                      <p className="text-2xl font-bold">{relationships.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Aktiva coaches</p>
                      <p className="text-2xl font-bold">{coaches.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tilldelade klienter</p>
                      <p className="text-2xl font-bold">{relationships.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <UserMinus className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Otilldelade</p>
                      <p className="text-2xl font-bold">{unassignedClients.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Relationship Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Coach-Klient Relationer
                  </CardTitle>
                  
                  <Dialog open={isRelationshipDialogOpen} onOpenChange={setIsRelationshipDialogOpen}>
                    <DialogTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Skapa relation
                        </Button>
                        <HelpTooltip content={helpTexts.administration.createRelationship} />
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Skapa Coach-Klient Relation</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Välj Coach</Label>
                          <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                            <SelectTrigger>
                              <SelectValue placeholder="Välj en coach" />
                            </SelectTrigger>
                            <SelectContent>
                              {coaches.map((coach) => (
                                <SelectItem key={coach.id} value={coach.id}>
                                  {`${coach.first_name} ${coach.last_name}`.trim()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Välj Klient</Label>
                          <Select value={selectedClient} onValueChange={setSelectedClient}>
                            <SelectTrigger>
                              <SelectValue placeholder="Välj en klient" />
                            </SelectTrigger>
                            <SelectContent>
                              {unassignedClients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {`${client.first_name} ${client.last_name}`.trim()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRelationshipDialogOpen(false)}>
                          Avbryt
                        </Button>
                        <Button onClick={handleCreateRelationship}>
                          Skapa relation
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Sök coach eller klient..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrera på coach" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla coaches</SelectItem>
                      {coaches.map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          {`${coach.first_name} ${coach.last_name}`.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Relationships List */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {filteredRelationships.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Inga relationer matchar filtret.</p>
                      </div>
                    ) : (
                      filteredRelationships.map((relationship) => {
                        const coach = coaches.find(c => c.id === relationship.coach_id);
                        const client = clients.find(c => c.id === relationship.client_id);
                        
                        return (
                          <div key={relationship.id} className="border-2 rounded-lg p-4 hover:bg-muted/20 transition-colors bg-gradient-to-r from-blue-50/20 to-green-50/20 dark:from-blue-950/20 dark:to-green-950/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                                  <Crown className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-primary">
                                    {`${coach?.first_name} ${coach?.last_name}`.trim() || 'Okänd coach'}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <ArrowRight className="h-5 w-5 text-muted-foreground mx-2" />
                                  <span className="text-sm text-muted-foreground">tilldelad</span>
                                  <ArrowRight className="h-5 w-5 text-muted-foreground mx-2" />
                                </div>
                                <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full">
                                  <User className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-green-700 dark:text-green-400">
                                    {`${client?.first_name} ${client?.last_name}`.trim() || 'Okänd klient'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/user/${relationship.client_id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Visa profil
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setTransferringRelationship(relationship);
                                    setIsTransferDialogOpen(true);
                                  }}
                                >
                                  <ArrowRight className="h-4 w-4 mr-1" />
                                  Flytta
                                  <HelpTooltip content={helpTexts.administration.transferClient} />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveRelationship(relationship.id)}
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-sm text-muted-foreground">
                              Relation skapad: {new Date(relationship.assigned_at).toLocaleDateString('sv-SE')}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>

                {/* Unassigned Clients */}
                {unassignedClients.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <UserMinus className="h-4 w-4 text-orange-500" />
                      Otilldelade klienter ({unassignedClients.length})
                      <HelpTooltip content={helpTexts.administration.unassignedClients} />
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {unassignedClients.map((client) => (
                        <div key={client.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">{`${client.first_name} ${client.last_name}`.trim()}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                navigate(`/user/${client.id}`);
                              } catch (error) {
                                toast({
                                  title: "Navigeringsfel",
                                  description: "Kunde inte öppna klientprofilen. Försök igen.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SYSTEM TAB */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Rollfördelning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                    <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{config.label}</span>
                      </div>
                      <Badge variant="outline">{stats.byRole[role as AppRole] || 0} användare</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Systemstatus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Databasanslutning</h4>
                      <p className="text-sm text-muted-foreground">Supabase</p>
                    </div>
                    <Badge variant="default">Aktiv</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Authentication</h4>
                      <p className="text-sm text-muted-foreground">RLS aktiverad</p>
                    </div>
                    <Badge variant="default">Säker</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Systemintegritet</h4>
                      <p className="text-sm text-muted-foreground">Alla komponenter</p>
                    </div>
                    <Badge variant="default">OK</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AUTOMATION TAB */}
        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <h4 className="font-medium">Stefan AI Assistant</h4>
                      <p className="text-sm text-muted-foreground">AI coaching & automatisering</p>
                    </div>
                    <Badge variant="default">Aktiv</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Användarsynkronisering</h4>
                      <p className="text-sm text-muted-foreground">Automatisk datauppdatering</p>
                    </div>
                    <Badge variant="default">Aktiv</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Rollbaserad säkerhet</h4>
                      <p className="text-sm text-muted-foreground">RLS policies</p>
                    </div>
                    <Badge variant="default">Aktiv</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Gamification System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Achievement System</h4>
                      <p className="text-sm text-muted-foreground">Prestationer och utmärkelser</p>
                    </div>
                    <Badge variant="secondary">Utveckling</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Progress Tracking</h4>
                      <p className="text-sm text-muted-foreground">Användarframsteg</p>
                    </div>
                    <Badge variant="default">Aktiv</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Engagement Metrics</h4>
                      <p className="text-sm text-muted-foreground">Användarengagemang</p>
                    </div>
                    <Badge variant="secondary">Planerad</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Redigera användare: {editingUser ? `${editingUser.first_name} ${editingUser.last_name}` : ''}
            </DialogTitle>
          </DialogHeader>
          
          {userFormData && editingUser && (
            <UserEditForm
              userData={userFormData}
              onDataChange={setUserFormData}
              onSave={saveUserProfile}
              onCancel={() => setIsUserDialogOpen(false)}
              isLoading={profileLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort användare</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort användaren{' '}
              <strong>
                {selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : ''}
              </strong>?
              <br /><br />
              Denna åtgärd raderar ALL relaterad data inklusive:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Profil och personuppgifter</li>
                <li>Uppgifter och bedömningar</li>
                <li>Meddelanden och interaktioner</li>
                <li>Coach-klient relationer</li>
                <li>GDPR-data och samtycken</li>
              </ul>
              <br />
              <strong>Denna åtgärd kan inte ångras.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && deleteUser(selectedUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ta bort användare
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Client Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flytta klient till ny coach</DialogTitle>
          </DialogHeader>
          
          {transferringRelationship && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Flyttar klient:</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-500" />
                  <span className="font-medium">
                    {(() => {
                      const client = clients.find(c => c.id === transferringRelationship.client_id);
                      return `${client?.first_name} ${client?.last_name}`.trim() || 'Okänd klient';
                    })()}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mt-3 mb-2">Från coach:</p>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {(() => {
                      const coach = coaches.find(c => c.id === transferringRelationship.coach_id);
                      return `${coach?.first_name} ${coach?.last_name}`.trim() || 'Okänd coach';
                    })()}
                  </span>
                </div>
              </div>

              <div>
                <Label>Välj ny coach</Label>
                <Select value={newCoach} onValueChange={setNewCoach}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj en coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches
                      .filter(coach => coach.id !== transferringRelationship.coach_id)
                      .map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          {`${coach.first_name} ${coach.last_name}`.trim()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsTransferDialogOpen(false);
              setTransferringRelationship(null);
              setNewCoach('');
            }}>
              Avbryt
            </Button>
            <Button onClick={handleTransferClient}>
              Flytta klient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * ==========================================================================
 * SUB-COMPONENTS
 * ==========================================================================
 */

/**
 * Individual User Management Card Component
 */
interface UserManagementCardProps {
  user: UnifiedUser;
  userRoles: AppRole[];
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  onAddRole: (role: AppRole) => void;
  onRemoveRole: (role: AppRole) => void;
  isDeleting: boolean;
  isRoleLoading: boolean;
}

function UserManagementCard({ 
  user, 
  userRoles, 
  onEdit, 
  onView, 
  onDelete, 
  onAddRole, 
  onRemoveRole, 
  isDeleting, 
  isRoleLoading 
}: UserManagementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState<AppRole | ''>('');

  const availableRoles = Object.keys(ROLE_CONFIG).filter(
    role => !userRoles.includes(role as AppRole)
  ) as AppRole[];

  const primaryRole = userRoles[0] || 'client';
  const roleConfig = ROLE_CONFIG[primaryRole];

  return (
    <Card className="border-l-4 border-l-primary hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* User Info */}
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <roleConfig.icon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">
                  {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Namnlös'}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">{user.email}</p>
              
              <div className="flex items-center gap-2 mt-1">
                {userRoles.map(role => {
                  const config = ROLE_CONFIG[role];
                  return (
                    <Badge key={role} variant="outline" className="text-xs">
                      <config.icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  );
                })}
                {userRoles.length === 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Ingen roll
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Role Management */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Current Roles */}
            {userRoles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nuvarande roller:</Label>
                <div className="space-y-2">
                  {userRoles.map(role => {
                    const config = ROLE_CONFIG[role];
                    return (
                      <div key={role} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          <span className="text-sm">{config.label}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRemoveRole(role)}
                          disabled={isRoleLoading}
                          className="h-7 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add New Role */}
            {availableRoles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Lägg till roll:</Label>
                <div className="flex gap-2">
                  <Select value={selectedNewRole} onValueChange={(value) => setSelectedNewRole(value as AppRole)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Välj roll" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(role => {
                        const config = ROLE_CONFIG[role];
                        return (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    size="sm"
                    onClick={() => {
                      if (selectedNewRole) {
                        onAddRole(selectedNewRole);
                        setSelectedNewRole('');
                      }
                    }}
                    disabled={!selectedNewRole || isRoleLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * User Edit Form Component
 */
interface UserEditFormProps {
  userData: ExtendedProfileData;
  onDataChange: (data: ExtendedProfileData) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function UserEditForm({ userData, onDataChange, onSave, onCancel, isLoading }: UserEditFormProps) {
  const updateField = (field: keyof ExtendedProfileData, value: any) => {
    onDataChange({
      ...userData,
      [field]: value
    });
  };

  const updateNestedField = (parent: keyof ExtendedProfileData, field: string, value: any) => {
    const parentData = userData[parent] as any || {};
    onDataChange({
      ...userData,
      [parent]: {
        ...parentData,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Grundläggande information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Förnamn</Label>
              <Input
                id="first_name"
                value={userData.first_name || ''}
                onChange={(e) => updateField('first_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Efternamn</Label>
              <Input
                id="last_name"
                value={userData.last_name || ''}
                onChange={(e) => updateField('last_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={userData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={userData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={userData.bio || ''}
              onChange={(e) => updateField('bio', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professionell information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="organization">Organisation</Label>
              <Input
                id="organization"
                value={userData.organization || ''}
                onChange={(e) => updateField('organization', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="department">Avdelning</Label>
              <Input
                id="department"
                value={userData.department || ''}
                onChange={(e) => updateField('department', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="job_title">Jobbtitel</Label>
              <Input
                id="job_title"
                value={userData.job_title || ''}
                onChange={(e) => updateField('job_title', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="primary_role">Primär roll</Label>
              <Select 
                value={userData.primary_role || ''} 
                onValueChange={(value) => updateField('primary_role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj primär roll" />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_ROLES.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adressinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="street">Gatuadress</Label>
              <Input
                id="street"
                value={userData.address?.street || ''}
                onChange={(e) => updateNestedField('address', 'street', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postnummer</Label>
              <Input
                id="postalCode"
                value={userData.address?.postalCode || ''}
                onChange={(e) => updateNestedField('address', 'postalCode', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="city">Stad</Label>
              <Input
                id="city"
                value={userData.address?.city || ''}
                onChange={(e) => updateNestedField('address', 'city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="country">Land</Label>
              <Select 
                value={userData.address?.country || ''} 
                onValueChange={(value) => updateNestedField('address', 'country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj land" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Avbryt
        </Button>
        <Button onClick={onSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sparar...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Spara ändringar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}