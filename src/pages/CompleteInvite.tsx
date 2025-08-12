import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function CompleteInvite() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    document.title = "Slutför inbjudan – SHIMMS";

    // detectSessionInUrl=true i klienten hanterar kodbytet automatiskt
    // Vänta in sessionen så vi vet om länken loggat in användaren temporärt
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const userEmail = data.session?.user?.email ?? null;
      setEmail(userEmail);
      setLoading(false);
    };
    init();
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Länken kunde inte verifieras. Försök igen från e‑posten.");
      return;
    }
    if (password.length < 12) {
      toast.error("Lösenord måste vara minst 12 tecken.");
      return;
    }
    if (password !== confirm) {
      toast.error("Lösenorden matchar inte.");
      return;
    }

    setUpdating(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;

      // Claima inbjudan och tilldela roll om sådan finns
      await supabase.rpc("claim_pending_invitation_for_current_user");

      toast.success("Lösenord satt och inbjudan klar! Välkommen.");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.message || "Kunde inte sätta lösenordet");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Laddar…</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Kunde inte verifiera länk</CardTitle>
            <CardDescription>
              Länken verkar ogiltig eller har redan använts. Försök igen från din e‑post eller logga in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/auth")}>Gå till inloggning</Button>
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
          <CardTitle>Slutför din inbjudan</CardTitle>
          <CardDescription>
            E‑post verifierad för <strong>{email}</strong>. Sätt ditt lösenord för att komma igång.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Av säkerhetsskäl kräver vi e‑postverifiering och att du väljer ett starkt lösenord (minst 12 tecken).
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nytt lösenord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={12}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Bekräfta lösenord</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={12}
                required
              />
            </div>

            <Button type="submit" disabled={updating} className="w-full">
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Sätt lösenord
                </>
              )}
            </Button>

            <div className="text-center">
              <Button type="button" variant="link" onClick={() => navigate("/auth")}>Gå till inloggning</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
