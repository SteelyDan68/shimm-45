import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDefaultRouteForRole } from '@/config/navigation';

export const RoleBasedRedirect = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    // Only redirect from root path to maintain user intent
    if (location.pathname !== '/') return;

    // Use centralized role-based routing logic
    const defaultRoute = getDefaultRouteForRole(roles);
    navigate(defaultRoute, { replace: true });
  }, [user, roles, navigate, location.pathname]);

  return null;
};