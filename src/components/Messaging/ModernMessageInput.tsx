import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Send, Smile, Paperclip, Mic } from 'lucide-react';
import { ActionTooltip } from '@/components/ui/action-tooltip';

interface ModernMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onTyping?: (isTyping: boolean) => void;
}

export const ModernMessageInput = React.forwardRef<HTMLTextAreaElement, ModernMessageInputProps>(({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Skriv ett meddelande...",
  className,
  onTyping
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Handle typing indicators
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    
    if (onTyping) {
      onTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
        if (onTyping) onTyping(false);
      }
    }
  };

  const handleSendClick = () => {
    if (value.trim() && !disabled) {
      onSend();
      if (onTyping) onTyping(false);
    }
  };

  return (
    <div className={cn(
      "border rounded-full transition-all duration-200 bg-background",
      isFocused ? "border-primary shadow-sm" : "border-border",
      className
    )}>
      <div className="flex items-end gap-2 p-2">
        {/* Emoji button */}
        <ActionTooltip content="Lägg till emoji">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </ActionTooltip>

        {/* Text input */}
        <Textarea
          ref={ref || textareaRef}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "min-h-[36px] max-h-[120px] resize-none border-0 bg-transparent p-1 text-sm",
            "focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground",
            "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          )}
          rows={1}
        />

        {/* Attachment button */}
        <ActionTooltip content="Bifoga fil">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </ActionTooltip>

        {/* Send/Voice button */}
        {value.trim() ? (
          <ActionTooltip content="Skicka meddelande (Enter)">
            <Button
              onClick={handleSendClick}
              disabled={disabled || !value.trim()}
              size="icon"
              className="h-8 w-8 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </ActionTooltip>
        ) : (
          <ActionTooltip content="Röstmeddelande">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              disabled={disabled}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </ActionTooltip>
        )}
      </div>
    </div>
  );
});

ModernMessageInput.displayName = 'ModernMessageInput';