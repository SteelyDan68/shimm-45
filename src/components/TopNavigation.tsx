import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/UnifiedAuthProvider";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { GlobalSearchBar } from "@/components/GlobalSearch/GlobalSearchBar";
import { MobileTouchButton } from "@/components/ui/mobile-responsive";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  LogOut,
  User,
  Shield,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageIcon } from "@/components/Messaging/MessageIcon";

export function TopNavigation() {
  const { user, signOut, hasRole, roles } = useAuth();
  const { routes } = useNavigation();
  const { open: sidebarOpen } = useSidebar();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  return (
    <header className="h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40">
      <div className="flex h-full items-center gap-4 px-4">
        {/* Sidebar Toggle - Ensure it's properly contained */}
        <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
        
        {/* Logo - Hidden on mobile when sidebar is open */}
        <div className={`flex items-center ${isMobile && sidebarOpen ? 'hidden' : ''}`}>
          <NavLink to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <h1 className="text-lg font-bold text-primary">SHIMMS</h1>
          </NavLink>
        </div>

        {/* Center Search */}
        <div className="flex-1 max-w-md mx-4">
          <GlobalSearchBar variant={isMobile ? "compact" : "full"} className="w-full" />
        </div>

        {/* Messages & Notifications - More Prominent */}
        <div className="flex items-center gap-3">
          <MessageIcon />
          
          {/* Quick Message Button for Coaches */}
          {(roles.includes('coach') || roles.includes('admin') || roles.includes('superadmin')) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/messages?action=compose')}
              className="hidden md:flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden lg:inline">Nytt meddelande</span>
            </Button>
          )}
          
          {/* Email - Desktop Only */}
          {!isMobile && (
            <span className="text-sm text-muted-foreground truncate max-w-48">
              {user?.email}
            </span>
          )}
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 rounded-full border border-border/50 hover:border-border transition-colors"
                aria-label="Användarmeny"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-72 bg-popover/95 backdrop-blur border shadow-lg">
              {/* User Info Header */}
              <div className="px-3 py-3 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate" title={user?.email}>
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasRole('superadmin') ? 'Superadministratör' : 
                   hasRole('admin') ? 'Administratör' : 
                   hasRole('coach') ? 'Coach' : 'Klient'}
                </p>
              </div>
              
              {/* Navigation Links */}
              <div className="py-1">
                <DropdownMenuItem asChild>
                  <NavLink to="/edit-profile" className="flex items-center w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                    <User className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>Min Profil</span>
                  </NavLink>
                </DropdownMenuItem>
                
                {(hasRole('superadmin') || hasRole('admin')) && (
                  <DropdownMenuItem asChild>
                    <NavLink to="/administration" className="flex items-center w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                      <Shield className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span>Administration</span>
                    </NavLink>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem asChild>
                  <NavLink to="/stefan-chat" className="flex items-center w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                    <HelpCircle className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>Hjälp & Support</span>
                  </NavLink>
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Sign Out */}
              <div className="py-1">
                <DropdownMenuItem 
                  onClick={async () => {
                    try {
                      await signOut();
                      navigate('/');
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-destructive focus:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span>Logga ut</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}