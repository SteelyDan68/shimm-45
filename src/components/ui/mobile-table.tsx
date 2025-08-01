import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit3, Trash2, Key } from "lucide-react"
import type { UnifiedUser } from "@/hooks/useUnifiedUserData"

interface MobileUserCardProps {
  user: UnifiedUser;
  onViewProfile: (user: UnifiedUser) => void;
  onEditUser: (user: UnifiedUser) => void;
  onDeleteUser: (userId: string) => void;
  onNavigateToProfile: (userId: string) => void;
  isDeleting?: boolean;
  getRoleBadge: (roles: string[]) => React.ReactNode;
  getRoleIcon: (roles: string[]) => React.ReactNode;
}

export function MobileUserCard({ 
  user, 
  onViewProfile, 
  onEditUser, 
  onDeleteUser, 
  onNavigateToProfile,
  isDeleting = false,
  getRoleBadge,
  getRoleIcon
}: MobileUserCardProps) {
  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Okänd användare';
  
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="text-sm">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getRoleIcon(user.roles)}
                <p className="font-medium text-sm truncate">{userName}</p>
              </div>
              
              <p className="text-xs text-muted-foreground truncate mb-2">
                {user.email}
              </p>
              
              <div className="flex flex-wrap items-center gap-2">
                {getRoleBadge(user.roles)}
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {user.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
              
              {user.last_login_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Senast inloggad: {new Date(user.last_login_at).toLocaleDateString('sv-SE')}
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 flex-shrink-0"
                disabled={isDeleting}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem onClick={() => onViewProfile(user)}>
                <Eye className="h-4 w-4 mr-2" />
                Visa profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigateToProfile(user.id)}>
                <Key className="h-4 w-4 mr-2" />
                Gå till profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditUser(user)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Redigera
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteUser(user.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Ta bort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}