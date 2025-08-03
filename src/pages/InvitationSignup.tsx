import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInvitations } from "@/hooks/useInvitations";
import { useAuth } from "@/providers/UnifiedAuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Mail, Lock, User, Loader2, CheckCircle, XCircle } from "lucide-react";

export const InvitationSignup = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { validateInvitation, acceptInvitation } = useInvitations();
  const { signUp } = useAuth();

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

    if (!invitation) return;

    if (formData.password !== formData.confirmPassword) {
      toast.error("Lösenorden matchar inte");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Lösenordet måste vara minst 6 tecken långt");
      return;
    }

    setIsRegistering(true);

    try {
      // Register the user
      const { error: signUpError } = await signUp(
        invitation.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );

      if (signUpError) throw signUpError;

      // Mark invitation as accepted
      await acceptInvitation(invitation.invitation_id);

      toast.success("Kontot har skapats! Kontrollera din e-post för verifiering.");
      
      // Redirect to auth page for verification message
      navigate("/auth", { 
        state: { 
          message: "Konto skapat! Kontrollera din e-post för att verifiera ditt konto innan du loggar in." 
        }
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Ett fel uppstod vid registreringen");
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
          <CardTitle>Välkommen till SHIMM!</CardTitle>
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