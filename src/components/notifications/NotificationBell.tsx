import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/providers/NotificationProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationCenter } from './NotificationCenter';
import { Bell, BellRing } from 'lucide-react';

interface NotificationBellProps {
  className?: string;
  showLabel?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = "",
  showLabel = false
}) => {
  const { unreadCount, notifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Animate when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotifications(true);
      const timer = setTimeout(() => setHasNewNotifications(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Get latest urgent notification for preview
  const latestUrgent = notifications.find(n => 
    !n.is_read && (n.priority === 'urgent' || n.priority === 'high')
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`
            relative touch-target-md
            ${hasNewNotifications ? 'animate-pulse' : ''}
            ${className}
          `}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          
          {showLabel && (
            <span className="ml-2 text-mobile-sm">
              Notifikationer
            </span>
          )}
          
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="
                absolute -top-1 -right-1 h-5 w-5 p-0 
                flex items-center justify-center text-xs
                min-w-[20px] rounded-full
              "
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          
          {/* Pulse indicator for urgent notifications */}
          {latestUrgent && (
            <div className="absolute -top-1 -right-1 h-3 w-3">
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
              <div className="absolute inset-0 bg-red-500 rounded-full"></div>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <NotificationCenter onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};