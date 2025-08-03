import { Routes, Route } from 'react-router-dom';
import { AdminHubLayout } from '@/components/AdminHub/AdminHubLayout';
import { UnifiedDashboard } from '@/components/AdminHub/UnifiedDashboard';
import { UserManagementTabs } from '@/components/UserAdministration/UserManagementTabs';

import { UnifiedAnalytics } from '@/components/AdminHub/Analytics/UnifiedAnalytics';
import { StefanControlCenter } from '@/components/AdminHub/AI/StefanControlCenter';
import { UserManagementCenter } from '@/components/AdminHub/UserManagement/UserManagementCenter';
import { SystemAdministrationCenter } from '@/components/AdminHub/SystemAdmin/SystemAdministrationCenter';

function AdminSystem() {
  return <SystemAdministrationCenter />;
}

export function AdminHub() {
  return (
    <Routes>
      <Route path="/" element={<AdminHubLayout />}>
        <Route index element={<UnifiedDashboard />} />
      </Route>
    </Routes>
  );
}