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
        return;
      }

      const invitationData = await validateInvitation(token);
      setInvitation(invitationData);
      setIsValidating(false);
    };

    checkInvitation();
  }, [token, validateInvitation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) {
      toast.error("Ingen giltig inbjudan hittades");
      return;
    }

    // Enhanced client-side validation
    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();
    const trimmedPassword = formData.password.trim();
    const trimmedConfirmPassword = formData.confirmPassword.trim();

    // Validation checks
    if (!trimmedFirstName) {
      toast.error("Förnamn krävs");
      return;
    }

    if (!trimmedLastName) {
      toast.error("Efternamn krävs");
      return;
    }

    if (!trimmedPassword) {
      toast.error("Lösenord krävs");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      toast.error("Lösenorden matchar inte");
      return;
    }

    if (trimmedPassword.length < 6) {
      toast.error("Lösenordet måste vara minst 6 tecken långt");
      return;
    }

    // Enhanced password validation
    const hasUpperCase = /[A-Z]/.test(trimmedPassword);
    const hasLowerCase = /[a-z]/.test(trimmedPassword);
    const hasNumbers = /\d/.test(trimmedPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      toast.error("Lösenordet måste innehålla minst en stor bokstav, en liten bokstav och en siffra");
      return;
    }

    setIsRegistering(true);

    try {
      console.log('🔥🔥🔥 InvitationSignup: STARTING REGISTRATION FOR:', {
        email: invitation.email,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        passwordLength: trimmedPassword.length,
        timestamp: new Date().toISOString()
      });
      
      // Ensure no conflicting session before sign-up (invited email must own this flow)
      if (session?.user?.email && session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        toast.info(`Du är inloggad som ${session.user.email}. Loggar ut för att skapa konto för ${invitation.email}...`);
        try {
          await signOut();
        } catch (e) {
          console.warn('Could not sign out prior to invitation signup:', e);
        }
      }

      // Register the user with enhanced error handling
      const signUpResult = await signUp(
        invitation.email,
        trimmedPassword,
        trimmedFirstName,
        trimmedLastName
      );
      
      console.log('🔥🔥🔥 InvitationSignup: SIGNUP RESULT RECEIVED:', {
        hasData: !!signUpResult.data,
        hasError: !!signUpResult.error,
        errorMessage: signUpResult.error?.message,
        errorDetails: signUpResult.error
      });
      
      const { data, error: signUpError } = signUpResult;

      if (signUpError) {
        console.error('🔥 InvitationSignup: SignUp error:', signUpError);
        throw signUpError;
      }

      console.log('🔥 InvitationSignup: SignUp successful, attempting to claim invitation and assign role...');

      try {
        const { data: claim, error: claimErr } = await (supabase as any).rpc('claim_pending_invitation_for_current_user');
        if (claimErr) {
          console.warn('🔥 InvitationSignup: Claim RPC error (likely awaiting email verification):', claimErr);
        } else if ((claim as any)?.status === 'claimed') {
          console.log('🔥 InvitationSignup: Invitation claimed and role assigned:', claim);
        } else {
          console.log('🔥 InvitationSignup: No claim performed (awaiting verification or no pending invitation).');
        }
      } catch (e) {
        console.warn('🔥 InvitationSignup: Claim RPC call failed:', e);
      }

      toast.success("Kontot har skapats! Kontrollera din e-post för verifiering.");
      
      // Redirect to auth page for verification message
      navigate("/auth", { 
        state: { 
          message: "Konto skapat! Kontrollera din e-post för att verifiera ditt konto innan du loggar in.",
          email: invitation.email
        }
      });

    } catch (error: any) {
      console.error('🔥 InvitationSignup: Registration error:', error);
      
      // Enhanced error message handling
      let errorMessage = "Ett fel uppstod vid registreringen";
      
      if (error.message) {
        if (error.message.includes('User already registered') || error.message.includes('already exists')) {
          errorMessage = "En användare med denna e-post existerar redan";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Ogiltig e-post adress";
        } else if (error.message.includes('Database error')) {
          errorMessage = "Databasfel - kontakta support";
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = "Nätverksfel - kontrollera din internetanslutning";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
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
          <CardTitle>Välkommen till NCCS!</CardTitle>
          <CardDescription>
            Du har bjudits in som <strong>{invitation.invited_role}</strong>. 
            Skapa ditt konto för att komma igång.
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

            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Minst 6 tecken"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Upprepa lösenordet"
                required
              />
            </div>

            <Button type="submit" disabled={isRegistering} className="w-full">
              {isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Skapar konto...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Skapa konto
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