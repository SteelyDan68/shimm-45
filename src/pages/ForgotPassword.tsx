import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Glömt lösenord – Återställ';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email,
          redirectTo: `${window.location.origin}/reset-password`
        }
      });
      if (error) throw error;
      toast({ title: 'E-post skickad', description: 'Kontrollera din inkorg för återställningslänken.' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Fel', description: err.message || 'Kunde inte skicka återställning', variant: 'destructive' });
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
              <Mail className="h-5 w-5" /> Glömt lösenord
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Skickar...' : 'Skicka återställningslänk'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
