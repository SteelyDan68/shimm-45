import { Routes, Route } from 'react-router-dom';
import { AdminHubLayout } from '@/components/AdminHub/AdminHubLayout';
import { UnifiedDashboard } from '@/components/AdminHub/UnifiedDashboard';
import { UserManagementTabs } from '@/components/UserAdministration/UserManagementTabs';

import { UnifiedAnalytics } from '@/components/AdminHub/Analytics/UnifiedAnalytics';
import { StefanControlCenter } from '@/components/AdminHub/AI/StefanControlCenter';
import { UserManagementCenter } from '@/components/AdminHub/UserManagement/UserManagementCenter';

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
        <Route path="users" element={<UserManagementCenter />} />
        <Route path="analytics" element={<UnifiedAnalytics />} />
        <Route path="ai" element={<StefanControlCenter />} />
        <Route path="system" element={<AdminSystem />} />
      </Route>
    </Routes>
  );
}