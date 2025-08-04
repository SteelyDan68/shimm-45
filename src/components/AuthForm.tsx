import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { validateEmail, validatePasswordStrength, sanitizeDbInput, RateLimiter } from '@/utils/inputSanitization';

export const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { toast } = useToast();

  // Rate limiter for login attempts
  const rateLimiter = useMemo(() => new RateLimiter(5, 15 * 60 * 1000), []);

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate email
    const sanitizedEmail = sanitizeDbInput(email);
    if (!validateEmail(sanitizedEmail)) {
      setEmailError('Ogiltig e-postadress');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Validate password
    if (password.length < 6) {
      setPasswordError('Lösenord måste vara minst 6 tecken');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Check rate limiting
    const clientIdentifier = `login_${email}`;
    if (!rateLimiter.isAllowed(clientIdentifier)) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime(clientIdentifier) / 1000 / 60);
      toast({
        title: "För många försök",
        description: `Vänta ${remainingTime} minuter innan du försöker igen`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const sanitizedEmail = sanitizeDbInput(email);
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Inloggning lyckades",
        description: "Välkommen tillbaka!",
      });
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Logga in</CardTitle>
        <CardDescription>
          Logga in på ditt konto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="E-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={emailError ? 'border-destructive' : ''}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Lösenord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={passwordError ? 'border-destructive' : ''}
            />
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Laddar...' : 'Logga in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};