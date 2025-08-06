/**
 * 🏗️ ENTERPRISE-GRADE BASE DASHBOARD LAYOUT
 * Gemensam layout för alla dashboard-implementationer
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Settings, Bell, HelpCircle, LogOut, Menu, ChevronDown,
  Sparkles, Shield, Users, BarChart3
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../contexts/DashboardContext';

interface BaseDashboardLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showNavigation?: boolean;
  className?: string;
}

export const BaseDashboardLayout: React.FC<BaseDashboardLayoutProps> = ({
  children,
  showHeader = true,
  showNavigation = true,
  className = ""
}) => {
  const { user, profile, signOut } = useAuth();
  const { state } = useDashboard();
  const navigate = useNavigate();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'client': return 'Klient';
      case 'coach': return 'Coach';
      case 'admin': return 'Admin';
      case 'superadmin': return 'Superadmin';
      default: return 'Användare';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client': return Sparkles;
      case 'coach': return Users;
      case 'admin': return Shield;
      case 'superadmin': return Shield;
      default: return Users;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'client': return 'default';
      case 'coach': return 'secondary';
      case 'admin': return 'destructive';
      case 'superadmin': return 'destructive';
      default: return 'outline';
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Användare';

  const initials = profile?.first_name 
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ''}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* 📱 RESPONSIVE HEADER */}
      {showHeader && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              
              {/* Logo & Titel */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Dashboard
                  </span>
                </div>
                
                {state.currentRole && (
                  <Badge variant={getRoleBadgeVariant(state.currentRole)} className="hidden sm:flex">
                    {React.createElement(getRoleIcon(state.currentRole), { className: "w-3 h-3 mr-1" })}
                    {getRoleDisplayName(state.currentRole)}
                  </Badge>
                )}
              </div>

              {/* Navigation (desktop) */}
              {showNavigation && state.config?.navigation && (
                <nav className="hidden md:flex items-center gap-1">
                  {state.config.navigation.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-2"
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {item.label}
                      {item.badge && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </nav>
              )}

              {/* User Menu */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 p-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium">
                        {displayName}
                      </span>
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {user?.email}
                    </div>
                    
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Inställningar
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => navigate('/help')}>
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Hjälp & Support
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logga ut
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile menu toggle */}
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* 📱 MOBILE NAVIGATION */}
      {showNavigation && state.config?.navigation && (
        <nav className="md:hidden border-b bg-background">
          <div className="container mx-auto px-4 py-2">
            <div className="flex gap-1 overflow-x-auto">
              {state.config.navigation.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span className="text-xs">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* 🎯 MAIN CONTENT AREA */}
      <main className="container mx-auto px-4 py-6">
        {state.isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laddar dashboard...</p>
            </Card>
          </div>
        ) : state.error ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <BarChart3 className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium mb-2">Dashboard-fel</h3>
              <p className="text-muted-foreground mb-4">{state.error}</p>
              <Button onClick={() => window.location.reload()}>
                Försök igen
              </Button>
            </Card>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
};