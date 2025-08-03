import { useState } from "react";
import { useAuth } from "@/providers/UnifiedAuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

interface SendInvitationFormProps {
  onSuccess?: () => void;
}

export const SendInvitationForm = ({ onSuccess }: SendInvitationFormProps) => {
  const { user, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("client");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !user) return;

    setIsLoading(true);

    try {
      // Call the edge function to send invitation
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email,
          role,
          inviterName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'SHIMM-teamet'
        }
      });

      if (error) throw error;

      toast.success(`Inbjudan skickad till ${email}`);
      setEmail("");
      setRole("client");
      onSuccess?.();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || 'Ett fel uppstod när inbjudan skulle skickas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Skicka inbjudan
        </CardTitle>
        <CardDescription>
          Bjud in nya användare till systemet via e-post
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-postadress</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="användare@exempel.se"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Roll</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Välj roll" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Klient</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isLoading || !email} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Skickar inbjudan...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Skicka inbjudan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};