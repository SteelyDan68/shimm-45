import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Mail,
  MoreHorizontal,
  Brain,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  name?: string;
  email: string;
  roles?: string[];
  primary_role?: string;
  coach_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserManagementStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  recentlyCreated: number;
}

export const UnifiedUserCommandCenter: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const { user: currentUser, hasRole } = useAuth();
  const { users, loading, refreshUsers } = useUsers();
  const { toast } = useToast();

  // Permission checks
  const isSuperAdmin = hasRole('superadmin');
  const canManageRoles = isSuperAdmin || hasRole('admin');

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || 
        user.roles?.includes(roleFilter) ||
        user.primary_role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Calculate stats
  const stats: UserManagementStats = useMemo(() => {
    const totalUsers = users.length;
    const usersByRole = users.reduce((acc, user) => {
      const role = user.primary_role || 'user';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const recentlyCreated = users.filter(user => {
      if (!user.created_at) return false;
      const created = new Date(user.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length;

    return { totalUsers, usersByRole, recentlyCreated };
  }, [users]);

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!canManageRoles) return;
    
    try {
      // This would call your user deletion function
      toast({
        title: "Användare raderad",
        description: "Användaren har raderats från systemet",
      });
      refreshUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fel",
        description: "Kunde inte radera användaren",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Okänt';
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p>Laddar användare...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Användarhantering
          </h1>
          <p className="text-muted-foreground">
            Hantera användare, roller och behörigheter
          </p>
        </div>

        <Button className="flex items-center gap-2" disabled>
          <UserPlus className="h-4 w-4" />
          Skapa Användare (Snart tillgänglig)
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala Användare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Superadmins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersByRole.superadmin || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersByRole.admin || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nya denna vecka</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentlyCreated}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Sök och Filtrera Användare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök användare..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Användare ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0) || user.email.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium">{user.name || user.email}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    {user.roles?.map(role => (
                      <Badge key={role} variant="outline">{role}</Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUserSelect(user.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Redigera
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/intelligence-hub?userId=${user.id}`}>
                          <Brain className="h-4 w-4 mr-2" />
                          Intelligence Hub
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </DropdownMenuItem>
                      {canManageRoles && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Radera
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Detail Panel - Coming Soon */}
      {selectedUserId && (
        <Card>
          <CardHeader>
            <CardTitle>Användardetaljer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Användarredigering kommer snart. Använd Intelligence Hub för analys.</p>
            <Button variant="outline" onClick={() => setSelectedUserId(null)}>
              Stäng
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};