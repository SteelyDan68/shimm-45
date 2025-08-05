import { useNotifications } from '@/providers/NotificationProvider';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useCallback } from 'react';

export interface NotificationService {
  sendTaskReminder: (userId: string, taskTitle: string, deadline: Date) => Promise<void>;
  sendMessageNotification: (recipientId: string, senderName: string, message: string) => Promise<void>;
  sendAssessmentComplete: (userId: string, assessmentType: string) => Promise<void>;
  sendCalendarReminder: (userId: string, eventTitle: string, eventTime: Date) => Promise<void>;
  sendSystemUpdate: (message: string, priority?: 'low' | 'medium' | 'high' | 'urgent') => Promise<void>;
  sendCustomNotification: (
    userId: string, 
    notification: {
      type: string;
      title: string;
      content: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      actionUrl?: string;
      actionLabel?: string;
    }
  ) => Promise<void>;
}

export const useNotificationService = (): NotificationService => {
  const { sendNotification } = useNotifications();
  const { user, roles } = useAuth();

  const sendTaskReminder = useCallback(async (
    userId: string, 
    taskTitle: string, 
    deadline: Date
  ) => {
    await sendNotification({
      notification_type: 'task',
      category: 'deadline',
      title: 'Uppgift deadline närmar sig',
      content: `Uppgiften "${taskTitle}" ska slutföras senast ${deadline.toLocaleDateString('sv-SE')}.`,
      priority: 'medium',
      metadata: {
        action_url: '/tasks',
        action_label: 'Visa uppgifter'
      }
    });
  }, [sendNotification]);

  const sendMessageNotification = useCallback(async (
    recipientId: string,
    senderName: string,
    message: string
  ) => {
    await sendNotification({
      notification_type: 'message',
      category: 'communication',
      title: `Nytt meddelande från ${senderName}`,
      content: message.length > 100 ? `${message.substring(0, 100)}...` : message,
      priority: 'medium',
      metadata: {
        action_url: '/messages',
        action_label: 'Läs meddelande'
      }
    });
  }, [sendNotification]);

  const sendAssessmentComplete = useCallback(async (
    userId: string,
    assessmentType: string
  ) => {
    await sendNotification({
      notification_type: 'assessment',
      category: 'results',
      title: 'Bedömning slutförd',
      content: `Din ${assessmentType.toLowerCase()}-bedömning har analyserats och resultat finns tillgängliga.`,
      priority: 'high',
      metadata: {
        action_url: `/client-assessment/${userId}`,
        action_label: 'Visa resultat'
      }
    });
  }, [sendNotification]);

  const sendCalendarReminder = useCallback(async (
    userId: string,
    eventTitle: string,
    eventTime: Date
  ) => {
    const timeString = eventTime.toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    await sendNotification({
      notification_type: 'calendar',
      category: 'reminder',
      title: 'Kommande händelse',
      content: `"${eventTitle}" är schemalagt för ${timeString}.`,
      priority: 'medium',
      metadata: {
        action_url: '/calendar',
        action_label: 'Visa kalender'
      }
    });
  }, [sendNotification]);

  const sendSystemUpdate = useCallback(async (
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) => {
    // Only send to admins and superadmins
    if (!roles.includes('admin') && !roles.includes('superadmin')) {
      return;
    }

    await sendNotification({
      notification_type: 'system',
      category: 'update',
      title: 'Systemuppdatering',
      content: message,
      priority
    });
  }, [sendNotification, roles]);

  const sendCustomNotification = useCallback(async (
    userId: string,
    notification: {
      type: string;
      title: string;
      content: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      actionUrl?: string;
      actionLabel?: string;
    }
  ) => {
    await sendNotification({
      notification_type: notification.type,
      category: 'custom',
      title: notification.title,
      content: notification.content,
      priority: notification.priority || 'medium',
      metadata: notification.actionUrl ? {
        action_url: notification.actionUrl,
        action_label: notification.actionLabel
      } : undefined
    });
  }, [sendNotification]);

  return {
    sendTaskReminder,
    sendMessageNotification,
    sendAssessmentComplete,
    sendCalendarReminder,
    sendSystemUpdate,
    sendCustomNotification
  };
};