import React from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { EnhancedCalendarView } from '@/components/Calendar/EnhancedCalendarView';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Inloggning krävs</h3>
          <p className="text-muted-foreground">
            Du måste vara inloggad för att se din utvecklingskalender
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <EnhancedCalendarView userId={user.id} />
    </div>
  );
};