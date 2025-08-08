/**
 * 🔔 UNIFIED NOTIFICATION SYSTEM
 * 
 * Centralized system som kombinerar:
 * - Message notifications från messaging systemet
 * - System notifications från notification provider
 * - Visual indicators för unread messages/notifications
 * 
 * WORLD-CLASS INTEGRATION för SHMMS
 */

import React from 'react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { MessageIcon } from '@/components/Messaging/MessageIcon';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { useNotifications } from '@/providers/NotificationProvider';

interface UnifiedNotificationSystemProps {
  className?: string;
}

export const UnifiedNotificationSystem: React.FC<UnifiedNotificationSystemProps> = ({
  className = ""
}) => {
  const { totalUnreadCount: unreadMessages } = useMessagingV2();
  const { unreadCount: systemNotifications } = useNotifications();

  // Total combined notifications
  const totalNotifications = unreadMessages + systemNotifications;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Message Icon med unread count */}
      <MessageIcon />
      
      {/* System Notification Bell med unread count */}
      <NotificationBell />
      
      {/* Global notification indicator om det finns något */}
      {totalNotifications > 0 && (
        <div className="relative">
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};