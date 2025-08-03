import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';
import type { AppRole } from '@/providers/UnifiedAuthProvider';

const roleLabels: Record<AppRole, string> = {
  superadmin: "Superadministratör",
  admin: "Administratör", 
  coach: "Coach",
  client: "Klient"
};

interface MultiRoleManagerProps {
  userId: string;
  currentRoles: string[];
  onRolesUpdated: () => void;
  disabled?: boolean;
}

export function MultiRoleManager({ userId, currentRoles, onRolesUpdated, disabled }: MultiRoleManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const addRole = async (role: AppRole) => {
    if (currentRoles.includes(role)) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: role }]);

      if (error) throw error;

      toast({
        title: "Roll tillagd",
        description: `Rollen ${roleLabels[role]} har lagts till`
      });

      onRolesUpdated();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till roll",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const removeRole = async (role: AppRole) => {
    // Tillåt att ta bort alla roller - användare kan nu existera utan roller
    if (currentRoles.length <= 1) {
      toast({
        title: "Varning",
        description: "Användaren kommer att sakna roller efter detta. De kommer endast ha grundläggande åtkomst.",
        variant: "default"
      });
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: "Roll borttagen",
        description: `Rollen ${roleLabels[role]} har tagits bort`
      });

      onRolesUpdated();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort roll",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const availableRoles = Object.keys(roleLabels).filter(
    role => !currentRoles.includes(role)
  ) as AppRole[];

  if (isUpdating) {
    return <div className="text-sm text-muted-foreground">Uppdaterar roller...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Current Roles */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Nuvarande roller</h4>
        <div className="flex flex-wrap gap-2">
          {currentRoles.map((role) => (
            <Badge key={role} variant="default" className="flex items-center gap-1">
              {roleLabels[role as AppRole]}
              {currentRoles.length > 1 && !disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeRole(role as AppRole)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Available Roles */}
      {availableRoles.length > 0 && !disabled && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Lägg till roll</h4>
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((role) => (
              <Button
                key={role}
                variant="outline"
                size="sm"
                onClick={() => addRole(role)}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {roleLabels[role]}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}