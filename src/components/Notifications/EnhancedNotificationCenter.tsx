import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  Settings, 
  Mail, 
  Monitor, 
  Clock, 
  Moon,
  CheckCircle,
  AlertCircle,
  Info,
  MessageSquare,
  Calendar,
  Target,
  FileText,
  TrendingUp,
  Check,
  X
} from 'lucide-react';
import { useEnhancedNotifications, type NotificationSettings, type Notification } from '@/hooks/useEnhancedNotifications';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface EnhancedNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnhancedNotificationCenter = ({ isOpen, onClose }: EnhancedNotificationCenterProps) => {
  const [activeTab, setActiveTab] = useState('notifications');
  const { 
    notifications, 
    settings, 
    unreadCount, 
    updateSettings, 
    markAsRead, 
    markAllAsRead,
    requestBrowserPermission 
  } = useEnhancedNotifications();
  const { toast } = useToast();

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === 'urgent' ? 'text-red-500' : 
                     priority === 'high' ? 'text-orange-500' : 
                     priority === 'low' ? 'text-gray-400' : 
                     'text-blue-500';

    switch (type) {
      case 'message_received':
        return <MessageSquare className={`h-4 w-4 ${iconClass}`} />;
      case 'coaching_session_reminder':
        return <Target className={`h-4 w-4 ${iconClass}`} />;
      case 'assessment_deadline':
        return <FileText className={`h-4 w-4 ${iconClass}`} />;
      case 'system_announcement':
        return <TrendingUp className={`h-4 w-4 ${iconClass}`} />;
      default:
        return <Bell className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'message_received': return 'Meddelande';
      case 'coaching_session_reminder': return 'Coaching';
      case 'assessment_deadline': return 'Bedömning';
      case 'system_announcement': return 'System';
      default: return 'Notifiering';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const handleSettingChange = async (key: keyof NotificationSettings, value: any) => {
    if (!settings) return;

    // Special handling for browser notifications
    if (key === 'browser_notifications' && value) {
      const granted = await requestBrowserPermission();
      if (!granted) return;
    }

    await updateSettings({ [key]: value });
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'notifications') return true;
    if (activeTab === 'unread') return !n.is_read;
    return n.category === activeTab;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifieringscenter
            {unreadCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {unreadCount} nya
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alla ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Olästa ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Inställningar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Alla notifieringar</h3>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Markera alla som lästa
                </Button>
              )}
            </div>
            
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Inga notifieringar att visa</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.is_read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                      }`}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getNotificationIcon(notification.notification_type, notification.priority)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                                {getNotificationTypeText(notification.notification_type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { 
                                  addSuffix: true, 
                                  locale: sv 
                                })}
                              </span>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                            
                            <h4 className="font-medium mb-1">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.content}
                            </p>
                            
                            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                {Object.entries(notification.metadata).map(([key, value]) => (
                                  <span key={key} className="mr-3">
                                    {key}: {String(value)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {!notification.is_read && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Olästa notifieringar</h3>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Markera alla som lästa
                </Button>
              )}
            </div>
            
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Inga olästa notifieringar</p>
                    <p className="text-sm">Bra jobbat! Du är uppdaterad.</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className="cursor-pointer transition-colors hover:bg-muted/50 border-l-4 border-l-primary bg-primary/5"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getNotificationIcon(notification.notification_type, notification.priority)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                                {getNotificationTypeText(notification.notification_type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { 
                                  addSuffix: true, 
                                  locale: sv 
                                })}
                              </span>
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            </div>
                            
                            <h4 className="font-medium mb-1">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="flex-1">
            <ScrollArea className="h-full">
              <div className="space-y-6">
                {settings && (
                  <>
                    {/* Delivery Methods */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bell className="h-5 w-5" />
                          Leveransmetoder
                        </CardTitle>
                        <CardDescription>
                          Välj hur du vill få dina notifieringar
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="font-medium">E-postnotiser</span>
                          </div>
                          <Switch
                            checked={settings.email_notifications}
                            onCheckedChange={(checked) => 
                              handleSettingChange('email_notifications', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span className="font-medium">Webbläsarnotiser</span>
                          </div>
                          <Switch
                            checked={settings.browser_notifications}
                            onCheckedChange={(checked) => 
                              handleSettingChange('browser_notifications', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <span className="font-medium">Interna notiser</span>
                          </div>
                          <Switch
                            checked={settings.internal_notifications}
                            onCheckedChange={(checked) => 
                              handleSettingChange('internal_notifications', checked)
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notification Types */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Typer av notifieringar
                        </CardTitle>
                        <CardDescription>
                          Anpassa vilka typer av notifieringar du vill få
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span className="font-medium">Coaching-sessioner</span>
                          </div>
                          <Switch
                            checked={settings.coaching_session_reminders}
                            onCheckedChange={(checked) => 
                              handleSettingChange('coaching_session_reminders', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <span className="font-medium">Milstolpar</span>
                          </div>
                          <Switch
                            checked={settings.coaching_milestone_alerts}
                            onCheckedChange={(checked) => 
                              handleSettingChange('coaching_milestone_alerts', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">Bedömningsdeadlines</span>
                          </div>
                          <Switch
                            checked={settings.assessment_deadline_reminders}
                            onCheckedChange={(checked) => 
                              handleSettingChange('assessment_deadline_reminders', checked)
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Timing Preferences */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Tidsinställningar
                        </CardTitle>
                        <CardDescription>
                          Anpassa när du vill få notifieringar
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Påminnelsetid</Label>
                          <input
                            type="time"
                            value={settings.reminder_time}
                            onChange={(e) => handleSettingChange('reminder_time', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Deadline-påminnelse</Label>
                          <Select 
                            value={settings.deadline_reminder_hours.toString()} 
                            onValueChange={(value) => 
                              handleSettingChange('deadline_reminder_hours', parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 timme före</SelectItem>
                              <SelectItem value="6">6 timmar före</SelectItem>
                              <SelectItem value="12">12 timmar före</SelectItem>
                              <SelectItem value="24">1 dag före</SelectItem>
                              <SelectItem value="48">2 dagar före</SelectItem>
                              <SelectItem value="72">3 dagar före</SelectItem>
                              <SelectItem value="168">1 vecka före</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Sammanfattningsfrekvens</Label>
                          <Select 
                            value={settings.digest_frequency} 
                            onValueChange={(value: 'never' | 'daily' | 'weekly') => 
                              handleSettingChange('digest_frequency', value)
                            }
                          >
                            <SelectTrigger>
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
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            <span className="font-medium">Helgnotiser</span>
                          </div>
                          <Switch
                            checked={settings.weekend_notifications}
                            onCheckedChange={(checked) => 
                              handleSettingChange('weekend_notifications', checked)
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};