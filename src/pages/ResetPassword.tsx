import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Återställ lösenord';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'För kort lösenord', description: 'Minst 6 tecken krävs', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Lösenorden matchar inte', description: 'Försök igen', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: 'Klart', description: 'Ditt lösenord är uppdaterat.' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Fel', description: err.message || 'Kunde inte uppdatera lösenord', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Tillbaka
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Välj nytt lösenord
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nytt lösenord</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Bekräfta nytt lösenord</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Uppdaterar...' : 'Uppdatera lösenord'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
