import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  notification_type: string;
  category: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  priority: string;
  is_read: boolean;
  read_at?: string;
  scheduled_for?: string;
  sent_at?: string;
  browser_sent: boolean;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  desktop_notifications: boolean;
  sound_enabled: boolean;
  muted_conversations?: string[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  sendNotification: (notification: {
    notification_type: string;
    category?: string;
    title: string;
    content: string;
    metadata?: Record<string, any>;
    priority?: string;
    scheduled_for?: string;
  }) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Load notifications and preferences
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationsError) throw notificationsError;

      const { data: preferencesData, error: preferencesError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        throw preferencesError;
      }

      setNotifications((notificationsData || []) as Notification[]);
      setPreferences((preferencesData || createDefaultPreferences(user.id)) as NotificationPreferences);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda notifikationer",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Create default preferences
  const createDefaultPreferences = (userId: string): NotificationPreferences => ({
    user_id: userId,
    email_notifications: true,
    push_notifications: true,
    desktop_notifications: true,
    sound_enabled: true,
    muted_conversations: [],
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show toast for high priority notifications
            if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
              toast({
                title: newNotification.title,
                description: newNotification.content,
                variant: newNotification.priority === 'urgent' ? "destructive" : "default"
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Load notifications on mount and user change
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Fel",
        description: "Kunde inte markera som läst",
        variant: "destructive"
      });
    }
  }, [toast]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );

      toast({
        title: "Markerat",
        description: "Alla notifikationer markerade som lästa"
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Fel",
        description: "Kunde inte markera alla som lästa",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort notifikation",
        variant: "destructive"
      });
    }
  }, [toast]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;

    try {
      const updatedPreferences = { ...preferences, ...updates };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(updatedPreferences);

      if (error) throw error;

      setPreferences(updatedPreferences);
      toast({
        title: "Sparat",
        description: "Notifikationsinställningar uppdaterade"
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera inställningar",
        variant: "destructive"
      });
    }
  }, [user, preferences, toast]);

  const sendNotification = useCallback(async (
    notification: {
      notification_type: string;
      category?: string;
      title: string;
      content: string;
      metadata?: Record<string, any>;
      priority?: string;
      scheduled_for?: string;
    }
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.id,
          category: notification.category || 'general',
          priority: notification.priority || 'medium',
          is_read: false,
          browser_sent: false,
          email_sent: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka notifikation",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    sendNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};