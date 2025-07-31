import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Message } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';

interface ConversationViewProps {
  conversation: {
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeen?: string;
  };
  messages: Message[];
  onSendMessage: (content: string) => void;
  onBack: () => void;
  loading?: boolean;
}

export const ConversationView = ({ 
  conversation, 
  messages, 
  onSendMessage, 
  onBack, 
  loading = false 
}: ConversationViewProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Igår ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd MMM HH:mm', { locale: sv });
    }
  };

  const getMessageGroups = () => {
    const groups: Message[][] = [];
    let currentGroup: Message[] = [];
    let lastSenderId = '';
    let lastTimestamp = '';

    messages.forEach((message) => {
      const timeDiff = lastTimestamp ? 
        (new Date(message.created_at).getTime() - new Date(lastTimestamp).getTime()) / 1000 / 60 : 0;

      // Group messages from same sender within 5 minutes
      if (message.sender_id === lastSenderId && timeDiff < 5) {
        currentGroup.push(message);
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [message];
      }

      lastSenderId = message.sender_id;
      lastTimestamp = message.created_at;
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{conversation.name}</h3>
            <p className="text-xs text-muted-foreground">
              {conversation.isOnline ? (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Online
                </span>
              ) : (
                conversation.lastSeen && `Aktiv ${formatDistanceToNow(new Date(conversation.lastSeen), { addSuffix: true, locale: sv })}`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {getMessageGroups().map((group, groupIndex) => {
            const isOwnMessage = group[0].sender_id === user?.id;
            return (
              <div
                key={groupIndex}
                className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwnMessage && (
                  <Avatar className="h-8 w-8 mt-auto">
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback className="text-xs">
                      {getInitials(conversation.name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  {group.map((message, messageIndex) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl px-4 py-2 break-words ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      } ${
                        messageIndex === 0 && isOwnMessage ? 'rounded-tr-2xl' : ''
                      } ${
                        messageIndex === 0 && !isOwnMessage ? 'rounded-tl-2xl' : ''
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))}
                  <span className={`text-xs text-muted-foreground px-2 ${
                    isOwnMessage ? 'text-right' : 'text-left'
                  }`}>
                    {formatMessageTime(group[group.length - 1].created_at)}
                    {isOwnMessage && group[group.length - 1].is_read && (
                      <span className="ml-1 text-blue-500">✓✓</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex gap-2 justify-start">
              <Avatar className="h-8 w-8 mt-auto">
                <AvatarImage src={conversation.avatar} />
                <AvatarFallback className="text-xs">
                  {getInitials(conversation.name)}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Skriv ett meddelande..."
              className="rounded-full pr-12 resize-none min-h-[40px] max-h-[120px]"
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || loading}
            size="sm"
            className="rounded-full h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};