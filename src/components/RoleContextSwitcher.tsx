import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, UserCheck, RefreshCw } from 'lucide-react';
import { useRoleContextSwitcher } from '@/hooks/useRoleContextSwitcher';
import type { AppRole } from '@/providers/UnifiedAuthProvider';

const roleLabels: Record<AppRole, string> = {
  superadmin: "Superadministratör",
  admin: "Administratör", 
  coach: "Coach",
  client: "Klient"
};

const roleColors: Record<AppRole, string> = {
  superadmin: "bg-red-100 text-red-800",
  admin: "bg-purple-100 text-purple-800",
  coach: "bg-blue-100 text-blue-800", 
  client: "bg-green-100 text-green-800"
};

export function RoleContextSwitcher() {
  const { 
    currentContext, 
    availableRoles, 
    isValidating, 
    switchToRole 
  } = useRoleContextSwitcher();
  
  const [selectedRole, setSelectedRole] = useState<AppRole>(currentContext);

  const handleRoleSwitch = async () => {
    if (selectedRole !== currentContext) {
      const success = await switchToRole(selectedRole);
      if (!success) {
        // Reset selection on failure
        setSelectedRole(currentContext);
      }
    }
  };

  if (availableRoles.length <= 1) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="text-sm font-medium">Aktuell roll:</span>
            <Badge className={roleColors[currentContext]}>
              {roleLabels[currentContext]}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="text-sm font-medium">Aktuell roll:</span>
            <Badge className={roleColors[currentContext]}>
              {roleLabels[currentContext]}
            </Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Byt till roll:</label>
            <div className="flex gap-2">
              <Select
                value={selectedRole}
                onValueChange={(value: AppRole) => setSelectedRole(value)}
                disabled={isValidating}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Välj roll" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${roleColors[role].split(' ')[0]}`} />
                        {roleLabels[role]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleRoleSwitch}
                disabled={selectedRole === currentContext || isValidating}
                size="sm"
                className="px-3"
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {selectedRole !== currentContext && (
            <p className="text-xs text-muted-foreground">
              Klicka för att byta till {roleLabels[selectedRole]}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}