import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EnhancedClientDashboard from '@/components/Dashboard/EnhancedClientDashboard';

const ClientDashboard = () => {
  return (
    <AppLayout>
      <div className="p-6">
        <EnhancedClientDashboard />
      </div>
    </AppLayout>
  );
};

export default ClientDashboard;