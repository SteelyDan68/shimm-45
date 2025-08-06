/**
 * USER ROLE MANAGER - Manage user roles and permissions
 * 
 * Hantera användarroller och behörigheter
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';

interface UserRoleManagerProps {
  user: any;
  onUpdate: () => void;
  canManageRoles: boolean;
}

interface RoleInfo {
  value: string;
  label: string;
  description: string;
  level: number;
  color: string;
}

const availableRoles: RoleInfo[] = [
  {
    value: 'client',
    label: 'Klient',
    description: 'Grundläggande åtkomst till klientfunktioner',
    level: 1,
    color: 'bg-blue-100 text-blue-800'
  },
  {
    value: 'coach',
    label: 'Coach',
    description: 'Kan hantera tilldelade klienter och coaching-funktioner',
    level: 2,
    color: 'bg-green-100 text-green-800'
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Administrativ åtkomst till systemhantering',
    level: 3,
    color: 'bg-orange-100 text-orange-800'
  },
  {
    value: 'superadmin',
    label: 'Superadmin',
    description: 'Fullständig systemåtkomst - högsta behörighetsnivå',
    level: 4,
    color: 'bg-red-100 text-red-800'
  }
];

export const UserRoleManager: React.FC<UserRoleManagerProps> = ({ 
  user, 
  onUpdate, 
  canManageRoles 
}) => {
  const [loading, setLoading] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [originalRoles, setOriginalRoles] = useState<string[]>([]);
  const { user: currentUser, hasRole } = useAuth();
  const { toast } = useToast();

  const isSuperAdmin = hasRole('superadmin');
  const currentUserLevel = isSuperAdmin ? 4 : hasRole('admin') ? 3 : hasRole('coach') ? 2 : 1;

  useEffect(() => {
    loadUserRoles();
  }, [user.id]);

  const loadUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      const roles = data?.map(r => r.role) || [];
      setUserRoles(roles);
      setOriginalRoles(roles);

    } catch (error: any) {
      console.error('Error loading user roles:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda användarroller",
        variant: "destructive"
      });
    }
  };

  const handleRoleToggle = (role: string, checked: boolean) => {
    if (!canManageRoles) return;

    const roleInfo = availableRoles.find(r => r.value === role);
    if (!roleInfo) return;

    // Check if current user can assign this role level
    if (roleInfo.level > currentUserLevel) {
      toast({
        title: "Otillräckliga behörigheter",
        description: `Du kan inte tilldela ${roleInfo.label}-rollen`,
        variant: "destructive"
      });
      return;
    }

    // Prevent removing own superadmin role
    if (role === 'superadmin' && !checked && user.id === currentUser?.id) {
      toast({
        title: "Åtgärd inte tillåten",
        description: "Du kan inte ta bort din egen superadmin-roll",
        variant: "destructive"
      });
      return;
    }

    setUserRoles(prev => 
      checked 
        ? [...prev, role]
        : prev.filter(r => r !== role)
    );
  };

  const handleSave = async () => {
    if (!canManageRoles) return;

    setLoading(true);
    try {
      // Remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      // Add new roles
      if (userRoles.length > 0) {
        const roleInserts = userRoles.map(role => ({
          user_id: user.id,
          role: role as any,
          assigned_by: currentUser?.id
        }));

        const { error } = await supabase
          .from('user_roles')
          .insert(roleInserts);

        if (error) throw error;
      }

      setOriginalRoles([...userRoles]);

      toast({
        title: "Roller uppdaterade",
        description: "Användarens roller har uppdaterats framgångsrikt",
      });

      onUpdate();

    } catch (error: any) {
      console.error('Error updating user roles:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera användarroller",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = JSON.stringify(userRoles.sort()) !== JSON.stringify(originalRoles.sort());

  const getHighestRole = () => {
    const sortedRoles = userRoles
      .map(role => availableRoles.find(r => r.value === role))
      .filter(Boolean)
      .sort((a, b) => (b?.level || 0) - (a?.level || 0));
    
    return sortedRoles[0];
  };

  const highestRole = getHighestRole();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Hantera Användarroller
        </h2>
        {canManageRoles && hasChanges && (
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Sparar...' : 'Spara Ändringar'}
          </Button>
        )}
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Aktuell Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {user.name?.charAt(0) || user.email?.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold">{user.name || user.email}</h3>
              <div className="flex gap-2 mt-1">
                {userRoles.map(role => {
                  const roleInfo = availableRoles.find(r => r.value === role);
                  return (
                    <Badge key={role} variant="outline" className={roleInfo?.color}>
                      {roleInfo?.label || role}
                    </Badge>
                  );
                })}
                {userRoles.length === 0 && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    Inga roller
                  </Badge>
                )}
              </div>
              {highestRole && (
                <p className="text-sm text-muted-foreground mt-1">
                  Högsta behörighetsnivå: {highestRole.label}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Management */}
      <Card>
        <CardHeader>
          <CardTitle>Tillgängliga Roller</CardTitle>
          {!canManageRoles && (
            <p className="text-sm text-muted-foreground">
              Du har endast läsåtkomst till användarroller
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {availableRoles.map((role) => {
            const canAssignRole = canManageRoles && role.level <= currentUserLevel;
            const isAssigned = userRoles.includes(role.value);
            const isOwnSuperadmin = role.value === 'superadmin' && user.id === currentUser?.id && isAssigned;

            return (
              <div 
                key={role.value} 
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  isAssigned ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <Checkbox
                  id={role.value}
                  checked={isAssigned}
                  onCheckedChange={(checked) => handleRoleToggle(role.value, checked as boolean)}
                  disabled={!canAssignRole || isOwnSuperadmin}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={role.value} 
                    className={`font-medium ${!canAssignRole ? 'text-muted-foreground' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {role.label}
                      <Badge variant="outline" className={role.color}>
                        Nivå {role.level}
                      </Badge>
                      {!canAssignRole && role.level > currentUserLevel && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          Kräver högre behörighet
                        </Badge>
                      )}
                      {isOwnSuperadmin && (
                        <Badge variant="outline" className="bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Kan inte tas bort
                        </Badge>
                      )}
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {role.description}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Behörighetsinformation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Klient:</strong> Grundläggande åtkomst till personliga funktioner och coaching-material
            </div>
            <div>
              <strong>Coach:</strong> Kan hantera tilldelade klienter, skapa coaching-planer och se analytics
            </div>
            <div>
              <strong>Admin:</strong> Kan hantera användare, roller, system-inställningar och se all data
            </div>
            <div>
              <strong>Superadmin:</strong> Fullständig åtkomst till alla funktioner inklusive säkerhetshantering
            </div>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Osparade ändringar</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Du har gjort ändringar i användarens roller. Glöm inte att spara!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};