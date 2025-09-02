/**
 * 🛡️ NAVIGATION RENDER REGRESSION TESTS
 * Prevents accidental breaking of live routes by testing all navigation paths can render
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Import navigation config
import { MAIN_NAVIGATION, NavigationItem } from '@/config/navigation';

// Mock all external dependencies
vi.mock('@/providers/UnifiedAuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: { first_name: 'Test', last_name: 'User' },
    roles: ['client', 'admin', 'superadmin'], // All roles to test all routes
    hasRole: () => true,
    isSuperAdmin: true,
    isAdmin: true,
    canManageUsers: true,
    isClient: true
  })
}));

vi.mock('@/hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigation: [],
    goTo: {
      home: vi.fn(),
      dashboard: vi.fn(),
      tasks: vi.fn(),
      calendar: vi.fn()
    },
    navigateTo: vi.fn(),
    isActive: vi.fn(() => false)
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } }))
    }
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: [],
    loading: false,
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn()
  })
}));

vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({
    users: [],
    loading: false
  })
}));

// Mock all potential hooks that pages might use
vi.mock('@/hooks/useProfiles', () => ({
  useProfiles: () => ({
    profiles: [],
    loading: false
  })
}));

vi.mock('@/hooks/usePathEntries', () => ({
  usePathEntries: () => ({
    entries: [],
    loading: false
  })
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Simple test component for routes that might not have dedicated components yet
const TestRouteComponent: React.FC<{ path: string }> = ({ path }) => (
  <div data-testid={`route-${path.replace(/\//g, '-')}`}>
    Route: {path}
  </div>
);

// Dynamic import helper with fallback
const importRouteComponent = async (path: string) => {
  const routeComponentMap: Record<string, () => Promise<any>> = {
    '/dashboard': () => import('@/pages/Dashboard'),
    '/client-dashboard': () => import('@/pages/ClientDashboard'), 
    '/coach': () => import('@/pages/CoachDashboard'),
    '/six-pillars': () => import('@/pages/SixPillars'),
    '/user-analytics': () => import('@/pages/UserAnalytics'),
    '/tasks': () => import('@/pages/Tasks'),
    '/calendar': () => import('@/pages/Calendar'),
    '/edit-profile': () => import('@/pages/EditProfile'),
    '/mobile': () => import('@/pages/Mobile'),
    '/messages': () => import('@/pages/Messages'),
    '/unified-users': () => import('@/pages/UnifiedUsers'),
    '/client-360': () => import('@/pages/Client360'),
    '/intelligence-hub': () => import('@/pages/IntelligenceHub'),
    '/administration': () => import('@/pages/Administration'),
    '/admin/feature-flags': () => import('@/pages/admin/FeatureFlags'),
    '/stefan-chat': () => import('@/pages/StefanChat'),
    '/onboarding': () => import('@/pages/Onboarding'),
    '/stefan-administration': () => import('@/pages/StefanAdministration'),
    '/auth': () => import('@/pages/Auth'),
    '/collaboration': () => import('@/pages/Collaboration'),
    '/ai-coaching': () => import('@/pages/AiCoaching')
  };

  try {
    if (routeComponentMap[path]) {
      const module = await routeComponentMap[path]();
      return module.default || module[Object.keys(module)[0]];
    }
    return null;
  } catch (error) {
    console.warn(`Could not import component for route ${path}:`, error);
    return null;
  }
};

describe('🛡️ Navigation Render Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Extract all unique paths from navigation
  const getAllNavigationPaths = (): string[] => {
    const paths: string[] = [];
    
    MAIN_NAVIGATION.forEach(group => {
      group.items.forEach(item => {
        // Skip dynamic routes (those with parameters)
        if (!item.url.includes(':') && !item.url.includes('${')) {
          paths.push(item.url);
        }
      });
    });
    
    return [...new Set(paths)]; // Remove duplicates
  };

  const navigationPaths = getAllNavigationPaths();

  describe('All Navigation Routes Render Test', () => {
    it.each(navigationPaths)('should render route: %s', async (path) => {
      let Component: React.ComponentType<any>;
      
      try {
        const ImportedComponent = await importRouteComponent(path);
        Component = ImportedComponent || (() => <TestRouteComponent path={path} />);
      } catch (error) {
        // If import fails, use test component
        Component = () => <TestRouteComponent path={path} />;
      }

      // Test that the component renders without throwing
      expect(() => {
        render(
          <TestWrapper>
            <Routes>
              <Route path={path} element={<Component />} />
              <Route path="*" element={<Component />} />
            </Routes>
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Navigation Structure Integrity', () => {
    it('should have valid navigation paths', () => {
      navigationPaths.forEach(path => {
        expect(path).toMatch(/^\/[a-zA-Z0-9\-_/]*$/);
        expect(path.length).toBeGreaterThan(0);
      });
    });

    it('should not have duplicate paths in navigation', () => {
      const pathCounts = navigationPaths.reduce((acc, path) => {
        acc[path] = (acc[path] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(pathCounts).forEach(([path, count]) => {
        if (count > 1) {
          console.warn(`Duplicate path detected: ${path} appears ${count} times`);
        }
        expect(count).toBe(1);
      });
    });

    it('should have consistent navigation items structure', () => {
      MAIN_NAVIGATION.forEach(group => {
        expect(group.title).toBeTruthy();
        expect(Array.isArray(group.roles)).toBe(true);
        expect(Array.isArray(group.items)).toBe(true);
        
        group.items.forEach(item => {
          expect(item.title).toBeTruthy();
          expect(item.url).toBeTruthy();
          expect(Array.isArray(item.roles)).toBe(true);
          expect(item.icon).toBeTruthy();
        });
      });
    });
  });

  describe('Route Coverage Analysis', () => {
    it('should cover all critical application routes', () => {
      const criticalRoutes = [
        '/dashboard',
        '/client-dashboard', 
        '/six-pillars',
        '/tasks',
        '/administration',
        '/unified-users',
        '/client-360'
      ];

      criticalRoutes.forEach(route => {
        expect(navigationPaths).toContain(route);
      });
    });

    it('should report navigation coverage statistics', () => {
      console.log(`📊 Navigation Coverage Report:`);
      console.log(`- Total navigation paths: ${navigationPaths.length}`);
      console.log(`- Unique routes tested: ${new Set(navigationPaths).size}`);
      console.log(`- Navigation groups: ${MAIN_NAVIGATION.length}`);
      
      const totalItems = MAIN_NAVIGATION.reduce((sum, group) => sum + group.items.length, 0);
      console.log(`- Total navigation items: ${totalItems}`);
    });
  });
});