import { NavLink, useNavigate } from "react-router-dom";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { GlobalSearchBar } from "@/components/GlobalSearch/GlobalSearchBar";
import { MobileTouchButton } from "@/components/ui/mobile-responsive";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from '@/utils/logger';
import { UnifiedNotificationSystem } from "@/components/UnifiedNotificationSystem";
import { 
  LogOut,
  Shield,
  HelpCircle,
  TrendingUp,
  BarChart3,
  CheckSquare,
  User,
  Smartphone,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TopNavigation() {
  const { user, signOut, isSuperAdmin, isAdmin, isCoach, isClient, isLoading } = useOptimizedAuth();
  const { routes } = useNavigation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Set logger context
  logger.setContext({ component: 'TopNavigation' });
  
  return (
    <header className="h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
      <div className="flex h-full items-center gap-4 px-4">
        {/* Logo */}
        <div className="flex items-center">
          <NavLink to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <h1 className="text-lg font-bold text-primary">SHIMMS</h1>
          </NavLink>
        </div>

        {/* Navigation Menu for Client */}
        {isClient && !isMobile && (
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium">
                  Utveckling
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 w-[400px]">
                    <NavigationMenuLink asChild>
                      <NavLink 
                        to="/six-pillars" 
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          <div className="text-sm font-medium leading-none">Six Pillars</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Starta din utvecklingsresa med våra sex grundpelare
                        </p>
                      </NavLink>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <NavLink 
                        to="/user-analytics" 
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <div className="text-sm font-medium leading-none">Min utvecklingsanalys</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Se din progress och utvecklingsmönster
                        </p>
                      </NavLink>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <NavLink 
                        to="/tasks" 
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4" />
                          <div className="text-sm font-medium leading-none">Uppgifter</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Hantera och genomför dina utvecklingsuppgifter
                        </p>
                      </NavLink>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
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
              
              {/* HUVUDNAVIGATION */}
              <div className="py-1">
                {(isSuperAdmin || isAdmin) && (
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
              
              {/* INSTÄLLNINGAR */}
              <div className="py-1">
                <DropdownMenuLabel className="text-xs text-muted-foreground px-3">
                  Inställningar
                </DropdownMenuLabel>
                
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