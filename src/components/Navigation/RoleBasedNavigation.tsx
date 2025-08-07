/**
 * 🧭 ROLE-BASED NAVIGATION SYSTEM
 * Intelligent navigation that adapts to user role and context
 */

import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { 
  Home, Users, Brain, BarChart3, Settings, 
  UserCheck, MessageSquare, Calendar, Award,
  Shield, Database, Zap, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: string;
  priority: number;
  description: string;
}

/**
 * 🎯 NAVIGATION CONFIGURATION
 * Priority-based navigation items per role
 */
const navigationConfig: NavItem[] = [
  // Core Dashboard Access
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    roles: ['client', 'coach', 'admin', 'superadmin'],
    priority: 1,
    description: 'Huvudöversikt och senaste aktivitet'
  },
  
  // Client-specific Navigation
  {
    to: '/my-journey',
    label: 'Min Resa',
    icon: Target,
    roles: ['client'],
    priority: 2,
    description: 'Din personliga utvecklingsresa'
  },
  {
    to: '/assessments',
    label: 'Utvärderingar',
    icon: UserCheck,
    roles: ['client'],
    priority: 3,
    description: 'Genomför självskattningar och utvecklingstester'
  },
  {
    to: '/stefan-chat',
    label: 'Stefan AI',
    icon: Brain,
    roles: ['client', 'coach'],
    priority: 4,
    description: 'AI-driven coaching och personlig vägledning'
  },
  
  // Coach-specific Navigation
  {
    to: '/my-clients',
    label: 'Mina Klienter',
    icon: Users,
    roles: ['coach'],
    priority: 2,
    description: 'Hantera och följa upp dina klienter'
  },
  {
    to: '/coaching-tools',
    label: 'Coachingverktyg',
    icon: Award,
    roles: ['coach'],
    priority: 3,
    description: 'Avancerade verktyg för coachning'
  },
  {
    to: '/client-intelligence',
    label: 'Klient Intelligence',
    icon: BarChart3,
    roles: ['coach'],
    priority: 4,
    description: 'Djupa insikter om klienternas utveckling'
  },
  
  // Admin Navigation
  {
    to: '/administration',
    label: 'Administration',
    icon: Shield,
    roles: ['admin', 'superadmin'],
    priority: 2,
    description: 'Användarhantering och systemkonfiguration'
  },
  {
    to: '/intelligence',
    label: 'Intelligence Hub',
    icon: Database,
    roles: ['admin', 'superadmin'],
    priority: 3,
    description: 'Systemövergripande analyser och rapporter'
  },
  {
    to: '/system-analytics',
    label: 'Systemanalys',
    icon: Zap,
    roles: ['superadmin'],
    priority: 4,
    description: 'Avancerad systemanalys och optimering'
  },
  
  // Universal Navigation
  {
    to: '/calendar',
    label: 'Kalender',
    icon: Calendar,
    roles: ['client', 'coach', 'admin', 'superadmin'],
    priority: 5,
    description: 'Schemaläggning och tidsplanering'
  },
  {
    to: '/messages',
    label: 'Meddelanden',
    icon: MessageSquare,
    roles: ['client', 'coach', 'admin', 'superadmin'],
    priority: 6,
    description: 'Intern kommunikation och notifikationer'
  },
  {
    to: '/settings',
    label: 'Inställningar',
    icon: Settings,
    roles: ['client', 'coach', 'admin', 'superadmin'],
    priority: 10,
    description: 'Personliga inställningar och preferenser'
  }
];

export const RoleBasedNavigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  const userRoles = user?.user_metadata?.roles || ['client'];
  
  // 🎯 Filter and prioritize navigation based on user roles
  const availableNavItems = useMemo(() => {
    return navigationConfig
      .filter(item => item.roles.some(role => userRoles.includes(role)))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 8); // Limit to prevent navigation overflow
  }, [userRoles]);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const getActiveClass = (path: string) => {
    return isActive(path)
      ? 'bg-primary/10 text-primary border-primary/20 font-medium'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50';
  };

  return (
    <nav className="space-y-1">
      <div className="px-3 py-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Navigation
        </h2>
      </div>
      
      {availableNavItems.map((item) => {
        const IconComponent = item.icon;
        
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-lg mx-2 border border-transparent',
              getActiveClass(item.to)
            )}
            title={item.description}
          >
            <IconComponent className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            
            {item.badge && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
            
            {isActive(item.to) && (
              <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </NavLink>
        );
      })}
      
      {/* Quick Actions Section */}
      <div className="px-3 py-2 mt-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Snabba Åtgärder
        </h3>
        <QuickActionButtons userRoles={userRoles} />
      </div>
    </nav>
  );
};

/**
 * 🚀 QUICK ACTION BUTTONS
 * Context-aware quick actions based on user role
 */
const QuickActionButtons: React.FC<{ userRoles: string[] }> = ({ userRoles }) => {
  const quickActions = useMemo(() => {
    const actions = [];
    
    if (userRoles.includes('client')) {
      actions.push({
        label: 'Ny Utvärdering',
        to: '/assessments/new',
        icon: UserCheck,
        variant: 'default' as const
      });
    }
    
    if (userRoles.includes('coach')) {
      actions.push({
        label: 'Ny Klient',
        to: '/clients/add',
        icon: Users,
        variant: 'secondary' as const
      });
    }
    
    if (userRoles.includes('admin') || userRoles.includes('superadmin')) {
      actions.push({
        label: 'Systemstatus',
        to: '/system/status',
        icon: Zap,
        variant: 'outline' as const
      });
    }
    
    return actions.slice(0, 2); // Max 2 quick actions
  }, [userRoles]);

  return (
    <div className="space-y-2">
      {quickActions.map((action) => {
        const IconComponent = action.icon;
        
        return (
          <NavLink
            key={action.to}
            to={action.to}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-muted/30 hover:bg-muted rounded-lg transition-colors"
          >
            <IconComponent className="h-4 w-4" />
            <span className="text-xs font-medium">{action.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default RoleBasedNavigation;