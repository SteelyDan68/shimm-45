import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { MessageV2 } from '@/hooks/useMessagingV2';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface ModernMessageBubbleProps {
  message: MessageV2;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

export const ModernMessageBubble: React.FC<ModernMessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  className
}) => {
  const isStefanAI = message.content.startsWith('🤖 Stefan:');
  const cleanContent = isStefanAI ? message.content.replace('🤖 Stefan: ', '') : message.content;
  
  return (
    <div className={cn(
      "flex items-end gap-2 max-w-[85%] animate-fade-in",
      isOwn ? "ml-auto flex-row-reverse" : "mr-auto",
      className
    )}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 mb-1 shrink-0">
          {isStefanAI ? (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">🤖</span>
            </div>
          ) : (
            <>
              <AvatarImage src={message.sender_profile?.avatar_url} />
              <AvatarFallback className="text-xs bg-muted">
                {message.sender_profile?.first_name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </>
          )}
        </Avatar>
      )}
      
      {/* Message bubble */}
      <div className={cn(
        "relative rounded-2xl px-4 py-2 shadow-sm transition-all duration-200 hover:shadow-md",
        "max-w-[280px] sm:max-w-[400px] md:max-w-[500px]",
        isOwn ? (
          // Own messages (right side) - Blue for client
          "bg-blue-500 text-white rounded-br-md"
        ) : isStefanAI ? (
          // Stefan AI messages - Green for AI  
          "bg-green-500 text-white rounded-bl-md"
        ) : (
          // Other users' messages (left side) - Light gray
          "bg-muted/80 text-foreground rounded-bl-md border border-border/50"
        )
      )}>
        {/* Message content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {cleanContent}
        </p>
        
        {/* Timestamp */}
        {showTimestamp && (
          <div className={cn(
            "flex items-center justify-end mt-1 gap-1",
            isOwn ? "text-white/70" : isStefanAI ? "text-white/70" : "text-muted-foreground"
          )}>
            <span className="text-xs leading-none">
              {format(new Date(message.created_at), 'HH:mm', { locale: sv })}
            </span>
            {/* Read status indicators for own messages */}
            {isOwn && (
              <div className="flex">
                <div className={cn(
                  "h-3 w-3 text-xs leading-none",
                  message.is_read ? "text-white/70" : "text-white/50"
                )}>
                  ✓
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Message tail/pointer */}
        <div className={cn(
          "absolute bottom-0 w-3 h-3",
          isOwn ? (
            "right-0 bg-blue-500 transform rotate-45 translate-x-1 translate-y-1"
          ) : isStefanAI ? (
            "left-0 bg-green-500 transform rotate-45 -translate-x-1 translate-y-1"
          ) : (
            "left-0 bg-muted/80 transform rotate-45 -translate-x-1 translate-y-1"
          )
        )} />
      </div>
    </div>
  );
};
