import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from './useAuth';
import { 
  getNavigationForRole, 
  getQuickActionsForRole, 
  getDefaultRouteForRole,
  NAVIGATION_ROUTES,
  NavigationItem,
  NavigationGroup
} from '@/config/navigation';

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole, roles } = useAuth();

  const userRoles = user ? roles : [];
  const navigation = getNavigationForRole(userRoles);
  const quickActions = getQuickActionsForRole(userRoles);
  const defaultRoute = getDefaultRouteForRole(userRoles);

  const isActive = (path: string, exact = false): boolean => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const navigateTo = (path: string, options?: { replace?: boolean; state?: any }) => {
    navigate(path, options);
  };

  const navigateToDefault = () => {
    navigate(defaultRoute);
  };

  const navigateToUser = (userId: string, context?: string) => {
    navigate(NAVIGATION_ROUTES.USER_PROFILE(userId, context));
  };

  // Legacy support - redirects to unified user route
  const navigateToClient = (clientId: string) => {
    navigate(NAVIGATION_ROUTES.USER_PROFILE(clientId, 'client'));
  };

  const navigateToIntelligence = (userId?: string) => {
    if (userId) {
      navigate(NAVIGATION_ROUTES.INTELLIGENCE_USER(userId));
    } else {
      navigate(NAVIGATION_ROUTES.INTELLIGENCE);
    }
  };

  const navigateToAssessment = (userId: string) => {
    navigate(NAVIGATION_ROUTES.USER_ASSESSMENT(userId));
  };

  const canAccess = (item: NavigationItem): boolean => {
    return item.roles.some(role => userRoles.includes(role as AppRole));
  };

  const getAccessibleGroups = (): NavigationGroup[] => {
    return navigation.filter(group => 
      group.items.some(item => canAccess(item))
    );
  };

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Add home/dashboard
    breadcrumbs.push({
      title: 'Hem',
      path: defaultRoute,
      icon: navigation[0]?.items[0]?.icon
    });

    // Map path segments to readable names
    const pathMappings: { [key: string]: string } = {
      'administration': 'Administration',
      'clients': 'Klienter', 
      'client': 'Klient',
      'user': 'Användare',
      'messages': 'Meddelanden',
      'tasks': 'Uppgifter',
      'calendar': 'Kalender',
      'intelligence': 'Intelligence',
      'stefan-chat': 'Stefan AI',
      'analytics': 'Analys',
      'reports': 'Rapporter',
      'onboarding': 'Välkomstbedömning',
      'edit-profile': 'Redigera Profil'
    };

    // Build breadcrumb trail
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip UUIDs and similar IDs
      if (segment.length > 30 || segment.includes('-')) {
        return;
      }

      const title = pathMappings[segment] || segment;
      breadcrumbs.push({
        title,
        path: currentPath,
        isLast: index === pathSegments.length - 1
      });
    });

    return breadcrumbs;
  };

  return {
    // Navigation data
    navigation,
    quickActions,
    defaultRoute,
    userRoles,
    
    // Navigation methods
    navigateTo,
    navigateToDefault,
    navigateToUser,
    navigateToClient,
    navigateToIntelligence,
    navigateToAssessment,
    
    // Utility methods
    isActive,
    canAccess,
    getAccessibleGroups,
    getBreadcrumbs,
    
    // Current state
    currentPath: location.pathname,
    currentSearch: location.search,
    currentState: location.state,
    
    // Route constants
    routes: NAVIGATION_ROUTES
  };
};