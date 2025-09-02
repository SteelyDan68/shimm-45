import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/providers/UnifiedAuthProvider';
import { 
  getNavigationForRole, 
  getQuickActionsForRole, 
  getDefaultRouteForRole,
  NAVIGATION_ROUTES,
  NavigationItem,
  NavigationGroup
} from '@/config/navigation';
import { NAVIGATION_PATTERNS } from '@/utils/navigationHelpers';
import { shouldShowBetaFeatures } from '@/utils/userHelpers';
import { isFeatureEnabled } from '@/config/FEATURE_FLAGS';

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole, roles } = useAuth();

  const userRoles = user ? roles : [];
  const isBetaUser = shouldShowBetaFeatures(user);
  const navigation = getNavigationForRole(userRoles, isBetaUser);
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

  // Standardized navigation methods using patterns
  const goTo = {
    home: () => navigate(NAVIGATION_PATTERNS.HOME()),
    dashboard: () => navigate(NAVIGATION_PATTERNS.DASHBOARD()),
    clientDashboard: () => navigate(NAVIGATION_PATTERNS.CLIENT_DASHBOARD()),
    coachDashboard: () => navigate(NAVIGATION_PATTERNS.COACH_DASHBOARD()),
    sixPillars: () => navigate(NAVIGATION_PATTERNS.SIX_PILLARS()),
    tasks: () => navigate(NAVIGATION_PATTERNS.TASKS()),
    calendar: () => navigate(NAVIGATION_PATTERNS.CALENDAR()),
    messages: () => navigate(NAVIGATION_PATTERNS.MESSAGES()),
    onboarding: () => navigate(NAVIGATION_PATTERNS.ONBOARDING()),
    myAssessments: () => navigate(NAVIGATION_PATTERNS.MY_ASSESSMENTS()),
    myAnalyses: () => navigate(NAVIGATION_PATTERNS.MY_ANALYSES()),
    myProgram: () => navigate(NAVIGATION_PATTERNS.MY_PROGRAM()),
    guidedAssessment: () => navigate(NAVIGATION_PATTERNS.GUIDED_ASSESSMENT()),
    userAnalytics: (tab?: string) => navigate(NAVIGATION_PATTERNS.USER_ANALYTICS(tab)),
    intelligenceHub: () => navigate(NAVIGATION_PATTERNS.INTELLIGENCE_HUB()),
    administration: () => navigate(NAVIGATION_PATTERNS.ADMINISTRATION()),
    stefanChat: () => navigate(NAVIGATION_PATTERNS.STEFAN_CHAT()),
    editProfile: () => navigate(NAVIGATION_PATTERNS.EDIT_PROFILE()),
    mobile: () => navigate(NAVIGATION_PATTERNS.MOBILE()),
  };

  const canAccess = (item: NavigationItem): boolean => {
    // Check feature flags first
    if (item.featureFlag && !isFeatureEnabled(item.featureFlag)) {
      return false;
    }
    
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
    
    // Standardized navigation patterns
    goTo,
    
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
    routes: NAVIGATION_ROUTES,
    patterns: NAVIGATION_PATTERNS
  };
};