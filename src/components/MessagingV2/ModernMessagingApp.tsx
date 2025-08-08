import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, Phone, Video, MoreVertical, Search, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { useProactiveMessaging } from '@/hooks/useProactiveMessaging';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { ComposeModal } from './ComposeModal';
import { FileUpload } from './FileUpload';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// 🚀 Modern Enterprise Messaging App 2025
// Instagram/WhatsApp/Discord inspired UI with world-class UX

interface ModernMessagingAppProps {
  className?: string;
}

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export const ModernMessagingApp: React.FC<ModernMessagingAppProps> = ({ className }) => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    currentMessages, // Use currentMessages instead of messages
    connectionStatus,
    totalUnreadCount,
    setActiveConversation,
    sendMessage,
    markConversationAsRead,
    getOrCreateDirectConversation,
    updateTypingStatus,
    addReaction
  } = useMessagingV2();
  
  const { getOrCreateStefanConversation } = useProactiveMessaging();
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Automatisk Stefan-konversation när användaren kommer till Messages
  useEffect(() => {
    const initializeStefanConversation = async () => {
      if (user && conversations.length === 0) {
        // Vänta lite för att låta conversations ladda
        setTimeout(async () => {
          await getOrCreateStefanConversation();
        }, 1000);
      }
    };
    
    initializeStefanConversation();
  }, [user, conversations.length, getOrCreateStefanConversation]);

  // Handle typing indicators
  useEffect(() => {
    if (activeConversation && messageInput.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        updateTypingStatus(activeConversation, true);
      }
    } else if (isTyping) {
      setIsTyping(false);
      updateTypingStatus(activeConversation || '', false);
    }
  }, [messageInput, activeConversation, isTyping, updateTypingStatus]);

  const handleSendMessage = async () => {
    if (!activeConversation || !messageInput.trim()) return;

    const success = await sendMessage(activeConversation, messageInput.trim());
    if (success) {
      setMessageInput('');
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUploaded = async (fileUrl: string, fileName: string, fileType: string) => {
    if (!activeConversation) return;
    
    const message = fileType.startsWith('image/') 
      ? `📷 ${fileName}` 
      : `📎 ${fileName}`;
    
    const success = await sendMessage(activeConversation, message);
    
    if (!success) {
      toast.error('Kunde inte skicka filen');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!activeConversation) return;
    
    // For now, send a placeholder message
    // In production, you'd upload the audio file and send the URL
    const message = `🎤 Röstmeddelande (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`;
    
    const success = await sendMessage(activeConversation, message);
    
    if (!success) {
      toast.error('Kunde inte skicka röstmeddelandet');
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversation(conversationId);
    markConversationAsRead(conversationId);
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Idag';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Igår';
    } else {
      return date.toLocaleDateString('sv-SE');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const participants = conv.participants || [];
    const searchLower = searchQuery.toLowerCase();
    return participants.some(p => 
      (p.first_name?.toLowerCase().includes(searchLower)) ||
      (p.last_name?.toLowerCase().includes(searchLower)) ||
      (p.email?.toLowerCase().includes(searchLower))
    ) || conv.title?.toLowerCase().includes(searchLower);
  });

  const currentConversation = conversations.find(c => c.id === activeConversation);
  const conversationTitle = currentConversation?.title || 
    currentConversation?.participants
      ?.filter(p => p.id !== user?.id)
      .map(p => `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email)
      .join(', ') || 'Konversation';

  return (
    <div className={cn("flex h-full bg-background border rounded-lg overflow-hidden", className)}>
      {/* 📱 Conversation List */}
      <div className={cn(
        "flex flex-col w-full md:w-80 border-r bg-muted/5",
        activeConversation && "hidden md:flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b bg-background/50 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Meddelanden
              {totalUnreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {totalUnreadCount}
                </Badge>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCompose(true)}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
                className="h-8 w-8"
              >
                <Search className="h-4 w-4" />
              </Button>
              <div className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === 'connected' && "bg-green-500",
                connectionStatus === 'connecting' && "bg-yellow-500 animate-pulse",
                connectionStatus === 'disconnected' && "bg-red-500"
              )} />
            </div>
          </div>
          
          {showSearch && (
            <Input
              placeholder="Sök konversationer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
          )}
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          <div className="p-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Send className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Inga konversationer än</p>
                  <p className="text-xs text-muted-foreground">Klicka på + ovan för att börja</p>
                </div>
                <Button 
                  onClick={() => setShowCompose(true)} 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Börja chatta
                </Button>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipant = conversation.participants?.find(p => p.id !== user?.id);
                const displayName = otherParticipant ? 
                  `${otherParticipant.first_name || ''} ${otherParticipant.last_name || ''}`.trim() || otherParticipant.email :
                  conversation.title || 'Okänd användare';

                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 m-1 rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                      activeConversation === conversation.id && "bg-primary/10 border border-primary/20"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherParticipant?.avatar_url} />
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online status indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">{displayName}</h3>
                        {conversation.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message?.content || 'Ingen meddelanden än...'}
                        </p>
                        {(conversation.unread_count || 0) > 0 && (
                          <Badge variant="destructive" className="text-xs h-5 min-w-[20px] flex items-center justify-center">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 💬 Active Conversation */}
      {activeConversation ? (
        <div className="flex flex-col flex-1">
          {/* Conversation Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveConversation(null)}
                className="md:hidden h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(conversationTitle)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-medium text-sm">{conversationTitle}</h3>
                <p className="text-xs text-muted-foreground">Online för 2 min sedan</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Video className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Visa profil</DropdownMenuItem>
                  <DropdownMenuItem>Ljudlösa notifieringar</DropdownMenuItem>
                  <DropdownMenuItem>Sök i konversation</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {(currentMessages || []).map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const showDate = index === 0 || 
                  formatMessageDate(message.created_at) !== formatMessageDate((currentMessages || [])[index - 1]?.created_at);
                const showAvatar = !isOwn && (
                  index === (currentMessages || []).length - 1 || 
                  (currentMessages || [])[index + 1]?.sender_id !== message.sender_id
                );

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                          {formatMessageDate(message.created_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className={cn(
                      "flex gap-2 group",
                      isOwn && "justify-end"
                    )}>
                      {!isOwn && (
                        <Avatar className={cn("h-8 w-8", !showAvatar && "opacity-0")}>
                          <AvatarFallback className="text-xs">
                            {getInitials(message.sender_profile?.first_name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "flex flex-col max-w-[70%]",
                        isOwn && "items-end"
                      )}>
                        <div className={cn(
                          "relative px-4 py-2 rounded-2xl break-words",
                          isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                          "hover:shadow-md transition-shadow duration-200"
                        )}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Reaction buttons - show on hover */}
                          <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                            {EMOJI_REACTIONS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(message.id, emoji)}
                                className="w-6 h-6 bg-background rounded-full shadow-md hover:scale-110 transition-transform duration-150 flex items-center justify-center text-xs"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.created_at)}
                          </span>
                          {isOwn && message.is_read && (
                            <span className="text-xs text-muted-foreground">✓✓</span>
                          )}
                        </div>

                        {/* Reactions */}
                        {Object.keys(message.reactions || {}).length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {Object.entries(message.reactions || {}).map(([userId, emoji]) => (
                              <span 
                                key={userId}
                                className="bg-muted px-2 py-1 rounded-full text-xs flex items-center gap-1"
                              >
                                {String(emoji)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t bg-background/50 backdrop-blur">
            <div className="flex items-end gap-2">
              <FileUpload
                onFileUploaded={handleFileUploaded}
                disabled={!activeConversation}
              />
              
              <div className="flex-1 min-h-[40px] relative">
                <Input
                  ref={inputRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Skriv ett meddelande..."
                  className="min-h-[40px] pr-20 resize-none rounded-full"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    disabled={!activeConversation}
                  />
                  <VoiceRecorder
                    onVoiceMessage={handleVoiceMessage}
                    disabled={!activeConversation}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {isTyping && (
              <p className="text-xs text-muted-foreground mt-2 pl-12">Du skriver...</p>
            )}
          </div>
        </div>
      ) : (
        /* 📱 Empty State */
        <div className="hidden md:flex flex-1 items-center justify-center bg-muted/5">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Välkommen till Meddelanden</h3>
              <p className="text-muted-foreground">
                Välj en konversation för att börja chatta
              </p>
            </div>
            <Button onClick={() => setShowCompose(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Börja chatta
            </Button>
          </div>
        </div>
      )}
      
      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onConversationCreated={(conversationId) => {
            setShowCompose(false);
            setActiveConversation(conversationId);
          }}
        />
      )}
    </div>
  );
};