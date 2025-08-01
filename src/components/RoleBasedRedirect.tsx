import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const RoleBasedRedirect = () => {
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    // Redirect bara för root path
    if (location.pathname !== '/') return;

    // Prioritera enligt hierarki
    if (hasRole('superadmin') || hasRole('admin')) {
      navigate('/dashboard');
    } else if (hasRole('coach')) {
      navigate('/coach');
    } else if (hasRole('client')) {
      navigate('/client-dashboard');
    } else {
      navigate('/dashboard');
    }
  }, [user, hasRole, navigate, location.pathname]);

  return null;
};