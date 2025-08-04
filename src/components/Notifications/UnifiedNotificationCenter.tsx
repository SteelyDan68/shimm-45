import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  BellOff, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Info,
  X,
  Volume2,
  VolumeX,
  Mail,
  Monitor,
  Smartphone,
  Clock,
  Calendar,
  Star,
  Shield
} from 'lucide-react';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface UnifiedNotificationCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const UnifiedNotificationCenter: React.FC<UnifiedNotificationCenterProps> = ({
  isOpen = true,
  onClose
}) => {
  const { hasRole } = useAuth();
  const {
    notifications,
    settings,
    unreadCount,
    loading,
    updateSettings,
    markAsRead,
    markAllAsRead,
    requestBrowserPermission
  } = useEnhancedNotifications();

  const [activeTab, setActiveTab] = useState('all');

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'urgent') return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (priority === 'high') return <AlertCircle className="w-5 h-5 text-orange-500" />;
    
    switch (type) {
      case 'assessment': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'coaching': return <Star className="w-5 h-5 text-blue-500" />;
      case 'task': return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'system': return <Shield className="w-5 h-5 text-gray-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'assessment': return 'Bedömning';
      case 'coaching': return 'Coaching';
      case 'task': return 'Uppgift';
      case 'system': return 'System';
      case 'milestone': return 'Milstolpe';
      case 'deadline': return 'Deadline';
      default: return 'Meddelande';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    if (!settings) return;

    // Special handling for browser notifications
    if (key === 'browser_notifications' && value === true) {
      const granted = await requestBrowserPermission();
      if (!granted) return;
    }

    await updateSettings({ [key]: value });
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread': return !notification.is_read;
      case 'coaching': return notification.notification_type.includes('coaching');
      case 'assessments': return notification.notification_type.includes('assessment');
      case 'tasks': return notification.notification_type.includes('task');
      default: return true;
    }
  });

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">Laddar notifieringar...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-xl">Notifieringscenter</CardTitle>
              <p className="text-sm text-muted-foreground">
                Hantera dina meddelanden och inställningar
              </p>
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {unreadCount}
              </Badge>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pb-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Alla</TabsTrigger>
              <TabsTrigger value="unread">
                Olästa
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="coaching">Coaching</TabsTrigger>
              <TabsTrigger value="settings">Inställningar</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="px-6 pb-4">
              {unreadCount > 0 && (
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} olästa notifieringar
                  </p>
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    Markera alla som lästa
                  </Button>
                </div>
              )}
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <BellOff className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Inga notifieringar</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        notification.is_read 
                          ? 'bg-muted/30 border-muted opacity-75' 
                          : 'bg-background border-border shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(notification.notification_type, notification.priority)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`text-sm font-medium ${notification.is_read ? 'opacity-70' : ''}`}>
                                {notification.title}
                              </h4>
                              <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                                {getNotificationTypeText(notification.notification_type)}
                              </Badge>
                              {notification.priority === 'urgent' && (
                                <Badge variant="destructive" className="text-xs animate-pulse">
                                  Brådskande
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm text-muted-foreground leading-relaxed ${notification.is_read ? 'opacity-70' : ''}`}>
                              {notification.content}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { 
                                  addSuffix: true, 
                                  locale: sv 
                                })}
                              </p>
                              {notification.email_sent && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="w-3 h-3 mr-1" />
                                  E-post skickad
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="opacity-70 hover:opacity-100"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <div className="px-6 pb-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="text-muted-foreground">Alla notifieringar är lästa!</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 rounded-lg border bg-background border-border shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(notification.notification_type, notification.priority)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium">{notification.title}</h4>
                              <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                                {getNotificationTypeText(notification.notification_type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {notification.content}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="coaching" className="mt-0">
            <div className="px-6 pb-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Inga coaching-notifieringar</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        notification.is_read 
                          ? 'bg-muted/30 border-muted opacity-75' 
                          : 'bg-background border-border shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <Star className="w-5 h-5 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium mb-1 ${notification.is_read ? 'opacity-70' : ''}`}>
                              {notification.title}
                            </h4>
                            <p className={`text-sm text-muted-foreground ${notification.is_read ? 'opacity-70' : ''}`}>
                              {notification.content}
                            </p>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="px-6 pb-6">
              <div className="space-y-6">
                {/* Leveransmetoder */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Leveransmetoder</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-500" />
                        <div>
                          <Label>E-postnotifieringar</Label>
                          <p className="text-sm text-muted-foreground">
                            Få notifieringar via e-post
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.email_notifications || false}
                        onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-green-500" />
                        <div>
                          <Label>Webbläsarnotiser</Label>
                          <p className="text-sm text-muted-foreground">
                            Popup-notiser i webbläsaren
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.browser_notifications || false}
                        onCheckedChange={(checked) => handleSettingChange('browser_notifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-purple-500" />
                        <div>
                          <Label>Interna notifieringar</Label>
                          <p className="text-sm text-muted-foreground">
                            Notifieringar i systemet
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.internal_notifications || false}
                        onCheckedChange={(checked) => handleSettingChange('internal_notifications', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Notifieringstyper */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Notifieringstyper</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Coaching-sessioner</Label>
                      <Switch
                        checked={settings?.coaching_session_reminders || false}
                        onCheckedChange={(checked) => handleSettingChange('coaching_session_reminders', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Milstolpar</Label>
                      <Switch
                        checked={settings?.coaching_milestone_alerts || false}
                        onCheckedChange={(checked) => handleSettingChange('coaching_milestone_alerts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Deadlines</Label>
                      <Switch
                        checked={settings?.assessment_deadline_reminders || false}
                        onCheckedChange={(checked) => handleSettingChange('assessment_deadline_reminders', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Timing */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Timing</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Påminnelsetid</Label>
                      <Select
                        value={settings?.reminder_time || '09:00:00'}
                        onValueChange={(value) => handleSettingChange('reminder_time', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="07:00:00">07:00</SelectItem>
                          <SelectItem value="08:00:00">08:00</SelectItem>
                          <SelectItem value="09:00:00">09:00</SelectItem>
                          <SelectItem value="10:00:00">10:00</SelectItem>
                          <SelectItem value="11:00:00">11:00</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Deadline-påminnelse</Label>
                      <Select
                        value={settings?.deadline_reminder_hours?.toString() || '24'}
                        onValueChange={(value) => handleSettingChange('deadline_reminder_hours', parseInt(value))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 timme</SelectItem>
                          <SelectItem value="6">6 timmar</SelectItem>
                          <SelectItem value="24">24 timmar</SelectItem>
                          <SelectItem value="48">48 timmar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Sammandrag</Label>
                      <Select
                        value={settings?.digest_frequency || 'daily'}
                        onValueChange={(value) => handleSettingChange('digest_frequency', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Aldrig</SelectItem>
                          <SelectItem value="daily">Dagligen</SelectItem>
                          <SelectItem value="weekly">Veckovis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Helgnotifieringar</Label>
                      <Switch
                        checked={settings?.weekend_notifications || false}
                        onCheckedChange={(checked) => handleSettingChange('weekend_notifications', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};