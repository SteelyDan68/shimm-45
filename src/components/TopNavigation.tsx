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
  Menu
} from "lucide-react";
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
        {!isClient && <SidebarTrigger className="h-8 w-8 flex-shrink-0" />}
        
        {/* Logo - Hidden on mobile when sidebar is open */}
        <div className={`flex items-center ${isMobile && sidebarOpen ? 'hidden' : ''}`}>
          <NavLink to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <h1 className="text-lg font-bold text-primary">SHIMMS</h1>
          </NavLink>
        </div>

        {/* Client Primary Nav - only for Client */}
        {isClient && (
          <nav className="hidden md:flex items-center gap-2 ml-2">
            <NavLink to="/six-pillars" className="px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">Six Pillars</NavLink>
            <NavLink to="/user-analytics" className="px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">Min utvecklingsanalys</NavLink>
            <NavLink to="/my-assessments" className="px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">Självskattning</NavLink>
            <NavLink to="/my-analyses" className="px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">Analys</NavLink>
            <NavLink to="/my-program" className="px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">Program</NavLink>
          </nav>
        )}

        {/* Center Search */}
        <div className="flex-1 max-w-md mx-4">
          <GlobalSearchBar variant={isMobile ? "compact" : "full"} className="w-full" />
        </div>
        {/* Messages & Quick Actions - Clean and focused */}
        <div className="flex items-center gap-3">
          {/* Mobile Client Menu */}
          {isClient && (
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 px-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Öppna meny</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-popover border shadow-lg z-50">
                  <DropdownMenuItem asChild><NavLink to="/six-pillars" className="w-full">Six Pillars</NavLink></DropdownMenuItem>
                  <DropdownMenuItem asChild><NavLink to="/user-analytics" className="w-full">Min utvecklingsanalys</NavLink></DropdownMenuItem>
                  <DropdownMenuItem asChild><NavLink to="/my-assessments" className="w-full">Självskattning</NavLink></DropdownMenuItem>
                  <DropdownMenuItem asChild><NavLink to="/my-analyses" className="w-full">Analys</NavLink></DropdownMenuItem>
                  <DropdownMenuItem asChild><NavLink to="/my-program" className="w-full">Program</NavLink></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

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
            
            <DropdownMenuContent align="end" className="w-72 bg-popover border shadow-lg z-50">
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
              
              {/* RENSAD NAVIGATION - Endast essentiella användarfunktioner */}
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