/**
 * 🎯 ENTERPRISE-GRADE DASHBOARD CONTEXT
 * Central state management för unified dashboard-arkitektur
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useRoleCache } from '@/hooks/useRoleCache';
import { 
  DashboardContextState, 
  DashboardConfig, 
  UserRole,
  DashboardProviderProps 
} from '../types/dashboard-types';
import { getDashboardConfig } from '../configs/dashboard-configs';

type DashboardAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ROLE'; payload: UserRole }
  | { type: 'SET_CONFIG'; payload: DashboardConfig }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_CUSTOMIZATIONS'; payload: Record<string, any> }
  | { type: 'RESET' };

const initialState: DashboardContextState = {
  currentRole: null,
  config: null,
  isLoading: true,
  error: null,
  customizations: {}
};

function dashboardReducer(state: DashboardContextState, action: DashboardAction): DashboardContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ROLE':
      return { ...state, currentRole: action.payload };
    
    case 'SET_CONFIG':
      return { ...state, config: action.payload, isLoading: false, error: null };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'UPDATE_CUSTOMIZATIONS':
      return { 
        ...state, 
        customizations: { ...state.customizations, ...action.payload }
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

const DashboardContext = createContext<{
  state: DashboardContextState;
  dispatch: React.Dispatch<DashboardAction>;
  refreshConfig: () => void;
  updateWidgetConfig: (widgetId: string, config: Record<string, any>) => void;
  toggleWidgetVisibility: (widgetId: string) => void;
} | null>(null);

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ 
  children, 
  userId, 
  role: providedRole 
}) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { user } = useAuth();
  const { isClient, isCoach, isAdmin, isSuperAdmin } = useRoleCache();

  // Determine user role with fallback to client
  const getUserRole = (): UserRole | null => {
    if (providedRole) return providedRole;
    
    if (isSuperAdmin) return 'superadmin';
    if (isAdmin) return 'admin';
    if (isCoach) return 'coach';
    if (isClient) return 'client';
    
    // Fallback: If user exists but no specific role found, default to client
    if (user?.id) {
      console.log('🔄 DashboardContext: No specific role found, defaulting to client');
      return 'client';
    }
    
    return null;
  };

  const loadDashboardConfig = async () => {
    try {
      console.log('🔄 DashboardContext: Starting loadDashboardConfig');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const role = getUserRole();
      console.log('🔄 DashboardContext: Determined role:', role);
      
      if (!role) {
        const error = 'Ingen giltig användarroll hittades';
        console.error('❌ DashboardContext:', error);
        throw new Error(error);
      }

      dispatch({ type: 'SET_ROLE', payload: role });

      console.log('🔄 DashboardContext: Loading config for role:', role, 'userId:', userId || user?.id);
      const config = getDashboardConfig(role, userId || user?.id);
      console.log('✅ DashboardContext: Config loaded:', config);
      
      dispatch({ type: 'SET_CONFIG', payload: config });

      // Load user customizations från localStorage eller database
      const savedCustomizations = localStorage.getItem(`dashboard-customizations-${user?.id}`);
      if (savedCustomizations) {
        try {
          const customizations = JSON.parse(savedCustomizations);
          dispatch({ type: 'UPDATE_CUSTOMIZATIONS', payload: customizations });
        } catch (error) {
          console.warn('Kunde inte ladda dashboard-anpassningar:', error);
        }
      }

      console.log('✅ DashboardContext: Configuration completed successfully');
    } catch (error) {
      console.error('Dashboard config loading error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Okänt fel' });
    }
  };

  const updateWidgetConfig = (widgetId: string, config: Record<string, any>) => {
    const updatedCustomizations = {
      ...state.customizations,
      widgets: {
        ...state.customizations.widgets,
        [widgetId]: {
          ...state.customizations.widgets?.[widgetId],
          config: { ...state.customizations.widgets?.[widgetId]?.config, ...config }
        }
      }
    };

    dispatch({ type: 'UPDATE_CUSTOMIZATIONS', payload: updatedCustomizations });
    
    // Save to localStorage
    localStorage.setItem(
      `dashboard-customizations-${user?.id}`, 
      JSON.stringify(updatedCustomizations)
    );
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const currentVisibility = state.customizations.widgets?.[widgetId]?.isVisible ?? true;
    
    const updatedCustomizations = {
      ...state.customizations,
      widgets: {
        ...state.customizations.widgets,
        [widgetId]: {
          ...state.customizations.widgets?.[widgetId],
          isVisible: !currentVisibility
        }
      }
    };

    dispatch({ type: 'UPDATE_CUSTOMIZATIONS', payload: updatedCustomizations });
    
    // Save to localStorage
    localStorage.setItem(
      `dashboard-customizations-${user?.id}`, 
      JSON.stringify(updatedCustomizations)
    );
  };

  const refreshConfig = () => {
    loadDashboardConfig();
  };

  // Initialize dashboard config
  useEffect(() => {
    if (user?.id || userId) {
      loadDashboardConfig();
    }
  }, [user?.id, userId, isClient, isCoach, isAdmin, isSuperAdmin]);

  // Reset when user changes
  useEffect(() => {
    return () => {
      dispatch({ type: 'RESET' });
    };
  }, [user?.id]);

  return (
    <DashboardContext.Provider 
      value={{ 
        state, 
        dispatch, 
        refreshConfig,
        updateWidgetConfig,
        toggleWidgetVisibility
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};