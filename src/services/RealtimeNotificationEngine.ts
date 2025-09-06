import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  taskReminders: boolean;
  progressUpdates: boolean;
  assessmentReminders: boolean;
  coachingInsights: boolean;
  realTimeSync: boolean;
}

export interface SystemNotification {
  id: string;
  userId: string;
  type: 'task_due' | 'progress_milestone' | 'assessment_ready' | 'coaching_insight' | 'system_update';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionData?: Record<string, any>;
  readAt?: string;
  createdAt: string;
}

export class RealtimeNotificationEngine {
  private static instance: RealtimeNotificationEngine;
  private subscriptions: Map<string, any> = new Map();
  private notificationQueue: SystemNotification[] = [];
  private preferences: NotificationPreferences = {
    taskReminders: true,
    progressUpdates: true,
    assessmentReminders: true,
    coachingInsights: true,
    realTimeSync: true
  };

  public static getInstance(): RealtimeNotificationEngine {
    if (!RealtimeNotificationEngine.instance) {
      RealtimeNotificationEngine.instance = new RealtimeNotificationEngine();
    }
    return RealtimeNotificationEngine.instance;
  }

  async initializeForUser(userId: string): Promise<void> {
    try {
      // Load user preferences
      await this.loadPreferences(userId);
      
      // Set up real-time subscriptions
      await this.setupRealtimeSubscriptions(userId);
      
      // Process any queued notifications
      await this.processNotificationQueue();

    } catch (error) {
      console.error('Failed to initialize notification engine:', error);
    }
  }

  private async loadPreferences(userId: string): Promise<void> {
    try {
      const { data } = await supabase
        .from('user_attributes')
        .select('attribute_value')
        .eq('user_id', userId)
        .eq('attribute_key', 'notification_preferences')
        .maybeSingle();

      const prefs = (data?.attribute_value as any) || {};
      if (prefs && typeof prefs === 'object') {
        this.preferences = { ...this.preferences, ...(prefs as Partial<NotificationPreferences>) };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  private async setupRealtimeSubscriptions(userId: string): Promise<void> {
    // Task updates subscription
    const taskChannel = supabase
      .channel(`tasks-${userId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        (payload) => this.handleTaskUpdate(payload)
      )
      .subscribe();

    // Assessment rounds subscription  
    const assessmentChannel = supabase
      .channel(`assessments-${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'assessment_rounds', filter: `user_id=eq.${userId}` },
        (payload) => this.handleAssessmentUpdate(payload)
      )
      .subscribe();

    // Progress tracking subscription
    const progressChannel = supabase
      .channel(`progress-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'neuroplastic_progress_tracking', filter: `user_id=eq.${userId}` },
        (payload) => this.handleProgressUpdate(payload)
      )
      .subscribe();

    this.subscriptions.set('tasks', taskChannel);
    this.subscriptions.set('assessments', assessmentChannel);
    this.subscriptions.set('progress', progressChannel);
  }

  private handleTaskUpdate(payload: any): void {
    if (!this.preferences.taskReminders) return;

    const { new: newTask, old: oldTask, eventType } = payload;
    
    if (eventType === 'UPDATE' && newTask.status === 'completed' && oldTask.status !== 'completed') {
      this.queueNotification({
        id: `task-${newTask.id}-completed`,
        userId: newTask.user_id,
        type: 'progress_milestone',
        title: 'Uppgift slutförd! 🎉',
        message: `Du har slutfört "${newTask.title}". Bra jobbat!`,
        priority: 'medium',
        actionData: { taskId: newTask.id, pillar: newTask.pillar },
        createdAt: new Date().toISOString()
      });
    }

    if (eventType === 'INSERT' && newTask.ai_generated) {
      this.queueNotification({
        id: `task-${newTask.id}-created`,
        userId: newTask.user_id,
        type: 'coaching_insight',
        title: 'Ny AI-genererad uppgift',
        message: `Stefan har skapat en ny uppgift för dig: "${newTask.title}"`,
        priority: 'medium',
        actionData: { taskId: newTask.id },
        createdAt: new Date().toISOString()
      });
    }
  }

  private handleAssessmentUpdate(payload: any): void {
    if (!this.preferences.assessmentReminders) return;

    const { new: assessment } = payload;
    
    this.queueNotification({
      id: `assessment-${assessment.id}-completed`,
      userId: assessment.user_id,
      type: 'progress_milestone',
      title: 'Assessment slutförd! 📊',
      message: `Ditt ${assessment.pillar_type}-assessment är nu analyserat och redo.`,
      priority: 'high',
      actionData: { 
        assessmentId: assessment.id,
        pillarType: assessment.pillar_type 
      },
      createdAt: new Date().toISOString()
    });
  }

  private handleProgressUpdate(payload: any): void {
    if (!this.preferences.progressUpdates) return;

    const { new: progress } = payload;
    
    // Check for milestone achievements
    if (progress.milestone_reached) {
      this.queueNotification({
        id: `milestone-${progress.id}`,
        userId: progress.user_id,
        type: 'progress_milestone',
        title: 'Milstolpe uppnådd! 🏆',
        message: `Du har nått en viktig milstolpe i din ${progress.pillar_type} utveckling!`,
        priority: 'high',
        actionData: { 
          progressId: progress.id,
          pillarType: progress.pillar_type,
          milestone: progress.milestone_data
        },
        createdAt: new Date().toISOString()
      });
    }
  }

  private queueNotification(notification: SystemNotification): void {
    this.notificationQueue.push(notification);
    
    // Process immediately if queue is not busy
    if (this.notificationQueue.length === 1) {
      setTimeout(() => this.processNotificationQueue(), 100);
    }
  }

  private async processNotificationQueue(): Promise<void> {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift()!;
      await this.deliverNotification(notification);
    }
  }

  private async deliverNotification(notification: SystemNotification): Promise<void> {
    try {
      // Store in database
      await (supabase as any)
        .from('system_notifications')
        .insert({
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          action_data: notification.actionData || {},
        });

      // Show toast if user is active
      if (document.hasFocus()) {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.priority === 'critical' ? 'destructive' : 'default',
        });
      }

      // Browser notification for important items
      if (notification.priority === 'high' || notification.priority === 'critical') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      }

    } catch (error) {
      console.error('Failed to deliver notification:', error);
    }
  }

  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      
      await (supabase as any)
        .from('user_attributes')
        .upsert({
          user_id: userId,
          attribute_key: 'notification_preferences',
          attribute_value: this.preferences
        });

    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }

  async requestBrowserPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  cleanup(): void {
    // Cleanup all subscriptions
    this.subscriptions.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
    this.notificationQueue = [];
  }
}

export const realtimeNotificationEngine = RealtimeNotificationEngine.getInstance();