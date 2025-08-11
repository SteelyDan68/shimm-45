import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, KeyRound, Copy, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';

interface PasswordInlineEditorProps {
  userId: string; // target user id
  userEmail?: string | null;
  userName?: string | null;
}

export const PasswordInlineEditor: React.FC<PasswordInlineEditorProps> = ({ userId, userEmail, userName }) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSelf = user?.id === userId;
  const isAdmin = hasRole('admin') || hasRole('superadmin');
  const isCoach = hasRole('coach');

  const canUse = isSelf || isAdmin || isCoach;
  if (!canUse) return null;

  const generate = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]<>?';
    let out = '';
    for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setPwd(out);
    setShow(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pwd);
      toast({ title: 'Kopierat', description: 'Lösenordet har kopierats till urklipp.' });
    } catch (e) {
      toast({ title: 'Kunde inte kopiera', variant: 'destructive' });
    }
  };

  const updatePassword = async () => {
    if (!pwd || pwd.length < 8) {
      toast({ title: 'För kort lösenord', description: 'Minst 8 tecken krävs.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (isSelf) {
        const { error } = await supabase.auth.updateUser({ password: pwd });
        if (error) throw error;
        toast({ title: 'Lösenord uppdaterat', description: 'Ditt lösenord har uppdaterats.' });
      } else {
        const { data, error } = await supabase.functions.invoke('admin-password-reset', {
          body: { targetUserId: userId, newPassword: pwd },
        });
        if (error || !data?.success) throw new Error(error?.message || data?.error || 'Misslyckades att uppdatera lösenord');
        toast({ title: 'Lösenord uppdaterat', description: `Lösenordet för ${userEmail || userName || 'användaren'} har uppdaterats.` });
      }
      setPwd('');
      setShow(false);
    } catch (e: any) {
      console.error('updatePassword error', e);
      toast({ title: 'Fel vid uppdatering', description: String(e?.message || e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Lösenord (temporär direkt-hantering)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          Detta är en tillfällig lösning. Du kan skapa och ändra lösenord direkt här.
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type={show ? 'text' : 'password'}
            placeholder="Nytt lösenord"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={() => setShow((s) => !s)} aria-label="Toggle visibility">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="secondary" onClick={generate} aria-label="Generate password">
            <Wand2 className="h-4 w-4 mr-1" /> Generera
          </Button>
          <Button type="button" variant="outline" onClick={copy} disabled={!pwd} aria-label="Copy password">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <Button type="button" onClick={updatePassword} disabled={loading || !pwd}>
            {loading ? 'Uppdaterar...' : 'Uppdatera lösenord'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
