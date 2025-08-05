import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  BellOff, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Info,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSettings {
  browserNotifications: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
  onboardingReminders: boolean;
  assessmentReminders: boolean;
  taskReminders: boolean;
  achievementNotifications: boolean;
}

export const NotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    browserNotifications: true,
    emailNotifications: true,
    soundEnabled: true,
    onboardingReminders: true,
    assessmentReminders: true,
    taskReminders: true,
    achievementNotifications: true
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Request browser notification permission
    if ('Notification' in window && settings.browserNotifications) {
      Notification.requestPermission();
    }

    // Load existing notifications and settings
    loadNotifications();
    loadSettings();
  }, [user]);

  const loadNotifications = () => {
    // In a real app, this would load from Supabase
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Välkommen!',
        message: 'Din utvecklingsresa har börjat. Kom ihåg att slutföra din första bedömning.',
        type: 'info',
        timestamp: new Date(),
        read: false,
        action: {
          label: 'Gör bedömning',
          onClick: () => { /* Navigate to assessment */ }
        }
      },
      {
        id: '2',
        title: 'Ny uppgift tillgänglig',
        message: 'Stefan har skapat en ny personlig utvecklingsuppgift för dig.',
        type: 'success',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      }
    ];
    
    setNotifications(mockNotifications);
  };

  const loadSettings = () => {
    // Load from localStorage or Supabase
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    
    toast({
      title: "Inställningar sparade",
      description: "Dina notifikationsinställningar har uppdaterats.",
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const showBrowserNotification = (notification: Notification) => {
    if (!settings.browserNotifications || !('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  const playNotificationSound = () => {
    if (!settings.soundEnabled) return;
    
    // Create a subtle notification sound
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
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    if (settings.browserNotifications) {
      showBrowserNotification(newNotification);
    }
    
    if (settings.soundEnabled) {
      playNotificationSound();
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (showSettings) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Notifikationsinställningar</CardTitle>
            <CardDescription>Anpassa hur du får meddelanden</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSettings(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="browser" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Webbläsarnotifikationer
              </Label>
              <Switch
                id="browser"
                checked={settings.browserNotifications}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, browserNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                E-postnotifikationer
              </Label>
              <Switch
                id="email"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sound" className="flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Ljud
              </Label>
              <Switch
                id="sound"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, soundEnabled: checked })
                }
              />
            </div>
          </div>

          <hr />

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Notifikationstyper</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="onboarding" className="text-sm">Onboarding-påminnelser</Label>
              <Switch
                id="onboarding"
                checked={settings.onboardingReminders}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, onboardingReminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="assessment" className="text-sm">Bedömningspåminnelser</Label>
              <Switch
                id="assessment"
                checked={settings.assessmentReminders}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, assessmentReminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="tasks" className="text-sm">Uppgiftspåminnelser</Label>
              <Switch
                id="tasks"
                checked={settings.taskReminders}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, taskReminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="achievements" className="text-sm">Prestationsnotifikationer</Label>
              <Switch
                id="achievements"
                checked={settings.achievementNotifications}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, achievementNotifications: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <CardTitle className="text-lg">Notifikationer</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Inga notifikationer</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border transition-colors ${
                notification.read 
                  ? 'bg-muted/50 border-muted' 
                  : 'bg-background border-border shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium ${notification.read ? 'opacity-70' : ''}`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm text-muted-foreground mt-1 ${notification.read ? 'opacity-70' : ''}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp.toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissNotification(notification.id)}
                  className="opacity-50 hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              
              {notification.action && !notification.read && (
                <div className="mt-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      notification.action?.onClick();
                      markAsRead(notification.id);
                    }}
                    className="w-full"
                  >
                    {notification.action.label}
                  </Button>
                </div>
              )}
              
              {!notification.read && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsRead(notification.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Markera som läst
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};