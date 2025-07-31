import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Key, RefreshCw, Settings } from 'lucide-react';

interface PasswordManagementProps {
  userId: string;
  userEmail: string;
  userName: string;
}

export function PasswordManagement({ userId, userEmail, userName }: PasswordManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('***HIDDEN***');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const { toast } = useToast();

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const resetPassword = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Lösenord uppdaterat",
        description: `Lösenordet för ${userName} har uppdaterats.`,
      });

      setCurrentPassword(newPassword);
      setNewPassword('');
      setIsOpen(false);
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

  const sendPasswordResetEmail = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Återställningsmail skickat",
        description: `Ett återställningsmail har skickats till ${userEmail}.`,
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="h-4 w-4 mr-2" />
          Hantera lösenord
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Lösenordshantering för {userName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Password Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Nuvarande lösenord</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  readOnly
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Obs: Lösenord visas endast efter att det har ändrats i denna session.
              </p>
            </CardContent>
          </Card>

          {/* Password Reset Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Återställ lösenord</CardTitle>
              <CardDescription>
                Välj metod för att återställa användarens lösenord
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Generate New Password */}
              <div className="space-y-3">
                <Label>Generera nytt lösenord</Label>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ange nytt lösenord eller generera"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={resetPassword}
                  disabled={!newPassword || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Uppdaterar...' : 'Sätt nytt lösenord'}
                </Button>
              </div>

              {/* Send Reset Email */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <Label>Skicka återställningsmail</Label>
                  <p className="text-sm text-muted-foreground">
                    Skicka ett mail till användaren så de kan återställa lösenordet själva.
                  </p>
                  <Button
                    variant="outline"
                    onClick={sendPasswordResetEmail}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Skicka återställningsmail till {userEmail}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}