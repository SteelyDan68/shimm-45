import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, UserCheck, Crown, Brain, User, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, type AppRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AdminRoleManagerProps {
  targetUserId: string;
  targetUserName: string;
  onRoleChanged?: () => void;
}

interface UserRole {
  id: string;
  role: AppRole;
  assigned_at: string;
  assigned_by: string | null;
}

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

const roleIcons: Record<AppRole, React.ComponentType<any>> = {
  superadmin: Crown,
  admin: Shield,
  coach: Brain,
  client: User
};

export function AdminRoleManager({ targetUserId, targetUserName, onRoleChanged }: AdminRoleManagerProps) {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [updating, setUpdating] = useState(false);

  const canManageRoles = hasRole('admin') || hasRole('superadmin');

  useEffect(() => {
    if (canManageRoles) {
      loadUserRoles();
    }
  }, [targetUserId, canManageRoles]);

  const loadUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', targetUserId)
        .in('role', ['superadmin', 'admin', 'coach', 'client'])
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setUserRoles((data || []) as UserRole[]);
    } catch (error) {
      console.error('Error loading user roles:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda användarroller",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedRole || !canManageRoles) return;

    // Check if user already has this role
    if (userRoles.some(ur => ur.role === selectedRole)) {
      toast({
        title: "Roll finns redan",
        description: `Användaren har redan rollen ${roleLabels[selectedRole]}`,
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUserId,
          role: selectedRole,
          assigned_by: currentUser.user?.id
        });

      if (error) throw error;

      toast({
        title: "Roll tillagd",
        description: `Rollen ${roleLabels[selectedRole]} har tilldelats ${targetUserName}`
      });

      setSelectedRole('');
      await loadUserRoles();
      onRoleChanged?.();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({
        title: "Fel",
        description: "Kunde inte tilldela roll: " + error.message,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveRole = async (roleId: string, role: AppRole) => {
    if (!canManageRoles) return;

    if (!window.confirm(`Är du säker på att du vill ta bort rollen ${roleLabels[role]} från ${targetUserName}?`)) {
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Roll borttagen",
        description: `Rollen ${roleLabels[role]} har tagits bort från ${targetUserName}`
      });

      await loadUserRoles();
      onRoleChanged?.();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort roll: " + error.message,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!canManageRoles) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center space-y-2">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Ingen behörighet att hantera roller</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Rollhantering för {targetUserName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Roles */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Nuvarande roller</h4>
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : userRoles.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed border-muted rounded-lg">
              <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Inga roller tilldelade</p>
            </div>
          ) : (
            <div className="space-y-2">
              {userRoles.map((userRole) => {
                const Icon = roleIcons[userRole.role];
                return (
                  <div
                    key={userRole.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${roleColors[userRole.role]}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{roleLabels[userRole.role]}</div>
                        <div className="text-xs text-muted-foreground">
                          Tilldelad {new Date(userRole.assigned_at).toLocaleDateString('sv-SE')}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveRole(userRole.id, userRole.role)}
                      disabled={updating}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Role */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium text-sm">Lägg till ny roll</h4>
          <div className="flex gap-2">
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Välj roll att tilldela" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([role, label]) => {
                  const Icon = roleIcons[role as AppRole];
                  const hasRole = userRoles.some(ur => ur.role === role);
                  return (
                    <SelectItem 
                      key={role} 
                      value={role}
                      disabled={hasRole}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                        {hasRole && <Badge variant="secondary" className="ml-2 text-xs">Tilldelad</Badge>}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddRole}
              disabled={!selectedRole || updating}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tilldela
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}