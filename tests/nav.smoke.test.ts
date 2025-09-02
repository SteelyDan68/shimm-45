/**
 * 🔥 NAVIGATION SMOKE TESTS
 * Critical safety checks to prevent accidental removal of live functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Import navigation config
import { MAIN_NAVIGATION, NAVIGATION_ROUTES } from '@/config/navigation';

// Import critical components
import { MyAssessments } from '@/pages/MyAssessments';
import { TasksPage } from '@/pages/Tasks';
import { Client360Page } from '@/pages/Client360';
import UserAnalytics from '@/pages/UserAnalytics';
import { Administration } from '@/pages/Administration';

// Mock providers and hooks
vi.mock('@/providers/UnifiedAuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: { first_name: 'Test', last_name: 'User' },
    roles: ['client'],
    hasRole: (role: string) => role === 'client',
    isSuperAdmin: false,
    isAdmin: false,
    canManageUsers: false,
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

// Mock hooks that components use
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

describe('🔥 Critical Navigation Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation Configuration Integrity', () => {
    it('should contain all critical routes in navigation config', () => {
      const allRoutes = MAIN_NAVIGATION.flatMap(group => group.items.map(item => item.url));
      
      // Critical routes that must exist
      const criticalRoutes = [
        NAVIGATION_ROUTES.SIX_PILLARS,
        NAVIGATION_ROUTES.TASKS,
        NAVIGATION_ROUTES.CLIENT_360,
        NAVIGATION_ROUTES.ADMINISTRATION,
        NAVIGATION_ROUTES.INTELLIGENCE_HUB
      ];

      criticalRoutes.forEach(route => {
        expect(allRoutes).toContain(route);
      });
    });

    it('should have valid navigation structure', () => {
      expect(MAIN_NAVIGATION).toBeDefined();
      expect(Array.isArray(MAIN_NAVIGATION)).toBe(true);
      expect(MAIN_NAVIGATION.length).toBeGreaterThan(0);

      MAIN_NAVIGATION.forEach(group => {
        expect(group.title).toBeDefined();
        expect(group.roles).toBeDefined();
        expect(Array.isArray(group.items)).toBe(true);
        
        group.items.forEach(item => {
          expect(item.title).toBeDefined();
          expect(item.url).toBeDefined();
          expect(item.roles).toBeDefined();
          expect(item.icon).toBeDefined();
        });
      });
    });

    it('should have consistent route definitions', () => {
      // Check that NAVIGATION_ROUTES constants are defined
      expect(NAVIGATION_ROUTES.DASHBOARD).toBeDefined();
      expect(NAVIGATION_ROUTES.SIX_PILLARS).toBeDefined();
      expect(NAVIGATION_ROUTES.TASKS).toBeDefined();
      expect(NAVIGATION_ROUTES.CLIENT_360).toBeDefined();
      expect(NAVIGATION_ROUTES.ADMINISTRATION).toBeDefined();
      expect(NAVIGATION_ROUTES.INTELLIGENCE_HUB).toBeDefined();
    });
  });

  describe('Critical Component Render Tests', () => {
    it('🎯 Assessment functionality should render without crashing', () => {
      expect(() => {
        render(
          <TestWrapper>
            <MyAssessments />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('📋 Actionables/Tasks functionality should render without crashing', () => {
      expect(() => {
        render(
          <TestWrapper>
            <TasksPage />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('👥 Client360 functionality should render without crashing', () => {
      expect(() => {
        render(
          <TestWrapper>
            <Client360Page />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('📊 Analytics functionality should render without crashing', () => {
      expect(() => {
        render(
          <TestWrapper>
            <UserAnalytics />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('⚙️ Admin functionality should render without crashing', () => {
      expect(() => {
        render(
          <TestWrapper>
            <Administration />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Route Accessibility Validation', () => {
    it('should not have orphaned routes in critical functionality', () => {
      const criticalPaths = [
        '/my-assessments',
        '/tasks', 
        '/client-360',
        '/user-analytics',
        '/administration'
      ];

      // These paths should exist in navigation or be explicitly marked as accessible
      const allNavigationUrls = MAIN_NAVIGATION.flatMap(group => 
        group.items.map(item => item.url)
      );

      // Check that critical paths are either in navigation or have known access patterns
      criticalPaths.forEach(path => {
        const hasNavigation = allNavigationUrls.includes(path);
        const isKnownAccessible = [
          '/my-assessments', // Accessible via welcome widget
          '/user-analytics' // Has navigation item
        ].includes(path);

        expect(hasNavigation || isKnownAccessible).toBe(true);
      });
    });
  });

  describe('Dead Code Detection', () => {
    it('should not import any known dead components', () => {
      // This test ensures we don't accidentally import components marked for removal
      const deadComponents = [
        'ClientProfile',
        'UserProfile', 
        'Collaboration',
        'CollaborationDashboard'
      ];

      // If any of these are imported in this test file, the test should fail
      deadComponents.forEach(component => {
        expect(() => {
          // This will throw if the module doesn't exist (which is good)
          try {
            require(`@/pages/${component}`);
            throw new Error(`Dead component ${component} is still importable`);
          } catch (e) {
            // Expected - component should not be importable
            expect(e.message).toContain('Cannot resolve');
          }
        }).not.toThrow();
      });
    });
  });
});

describe('🛡️ Navigation Safety Checks', () => {
  it('should have stable route structure for critical views', () => {
    const criticalRouteKeys = [
      'DASHBOARD',
      'SIX_PILLARS', 
      'TASKS',
      'CLIENT_360',
      'ADMINISTRATION',
      'INTELLIGENCE_HUB'
    ];

    criticalRouteKeys.forEach(key => {
      expect(NAVIGATION_ROUTES[key]).toBeDefined();
      expect(typeof NAVIGATION_ROUTES[key]).toBe('string');
    });
  });

  it('should maintain role-based access structure', () => {
    const adminGroup = MAIN_NAVIGATION.find(group => 
      group.title === 'Administration'
    );
    
    expect(adminGroup).toBeDefined();
    expect(adminGroup?.roles).toContain('superadmin');
    expect(adminGroup?.roles).toContain('admin');
  });

  it('should preserve client navigation items', () => {
    const clientItems = MAIN_NAVIGATION.flatMap(group =>
      group.items.filter(item => item.roles.includes('client'))
    );

    expect(clientItems.length).toBeGreaterThan(0);
    
    // Essential client routes should exist
    const clientRoutes = clientItems.map(item => item.url);
    expect(clientRoutes).toContain(NAVIGATION_ROUTES.SIX_PILLARS);
    expect(clientRoutes).toContain(NAVIGATION_ROUTES.TASKS);
  });
});