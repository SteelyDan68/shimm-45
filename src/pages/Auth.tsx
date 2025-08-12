import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  // Tabs + Sign up form
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // SEO: Title, meta description, canonical
  useEffect(() => {
    document.title = 'Logga in eller skapa konto | SHIMMS';

    const ensureMeta = (name: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        (el as HTMLMetaElement).name = name;
        document.head.appendChild(el);
      }
      return el as HTMLMetaElement;
    };

    const metaDesc = ensureMeta('description');
    metaDesc.setAttribute('content', 'Logga in eller skapa konto för SHIMMS – AI-driven plattform. E-postverifiering och säker inloggning.');

    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', window.location.href);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(signInEmail, signInPassword);
      
      if (!error) {
        try {
          const { data: claim, error: claimErr } = await (supabase as any).rpc('claim_pending_invitation_for_current_user');
          if (claimErr) {
            console.warn('Invitation claim error:', claimErr);
          } else if ((claim as any)?.status === 'claimed') {
            toast({
              title: 'Inbjudan aktiverad',
              description: `Rollen ${(claim as any).assigned_role} har tilldelats.`,
            });
          }
        } catch (e) {
          console.warn('Claim RPC failed:', e);
        }
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

  const handleResendVerification = async () => {
    if (!signInEmail) {
      toast({
        title: 'E-postadress krävs',
        description: 'Ange din e-post ovan för att skicka om verifiering.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await (supabase as any).auth.resend({
        type: 'signup',
        email: signInEmail
      });
      if (error) throw error;

      toast({
        title: 'Verifieringsmail skickat',
        description: `En ny bekräftelselänk har skickats till ${signInEmail}`,
      });
    } catch (error: any) {
      toast({
        title: 'Kunde inte skicka',
        description: error?.message || 'Ett fel uppstod när verifieringsmailet skulle skickas',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signUpEmail || !signUpPassword) {
      toast({
        title: 'Fyll i alla fält',
        description: 'E-post och lösenord krävs.',
        variant: 'destructive',
      });
      return;
    }

    if (signUpPassword !== signUpConfirm) {
      toast({
        title: 'Lösenorden matchar inte',
        description: 'Bekräfta att båda lösenorden är identiska.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await (supabase as any).auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;

      toast({
        title: 'Verifiering skickad',
        description: `Vi har skickat ett verifieringsmail till ${signUpEmail}. Öppna länken för att aktivera ditt konto.`,
      });

      // Växla till inloggningsfliken
      setActiveTab('login');
    } catch (error: any) {
      toast({
        title: 'Kunde inte skapa konto',
        description: error?.message || 'Ett fel uppstod. Försök igen senare.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Välkommen till SHIMMS</h1>
          <p className="text-muted-foreground">En AI-driven plattform som ger dig verktyg för det du behöver i livet och karriären.</p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Skapad och utvecklad 2025 av{' '}
            <a 
              href="mailto:stefan.hallgren@gmail.com" 
              className="hover:underline"
            >
              Stefan Hallgren
            </a>
            {' '}© All rights reserved
          </p>
        </header>

        <Tabs defaultValue="login" value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="login">Logga in</TabsTrigger>
            <TabsTrigger value="signup">Skapa konto</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
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
                  
                  <div className="text-center mt-2 flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto font-normal"
                      onClick={() => handleForgotPassword()}
                    >
                      Har du glömt ditt lösenord?
                    </Button>
                    <span className="text-muted-foreground">·</span>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto font-normal"
                      onClick={() => handleResendVerification()}
                    >
                      Skicka om verifieringsmail
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Skapa konto</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-postadress</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="din@email.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Lösenord</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Minst 12 tecken"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Bekräfta lösenord</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="Bekräfta lösenord"
                      value={signUpConfirm}
                      onChange={(e) => setSignUpConfirm(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Skapar konto...' : 'Skapa konto'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Vi skickar en verifieringslänk till din e-post för att aktivera kontot.
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};