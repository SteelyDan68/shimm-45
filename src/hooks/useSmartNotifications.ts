import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SmartNotification } from '@/types/gamification';

export const useSmartNotifications = (clientId?: string) => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Schedule a smart notification
  const scheduleNotification = useCallback(async (
    notificationType: SmartNotification['notification_type'],
    title: string,
    message: string,
    scheduledFor: string,
    priority: SmartNotification['priority'] = 'medium',
    context: Record<string, any> = {}
  ): Promise<boolean> => {
    if (!clientId) return false;

    try {
      const notification: Omit<SmartNotification, 'id' | 'created_at' | 'sent_at'> = {
        client_id: clientId,
        notification_type: notificationType,
        title,
        message,
        priority,
        scheduled_for: scheduledFor,
        context,
        is_sent: false
      };

      // Store notification in path_entries with special type
      const { error } = await supabase
        .from('path_entries')
        .insert({
          client_id: clientId,
          type: 'action',
          title: `📬 ${title}`,
          details: message,
          status: 'planned',
          ai_generated: true,
          created_by: clientId,
          visible_to_client: true,
          timestamp: scheduledFor,
          metadata: {
            notification_type: notificationType,
            priority,
            context,
            is_notification: true,
            is_sent: false
          }
        });

      if (error) throw error;

      toast({
        title: "Notifikation schemalagd",
        description: `${title} kommer att skickas ${new Date(scheduledFor).toLocaleString('sv-SE')}`,
      });

      return true;
    } catch (error: any) {
      console.error('Error scheduling notification:', error);
      toast({
        title: "Fel",
        description: "Kunde inte schemalägga notifikation",
        variant: "destructive"
      });
      return false;
    }
  }, [clientId, toast]);

  // Send immediate notification
  const sendImmediateNotification = useCallback(async (
    title: string,
    message: string,
    type: SmartNotification['notification_type'] = 'custom_coaching',
    priority: SmartNotification['priority'] = 'medium'
  ): Promise<boolean> => {
    if (!clientId) return false;

    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('path_entries')
        .insert({
          client_id: clientId,
          type: 'recommendation',
          title: `🔔 ${title}`,
          details: message,
          status: 'completed',
          ai_generated: true,
          created_by: clientId,
          visible_to_client: true,
          timestamp: now,
          created_by_role: 'system',
          metadata: {
            notification_type: type,
            priority,
            is_notification: true,
            is_sent: true,
            sent_at: now
          }
        });

      if (error) throw error;

      // Show as toast if high priority
      if (priority === 'high') {
        toast({
          title: title,
          description: message,
        });
      }

      return true;
    } catch (error: any) {
      console.error('Error sending notification:', error);
      return false;
    }
  }, [clientId, toast]);

  // Get pending notifications
  const getPendingNotifications = useCallback(async (): Promise<SmartNotification[]> => {
    if (!clientId) return [];

    try {
      const { data, error } = await supabase
        .from('path_entries')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'action')
        .eq('status', 'planned')
        .contains('metadata', { is_notification: true, is_sent: false })
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const notifications = (data || []).map(entry => {
        const metadata = entry.metadata as any;
        return {
          id: entry.id,
          client_id: entry.client_id,
          notification_type: metadata?.notification_type,
          title: entry.title.replace('📬 ', ''),
          message: entry.details || '',
          priority: metadata?.priority || 'medium',
          scheduled_for: entry.timestamp,
          context: metadata?.context || {},
          is_sent: false,
          created_at: entry.created_at
        } as SmartNotification;
      });

      setNotifications(notifications);
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }, [clientId]);

  // Mark notification as sent
  const markAsSent = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('path_entries')
        .update({
          status: 'completed',
          metadata: {
            is_sent: true,
            sent_at: now
          }
        })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as sent:', error);
      return false;
    }
  }, []);

  // Auto-schedule streak warning
  const scheduleStreakWarning = useCallback(async (): Promise<boolean> => {
    if (!clientId) return false;

    // Schedule for tomorrow if no activity today
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10 AM

    return await scheduleNotification(
      'streak_warning',
      'Håll din streak vid liv! 🔥',
      'Du har byggt upp en fantastisk utvecklingsstreak. Gör en snabb check-in för att behålla din momentum!',
      tomorrow.toISOString(),
      'high',
      { streak_reminder: true }
    );
  }, [clientId, scheduleNotification]);

  // Auto-schedule weekly summary
  const scheduleWeeklySummary = useCallback(async (): Promise<boolean> => {
    if (!clientId) return false;

    // Schedule for next Sunday
    const nextSunday = new Date();
    const daysUntilSunday = 7 - nextSunday.getDay();
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(19, 0, 0, 0); // 7 PM

    return await scheduleNotification(
      'custom_coaching',
      'Veckosammanfattning från Stefan',
      'Din vecka i utveckling - framsteg, insikter och nästa steg framåt.',
      nextSunday.toISOString(),
      'medium',
      { weekly_summary: true }
    );
  }, [clientId, scheduleNotification]);

  return {
    notifications,
    unreadCount,
    isLoading,
    scheduleNotification,
    sendImmediateNotification,
    getPendingNotifications,
    markAsSent,
    scheduleStreakWarning,
    scheduleWeeklySummary
  };
};