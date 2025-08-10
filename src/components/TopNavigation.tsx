import { NavLink, useNavigate } from "react-router-dom";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { GlobalSearchBar } from "@/components/GlobalSearch/GlobalSearchBar";
import { MobileTouchButton } from "@/components/ui/mobile-responsive";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from '@/utils/logger';
import { UnifiedNotificationSystem } from "@/components/UnifiedNotificationSystem";
import { 
  LogOut,
  Shield,
  HelpCircle,
  MessageSquare,
  Target,
  BarChart3,
  CheckSquare,
  Calendar,
  User,
  Smartphone,
  Settings,
  ChevronDown
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TopNavigation() {
  const { user, signOut, isSuperAdmin, isAdmin, isCoach, isClient, isLoading } = useOptimizedAuth();
  const { routes } = useNavigation();
  const { open: sidebarOpen } = useSidebar();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Set logger context
  logger.setContext({ component: 'TopNavigation' });
  
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

        {/* CONSOLIDATED NAVIGATION - Desktop Only */}
        {!isMobile && (
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="flex items-center gap-2">
              {/* Six Pillars - Direct Link */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <NavLink 
                    to="/six-pillars" 
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Six Pillars
                  </NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Utveckling - Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Utveckling
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 w-80">
                    <NavLink 
                      to="/user-analytics"
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="text-sm font-medium leading-none">Min utvecklingsanalys</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Detaljerad analys av din utvecklingsprogress
                      </p>
                    </NavLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Uppgifter - Direct Link */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <NavLink 
                    to="/tasks" 
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Uppgifter
                  </NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Kalender - Direct Link */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <NavLink 
                    to="/calendar" 
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Kalender
                  </NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        )}

        {/* Center Search */}
        <div className="flex-1 max-w-md mx-4">
          <GlobalSearchBar variant={isMobile ? "compact" : "full"} className="w-full" />
        </div>

        {/* Messages & Quick Actions - Clean and focused */}
        <div className="flex items-center gap-3">
          <UnifiedNotificationSystem />
          
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
                  {isSuperAdmin ? 'Superadministratör' : 
                   isAdmin ? 'Administratör' : 
                   isCoach ? 'Coach' : 'Klient'}
                </p>
              </div>
              
              {/* ADMINISTRATION - För admin/superadmin */}
              {(isSuperAdmin || isAdmin) && (
                <div className="py-1">
                  <DropdownMenuItem asChild>
                    <NavLink to="/administration" className="flex items-center w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                      <Shield className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span>Administration</span>
                    </NavLink>
                  </DropdownMenuItem>
                </div>
              )}

              {/* INSTÄLLNINGAR - Konsoliderad användarhantering */}
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Inställningar
                </div>
                
                <DropdownMenuItem asChild>
                  <NavLink to="/edit-profile" className="flex items-center w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                    <User className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>Min Profil</span>
                  </NavLink>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <NavLink to="/mobile" className="flex items-center w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                    <Smartphone className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>Mobil</span>
                  </NavLink>
                </DropdownMenuItem>
              </div>

              {/* HJÄLP & SUPPORT */}
              <div className="py-1">
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
                      logger.info('User signing out');
                      await signOut();
                      navigate('/');
                    } catch (error) {
                      logger.error('Logout error:', error);
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