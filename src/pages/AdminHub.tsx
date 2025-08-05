import { Routes, Route } from 'react-router-dom';
import { AdminHubLayout } from '@/components/AdminHub/AdminHubLayout';
import { RealUnifiedDashboard } from '@/components/AdminHub/RealUnifiedDashboard';
import { UserManagementTabs } from '@/components/UserAdministration/UserManagementTabs';

import { UnifiedAnalytics } from '@/components/AdminHub/Analytics/UnifiedAnalytics';
import { UnifiedStefanAdminCenter } from '@/components/AdminHub/AI/UnifiedStefanAdminCenter';
import { UserManagementCenter } from '@/components/AdminHub/UserManagement/UserManagementCenter';
import { AttributeSystemMigration } from '@/components/Migration/AttributeSystemMigration';
import { AttributeSystemTest } from '@/components/Testing/AttributeSystemTest';
import { MigrationProgress } from '@/components/Migration/MigrationProgress';
function AdminSystem() {
  return <div className="p-6">System administration kommer snart</div>;
}

export function AdminHub() {
  return (
    <Routes>
      <Route path="/" element={<AdminHubLayout />}>
        <Route index element={<RealUnifiedDashboard />} />
        <Route path="users" element={<UserManagementCenter />} />
        <Route path="analytics" element={<UnifiedAnalytics />} />
        <Route path="ai" element={<UnifiedStefanAdminCenter />} />
        <Route path="migration" element={
          <div className="space-y-6">
            <MigrationProgress />
            <AttributeSystemMigration />
          </div>
        } />
        <Route path="testing" element={<AttributeSystemTest />} />
        <Route path="system" element={<AdminSystem />} />
      </Route>
    </Routes>
  );
}