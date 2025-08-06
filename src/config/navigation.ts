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
  Smartphone
} from "lucide-react";

export interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  roles: string[];
  exact?: boolean;
  children?: NavigationItem[];
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
  roles: string[];
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
        title: "Min Dashboard",
        url: NAVIGATION_ROUTES.CLIENT_DASHBOARD,
        icon: Home, 
        roles: ["client"],
        exact: true
      }
    ]
  },
  {
    title: "Verktyg",
    roles: ["superadmin", "admin", "coach", "client"],
    items: [
      {
        title: "Six Pillars",
        url: NAVIGATION_ROUTES.SIX_PILLARS,
        icon: TrendingUp,
        roles: ["client", "coach"]
      },
      {
        title: "Mina Uppgifter",
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
        title: "Meddelanden",
        url: NAVIGATION_ROUTES.MESSAGES,
        icon: MessageSquare,
        roles: ["superadmin", "admin", "coach", "client"]
      },
      {
        title: "Min Intelligence",
        url: "/client-intelligence",
        icon: Brain,
        roles: ["client"]
      },
      {
        title: "Stefan AI Hub",
        url: "/stefan",
        icon: Brain,
        roles: ["superadmin", "admin", "coach", "client"]
      },
      {
        title: "Mobil",
        url: NAVIGATION_ROUTES.MOBILE,
        icon: Smartphone,
        roles: ["superadmin", "admin", "coach", "client"]
      }
    ]
  },
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
    {
      title: "Min Intelligence",
      description: "Se din digitala analys",
      icon: Brain,
      url: "/client-intelligence",
      variant: "outline" as const
    }
  ]
};

// Utility functions
export const getNavigationForRole = (roles: string[]): NavigationGroup[] => {
  return MAIN_NAVIGATION.filter(group => 
    group.roles.some(role => roles.includes(role))
  ).map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.roles.some(role => roles.includes(role))
    )
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