/**
 * 🔄 REAL-TIME NOTIFICATION SYSTEM
 * Live notifikationer med Supabase Realtime för enterprise-grade UX
 * Phase 4: Real-time Experience Revolution
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X, BellRing } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface RealtimeNotification {
  id: string;
  type: 'coaching_insight' | 'task_reminder' | 'system_update' | 'achievement' | 'message';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface RealtimeNotificationSystemProps {
  maxVisibleNotifications?: number;
  autoHideDelay?: number;
  enableSound?: boolean;
  className?: string;
}

export const RealtimeNotificationSystem: React.FC<RealtimeNotificationSystemProps> = ({
  maxVisibleNotifications = 5,
  autoHideDelay = 8000,
  enableSound = true,
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔄 REAL-TIME SUBSCRIPTION
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to coaching recommendations
    const coachingChannel = supabase
      .channel('coaching-recommendations')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_coaching_recommendations',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification: RealtimeNotification = {
            id: `coaching-${payload.new.id}`,
            type: 'coaching_insight',
            title: 'Ny Coaching Insight',
            message: `Stefan AI har en ny rekommendation: ${payload.new.title}`,
            priority: payload.new.priority as 'low' | 'medium' | 'high' | 'urgent',
            timestamp: new Date(),
            read: false,
            actionUrl: '/stefan/coaching',
            actionLabel: 'Se insight',
            metadata: { recommendationId: payload.new.id }
          };
          
          addNotification(newNotification);
        }
      )
      .subscribe();

    // Subscribe to task updates
    const tasksChannel = supabase
      .channel('task-updates')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calendar_actionables',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification: RealtimeNotification = {
            id: `task-${payload.new.id}`,
            type: 'task_reminder',
            title: 'Ny Uppgift Skapad',
            message: `En ny uppgift har lagts till: ${payload.new.title}`,
            priority: 'medium',
            timestamp: new Date(),
            read: false,
            actionUrl: '/tasks',
            actionLabel: 'Se uppgifter',
            metadata: { taskId: payload.new.id }
          };
          
          addNotification(newNotification);
        }
      )
      .subscribe();

    // Subscribe to pillar completions
    const pillarsChannel = supabase
      .channel('pillar-completions')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assessment_rounds',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification: RealtimeNotification = {
            id: `achievement-${payload.new.id}`,
            type: 'achievement',
            title: '🎉 Pillar Genomförd!',
            message: `Grattis! Du har genomfört utvecklingsområdet: ${payload.new.pillar_type}`,
            priority: 'high',
            timestamp: new Date(),
            read: false,
            actionUrl: '/six-pillars',
            actionLabel: 'Se framsteg',
            metadata: { pillarType: payload.new.pillar_type }
          };
          
          addNotification(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(coachingChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(pillarsChannel);
    };
  }, [user?.id]);

  const addNotification = useCallback((notification: RealtimeNotification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 50); // Keep max 50 notifications
      return updated;
    });
    
    setUnreadCount(prev => prev + 1);
    
    // Show toast for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === 'urgent' ? 'destructive' : 'default'
      });
    }
    
    // Play notification sound
    if (enableSound && notification.priority !== 'low') {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if audio fails
      } catch (error) {
        // Ignore audio errors
      }
    }
    
    // Auto-hide low priority notifications
    if (notification.priority === 'low') {
      setTimeout(() => {
        markAsRead(notification.id);
      }, autoHideDelay);
    }
  }, [toast, enableSound, autoHideDelay]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'coaching_insight': return CheckCircle;
      case 'task_reminder': return Bell;
      case 'achievement': return CheckCircle;
      case 'system_update': return Info;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const visibleNotifications = notifications
    .filter(n => !n.read)
    .slice(0, maxVisibleNotifications);

  const allNotifications = notifications.slice(0, 20);

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-orange-500 animate-pulse" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Floating Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {visibleNotifications.map((notification) => {
          const IconComponent = getNotificationIcon(notification.type);
          
          return (
            <Alert 
              key={notification.id}
              className={cn(
                'border-l-4 animate-in slide-in-from-right duration-300',
                getPriorityColor(notification.priority)
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <IconComponent className="h-5 w-5 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    <AlertDescription className="text-xs">
                      {notification.message}
                    </AlertDescription>
                    {notification.actionUrl && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={() => {
                          window.location.href = notification.actionUrl!;
                          markAsRead(notification.id);
                        }}
                      >
                        {notification.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => removeNotification(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Alert>
          );
        })}
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-40">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Notifikationer</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Markera alla som lästa
                </Button>
              )}
            </div>
          </div>
          
          <div className="divide-y">
            {allNotifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Inga notifikationer</p>
              </div>
            ) : (
              allNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-3 hover:bg-gray-50 cursor-pointer',
                      !notification.read && 'bg-blue-50 border-l-2 border-l-blue-500'
                    )}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-4 w-4 mt-1 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {notification.timestamp.toLocaleString('sv-SE')}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      
      {/* Overlay to close panel */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};