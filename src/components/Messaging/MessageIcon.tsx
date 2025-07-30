import { Bell, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMessages } from '@/hooks/useMessages';
import { MessageList } from './MessageList';

export const MessageIcon = () => {
  const { unreadCount } = useMessages();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Meddelanden</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} olästa</Badge>
          )}
        </div>
        <MessageList />
      </PopoverContent>
    </Popover>
  );
};