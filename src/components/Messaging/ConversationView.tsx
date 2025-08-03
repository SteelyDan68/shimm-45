import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { useMessages, type Message } from '@/hooks/useMessages';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { formatDistanceToNow, format, isSameDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { HelpTooltip } from '@/components/HelpTooltip';
import { supabase } from '@/integrations/supabase/client';
import { StefanConversationView } from './StefanConversationView';

interface ConversationViewProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onClose: () => void;
}

export const ConversationView = ({ 
  recipientId, 
  recipientName, 
  recipientAvatar, 
  onClose 
}: ConversationViewProps) => {
  // Stefan AI special handling
  if (recipientId === 'stefan-ai') {
    return <StefanConversationView onClose={onClose} />;
  }
  const [newMessage, setNewMessage] = useState('');
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { user } = useAuth();
  const { messages, sendMessage, markAsRead } = useMessages();

  // Filter messages for this conversation
  useEffect(() => {
    const filtered = messages.filter(msg => 
      (msg.sender_id === user?.id && msg.receiver_id === recipientId) ||
      (msg.sender_id === recipientId && msg.receiver_id === user?.id)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    setConversationMessages(filtered);

    // Mark unread messages as read
    filtered.forEach(msg => {
      if (msg.receiver_id === user?.id && !msg.is_read) {
        markAsRead(msg.id);
      }
    });
  }, [messages, recipientId, user?.id, markAsRead]);

  // Set up presence tracking
  useEffect(() => {
    if (!user) return;

    // Mock online status and last seen for demo
    setIsOnline(Math.random() > 0.3);
    setLastSeen(new Date(Date.now() - Math.random() * 3600000)); // Random time within last hour

    // In a real app, you would track presence via Supabase realtime
    const presenceChannel = supabase
      .channel(`presence-${recipientId}`)
      .on('presence', { event: 'sync' }, () => {
        // Handle presence updates
      })
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [recipientId, user]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [conversationMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const success = await sendMessage(recipientId, newMessage.trim());
    if (success) {
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    
    return groups;
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    
    if (isSameDay(date, today)) {
      return 'Idag';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (isSameDay(date, yesterday)) {
      return 'Igår';
    }
    
    return format(date, 'dd MMM yyyy', { locale: sv });
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const messageGroups = groupMessagesByDate(conversationMessages);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={recipientAvatar} />
                <AvatarFallback>{getUserInitials(recipientName)}</AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            
            <div>
              <h3 className="font-semibold">{recipientName}</h3>
              <p className="text-xs text-muted-foreground">
                {isOnline ? 'Online' : 'Senast aktiv för en stund sedan'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HelpTooltip content="Videochatt och telefonsamtal kommer snart" side="bottom">
            <Button variant="ghost" size="sm" disabled>
              <Phone className="h-4 w-4" />
            </Button>
          </HelpTooltip>
          <HelpTooltip content="Videochatt kommer snart" side="bottom">
            <Button variant="ghost" size="sm" disabled>
              <Video className="h-4 w-4" />
            </Button>
          </HelpTooltip>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {Object.entries(messageGroups).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex justify-center my-4">
                <Badge variant="secondary" className="text-xs">
                  {formatDateHeader(dateKey)}
                </Badge>
              </div>

              {/* Messages for this date */}
              <div className="space-y-2">
                {msgs.map((message, index) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  const showAvatar = !isOwnMessage && (index === 0 || msgs[index - 1]?.sender_id !== message.sender_id);
                  const showTime = index === msgs.length - 1 || 
                    new Date(msgs[index + 1]?.created_at).getTime() - new Date(message.created_at).getTime() > 60000;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwnMessage && (
                        <div className="w-8">
                          {showAvatar && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={recipientAvatar} />
                              <AvatarFallback className="text-xs">
                                {getUserInitials(recipientName)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      
                      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content}
                        </div>
                        
                        {showTime && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.created_at), 'HH:mm', { locale: sv })}
                            </span>
                            {isOwnMessage && (
                              <span className="text-xs text-muted-foreground">
                                {message.is_read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {isOwnMessage && <div className="w-8" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Skriv ett meddelande..."
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};