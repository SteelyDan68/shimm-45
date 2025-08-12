import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users } from "lucide-react";
import { useAuth } from "@/providers/UnifiedAuthProvider";

import { CreateUserForm } from "./CreateUserForm";
import { SafeCentralUserManager } from "@/components/Universal/SafeCentralUserManager";
import { UserManagementErrorBoundary } from "@/components/Universal/UserManagementErrorBoundary";

interface UserManagementTabsProps {
  onUserCreated?: () => void;
}

export const UserManagementTabs = ({ onUserCreated }: UserManagementTabsProps) => {
  const { canCreateUsers, canManageUsers } = useAuth();
  const [activeTab, setActiveTab] = useState("manage");

  const handleUserCreated = () => {
    onUserCreated?.();
    // Växla till hantera-tab för att se den nya användaren
    setActiveTab("manage");
  };

  return (
    <div className="space-y-6">
      {/* Snabb åtgärder header */}
      <div className="flex flex-wrap gap-2">
        {canCreateUsers && (
          <Badge variant="outline" className="flex items-center gap-1">
            <UserPlus className="h-3 w-3" />
            Manuell registrering
          </Badge>
        )}
        {canManageUsers && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Användarhantering
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Hantera användare
          </TabsTrigger>
          
          {canCreateUsers && (
            <TabsTrigger value="create" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Skapa användare
            </TabsTrigger>
          )}
          
        </TabsList>

        {/* Hantera användare tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Användarhantering
              </CardTitle>
              <CardDescription>
                Hantera befintliga användare, roller och relationer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagementErrorBoundary>
                <SafeCentralUserManager />
              </UserManagementErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skapa användare tab */}
        {canCreateUsers && (
          <TabsContent value="create" className="space-y-6">
            <CreateUserForm 
              onSuccess={handleUserCreated}
              onCancel={() => setActiveTab("manage")}
            />
          </TabsContent>
        )}

      </Tabs>
    </div>
  );
};