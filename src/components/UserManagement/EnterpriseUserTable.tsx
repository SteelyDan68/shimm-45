import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Users
} from 'lucide-react';
import { useUnifiedUsers } from '@/hooks/useUnifiedUsers';

interface EnterpriseUserTableProps {
  onUserSelect?: (userId: string) => void;
  selectable?: boolean;
}

export const EnterpriseUserTable = ({ 
  onUserSelect, 
  selectable = false 
}: EnterpriseUserTableProps) => {
  const { users, loading, getUsersByRole } = useUnifiedUsers();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter);
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (roles: string[]) => {
    if (roles.includes('superadmin')) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (roles.includes('admin')) return <Shield className="h-4 w-4 text-red-500" />;
    if (roles.includes('coach')) return <UserCheck className="h-4 w-4 text-blue-500" />;
    return <User className="h-4 w-4 text-gray-500" />;
  };

  const getRoleBadge = (roles: string[]) => {
    const primaryRole = roles.includes('superadmin') ? 'superadmin' :
                       roles.includes('admin') ? 'admin' :
                       roles.includes('coach') ? 'coach' : 'client';
    
    const variants = {
      superadmin: 'destructive',
      admin: 'secondary',
      coach: 'default',
      client: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[primaryRole as keyof typeof variants]}>
        {primaryRole}
      </Badge>
    );
  };

  const handleUserClick = (userId: string) => {
    if (selectable && onUserSelect) {
      onUserSelect(userId);
    } else {
      navigate(`/user/${userId}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Laddar användare...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Användarhantering
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök användare..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
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
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="inactive">Inaktiv</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inga användare hittades</h3>
            <p className="text-muted-foreground">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                ? "Inga användare matchar dina filter"
                : "Inga användare finns registrerade"
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Användare</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Senast inloggad</TableHead>
                  <TableHead>Registrerad</TableHead>
                  {!selectable && <TableHead>Åtgärder</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id}
                    className={selectable ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={selectable ? () => handleUserClick(user.id) : undefined}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getRoleIcon(user.roles)}
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getRoleBadge(user.roles)}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {user.last_login_at 
                          ? new Date(user.last_login_at).toLocaleDateString('sv-SE')
                          : 'Aldrig'
                        }
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {user.created_at 
                          ? new Date(user.created_at).toLocaleDateString('sv-SE')
                          : 'Okänt'
                        }
                      </div>
                    </TableCell>
                    
                    {!selectable && (
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUserClick(user.id)}
                        >
                          Visa profil
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* User count summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          Visar {filteredUsers.length} av {users.length} användare
        </div>
      </CardContent>
    </Card>
  );
};