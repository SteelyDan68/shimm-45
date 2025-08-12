import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';
import { useForcePasswordChange } from '@/hooks/useForcePasswordChange';

interface ForcePasswordChangeDialogProps {
  open: boolean;
}

export function ForcePasswordChangeDialog({ open }: ForcePasswordChangeDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  
  const { updatePassword } = useForcePasswordChange();

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Lösenordet måste vara minst 8 tecken långt';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Lösenordet måste innehålla minst en liten bokstav';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Lösenordet måste innehålla minst en stor bokstav';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Lösenordet måste innehålla minst en siffra';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validera lösenord
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    setIsUpdating(true);
    try {
      await updatePassword(newPassword);
      // Dialog stängs automatiskt när mustChangePassword blir false
    } catch (error: any) {
      setError(error.message || 'Kunde inte uppdatera lösenord');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-500" />
            Lösenordsbyte krävs
          </DialogTitle>
          <DialogDescription>
            Du måste byta ditt temporära lösenord innan du kan fortsätta använda systemet.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ditt nuvarande lösenord är temporärt. Välj ett nytt säkert lösenord för att fortsätta.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nytt lösenord</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minst 8 tecken med stor/liten bokstav och siffra"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Bekräfta nytt lösenord</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Upprepa det nya lösenordet"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Lösenordskrav:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Minst 8 tecken långt</li>
                <li>Minst en stor bokstav (A-Z)</li>
                <li>Minst en liten bokstav (a-z)</li>
                <li>Minst en siffra (0-9)</li>
              </ul>
            </div>
          </div>

          <Button type="submit" disabled={isUpdating} className="w-full">
            {isUpdating ? 'Uppdaterar...' : 'Uppdatera lösenord'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}