/**
 * 🎯 CLEAN & INTUITIVE SIDEBAR NAVIGATION
 * Single source of truth för all navigation - inget cluttering!
 */

import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/UnifiedAuthProvider";
import { useNavigation } from "@/hooks/useNavigation";
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

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { navigation, isActive } = useNavigation();
  const currentPath = location.pathname;

  const getNavCls = (path: string) => 
    isActive(path) ? "bg-primary text-primary-foreground" : "hover:bg-muted/50";

  return (
    <Sidebar 
      variant="sidebar" 
      className={cn(
        "border-r transition-all duration-300",
        open ? "w-72" : "w-14"
      )}
    >
      <SidebarContent className="overflow-y-auto">
        {/* 🎯 ROLLBASERAD NAVIGATION */}
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-primary font-semibold">
              {group.title === "Huvudmeny" ? "🏠" : "🔧"} {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={!open ? item.title : undefined}>
                      <NavLink 
                        to={item.url} 
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                          getNavCls(item.url)
                        )}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {open && <span className="font-medium">{item.title}</span>}
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