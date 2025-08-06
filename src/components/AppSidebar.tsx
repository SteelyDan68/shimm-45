/**
 * 🎯 CLEAN & INTUITIVE SIDEBAR NAVIGATION
 * Single source of truth för all navigation - inget cluttering!
 */

import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  BarChart3,
  Target,
  CheckSquare,
  Calendar,
  User,
  Brain,
  MessageSquare,
  Lightbulb,
  Users,
  Shield,
  Search,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/UnifiedAuthProvider";
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
  const { hasRole } = useAuth();
  const currentPath = location.pathname;

  // 🎯 CLEAN NAVIGATION - Client-focused items first
  const clientNavigation = [
    { 
      title: "Dashboard", 
      url: "/client-dashboard", 
      icon: LayoutDashboard,
      tooltip: "Huvudöversikt"
    },
    { 
      title: "Min Utvecklingsanalys", 
      url: "/user-analytics", 
      icon: BarChart3,
      tooltip: "Pillar-analyser och framsteg"
    },
    { 
      title: "Sex Utvecklingspelare", 
      url: "/six-pillars", 
      icon: Target,
      tooltip: "Bedömningar och utvecklingsresor"
    },
    { 
      title: "Uppgifter", 
      url: "/tasks", 
      icon: CheckSquare,
      tooltip: "Utvecklingsuppgifter"
    },
    { 
      title: "Kalender", 
      url: "/calendar", 
      icon: Calendar,
      tooltip: "Schemaläggning och aktiviteter"
    },
    { 
      title: "AI-Coachning", 
      url: "/ai-coaching", 
      icon: Brain,
      tooltip: "Personlig AI-utveckling"
    },
    { 
      title: "Min Profil", 
      url: "/edit-profile", 
      icon: User,
      tooltip: "Personlig information"
    }
  ];

  // 🎯 TOOLS & COMMUNICATION
  const toolsNavigation = [
    { 
      title: "Meddelanden", 
      url: "/messages", 
      icon: MessageSquare,
      tooltip: "Kommunikation"
    },
    { 
      title: "Globalsökning", 
      url: "/search", 
      icon: Search,
      tooltip: "Sök i systemet"
    },
    { 
      title: "Stefan AI Chat", 
      url: "/stefan-chat", 
      icon: Lightbulb,
      tooltip: "AI-assistent"
    }
  ];

  // 🎯 ADMIN NAVIGATION - Only for authorized users
  const adminNavigation = [
    { 
      title: "Användarhantering", 
      url: "/unified-users", 
      icon: Users,
      tooltip: "Hantera användare"
    },
    { 
      title: "Administration", 
      url: "/administration", 
      icon: Shield,
      tooltip: "Systemadministration"
    }
  ];

  const isActive = (path: string) => currentPath === path;
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
        {/* 🏠 HUVUDNAVIGATION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            🏠 Huvudmeny
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clientNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={!open ? item.tooltip : undefined}>
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

        {/* 🛠️ VERKTYG & KOMMUNIKATION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-600 font-semibold">
            🛠️ Verktyg
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={!open ? item.tooltip : undefined}>
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

        {/* 🔐 ADMIN - Only for authorized users */}
        {(hasRole('admin') || hasRole('superadmin')) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-red-600 font-semibold">
              🔐 Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigation.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={!open ? item.tooltip : undefined}>
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}