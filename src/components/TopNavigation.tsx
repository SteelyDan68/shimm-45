import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings,
  LogOut,
  User
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

const coachItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Klienter", url: "/clients", icon: Users },
  { title: "Coach", url: "/coach", icon: TrendingUp },
  { title: "Meddelanden", url: "/messages", icon: FileText },
];

const clientItems = [
  { title: "Min Dashboard", url: "/client-dashboard", icon: Home },
  { title: "Meddelanden", url: "/messages", icon: FileText },
  { title: "Redigera Profil", url: "/edit-profile", icon: User },
];

export function TopNavigation() {
  const { user, signOut, hasRole } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  // Välj navigationsmenyn baserat på användarroll
  const navItems = hasRole('client') ? clientItems : coachItems;
  
  return (
    <header className="h-16 border-b bg-card shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold text-primary">SHIMM</h1>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
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
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <MessageIcon />
          
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.email}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {user?.email?.charAt(0).toUpperCase() || "N"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              {/* Visa administration endast för icke-klienter */}
              {!hasRole('client') && (
                <>
                  <DropdownMenuItem asChild>
                    <NavLink to="/admin" className="flex items-center w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Administration
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}