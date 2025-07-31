import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Plus, 
  Trash2, 
  Crown,
  Shield,
  User,
  Search
} from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useUnifiedUserData } from '@/hooks/useUnifiedUserData';

interface OrganizationMemberManagerProps {
  organizationId: string;
}

export function OrganizationMemberManager({ organizationId }: OrganizationMemberManagerProps) {
  const { getOrganizationMembers, addMember, removeMember } = useOrganizations();
  const { allUsers } = useUnifiedUserData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user' | 'manager'>('user');
  const [searchTerm, setSearchTerm] = useState('');

  const members = getOrganizationMembers(organizationId);
  const memberUserIds = members.map(m => m.user_id);
  const availableUsers = allUsers.filter(user => !memberUserIds.includes(user.id));

  const filteredAvailableUsers = availableUsers.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    
    const success = await addMember(organizationId, selectedUserId, selectedRole);
    if (success) {
      setIsAddDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('user');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Är du säker på att du vill ta bort denna medlem från organisationen?')) {
      return;
    }
    
    await removeMember(organizationId, userId);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'manager': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-yellow-500';
      case 'admin': return 'bg-blue-500';
      case 'manager': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin': return 'Superadmin';
      case 'admin': return 'Administratör';
      case 'manager': return 'Manager';
      default: return 'Användare';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Organisationsmedlemmar</h3>
          <p className="text-muted-foreground">Hantera medlemmar och deras roller</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Lägg till medlem
        </Button>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Medlemmar ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="space-y-3">
              {members.map((member: any) => {
                const user = allUsers.find(u => u.id === member.user_id);
                if (!user) return null;

                return (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.first_name?.[0] || user.email?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : user.email
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(member.role)}>
                        <span className="mr-1">{getRoleIcon(member.role)}</span>
                        {getRoleLabel(member.role)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Inga medlemmar än</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lägg till medlem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sök användare</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök efter namn eller e-post..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Välj användare</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj en användare..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredAvailableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {user.first_name?.[0] || user.email?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name} (${user.email})`
                            : user.email
                          }
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  {filteredAvailableUsers.length === 0 && (
                    <SelectItem value="" disabled>
                      Inga tillgängliga användare
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Roll</label>
              <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Användare
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Administratör
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Manager
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleAddMember} disabled={!selectedUserId}>
                Lägg till
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}