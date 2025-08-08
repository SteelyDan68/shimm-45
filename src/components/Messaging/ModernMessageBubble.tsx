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
  isStefanAI?: boolean;
}

export const ModernMessageBubble: React.FC<ModernMessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  className,
  isStefanAI = false
}) => {
  const cleanContent = isStefanAI ? message.content.replace('🤖 Stefan: ', '') : message.content;
  
  return (
    <div className={cn(
      "flex flex-col gap-1 max-w-[85%] animate-fade-in",
      isOwn ? "ml-auto items-end" : "mr-auto items-start",
      className
    )}>
      {/* Sender name */}
      {(!isOwn || isStefanAI) && (
        <div className={cn(
          "text-xs font-medium px-2",
          isOwn ? "text-primary/70" : isStefanAI ? "text-ai-primary" : "text-muted-foreground"
        )}>
          {isStefanAI ? "🤖 Stefan AI" : isOwn ? "Du" : message.sender_profile?.first_name || "Okänd"}
        </div>
      )}
      
      {/* Message container */}
      <div className={cn(
        "flex items-end gap-2",
        isOwn ? "flex-row-reverse" : ""
      )}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 mb-1 shrink-0">
          {isStefanAI ? (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-ai-primary to-ai-secondary flex items-center justify-center">
              <span className="text-xs font-bold text-ai-primary-foreground">🤖</span>
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
          // Own messages (right side) - Primary color for client
          "bg-primary text-primary-foreground rounded-br-md"
        ) : isStefanAI ? (
          // Stefan AI messages - AI semantic colors
          "bg-ai-primary text-ai-primary-foreground rounded-bl-md"
        ) : (
          // Other users' messages (left side) - Muted colors
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
            isOwn ? "text-primary-foreground/70" : isStefanAI ? "text-ai-primary-foreground/70" : "text-muted-foreground"
          )}>
            <span className="text-xs leading-none">
              {format(new Date(message.created_at), 'HH:mm', { locale: sv })}
            </span>
            {/* Read status indicators for own messages */}
            {isOwn && (
              <div className="flex">
                <div className={cn(
                  "h-3 w-3 text-xs leading-none",
                  message.is_read ? "text-primary-foreground/70" : "text-primary-foreground/50"
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
            "right-0 bg-primary transform rotate-45 translate-x-1 translate-y-1"
          ) : isStefanAI ? (
            "left-0 bg-ai-primary transform rotate-45 -translate-x-1 translate-y-1"
          ) : (
            "left-0 bg-muted/80 transform rotate-45 -translate-x-1 translate-y-1"
          )
        )} />
        </div>
      </div>
    </div>
  );
};
