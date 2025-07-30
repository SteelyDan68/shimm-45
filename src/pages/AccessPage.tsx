import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export const AccessPage = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);

    try {
      // Verify the access code
      const { data, error } = await supabase
        .from('access_codes')
        .select('id, status, expires_at')
        .eq('code', code.trim())
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Ogiltig kod",
          description: "Koden du angav är inte giltig eller har redan använts.",
          variant: "destructive",
        });
        return;
      }

      // Check if code has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({
          title: "Kod har gått ut",
          description: "Denna kod har gått ut. Kontakta administratören för en ny kod.",
          variant: "destructive",
        });
        return;
      }

      // Store access session in localStorage
      localStorage.setItem('shimm_access_granted', 'true');
      localStorage.setItem('shimm_access_code_id', data.id);

      toast({
        title: "Kod godkänd",
        description: "Du har nu tillgång till registreringssidan.",
      });

      // Navigate to auth page
      navigate('/auth');
    } catch (error: any) {
      console.error('Access code verification error:', error);
      toast({
        title: "Fel",
        description: "Ett fel uppstod när koden verifierades. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary mb-4">
            SHIMM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Ange din åtkomstkod"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center text-lg"
                required
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !code.trim()}
            >
              {isLoading ? 'Verifierar...' : 'Fortsätt'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};