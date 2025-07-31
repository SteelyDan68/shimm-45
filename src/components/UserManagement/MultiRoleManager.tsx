import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/hooks/useAuth';
import { Plus, X } from 'lucide-react';

const roleLabels: Record<AppRole, string> = {
  superadmin: 'Superadministratör',
  admin: 'Administratör',
  coach: 'Coach',
  client: 'Klient'
};

interface MultiRoleManagerProps {
  userId: string;
  currentRoles: AppRole[];
  onRolesUpdated: () => void;
  disabled?: boolean;
}

export const MultiRoleManager: React.FC<MultiRoleManagerProps> = ({
  userId,
  currentRoles,
  onRolesUpdated,
  disabled = false
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const addRole = async (role: AppRole) => {
    if (currentRoles.includes(role)) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: role as any }]);

      if (error) throw error;

      toast({
        title: "Roll tillagd",
        description: `${roleLabels[role]} har lagts till`
      });

      onRolesUpdated();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({
        title: "Fel",
        description: `Kunde inte lägga till roll: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const removeRole = async (role: AppRole) => {
    // Prevent removing the last role
    if (currentRoles.length <= 1) {
      toast({
        title: "Kan inte ta bort roll",
        description: "Användaren måste ha minst en roll",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);

      if (error) throw error;

      toast({
        title: "Roll borttagen",
        description: `${roleLabels[role]} har tagits bort`
      });

      onRolesUpdated();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: "Fel",
        description: `Kunde inte ta bort roll: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const availableRoles = Object.keys(roleLabels).filter(
    role => !currentRoles.includes(role as AppRole)
  ) as AppRole[];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">Nuvarande roller</h4>
        <div className="flex gap-2 flex-wrap">
          {currentRoles.map((role) => (
            <Badge key={role} variant="default" className="flex items-center gap-1">
              {roleLabels[role]}
              {currentRoles.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeRole(role)}
                  disabled={disabled || isUpdating}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      </div>

      {availableRoles.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Lägg till roll</h4>
          <div className="flex gap-2 flex-wrap">
            {availableRoles.map((role) => (
              <Button
                key={role}
                variant="outline"
                size="sm"
                onClick={() => addRole(role)}
                disabled={disabled || isUpdating}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {roleLabels[role]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isUpdating && (
        <p className="text-sm text-muted-foreground">Uppdaterar roller...</p>
      )}
    </div>
  );
};