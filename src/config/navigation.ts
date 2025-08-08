import { 
  Home, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings,
  User,
  Brain,
  CheckSquare,
  Calendar,
  BarChart3,
  Database,
  ClipboardList,
  MessageSquare,
  Building2,
  Users2,
  Smartphone,
  RefreshCw,
  Zap,
  Activity
} from "lucide-react";

export interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  roles: string[];
  exact?: boolean;
  children?: NavigationItem[];
  betaOnly?: boolean; // Add beta flag
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
  roles: string[];
  betaOnly?: boolean; // Add beta flag for groups
}

export const NAVIGATION_ROUTES = {
  // Core routes
  DASHBOARD: "/dashboard",
  CLIENT_DASHBOARD: "/client-dashboard", 
  COACH_DASHBOARD: "/coach",
  
  // User management - SINGLE SOURCE OF TRUTH: ONLY user_id
  UNIFIED_USERS: "/unified-users",
  ADMINISTRATION: "/administration",
  USERS: "/users",
  USER_PROFILE: (id: string, context?: string) => `/user/${id}${context ? `?context=${context}` : ''}`,
  EDIT_PROFILE: "/edit-profile",
  
  // Features
  SIX_PILLARS: "/six-pillars",
  MESSAGES: "/messages",
  TASKS: "/tasks", 
  CALENDAR: "/calendar",
  INTELLIGENCE: "/intelligence",
  INTELLIGENCE_USER: (id: string) => `/intelligence/${id}`,
  INTELLIGENCE_HUB: "/intelligence-hub",
  STEFAN_CHAT: "/stefan-chat",
  
  // Assessment - UNIFIED: user_id only
  ONBOARDING: "/onboarding",
  USER_ASSESSMENT: (id: string) => `/user/${id}?context=assessment`,
  
  // Analytics & Reports
  ANALYTICS: "/analytics",
  DATA_COLLECTION: "/data-collection", 
  REPORTS: "/reports",
  
  // Auth
  AUTH: "/auth",
  INVITATION: (token: string) => `/invitation/${token}`,
  COLLABORATION: "/collaboration",
  AI_COACHING: "/ai-coaching",
  MOBILE: "/mobile",
} as const;

export const MAIN_NAVIGATION: NavigationGroup[] = [
  {
    title: "Huvudmeny",
    roles: ["superadmin", "admin", "coach", "client"],
    items: [
      // SUPERADMIN & ADMIN DASHBOARDS
      {
        title: "Dashboard",
        url: NAVIGATION_ROUTES.DASHBOARD,
        icon: Home,
        roles: ["superadmin", "admin"],
        exact: true
      },
      {
        title: "Coach Dashboard", 
        url: NAVIGATION_ROUTES.COACH_DASHBOARD,
        icon: TrendingUp,
        roles: ["coach"],
        exact: true
      },
      {
        title: "Dashboard",
        url: NAVIGATION_ROUTES.CLIENT_DASHBOARD,
        icon: Home, 
        roles: ["client"],
        exact: true
      },
      // CLIENT NAVIGATION
      {
        title: "Six Pillars", 
        url: NAVIGATION_ROUTES.SIX_PILLARS, 
        icon: TrendingUp,
        roles: ["client"]
      },
      // Ta bort "Min Utvecklingsöversikt" från navigation
      {
        title: "Min Utvecklingsanalys", 
        url: "/user-analytics", 
        icon: BarChart3,
        roles: ["client"]
      },
      {
        title: "Uppgifter", 
        url: NAVIGATION_ROUTES.TASKS, 
        icon: CheckSquare,
        roles: ["client"]
      },
      {
        title: "Kalender", 
        url: NAVIGATION_ROUTES.CALENDAR, 
        icon: Calendar,
        roles: ["client", "coach"]
      },
      {
        title: "Min Profil", 
        url: NAVIGATION_ROUTES.EDIT_PROFILE, 
        icon: User,
        roles: ["client"]
      },
      {
        title: "Meddelanden",
        url: NAVIGATION_ROUTES.MESSAGES,
        icon: MessageSquare,
        roles: ["superadmin", "admin", "coach", "client"]
      }
    ]
  },
  {
    title: "Administration",
    roles: ["superadmin", "admin"],
    items: [
      {
        title: "Unified User Center",
        url: NAVIGATION_ROUTES.UNIFIED_USERS,
        icon: Users,
        roles: ["superadmin", "admin", "coach"]
      },
      {
        title: "System Administration",
        url: NAVIGATION_ROUTES.ADMINISTRATION,
        icon: Settings,
        roles: ["superadmin", "admin"]
      },
      {
        title: "Intelligence Hub",
        url: NAVIGATION_ROUTES.INTELLIGENCE_HUB,
        icon: Brain,
        roles: ["superadmin", "admin", "coach"]
      },
      {
        title: "Analytics & Reports",
        url: NAVIGATION_ROUTES.ANALYTICS,
        icon: BarChart3,
        roles: ["superadmin", "admin"]
      },
      {
        title: "Data Collection",
        url: NAVIGATION_ROUTES.DATA_COLLECTION,
        icon: Database,
        roles: ["superadmin", "admin"]
      },
      {
        title: "Mobil",
        url: NAVIGATION_ROUTES.MOBILE,
        icon: Smartphone,
        roles: ["superadmin", "admin"]
      }
    ]
  },
  {
    title: "Beta Testing (Anna)",
    roles: ["client"],
    betaOnly: true, // Special flag for Anna Andersson only
    items: [
      {
        title: "Assessment Konsolidering",
        url: "/user-analytics?tab=consolidation",
        icon: RefreshCw,
        roles: ["client"],
        betaOnly: true
      },
      {
        title: "AI-till-Actionables",
        url: "/user-analytics?tab=consolidation",
        icon: Zap,
        roles: ["client"], 
        betaOnly: true
      },
      {
        title: "Pipeline Status",
        url: "/user-analytics?tab=consolidation",
        icon: Activity,
        roles: ["client"],
        betaOnly: true
      }
    ]
  }
];

