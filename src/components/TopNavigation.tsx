import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { GlobalSearchBar } from "@/components/GlobalSearch/GlobalSearchBar";
import { MobileTouchButton, ConditionalRender } from "@/components/ui/mobile-responsive";
import { useIsMobile } from "@/hooks/use-mobile";
import { useResponsiveNavigation } from "@/hooks/useResponsiveNavigation";
import { 
  LogOut,
  User,
  Menu,
  X,
  Settings
} from "lucide-react";
import { useState } from "react";
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
  const { user, signOut, hasRole } = useAuth();
  const { navigation, isActive, routes } = useNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Get all navigation items for current user
  const navItems = navigation.flatMap(group => group.items);
  
  // Use responsive navigation to determine when to show hamburger menu
  const { shouldShowHamburger, headerRef } = useResponsiveNavigation({
    menuItems: navItems.length,
    minSpaceRequired: 800
  });
  
  // Show hamburger if either mobile OR insufficient space
  const showHamburgerMenu = isMobile || shouldShowHamburger;
  
  return (
    <>
      <header ref={headerRef} className="nav-mobile bg-card shadow-sm">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Logo */}
          <div data-nav-logo className="flex items-center space-x-4">
            <h1 className="text-lg sm:text-xl font-bold text-primary">SHIMM</h1>
          </div>

          {/* Desktop Navigation - only show when there's enough space */}
          {!showHamburgerMenu && (
            <nav className="flex items-center space-x-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>
          )}

          {/* Center Search - Desktop Only when there's space */}
          {!showHamburgerMenu && (
            <div data-nav-search className="flex flex-1 max-w-md mx-8">
              <GlobalSearchBar variant="full" className="w-full" />
            </div>
          )}

          {/* Right side actions */}
          <div data-nav-actions className="flex items-center space-x-2">
            {/* Mobile Search - show when hamburger menu is active */}
            {showHamburgerMenu && (
              <div>
                <GlobalSearchBar variant="compact" />
              </div>
            )}
            
            <MessageIcon />
            
            {/* Hamburger menu button - show on mobile OR when insufficient space */}
            {showHamburgerMenu && (
              <MobileTouchButton 
                variant="sm"
                className="bg-transparent text-foreground hover:bg-muted border-0 shadow-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </MobileTouchButton>
            )}
            
            {/* Email display - only show when there's space */}
            {!showHamburgerMenu && (
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <MobileTouchButton 
                  variant="sm"
                  className="rounded-full bg-transparent hover:bg-muted border-0 shadow-none p-1"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {user?.email?.charAt(0).toUpperCase() || "N"}
                    </AvatarFallback>
                  </Avatar>
                </MobileTouchButton>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56 z-50">
                <DropdownMenuItem asChild>
                  <NavLink to="/edit-profile" className="flex items-center w-full">
                    <User className="h-4 w-4 mr-2" />
                    Redigera Profil
                  </NavLink>
                </DropdownMenuItem>
                
                {(hasRole('superadmin') || hasRole('admin')) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <NavLink to="/administration" className="flex items-center w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Administration
                      </NavLink>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logga ut
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Navigation Menu - show when hamburger is active */}
      {isMobileMenuOpen && showHamburgerMenu && (
        <div className="bg-card border-b shadow-mobile-lg animate-slide-up-mobile">
          <nav className="px-4 py-4 space-mobile-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 touch-target-md px-4 rounded-lg text-mobile-base font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/70"
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}