import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Send, ClipboardCopy } from 'lucide-react';

export const AiReplyAssistant: React.FC = () => {
  const { user } = useAuth();
  const { activeConversation, sendMessage } = useMessagingV2();

  const [messageContent, setMessageContent] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const generateSuggestion = async () => {
    if (!messageContent.trim()) return;
    setLoading(true);
    setSuggestion('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-message-assistant', {
        body: {
          messageContent,
          senderName: user?.email || 'Klient',
          context,
        },
      });

      if (error) throw error;
      setSuggestion(data?.aiSuggestion || '');
    } catch (e) {
      console.error('AI assistant error:', e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!suggestion) return;
    try {
      await navigator.clipboard.writeText(suggestion);
    } catch (e) {
      console.error('Clipboard error:', e);
    }
  };

  const sendDirectly = async () => {
    if (!activeConversation || !suggestion.trim()) return;
    await sendMessage(activeConversation, suggestion.trim());
    setSuggestion('');
    setMessageContent('');
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-svarshjälp
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">Live</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Klistra in inkommande text och få ett professionellt, empatiskt svarsförslag.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Innehåll från klient</label>
          <Textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Klistra in meddelandet här..."
            className="min-h-[90px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Kontext (frivilligt)</label>
          <Input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="T.ex. tema, mål, känsloläge..."
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={generateSuggestion} disabled={loading || !messageContent.trim()} className="flex-1">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Föreslå svar
          </Button>
        </div>

        {suggestion && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Förslag</label>
            <Textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} className="min-h-[120px]" />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={copyToClipboard} className="flex-1">
                <ClipboardCopy className="h-4 w-4 mr-2" />
                Kopiera
              </Button>
              <Button onClick={sendDirectly} disabled={!activeConversation} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Skicka direkt
              </Button>
            </div>
            {!activeConversation && (
              <p className="text-[11px] text-muted-foreground">Öppna en konversation för att kunna skicka förslaget direkt.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
