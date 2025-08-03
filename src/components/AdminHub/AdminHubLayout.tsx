import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Brain, 
  Settings,
  Search,
  Bell,
  Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { NavLink } from 'react-router-dom';

interface AdminNavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  badge?: string;
  roles: string[];
}

interface AdminNavigationGroup {
  title: string;
  items: AdminNavigationItem[];
  roles: string[];
}

const ADMIN_NAVIGATION: AdminNavigationGroup[] = [
  {
    title: "Översikt",
    roles: ["superadmin", "admin", "coach"],
    items: [
      {
        title: "Dashboard",
        url: "/admin-hub",
        icon: LayoutDashboard,
        roles: ["superadmin", "admin", "coach"]
      }
    ]
  }
];

function AdminSidebar() {
  const { roles } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const hasAccess = (item: AdminNavigationItem | AdminNavigationGroup) => {
    return item.roles.some(role => roles.includes(role as any));
  };

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-muted/50";

  return (
    <Sidebar 
      className={cn(
        "shrink-0 border-r",
        collapsed ? "w-16" : "w-64"
      )}
      style={{ 
        "--sidebar-width": collapsed ? "4rem" : "16rem" 
      } as React.CSSProperties}
    >
      <SidebarContent>
        {ADMIN_NAVIGATION.filter(hasAccess).map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.filter(hasAccess).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavClassName}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && (
                          <>
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

function AdminHeader() {
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 pl-2 pr-6">
        <SidebarTrigger className="ml-0" />
        
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Admin Hub</h1>
          <Badge variant="outline">
            {profile?.first_name || user?.email?.split('@')[0]}
          </Badge>
        </div>

        <div className="flex-1 flex items-center gap-4 max-w-sm ml-auto">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök användare, funktioner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              3
            </Badge>
          </Button>
        </div>
      </div>
    </header>
  );
}

function QuickActionsPanel() {
  const { canCreateUsers, canInviteUsers, canManageUsers } = usePermissions();
  
  const quickActions = [
    ...(canCreateUsers ? [{
      title: "Skapa användare",
      description: "Manuell registrering",
      icon: Users,
      action: () => {/* Navigate to user creation */}
    }] : []),
    ...(canInviteUsers ? [{
      title: "Bjud in användare", 
      description: "E-postinbjudan",
      icon: Users,
      action: () => {/* Navigate to invitation */}
    }] : []),
  ];

  if (quickActions.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="p-2 shadow-lg">
        <div className="flex flex-col gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={action.action}
              className="justify-start gap-2 text-left"
            >
              <action.icon className="h-4 w-4" />
              <div className="hidden lg:block">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AdminHubLayout() {
  const { canManageUsers } = usePermissions();

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Åtkomst nekad</h2>
          <p className="text-muted-foreground">
            Du har inte behörighet att komma åt Admin Hub.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
        
        <QuickActionsPanel />
      </div>
    </SidebarProvider>
  );
}