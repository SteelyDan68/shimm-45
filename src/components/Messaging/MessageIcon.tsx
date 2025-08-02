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
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            Meddelanden
          </h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {unreadCount} olästa
            </Badge>
          )}
        </div>
        <MessageList />
        <div className="p-3 border-t bg-gray-50">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => window.location.href = '/messages'}
          >
            Visa alla meddelanden
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};