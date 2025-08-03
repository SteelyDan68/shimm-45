import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUnifiedUsers } from '@/hooks/useUnifiedUsers';
import { usePermissions } from '@/hooks/usePermissions';
import { CreateUserForm } from '@/components/UserAdministration/CreateUserForm';
import { SendInvitationForm } from '@/components/InvitationSystem/SendInvitationForm';
import { UserManagementTabs } from '@/components/UserAdministration/UserManagementTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Search, 
  Filter,
  BarChart3,
  Shield,
  Settings
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function UserManagementCenter() {
  const { canCreateUsers, canInviteUsers, canManageUsers } = usePermissions();
  const { users, loading, getUsersByRole } = useUnifiedUsers();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('manage');

  // Handle URL query parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['manage', 'create', 'invite'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const coaches = getUsersByRole('coach');
  const admins = getUsersByRole('admin');
  const clients = getUsersByRole('client');
  const superadmins = getUsersByRole('superadmin');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.roles.includes(selectedRole as any);
    return matchesSearch && matchesRole;
  });

  const userStats = {
    total: users.length,
    coaches: coaches.length,
    admins: admins.length,
    clients: clients.length,
    superadmins: superadmins.length,
    active: users.filter(u => u.created_at).length
  };

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Åtkomst nekad</h3>
          <p className="text-muted-foreground">
            Du har inte behörighet att komma åt användarhantering.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt användare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.active} aktiva
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coaches</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.coaches}</div>
            <p className="text-xs text-muted-foreground">
              Aktiva coaches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Klienter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.clients}</div>
            <p className="text-xs text-muted-foreground">
              Registrerade klienter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administratörer</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.admins + userStats.superadmins}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.superadmins} superadmins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Användarhantering</CardTitle>
              <CardDescription>
                Hantera användare, roller och relationer
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              {canCreateUsers && (
                <Button size="sm" variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Skapa användare
                </Button>
              )}
              {canInviteUsers && (
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Bjud in
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök användare..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2">
              {['all', 'superadmin', 'admin', 'coach', 'client'].map((role) => (
                <Button
                  key={role}
                  variant={selectedRole === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRole(role)}
                >
                  {role === 'all' ? 'Alla' : 
                   role === 'superadmin' ? 'Superadmin' :
                   role === 'admin' ? 'Admin' :
                   role === 'coach' ? 'Coach' : 'Klient'}
                </Button>
              ))}
            </div>
          </div>

          <Separator className="mb-6" />

          {/* User Management Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manage">Hantera användare</TabsTrigger>
              {canCreateUsers && (
                <TabsTrigger value="create">Skapa användare</TabsTrigger>
              )}
              {canInviteUsers && (
                <TabsTrigger value="invite">Bjud in användare</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="manage" className="space-y-4">
              <UserManagementTabs />
            </TabsContent>

            {canCreateUsers && (
              <TabsContent value="create" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Skapa ny användare</CardTitle>
                    <CardDescription>
                      Skapa en användare manuellt med fullständig profilinformation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CreateUserForm />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {canInviteUsers && (
              <TabsContent value="invite" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Bjud in användare</CardTitle>
                    <CardDescription>
                      Skicka e-postinbjudningar till nya användare
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SendInvitationForm />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick User Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Användaröversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Laddar användardata...
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredUsers.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                
                {filteredUsers.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground">
                    ... och {filteredUsers.length - 10} användare till
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}