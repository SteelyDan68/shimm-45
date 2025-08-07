/**
 * 🍞 INTELLIGENT BREADCRUMB SYSTEM
 * Context-aware navigation breadcrumbs with role-based paths
 */

import React, { useMemo } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * 🗺️ ROUTE MAPPING CONFIGURATION
 * Maps paths to user-friendly labels with context awareness
 */
const routeConfig: Record<string, (userRoles: string[]) => BreadcrumbItem[]> = {
  '/': (roles) => [{ label: 'Dashboard', icon: Home, isActive: true }],
  '/dashboard': (roles) => [{ label: 'Dashboard', icon: Home, isActive: true }],
  
  // Client Routes
  '/my-journey': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Min Resa', isActive: true }
  ],
  '/assessments': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Utvärderingar', isActive: true }
  ],
  '/assessments/new': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Utvärderingar', href: '/assessments' },
    { label: 'Ny Utvärdering', isActive: true }
  ],
  
  // Coach Routes
  '/my-clients': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Mina Klienter', isActive: true }
  ],
  '/client-intelligence': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Klient Intelligence', isActive: true }
  ],
  '/coaching-tools': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Coachingverktyg', isActive: true }
  ],
  
  // Admin Routes  
  '/administration': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Administration', isActive: true }
  ],
  '/intelligence': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Intelligence Hub', isActive: true }
  ],
  '/system-analytics': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Systemanalys', isActive: true }
  ],
  
  // Universal Routes
  '/stefan-chat': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Stefan AI', isActive: true }
  ],
  '/calendar': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Kalender', isActive: true }
  ],
  '/messages': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Meddelanden', isActive: true }
  ],
  '/settings': () => [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Inställningar', isActive: true }
  ]
};

/**
 * 🧩 SMART PATH PARSER
 * Generates breadcrumbs for dynamic routes
 */
const parsePathSegments = (pathname: string, userRoles: string[]): BreadcrumbItem[] => {
  // Handle exact matches first
  if (routeConfig[pathname]) {
    return routeConfig[pathname](userRoles);
  }
  
  // Handle dynamic routes like /clients/123, /assessments/456/results
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: Home }
  ];
  
  let currentPath = '';
  
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const isLast = i === segments.length - 1;
    
    // Check if we have a config for this partial path
    if (routeConfig[currentPath]) {
      const configBreadcrumbs = routeConfig[currentPath](userRoles);
      // Add only the last item from config to avoid duplication
      const lastConfigItem = configBreadcrumbs[configBreadcrumbs.length - 1];
      if (lastConfigItem && !isLast) {
        lastConfigItem.href = currentPath;
        lastConfigItem.isActive = false;
      }
      breadcrumbs.push({ ...lastConfigItem, isActive: isLast });
    } else {
      // Generate friendly name from segment
      const friendlyName = segments[i]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({
        label: friendlyName,
        href: isLast ? undefined : currentPath,
        isActive: isLast
      });
    }
  }
  
  return breadcrumbs;
};

export const BreadcrumbSystem: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const userRoles = user?.user_metadata?.roles || ['client'];
  
  // 🎯 Generate context-aware breadcrumbs
  const breadcrumbs = useMemo(() => {
    return parsePathSegments(location.pathname, userRoles);
  }, [location.pathname, userRoles]);

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for simple routes
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const IconComponent = crumb.icon;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/60" />
              )}
              
              {crumb.href && !isLast ? (
                <NavLink
                  to={crumb.href}
                  className={cn(
                    'flex items-center gap-1.5 hover:text-foreground transition-colors',
                    'text-muted-foreground hover:underline'
                  )}
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  <span>{crumb.label}</span>
                </NavLink>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1.5',
                    isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  <span>{crumb.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BreadcrumbSystem;