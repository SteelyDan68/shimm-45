import React from 'react';
import { CoachMessagingSettings } from '@/components/Admin/CoachMessagingSettings';

/**
 * 🎯 COACH MESSAGING ADMIN PAGE
 * Admin-sida för att hantera human coach messaging
 */

const CoachMessagingAdmin: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <CoachMessagingSettings />
    </div>
  );
};

export default CoachMessagingAdmin;