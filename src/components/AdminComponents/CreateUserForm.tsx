import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Eye, EyeOff, Shield, Copy, AlertTriangle } from 'lucide-react';

interface CreateUserFormProps {
  onSuccess: () => void;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'client',
    temporaryPassword: ''
  });
  const { toast } = useToast();

  const generateSecurePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    // Garantera minst en av varje typ
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Fyll på till 12 tecken
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Blanda om för säkerhet
    const shuffled = password.split('').sort(() => Math.random() - 0.5).join('');
    setFormData(prev => ({ ...prev, temporaryPassword: shuffled }));
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(formData.temporaryPassword);
      toast({
        title: "Kopierat",
        description: "Temporärt lösenord kopierat till urklipp"
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte kopiera lösenord",
        variant: "destructive"
      });
    }
  };

  const copyCreatedUserInfo = async () => {
    if (!createdUser) return;
    
    const userInfo = `
E-post: ${createdUser.email}
Temporärt lösenord: ${createdUser.temporary_password}
Roll: ${createdUser.role}

VIKTIGT: Användaren måste byta lösenord vid första inloggning.
    `.trim();
    
    try {
      await navigator.clipboard.writeText(userInfo);
      toast({
        title: "Kopierat",
        description: "Användarinformation kopierad till urklipp"
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte kopiera användarinformation",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.temporaryPassword) {
      toast({
        title: "Fel",
        description: "Alla fält måste fyllas i",
        variant: "destructive"
      });
      return;
    }

    if (formData.temporaryPassword.length < 8) {
      toast({
        title: "Fel", 
        description: "Temporärt lösenord måste vara minst 8 tecken",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: formData
      });

      if (error) throw error;

      if (data?.success) {
        setCreatedUser(data);
        toast({
          title: "Användare skapad",
          description: `${formData.email} har skapats framgångsrikt`
        });
        
        // Återställ formulär men behåll dialogen öppen för att visa resultatet
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'client',
          temporaryPassword: ''
        });
        
        onSuccess();
      } else {
        throw new Error(data?.error || 'Okänt fel');
      }
    } catch (error: any) {
      console.error('Create user error:', error);
      toast({
        title: "Fel",
        description: error?.message || "Kunde inte skapa användare",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'client',
      temporaryPassword: ''
    });
    setCreatedUser(null);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          Skapa användare manuellt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Skapa användare manuellt
          </DialogTitle>
          <DialogDescription>
            Skapa en användare direkt med temporärt lösenord. Användaren måste byta lösenord vid första inloggning.
          </DialogDescription>
        </DialogHeader>
        
        {createdUser ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Användare skapad framgångsrikt!</CardTitle>
              <CardDescription className="text-green-700">
                Användaren har skapats och måste informeras om inloggningsuppgifterna.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">E-post</Label>
                  <p className="text-sm bg-white p-2 rounded border">{createdUser.email}</p>
                </div>
                <div>
                  <Label className="font-medium">Roll</Label>
                  <p className="text-sm bg-white p-2 rounded border">{createdUser.role}</p>
                </div>
              </div>
              
              <div>
                <Label className="font-medium">Temporärt lösenord</Label>
                <div className="flex gap-2">
                  <Input 
                    type="password" 
                    value={createdUser.temporary_password}
                    readOnly
                    className="bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyCreatedUserInfo}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Viktigt:</strong> Informera användaren om inloggningsuppgifterna på ett säkert sätt. 
                  Användaren måste byta lösenord vid första inloggning.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={copyCreatedUserInfo} variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Kopiera info
                </Button>
                <Button onClick={resetForm} className="flex-1">
                  Skapa nästa användare
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Förnamn *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Efternamn *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-postadress *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Roll *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Klient</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temporaryPassword">Temporärt lösenord *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="temporaryPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.temporaryPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, temporaryPassword: e.target.value }))}
                    placeholder="Minst 8 tecken"
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
                <Button type="button" variant="outline" onClick={generateSecurePassword}>
                  Generera
                </Button>
                <Button type="button" variant="outline" onClick={copyPassword}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Användaren kommer att tvingas byta lösenord vid första inloggning. 
                Se till att informera användaren om inloggningsuppgifterna på ett säkert sätt.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                Avbryt
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Skapar...' : 'Skapa användare'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}