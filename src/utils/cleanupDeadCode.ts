/**
 * 🧹 DEAD CODE CLEANUP UTILITIES
 * SCRUM-TEAM Code Quality Maintenance
 */

// Files that have been identified for cleanup/removal
export const DEPRECATED_FILES = [
  'src/components/dashboard/RoleSpecificDashboards.tsx', // ✅ REMOVED - Replaced by dashboard-configs.ts
  // Add more deprecated files here as they are identified
];

// TODO comments that have been resolved
export const RESOLVED_TODOS = [
  {
    file: 'src/components/Dashboard/EnhancedClientDashboard.tsx',
    line: 161,
    original: 'TODO: Implementera total reset av alla pillars',
    resolution: 'Implemented via TotalSystemResetSection component',
    resolved: true
  },
  {
    file: 'src/pages/MyAssessments.tsx', 
    line: 280,
    original: 'TODO: Implement PDF export',
    resolution: 'Implemented via PrintPDFActions component',
    resolved: true
  },
  {
    file: 'src/components/Universal/UniversalPillarDashboard.tsx',
    line: 92,
    original: 'TODO: Add user list from API',
    resolution: 'User list loaded dynamically from role permissions',
    resolved: true
  }
];

// Redundant imports that should be cleaned up
export const REDUNDANT_IMPORTS = [
  // These will be identified during automated cleanup
];

// Unused functions that can be removed
export const UNUSED_FUNCTIONS = [
  // These will be identified during automated cleanup
];

// Cleanup report
export const generateCleanupReport = () => {
  return {
    deprecatedFiles: DEPRECATED_FILES.length,
    resolvedTodos: RESOLVED_TODOS.filter(todo => todo.resolved).length,
    pendingCleanup: RESOLVED_TODOS.filter(todo => !todo.resolved).length,
    lastCleanup: new Date().toISOString()
  };
};