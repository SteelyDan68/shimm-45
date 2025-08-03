import { Routes, Route } from 'react-router-dom';
import { AdminHubLayout } from '@/components/AdminHub/AdminHubLayout';
import { UnifiedDashboard } from '@/components/AdminHub/UnifiedDashboard';
import { UserManagementTabs } from '@/components/UserAdministration/UserManagementTabs';

// Placeholder components - dessa skulle implementeras i nästa fas
function AdminAnalytics() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Unified Analytics</h1>
      <p>Här skulle en konsoliderad analytics-dashboard finnas</p>
    </div>
  );
}

function AdminAI() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Stefan AI Control Center</h1>
      <p>Här skulle Stefan AI management finnas</p>
    </div>
  );
}

function AdminSystem() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Systemadministration</h1>
      <p>Här skulle system administration finnas</p>
    </div>
  );
}

export function AdminHub() {
  return (
    <Routes>
      <Route path="/" element={<AdminHubLayout />}>
        <Route index element={<UnifiedDashboard />} />
        <Route path="users" element={<UserManagementTabs />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="ai" element={<AdminAI />} />
        <Route path="system" element={<AdminSystem />} />
      </Route>
    </Routes>
  );
}