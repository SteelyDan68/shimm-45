import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
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
  
  // Get all navigation items for current user
  const navItems = navigation.flatMap(group => group.items);
  
  return (
    <>
      <header className="h-16 border-b bg-card shadow-sm">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <h1 className="text-lg sm:text-xl font-bold text-primary">SHIMM</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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

          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <MessageIcon />
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <span className="text-sm text-muted-foreground hidden sm:block lg:block">
              {user?.email}
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0">
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                    <AvatarFallback className="text-xs">
                      {user?.email?.charAt(0).toUpperCase() || "N"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
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

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-card border-b shadow-lg">
          <nav className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}