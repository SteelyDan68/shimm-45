import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  User, 
  Brain, 
  Database,
  TrendingUp,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';

interface Client {
  id: string;
  name: string;
  category: string;
  status: string;
}

const mainItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Alla Klienter", url: "/clients", icon: Users },
  { title: "Analys", url: "/analytics", icon: TrendingUp },
  { title: "Datainsamling", url: "/data-collection", icon: Database },
];

export function AppSidebar() {
  const { open, openMobile } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted/50";

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, category, status')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  return (
    <Sidebar className={!open ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Huvudmeny</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink to={item.url} className={getNavCls}>
                       <item.icon className="h-4 w-4" />
                       {open && <span>{item.title}</span>}
                     </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Clients */}
        {clients.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Klienter</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clients.slice(0, open ? 8 : 0).map((client) => (
                  <SidebarMenuItem key={client.id}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={`/client/${client.id}`} 
                        className={getNavCls}
                      >
                        <User className="h-4 w-4" />
                         {open && (
                           <div className="flex-1 min-w-0">
                             <span className="truncate">{client.name}</span>
                             <div className="text-xs text-muted-foreground">
                               {client.category}
                             </div>
                           </div>
                         )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                {clients.length > 8 && open && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/clients" className={getNavCls}>
                        <span className="text-xs text-muted-foreground">
                          +{clients.length - 8} fler...
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}