import React, { useState } from 'react';
import { useNotifications } from '@/providers/NotificationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  X, 
  ExternalLink,
  AlertTriangle,
  Info,
  MessageSquare,
  Calendar,
  CheckSquare,
  ClipboardList,
  Settings
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigation } from '@/hooks/useNavigation';

const NOTIFICATION_ICONS = {
  message: MessageSquare,
  task: CheckSquare,
  assessment: ClipboardList,
  calendar: Calendar,
  system: Settings,
  reminder: Bell
};

const PRIORITY_COLORS = {
  low: 'bg-muted',
  medium: 'bg-blue-100 border-blue-200',
  high: 'bg-orange-100 border-orange-200',
  urgent: 'bg-red-100 border-red-200'
};

interface NotificationCenterProps {
  onClose?: () => void;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onClose,
  className = ""
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading
  } = useNotifications();
  
  const { navigateTo } = useNavigation();
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all');

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.is_read;
      case 'actionable':
        return notification.metadata?.action_url; // Check if has action URL in metadata
      default:
        return true;
    }
  });

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.metadata?.action_url) {
      navigateTo(notification.metadata.action_url);
      onClose?.();
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
            <span className="text-mobile-sm">Laddar notifikationer...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-mobile-lg flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Notifikationer
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-mobile-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Markera alla
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Filter buttons */}
        <div className="flex gap-1 mt-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-mobile-xs"
          >
            Alla ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            className="text-mobile-xs"
          >
            Olästa ({unreadCount})
          </Button>
          <Button
            variant={filter === 'actionable' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('actionable')}
            className="text-mobile-xs"
          >
            Åtgärder ({notifications.filter(n => n.metadata?.action_url).length})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="px-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-mobile-sm">
                  {filter === 'all' ? 'Inga notifikationer' : 
                   filter === 'unread' ? 'Inga olästa notifikationer' : 
                   'Inga åtgärder krävs'}
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredNotifications.map((notification, index) => {
                  const IconComponent = NOTIFICATION_ICONS[notification.notification_type as keyof typeof NOTIFICATION_ICONS] || Bell;
                  const isLast = index === filteredNotifications.length - 1;

                  return (
                    <div key={notification.id}>
                      <div
                        className={`
                          p-4 hover:bg-muted/50 transition-colors cursor-pointer
                          ${!notification.is_read ? 'bg-blue-50/50' : ''}
                          ${PRIORITY_COLORS[notification.priority]}
                        `}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`
                                text-mobile-sm truncate
                                ${!notification.is_read ? 'font-semibold' : 'font-medium'}
                              `}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {getPriorityIcon(notification.priority)}
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-mobile-xs text-muted-foreground line-clamp-2 mb-2">
                              {notification.content}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-mobile-xs text-muted-foreground">
                                {formatDistance(new Date(notification.created_at), new Date(), {
                                  addSuffix: true,
                                  locale: sv
                                })}
                              </span>
                              
                              <div className="flex gap-1">
                                {notification.metadata?.action_url && (
                                  <Badge variant="outline" className="text-xs">
                                    {notification.metadata?.action_label || 'Åtgärd'}
                                    <ExternalLink className="h-2 w-2 ml-1" />
                                  </Badge>
                                )}
                                
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="text-mobile-xs h-6 px-2"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="text-mobile-xs h-6 px-2 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {!isLast && <Separator />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};