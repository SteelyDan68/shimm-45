import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Eye, Reply } from 'lucide-react';
import { useState } from 'react';
import { ComposeMessage } from './ComposeMessage';

export const MessageList = () => {
  const { messages, markAsRead } = useMessages();
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  const handleMessageClick = async (messageId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(messageId);
    }
    setSelectedMessage(messageId);
  };

  const recentMessages = messages.slice(0, 10);

  if (showCompose) {
    return (
      <ComposeMessage 
        onClose={() => setShowCompose(false)}
        onSent={() => setShowCompose(false)}
      />
    );
  }

  return (
    <div className="max-h-96">
      <ScrollArea className="h-80">
        <div className="p-2">
          {recentMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Inga meddelanden ännu
            </div>
          ) : (
            recentMessages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  message.is_read 
                    ? 'hover:bg-muted/50' 
                    : 'bg-primary/10 hover:bg-primary/20 border-l-4 border-primary'
                }`}
                onClick={() => handleMessageClick(message.id, message.is_read)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {message.subject || 'Inget ämne'}
                      </p>
                      {!message.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {message.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.created_at), { 
                        addSuffix: true, 
                        locale: sv 
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!message.is_read && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(message.id);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-3 border-t">
        <Button 
          onClick={() => setShowCompose(true)}
          className="w-full"
          size="sm"
        >
          Nytt meddelande
        </Button>
      </div>
    </div>
  );
};