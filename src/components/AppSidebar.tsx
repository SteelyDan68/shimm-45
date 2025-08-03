import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  User, 
  Search,
  ChevronDown
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/hooks/useNavigation';
import { useUnifiedClients } from '@/hooks/useUnifiedClients';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface Client {
  id: string;
  name: string;
  category: string;
  status: string;
  user_id?: string;
}

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { hasRole } = useAuth();
  const { navigation, isActive } = useNavigation();
  const { clients: unifiedClients } = useUnifiedClients();
  const [openGroups, setOpenGroups] = useState<string[]>(['Huvudmeny']);
  
  // Map unified clients to sidebar format
  const clients = unifiedClients.map(client => ({
    id: client.id,
    name: client.name,
    category: client.category || 'general',
    status: client.status,
    user_id: client.id
  }));

  const currentPath = location.pathname;
  
  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  const getNavCls = (itemUrl: string) => 
    isActive(itemUrl) ? "bg-primary text-primary-foreground" : "hover:bg-muted/50";


  return (
    <Sidebar 
      variant="sidebar" 
      collapsible="icon"
      className="border-r bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30"
    >
      <SidebarContent className="overflow-y-auto">
        {/* Dynamic Navigation Groups */}
        {navigation.map((group) => (
          <Collapsible
            key={group.title}
            open={openGroups.includes(group.title)}
            onOpenChange={() => toggleGroup(group.title)}
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-muted/50 transition-colors rounded-md px-2 py-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </span>
                  {open && (
                    <ChevronDown className={`h-3 w-3 transition-transform ${
                      openGroups.includes(group.title) ? 'rotate-180' : ''
                    }`} />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={!open ? item.title : undefined}>
                          <NavLink 
                            to={item.url} 
                            className={`${getNavCls(item.url)} transition-colors rounded-md`}
                            title={!open ? item.title : undefined}
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {open && <span className="truncate">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}

        {/* Quick Search - Only when expanded */}
        {open && (hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
          <SidebarGroup>
            <SidebarGroupLabel>Snabbsökning</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/search" className={getNavCls("/search")}>
                      <Search className="h-4 w-4" />
                      <span>Sök användare</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Recent Clients - Only for coaches/admins when expanded */}
        {open && clients.length > 0 && (hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
          <SidebarGroup>
            <SidebarGroupLabel>Senaste användare</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clients.slice(0, 5).map((client) => (
                  <SidebarMenuItem key={client.id}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={`/client/${client.user_id || client.id}`} 
                        className={`${getNavCls(`/client/${client.user_id || client.id}`)} group`}
                      >
                        <User className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="truncate text-sm">{client.name}</span>
                          <div className="text-xs text-muted-foreground truncate">
                            {client.category}
                          </div>
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                {clients.length > 5 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/administration" className="text-xs text-muted-foreground hover:text-foreground">
                        <Users className="h-4 w-4" />
                        <span>Visa alla ({clients.length})</span>
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