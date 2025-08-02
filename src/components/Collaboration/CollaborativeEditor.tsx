import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import { Save, Users, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CollaborativeEditorProps {
  documentId: string;
  documentType: 'assessment' | 'notes' | 'plan';
  initialContent?: string;
  onSave?: (content: string) => void;
  roomId?: string;
}

export function CollaborativeEditor({ 
  documentId, 
  documentType, 
  initialContent = '', 
  onSave,
  roomId 
}: CollaborativeEditorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [cursors, setCursors] = useState<Record<string, { line: number; column: number; userName: string }>>({});

  const {
    isConnected,
    activeCollaborators,
    events,
    sendDocumentEdit,
    sendTypingIndicator,
    joinRoom,
    updateStatus
  } = useRealtimeCollaboration();

  // Join collaboration room for this document
  useEffect(() => {
    const effectiveRoomId = roomId || `document_${documentId}`;
    joinRoom(effectiveRoomId, { 
      documentId, 
      documentType,
      activity: `Redigerar ${documentType}` 
    });
  }, [documentId, documentType, roomId, joinRoom]);

  // Handle incoming document changes
  useEffect(() => {
    const latestDocumentEvents = events.filter(e => 
      e.type === 'document_edit' && 
      e.data.documentId === documentId
    );

    if (latestDocumentEvents.length > 0) {
      const latestEvent = latestDocumentEvents[latestDocumentEvents.length - 1];
      
      // Apply changes from other users
      if (latestEvent.data.changes && latestEvent.userId !== activeCollaborators.find(c => c.userId)?.userId) {
        // Simple merge: for now just update if content is significantly different
        if (latestEvent.data.changes.content && 
            Math.abs(latestEvent.data.changes.content.length - content.length) > 10) {
          setContent(latestEvent.data.changes.content);
          toast({
            title: "Dokument uppdaterat",
            description: `${latestEvent.userName} gjorde ändringar`,
          });
        }
      }

      // Update cursor positions
      if (latestEvent.data.cursor) {
        setCursors(prev => ({
          ...prev,
          [latestEvent.userId]: {
            ...latestEvent.data.cursor,
            userName: latestEvent.userName
          }
        }));
      }
    }
  }, [events, documentId, content.length, activeCollaborators, toast]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    
    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true, `Redigerar ${documentType}`);
      
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(false);
      }, 3000);
    }

    // Debounced document edit event
    const timeoutId = setTimeout(() => {
      sendDocumentEdit(documentId, { 
        content: newContent,
        timestamp: new Date().toISOString()
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [documentId, documentType, isTyping, sendDocumentEdit, sendTypingIndicator]);

  // Save document
  const handleSave = useCallback(async () => {
    try {
      if (onSave) {
        await onSave(content);
      }
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Send save event
      await sendDocumentEdit(documentId, { 
        content,
        action: 'save',
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Dokument sparat",
        description: "Dina ändringar har sparats",
      });
    } catch (error) {
      toast({
        title: "Fel vid sparning",
        description: "Kunde inte spara dokumentet",
        variant: "destructive",
      });
    }
  }, [content, onSave, documentId, sendDocumentEdit, toast]);

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const interval = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [hasUnsavedChanges, handleSave]);

  // Update status when typing
  useEffect(() => {
    updateStatus(isTyping ? 'busy' : 'online', {
      documentId,
      documentType,
      activity: isTyping ? `Skriver i ${documentType}` : `Läser ${documentType}`
    });
  }, [isTyping, documentId, documentType, updateStatus]);

  const otherCollaborators = activeCollaborators.filter(c => 
    c.metadata?.documentId === documentId
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {documentType === 'assessment' && 'Bedömning'}
            {documentType === 'notes' && 'Anteckningar'}
            {documentType === 'plan' && 'Plan'}
            
            {isConnected && (
              <Badge variant="outline" className="ml-2">
                <Users className="h-3 w-3 mr-1" />
                {activeCollaborators.length} aktiva
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {otherCollaborators.length > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {otherCollaborators.length} andra läser
                </span>
              </div>
            )}
            
            <Button 
              onClick={handleSave}
              size="sm"
              disabled={!hasUnsavedChanges}
              variant={hasUnsavedChanges ? "default" : "outline"}
            >
              <Save className="h-4 w-4 mr-2" />
              {hasUnsavedChanges ? 'Spara' : 'Sparat'}
            </Button>
          </div>
        </div>
        
        {lastSaved && (
          <p className="text-sm text-muted-foreground">
            Senast sparat: {lastSaved.toLocaleTimeString('sv-SE')}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={`Skriv din ${documentType} här...`}
            className="min-h-[300px] resize-none"
          />
          
          {/* Show other users' cursors */}
          {Object.entries(cursors).map(([userId, cursor]) => (
            <div 
              key={userId}
              className="absolute bg-primary text-primary-foreground text-xs px-1 py-0.5 rounded pointer-events-none"
              style={{
                top: `${cursor.line * 20}px`,
                left: `${cursor.column * 8}px`,
              }}
            >
              {cursor.userName}
            </div>
          ))}
          
          {/* Typing indicators */}
          {events.filter(e => 
            e.type === 'message' && 
            e.data.typing && 
            e.data.context?.includes(documentType)
          ).map(event => (
            <Badge 
              key={event.userId} 
              variant="outline" 
              className="absolute top-2 right-2 animate-pulse"
            >
              {event.userName} skriver...
            </Badge>
          ))}
        </div>
        
        {/* Collaboration status */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span>Synkroniserad</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-destructive rounded-full" />
                  <span>Frånkopplad</span>
                </>
              )}
            </div>
            
            {hasUnsavedChanges && (
              <span className="text-warning">Osparade ändringar</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}