import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, Mail } from 'lucide-react';

interface SelfPasswordResetCardProps {
  userEmail: string;
  userName?: string;
}

export const SelfPasswordResetCard: React.FC<SelfPasswordResetCardProps> = ({ userEmail, userName }) => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const sendResetEmail = async () => {
    if (!userEmail) return;
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: userEmail,
          name: userName,
          redirectTo: `${window.location.origin}/reset-password`
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Återställningslänk skickad',
          description: `Vi har skickat en säker återställningslänk till ${userEmail}`
        });
      } else {
        throw new Error(data?.error || 'Kunde inte skicka återställningslänk');
      }
    } catch (err: any) {
      console.error('send-password-reset error', err);
      toast({
        title: 'Något gick fel',
        description: err.message || 'Kunde inte skicka återställningslänk',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Lösenordssäkerhet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          För din säkerhet hanteras lösenordsbyten via en återställningslänk till din e‑post.
        </p>
        <Button onClick={sendResetEmail} disabled={isSending} variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          {isSending ? 'Skickar...' : 'Skicka återställningslänk'}
        </Button>
      </CardContent>
    </Card>
  );
};
