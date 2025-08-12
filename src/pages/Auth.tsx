import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign in form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(signInEmail, signInPassword);
      
      if (!error) {
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!signInEmail) {
      toast({
        title: 'E-postadress krävs',
        description: 'Vänligen ange din e-postadress först.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: signInEmail,
          redirectTo: `${window.location.origin}/auth`
        }
      });

      if (error) throw error;

      toast({
        title: 'Återställningslänk skickad',
        description: `En länk för att återställa lösenordet har skickats till ${signInEmail}`,
      });
    } catch (error: any) {
      toast({
        title: 'Fel vid skickande',
        description: error?.message || 'Kunde inte skicka återställningslänk',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Välkommen till SHIMMS</h1>
          <p className="text-muted-foreground">En AI-driven plattform för att ge dig kunskap om och verktyg för det du behöver i livet- och karriären.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Logga in</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">E-postadress</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="din@email.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Lösenord</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ditt lösenord"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Loggar in...' : 'Logga in'}
              </Button>
              
              <div className="text-center mt-2">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={() => handleForgotPassword()}
                >
                  Har du glömt ditt lösenord?
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};