export const QUICK_ACTIONS = {
  superadmin: [
    {
      title: "Unified User Center",
      description: "Komplett användarhantering",
      icon: Users,
      url: NAVIGATION_ROUTES.UNIFIED_USERS,
      variant: "default" as const
    },
    {
      title: "Stefan AI Konsultation", 
      description: "Få AI-baserade råd och insikter",
      icon: Brain,
      url: NAVIGATION_ROUTES.STEFAN_CHAT,
      variant: "secondary" as const
    },
    {
      title: "Intelligence Hub",
      description: "Analys och insikter",
      icon: Brain,
      url: NAVIGATION_ROUTES.INTELLIGENCE_HUB,
      variant: "outline" as const
    }
  ],
  admin: [
    {
      title: "Unified User Center",
      description: "Hantera användare och roller",
      icon: Users,
      url: NAVIGATION_ROUTES.UNIFIED_USERS,
      variant: "default" as const
    },
    {
      title: "Stefan AI Konsultation",
      description: "Få AI-baserade råd och insikter", 
      icon: Brain,
      url: NAVIGATION_ROUTES.STEFAN_CHAT,
      variant: "secondary" as const
    },
    {
      title: "Intelligence Hub",
      description: "Användaranalys och insikter",
      icon: Brain,
      url: NAVIGATION_ROUTES.INTELLIGENCE_HUB,
      variant: "outline" as const
    }
  ],
  coach: [
    {
      title: "Unified User Center",
      description: "Hantera klienter",
      icon: Users,
      url: NAVIGATION_ROUTES.UNIFIED_USERS,
      variant: "default" as const
    },
    {
      title: "Stefan AI Konsultation",
      description: "Få coachning-råd från AI",
      icon: Brain,
      url: NAVIGATION_ROUTES.STEFAN_CHAT,
      variant: "secondary" as const
    },
    {
      title: "Intelligence Hub",
      description: "Klientanalys och progress",
      icon: Brain,
      url: NAVIGATION_ROUTES.INTELLIGENCE_HUB,
      variant: "outline" as const
    },
  ],
  client: [
    {
      title: "Six Pillars",
      description: "Starta din utvecklingsresa",
      icon: TrendingUp,
      url: NAVIGATION_ROUTES.SIX_PILLARS,
      variant: "default" as const
    },
    {
      title: "Genomför bedömning",
      description: "Uppdatera din utveckling",
      icon: ClipboardList,
      url: NAVIGATION_ROUTES.ONBOARDING,
      variant: "secondary" as const
    },
    {
      title: "Stefan AI Hjälp",
      description: "Få personlig vägledning",
      icon: Brain,
      url: NAVIGATION_ROUTES.STEFAN_CHAT,
      variant: "secondary" as const
    },
    {
      title: "Mina uppgifter",
      description: "Se och hantera dina uppgifter",
      icon: CheckSquare,
      url: NAVIGATION_ROUTES.TASKS,
      variant: "outline" as const
    },
    // Ta bort "Min Utvecklingsöversikt" från quickActions
  ]
};

// Utility functions
export const getNavigationForRole = (roles: string[], isAnnaAndersson = false): NavigationGroup[] => {
  return MAIN_NAVIGATION.filter(group => {
    // Filter out beta groups if not Anna Andersson
    if (group.betaOnly && !isAnnaAndersson) return false;
    
    return group.roles.some(role => roles.includes(role));
  }).map(group => ({
    ...group,
    items: group.items.filter(item => {
      // Filter out beta items if not Anna Andersson
      if (item.betaOnly && !isAnnaAndersson) return false;
      
      return item.roles.some(role => roles.includes(role));
    })
  }));
};

export const getQuickActionsForRole = (roles: string[]) => {
  // Prioritera roller: superadmin > admin > coach > client
  if (roles.includes('superadmin')) return QUICK_ACTIONS.superadmin;
  if (roles.includes('admin')) return QUICK_ACTIONS.admin;
  if (roles.includes('coach')) return QUICK_ACTIONS.coach;
  if (roles.includes('client')) return QUICK_ACTIONS.client;
  return [];
};

export const getDefaultRouteForRole = (roles: string[]): string => {
  // HIERARKISK ROLLPRIORITERING med SUPERADMIN GOD MODE
  if (roles.includes('superadmin')) {
    return NAVIGATION_ROUTES.DASHBOARD; // Superadmin sees main admin dashboard
  }
  if (roles.includes('admin')) {
    return NAVIGATION_ROUTES.DASHBOARD;
  }
  if (roles.includes('coach')) {
    return NAVIGATION_ROUTES.COACH_DASHBOARD;
  }
  if (roles.includes('client')) {
    return NAVIGATION_ROUTES.CLIENT_DASHBOARD;
  }
  return NAVIGATION_ROUTES.DASHBOARD; // Fallback
};