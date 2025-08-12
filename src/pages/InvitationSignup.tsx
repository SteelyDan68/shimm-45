import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useInvitations } from "@/hooks/useInvitations";
import { useAuth } from "@/providers/UnifiedAuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Mail, Lock, User, Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const InvitationSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');
  const { validateInvitation, acceptInvitation } = useInvitations();
  const { signUp, session, signOut } = useAuth();

  const [invitation, setInvitation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const checkInvitation = async () => {
      if (!token) {
        setIsValidating(false);
        document.title = "Inbjuden registrering – SHIMMS";
        return;
      }

      const invitationData = await validateInvitation(token);
      setInvitation(invitationData);
      setIsValidating(false);
      document.title = "Inbjuden registrering – SHIMMS";
    };

    checkInvitation();
  }, [token, validateInvitation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) {
      toast.error("Ingen giltig inbjudan hittades");
      return;
    }

    // Validera namn (e-post kommer från inbjudan)
    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();

    if (!trimmedFirstName) {
      toast.error("Förnamn krävs");
      return;
    }

    if (!trimmedLastName) {
      toast.error("Efternamn krävs");
      return;
    }

    setIsRegistering(true);

    try {
      // Kör serverledd pre-approved signup som skickar verifieringslänk
      const redirectTo = `${window.location.origin}/complete-invite`;
      const { data, error } = await supabase.functions.invoke('preapproved-signup', {
        body: {
          token,
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          redirectTo,
        },
      });

      if (error) {
        // 409 kommer som error från invoke vid non-2xx
        const status = (error as any)?.status || (data as any)?.status;
        if (status === 409 || (data as any)?.status === 'user_exists') {
          toast.info("Användare finns redan. Logga in så kopplas inbjudan automatiskt.");
          navigate('/auth', {
            state: {
              message: 'Logga in – din inbjudan kopplas automatiskt efter inloggning.',
              email: invitation.email,
            },
          });
          return;
        }
        throw new Error((error as any)?.message || 'Något gick fel vid inbjudan');
      }

      // Lyckad inbjudan/utskick av verifieringslänk
      if ((data as any)?.status === 'invited') {
        toast.success('Verifieringslänk skickad! Kontrollera din e‑post.');
        navigate('/auth', {
          state: {
            message: 'Verifieringslänk skickad! Kontrollera din e‑post och verifiera innan inloggning.',
            email: invitation.email,
          },
        });
        return;
      }

      // Fallback – om oväntat svar
      toast.success('Verifieringslänk skickad! Kontrollera din e‑post.');
      navigate('/auth', {
        state: {
          message: 'Verifieringslänk skickad! Kontrollera din e‑post och verifiera innan inloggning.',
          email: invitation.email,
        },
      });
    } catch (err: any) {
      console.error('preapproved-signup error', err);
      const msg = err?.message || 'Ett fel uppstod vid utskick av verifieringslänk';
      toast.error(msg);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Validerar inbjudan...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !invitation || !invitation.is_valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle>Ogiltig inbjudan</CardTitle>
            <CardDescription>
              Denna inbjudningslänk är antingen ogiltig eller har gått ut.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Gå till inloggning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle>Välkommen till SHIMMS!</CardTitle>
          <CardDescription>
            Du har bjudits in som <strong>{invitation.invited_role}</strong>.
            Bekräfta ditt konto via verifieringslänken som skickas till din e‑post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Inbjudan skickad till: <strong>{invitation.email}</strong>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Förnamn</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Efternamn</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Vi skickar en verifieringslänk till din e‑post. Du sätter lösenord efter verifiering.
            </div>

            <Button type="submit" disabled={isRegistering} className="w-full">
              {isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Skickar verifieringslänk...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Skicka verifieringslänk
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={() => navigate("/auth")}
              className="text-sm"
            >
              Har du redan ett konto? Logga in här
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};