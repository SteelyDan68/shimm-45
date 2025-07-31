import { useState, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search,
  Filter,
  MoreHorizontal,
  Edit3,
  Trash2,
  User,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Users,
  UserCheck,
  UserX
} from "lucide-react";
import { PasswordManagement } from "./PasswordManagement";
import type { Profile, AppRole } from "@/hooks/useAuth";

interface ExtendedProfile extends Profile {
  roles?: AppRole[];
}

interface UserTableProps {
  users: ExtendedProfile[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onEditUser: (user: ExtendedProfile) => void;
  onViewProfile: (user: ExtendedProfile) => void;
  onDeleteUser: (userId: string) => void;
  onRoleChange: (userId: string, role: AppRole) => void;
  deletingUserId: string | null;
  updatingRoleUserId: string | null;
}

const roleLabels: Record<AppRole, string> = {
  superadmin: "Superadministratör",
  admin: "Administratör", 
  coach: "Coach",
  client: "Klient"
};

const roleColors: Record<AppRole, string> = {
  superadmin: "bg-red-500",
  admin: "bg-orange-500",
  coach: "bg-teal-500",
  client: "bg-yellow-500"
};

type SortField = 'name' | 'email' | 'role' | 'created_at' | 'last_login_at';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

export function UserTable({
  users,
  isAdmin,
  isSuperAdmin,
  onEditUser,
  onViewProfile,
  onDeleteUser,
  onRoleChange,
  deletingUserId,
  updatingRoleUserId
}: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organization?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "all" || 
        user.roles?.includes(roleFilter as AppRole) ||
        (roleFilter === "no-role" && (!user.roles || user.roles.length === 0));
      
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = a.roles?.[0] || 'zzz';
          bValue = b.roles?.[0] || 'zzz';
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'last_login_at':
          aValue = a.last_login_at ? new Date(a.last_login_at) : new Date(0);
          bValue = b.last_login_at ? new Date(b.last_login_at) : new Date(0);
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <SortAsc className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const renderUserCard = (user: ExtendedProfile) => (
    <Card key={user.id} className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarFallback>
            {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
           <h3 className="font-medium truncate">
             {user.first_name} {user.last_name}
           </h3>
           <p className="text-sm text-muted-foreground truncate">{user.email}</p>
           <p className="text-xs text-muted-foreground font-mono truncate">ID: {user.id}</p>
          <div className="flex gap-1 mt-2 flex-wrap">
            {user.roles?.map((role) => (
              <Badge 
                key={role} 
                variant="secondary"
                className={`text-white text-xs ${roleColors[role]}`}
              >
                {roleLabels[role]}
              </Badge>
            ))}
            {(!user.roles || user.roles.length === 0) && (
              <Badge variant="outline" className="text-xs">Ingen roll</Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewProfile(user)}>
              <User className="h-4 w-4 mr-2" />
              Visa profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditUser(user)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Redigera
            </DropdownMenuItem>
            {(isAdmin || isSuperAdmin) && (
              <DropdownMenuItem 
                onClick={() => onDeleteUser(user.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Ta bort
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Totalt</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aktiva</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Inaktiva</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.status !== 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Filtrerade</p>
                <p className="text-2xl font-bold">{filteredAndSortedUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök användare..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Roll" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla roller</SelectItem>
              <SelectItem value="no-role">Ingen roll</SelectItem>
              {Object.entries(roleLabels).map(([role, label]) => (
                <SelectItem key={role} value={role}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="inactive">Inaktiv</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Användare
                      <SortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      <SortIcon field="email" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-2">
                      Roller
                      <SortIcon field="role" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('last_login_at')}
                  >
                    <div className="flex items-center gap-2">
                      Senaste inloggning
                      <SortIcon field="last_login_at" />
                    </div>
                  </TableHead>
                  <TableHead>Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                         <div>
                           <div className="font-medium">
                             {user.first_name} {user.last_name}
                           </div>
                           <div className="text-sm text-muted-foreground">
                             {user.organization}
                           </div>
                           <div className="text-xs text-muted-foreground font-mono">
                             ID: {user.id}
                           </div>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles?.map((role) => (
                          <Badge 
                            key={role} 
                            variant="secondary"
                            className={`text-white ${roleColors[role]}`}
                          >
                            {roleLabels[role]}
                          </Badge>
                        ))}
                        {(!user.roles || user.roles.length === 0) && (
                          <Badge variant="outline">Ingen roll</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login_at 
                        ? new Date(user.last_login_at).toLocaleDateString('sv-SE')
                        : 'Aldrig'
                      }
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={deletingUserId === user.id || updatingRoleUserId === user.id}
                          >
                            {(deletingUserId === user.id || updatingRoleUserId === user.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewProfile(user)}>
                            <User className="h-4 w-4 mr-2" />
                            Visa fullständig profil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditUser(user)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Redigera grundinfo
                          </DropdownMenuItem>
                          {(isAdmin || isSuperAdmin) && (
                            <DropdownMenuItem className="p-0">
                              <PasswordManagement 
                                userId={user.id}
                                userEmail={user.email}
                                userName={`${user.first_name} ${user.last_name}`}
                              />
                            </DropdownMenuItem>
                          )}
                          {(isAdmin || isSuperAdmin) && (
                            <DropdownMenuItem 
                              onClick={() => onDeleteUser(user.id)}
                              className="text-red-600 focus:text-red-600"
                              disabled={deletingUserId === user.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {deletingUserId === user.id ? 'Tar bort...' : 'Ta bort'}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedUsers.map(renderUserCard)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Visar {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} av {filteredAndSortedUsers.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Föregående
            </Button>
            <span className="text-sm">
              Sida {currentPage} av {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Nästa
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}