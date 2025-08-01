import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Key, Eye, EyeOff } from 'lucide-react';

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
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const { toast } = useToast();

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    setNewPassword(password.split('').sort(() => Math.random() - 0.5).join(''));
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Fel",
        description: "Lösenordet måste vara minst 6 tecken långt",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Lösenord uppdaterat",
        description: `Lösenordet för ${userName} har uppdaterats framgångsrikt`
      });

      setNewPassword('');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera lösenord: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordResetEmail = async () => {
    setIsEmailLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: "E-post skickat",
        description: `Lösenordsåterställningslänk har skickats till ${userEmail}`
      });

      setIsOpen(false);
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka återställningslänk: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsEmailLoading(false);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lösenordshantering för {userName}</DialogTitle>
          <DialogDescription>
            Återställ lösenord direkt eller skicka en återställningslänk
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Direct Password Reset */}
          <div className="space-y-4">
            <h4 className="font-medium">Sätt nytt lösenord direkt</h4>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nytt lösenord</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minst 6 tecken"
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
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generera
                </Button>
              </div>
            </div>
            <Button onClick={resetPassword} disabled={isLoading || !newPassword}>
              {isLoading ? 'Uppdaterar...' : 'Uppdatera lösenord'}
            </Button>
          </div>

          {/* Email Reset */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Eller skicka återställningslänk</h4>
            <p className="text-sm text-muted-foreground">
              Skicka en lösenordsåterställningslänk till {userEmail}
            </p>
            <Button 
              variant="outline" 
              onClick={sendPasswordResetEmail}
              disabled={isEmailLoading}
            >
              {isEmailLoading ? 'Skickar...' : 'Skicka återställningslänk'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}