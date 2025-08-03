import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  userId: string;
  category: 'onboarding' | 'assessment' | 'task' | 'achievement' | 'system';
  metadata?: Record<string, any>;
}

interface NotificationSettings {
  browserNotifications: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
  categories: {
    onboarding: boolean;
    assessment: boolean;
    task: boolean;
    achievement: boolean;
    system: boolean;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    browserNotifications: true,
    emailNotifications: true,
    soundEnabled: true,
    categories: {
      onboarding: true,
      assessment: true,
      task: true,
      achievement: true,
      system: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load notifications from database
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would be a proper table
      // For now, we'll simulate with localStorage
      const stored = localStorage.getItem(`notifications_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      const stored = localStorage.getItem(`notificationSettings_${user.id}`);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }, [user]);

  // Save notifications to storage
  const saveNotifications = (notifications: Notification[]) => {
    if (!user) return;
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
  };

  // Save settings
  const saveSettings = (newSettings: NotificationSettings) => {
    if (!user) return;
    
    setSettings(newSettings);
    localStorage.setItem(`notificationSettings_${user.id}`, JSON.stringify(newSettings));
  };

  // Add a new notification
  const addNotification = useCallback((
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    category: Notification['category'] = 'system',
    metadata?: Record<string, any>
  ) => {
    if (!user || !settings.categories[category]) return;

    const notification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
      userId: user.id,
      category,
      metadata
    };

    setNotifications(prev => {
      const updated = [notification, ...prev];
      saveNotifications(updated);
      return updated;
    });

    // Show browser notification if enabled
    if (settings.browserNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, {
              body: message,
              icon: '/favicon.ico',
              tag: notification.id
            });
          }
        });
      }
    }

    // Play sound if enabled
    if (settings.soundEnabled) {
      playNotificationSound();
    }

    return notification.id;
  }, [user, settings]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      saveNotifications(updated);
      return updated;
    });
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notification => notification.id !== notificationId);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    if (user) {
      localStorage.removeItem(`notifications_${user.id}`);
    }
  }, [user]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get notifications by category
  const getNotificationsByCategory = (category: Notification['category']) => {
    return notifications.filter(n => n.category === category);
  };

  // Predefined notification helpers
  const notifyOnboardingComplete = () => {
    addNotification(
      'Onboarding slutfört! 🎉',
      'Välkommen till din utvecklingsresa. Din profil är nu skapad och Stefan kommer att guida dig.',
      'success',
      'onboarding'
    );
  };

  const notifyNewAssessment = (assessmentName: string) => {
    addNotification(
      'Ny bedömning tillgänglig',
      `${assessmentName} är redo att genomföras. Detta hjälper oss att förbättra din utvecklingsplan.`,
      'info',
      'assessment'
    );
  };

  const notifyTaskComplete = (taskName: string) => {
    addNotification(
      'Uppgift slutförd! ✅',
      `Bra jobbat! Du har slutfört "${taskName}". Stefan analyserar dina framsteg.`,
      'success',
      'task'
    );
  };

  const notifyAchievement = (achievementName: string) => {
    addNotification(
      'Ny prestation upplåst! 🏆',
      `Grattis! Du har uppnått "${achievementName}". Fortsätt så här!`,
      'success',
      'achievement'
    );
  };

  const notifySystemUpdate = (message: string) => {
    addNotification(
      'Systemuppdatering',
      message,
      'info',
      'system'
    );
  };

  // Initialize
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadSettings();
    }
  }, [user, loadNotifications, loadSettings]);

  return {
    notifications,
    settings,
    isLoading,
    unreadCount,
    
    // Actions
    addNotification,
    markAsRead,
    removeNotification,
    markAllAsRead,
    clearAll,
    saveSettings,
    getNotificationsByCategory,
    
    // Predefined helpers
    notifyOnboardingComplete,
    notifyNewAssessment,
    notifyTaskComplete,
    notifyAchievement,
    notifySystemUpdate
  };
};