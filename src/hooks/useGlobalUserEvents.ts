/**
 * 🔄 GLOBAL USER EVENT SYSTEM
 * 
 * Centraliserat event-system för att säkerställa att ALLA komponenter
 * uppdateras när användardata ändras (GDPR-radering, skapa/redigera etc.)
 */

import { useEffect, useCallback } from 'react';

export type UserEventType = 
  | 'userDataChanged'
  | 'gdprActionCompleted'
  | 'userCreated'
  | 'userUpdated'
  | 'userDeleted'
  | 'roleChanged';

export interface UserEventDetail {
  type: UserEventType;
  userId?: string;
  email?: string;
  action?: string;
  timestamp: number;
}

/**
 * Trigger a global user event that all components can listen to
 */
export const triggerUserEvent = (type: UserEventType, detail?: Partial<UserEventDetail>) => {
  const event = new CustomEvent(type, {
    detail: {
      type,
      timestamp: Date.now(),
      ...detail
    }
  });
  
  console.log(`🔄 Triggering global event: ${type}`, detail);
  window.dispatchEvent(event);
  
  // Also trigger the general userDataChanged event
  if (type !== 'userDataChanged') {
    window.dispatchEvent(new CustomEvent('userDataChanged', { detail }));
  }
};

/**
 * Hook to listen for global user events and trigger callbacks
 */
export const useGlobalUserEvents = (
  callback: (eventType: UserEventType, detail?: UserEventDetail) => void,
  events: UserEventType[] = ['userDataChanged']
) => {
  const handleEvent = useCallback((event: CustomEvent<UserEventDetail>) => {
    callback(event.type as UserEventType, event.detail);
  }, [callback]);

  useEffect(() => {
    events.forEach(eventType => {
      window.addEventListener(eventType, handleEvent as EventListener);
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleEvent as EventListener);
      });
    };
  }, [events, handleEvent]);
};

/**
 * Utility to force refresh all user-related data across the application
 */
export const forceGlobalUserRefresh = () => {
  triggerUserEvent('userDataChanged', { action: 'force_refresh' });
};