import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useUnifiedNavigation = () => {
  const navigate = useNavigate();

  const unifiedNavigate = useCallback((path: string, options?: { replace?: boolean }) => {
    try {
      navigate(path, options);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to window.location if navigate fails
      if (options?.replace) {
        window.location.replace(path);
      } else {
        window.location.href = path;
      }
    }
  }, [navigate]);

  return {
    navigate: unifiedNavigate
  };
};