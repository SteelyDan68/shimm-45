import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from './use-toast';

export interface NotificationSettings {
  id?: string;
  user_id: string;
  email_notifications: boolean;
  browser_notifications: boolean;
  internal_notifications: boolean;
  coaching_session_reminders: boolean;
  coaching_milestone_alerts: boolean;
  assessment_deadline_reminders: boolean;
  reminder_time: string;
  deadline_reminder_hours: number;
  digest_frequency: 'never' | 'daily' | 'weekly';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  weekend_notifications: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  content: string;
  metadata: any; // Using any to match Supabase Json type
  is_read: boolean;
  email_sent: boolean;
  browser_sent: boolean;
  scheduled_for: string;
  sent_at?: string;
  read_at?: string;
  priority: string; // Using string to match database
  category: string; // Using string to match database
  created_at: string;
  updated_at: string;
}

export const useEnhancedNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's notification settings
  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data as NotificationSettings);
      } else {
        // Create default settings
        const defaultSettings = {
          user_id: user.id,
          email_notifications: true,
          browser_notifications: false,
          internal_notifications: true,
          coaching_session_reminders: true,
          coaching_milestone_alerts: true,
          assessment_deadline_reminders: true,
          reminder_time: '09:00:00',
          deadline_reminder_hours: 24,
          digest_frequency: 'daily' as const,
          weekend_notifications: false
        };

        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings as NotificationSettings);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta notifieringsinställningar",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Fetch user's notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setNotifications((data || []) as Notification[]);
      
      // Count unread notifications
      const unread = data?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta notifieringar",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Update notification settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!user || !settings) return false;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .update(newSettings)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setSettings(data as NotificationSettings);
      toast({
        title: "Inställningar uppdaterade",
        description: "Dina notifieringsinställningar har sparats"
      });
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera inställningar",
        variant: "destructive"
      });
      return false;
    }
  }, [user, settings, toast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      
      setUnreadCount(0);
      
      toast({
        title: "Alla notifieringar markerade som lästa",
        description: "Alla dina notifieringar har markerats som lästa"
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Fel",
        description: "Kunde inte markera alla notifieringar som lästa",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Send notification (for system use)
  const sendNotification = useCallback(async (
    userId: string,
    type: string,
    title: string,
    content: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    metadata: Record<string, any> = {}
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-enhanced-notification', {
        body: {
          userId,
          type,
          title,
          content,
          priority,
          metadata
        }
      });

      if (error) throw error;
      
      // Refresh notifications to include the new one
      await fetchNotifications();
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }, [fetchNotifications]);

  // Request browser permission
  const requestBrowserPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Webbläsarnotiser stöds inte",
        description: "Din webbläsare stöder inte notifieringar",
        variant: "destructive"
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await updateSettings({ browser_notifications: true });
        toast({
          title: "Webbläsarnotiser aktiverade",
          description: "Du kommer nu att få notiser i webbläsaren"
        });
        return true;
      } else {
        toast({
          title: "Notiser nekade",
          description: "Du kan aktivera notiser i webbläsarinställningarna",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting browser permission:', error);
      return false;
    }
  }, [updateSettings, toast]);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, content: string, icon?: string) => {
    if (!settings?.browser_notifications || Notification.permission !== 'granted') {
      return;
    }

    try {
      new Notification(title, {
        body: content,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico'
      });
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }, [settings]);

  // Initialize
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchSettings(),
        fetchNotifications()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [user, fetchSettings, fetchNotifications]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to notification changes
    const notificationChannel = supabase
      .channel(`notifications:${user.id}`)
      .on('broadcast', { event: 'new_notification' }, (payload) => {
        const newNotification = payload.payload.notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if enabled
        if (settings?.browser_notifications) {
          showBrowserNotification(newNotification.title, newNotification.content);
        }
        
        // Show toast for internal notifications
        if (settings?.internal_notifications) {
          toast({
            title: newNotification.title,
            description: newNotification.content,
            duration: 5000
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [user, settings, showBrowserNotification, toast]);

  return {
    notifications,
    settings,
    unreadCount,
    loading,
    fetchNotifications,
    updateSettings,
    markAsRead,
    markAllAsRead,
    sendNotification,
    requestBrowserPermission,
    showBrowserNotification
  };
};