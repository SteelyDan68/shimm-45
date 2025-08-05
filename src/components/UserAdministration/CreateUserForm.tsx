import { useState, useEffect } from "react";
import { useAuth } from "@/providers/UnifiedAuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";

interface CreateUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
  bio?: string;
  assignCoach?: boolean;
  coachId?: string;
  sendInviteEmail?: boolean;
}

export const CreateUserForm = ({ onSuccess, onCancel }: CreateUserFormProps) => {
  const { user } = useAuth();
  const { canCreateUsers, canAssignCoaches } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [coaches, setCoaches] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<CreateUserData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "client",
    phone: "",
    organization: "",
    jobTitle: "",
    bio: "",
    assignCoach: false,
    coachId: "",
    sendInviteEmail: false
  });

  const loadCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          profiles:user_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('role', 'coach');

      if (error) throw error;

      const coachList = data
        ?.filter(item => item.profiles)
        .map(item => item.profiles)
        .filter(Boolean) || [];

      setCoaches(coachList);
    } catch (error) {
      console.error('Error loading coaches:', error);
    }
  };

  // Ladda coaches när komponenten mountas
  useEffect(() => {
    if (canAssignCoaches) {
      loadCoaches();
    }
  }, [canAssignCoaches]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateUsers) {
      toast.error('Du har inte behörighet att skapa användare');
      return;
    }

    setIsLoading(true);

    try {
      // Anropa admin-create-user edge function
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          extendedProfile: {
            phone: formData.phone,
            organization: formData.organization,
            job_title: formData.jobTitle,
            bio: formData.bio
          },
          sendInviteEmail: formData.sendInviteEmail
        }
      });

      if (error) {
        console.error('Admin create user error:', error);
        throw error;
      }

      // Om användaren skapades framgångsrikt och ska tilldelas en coach
      if (data.success && formData.assignCoach && formData.coachId && formData.role === 'client') {
        try {
          const { error: relationError } = await supabase
            .from('coach_client_assignments')
            .insert({
              coach_id: formData.coachId,
              client_id: data.user.id,
              assigned_by: user?.id,
              assigned_at: new Date().toISOString(),
              is_active: true
            });

          if (relationError) {
            console.error('Error assigning coach:', relationError);
            toast.error(`Användare skapad men kunde inte tilldela coach: ${relationError.message}`);
          } else {
            const selectedCoach = coaches.find(c => c.id === formData.coachId);
            const coachName = selectedCoach ? `${selectedCoach.first_name} ${selectedCoach.last_name}` : 'vald coach';
            toast.success(`Användare skapad och tilldelad till ${coachName}`);
          }
        } catch (coachError) {
          console.error('Coach assignment error:', coachError);
          toast.error('Användare skapad men kunde inte tilldela coach (nätverksfel)');
        }
      } else {
        toast.success(`Användare ${formData.firstName} ${formData.lastName} har skapats`);
      }

      // Återställ formulär
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "client",
        phone: "",
        organization: "",
        jobTitle: "",
        bio: "",
        assignCoach: false,
        coachId: "",
        sendInviteEmail: false
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Ett fel uppstod när användaren skulle skapas');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canCreateUsers) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Du har inte behörighet att skapa användare manuellt.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Skapa ny användare
        </CardTitle>
        <CardDescription>
          Registrera en ny användare manuellt i systemet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Förnamn</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Anna"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Efternamn</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Andersson"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-postadress</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="anna.andersson@exempel.se"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minst 8 tecken"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={generatePassword}
              >
                Generera
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Roll</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon (valfritt)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+46 70 123 45 67"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organisation (valfritt)</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="Företag AB"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Befattning (valfritt)</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="VD, Projektledare, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Kort beskrivning (valfritt)</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Kort beskrivning av användaren..."
              rows={3}
            />
          </div>

          {/* Coach-tilldelning för klienter */}
          {canAssignCoaches && formData.role === 'client' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <Label htmlFor="assignCoach">Tilldela coach direkt</Label>
                <Switch
                  id="assignCoach"
                  checked={formData.assignCoach}
                  onCheckedChange={(checked) => setFormData({ ...formData, assignCoach: checked })}
                />
              </div>
              
              {formData.assignCoach && (
                <div className="space-y-2">
                  <Label htmlFor="coachId">Välj coach</Label>
                  <Select 
                    value={formData.coachId} 
                    onValueChange={(value) => setFormData({ ...formData, coachId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj en coach" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches.map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          {coach.first_name} {coach.last_name} ({coach.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="sendInviteEmail"
                checked={formData.sendInviteEmail}
                onCheckedChange={(checked) => setFormData({ ...formData, sendInviteEmail: checked })}
              />
              <Label htmlFor="sendInviteEmail">Skicka välkomstmail</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Avbryt
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Skapar användare...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Skapa användare
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};