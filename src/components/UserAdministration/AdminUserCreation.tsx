import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Eye, EyeOff, Mail, MapPin, User, Shield, Key, Users } from 'lucide-react';
import type { AppRole } from '@/hooks/useAuth';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePasswordStrength, sanitizeText } from '@/utils/inputSanitization';
import { COUNTRIES } from '@/types/extendedProfile';

const roleLabels: Record<AppRole, string> = {
  superadmin: "Superadministratör",
  admin: "Administratör", 
  coach: "Coach",
  client: "Klient"
};

interface AdminUserCreationProps {
  onUserCreated?: () => void;
}

interface UserFormData {
  // Basic Information
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  personnummer: string;
  phone: string;
  
  // Address Information
  street: string;
  postalCode: string;
  city: string;
  country: string;
  
  // Role and Access
  role: AppRole;
  
  // Social Media Platforms
  instagram_handle: string;
  youtube_handle: string;
  tiktok_handle: string;
  facebook_handle: string;
  twitter_handle: string;
  snapchat_handle: string;
  
  // Additional Information
  bio: string;
  organization: string;
  job_title: string;
  
  // Email Invitation
  sendInviteEmail: boolean;
}

export function AdminUserCreation({ onUserCreated }: AdminUserCreationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { hasRole } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    personnummer: '',
    phone: '',
    street: '',
    postalCode: '',
    city: '',
    country: 'Sverige',
    role: 'client',
    instagram_handle: '',
    youtube_handle: '',
    tiktok_handle: '',
    facebook_handle: '',
    twitter_handle: '',
    snapchat_handle: '',
    bio: '',
    organization: '',
    job_title: '',
    sendInviteEmail: true
  });

  // Determine available roles based on current user's role
  const getAvailableRoles = (): AppRole[] => {
    if (hasRole('superadmin')) {
      return ['superadmin', 'admin', 'coach', 'client'];
    } else if (hasRole('admin')) {
      return ['admin', 'coach', 'client'];
    } else if (hasRole('coach')) {
      return ['client'];
    }
    return ['client'];
  };

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
    for (let i = 4; i < 16; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    setFormData(prev => ({ ...prev, password }));
  };

  const validatePersonnummer = (personnummer: string): boolean => {
    // Swedish personal number validation (12 digits: YYYYMMDDXXXX)
    const cleaned = personnummer.replace(/\D/g, '');
    return cleaned.length === 12 && /^\d{12}$/.test(cleaned);
  };

  const formatPersonnummer = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 8) {
      return cleaned;
    }
    return cleaned.slice(0, 8) + '-' + cleaned.slice(8, 12);
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    if (field === 'personnummer') {
      value = formatPersonnummer(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!validateEmail(formData.email)) {
        throw new Error('Ogiltig e-postadress');
      }

      const passwordValidation = validatePasswordStrength(formData.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Lösenordet uppfyller inte kraven: ${passwordValidation.errors.join(', ')}`);
      }

      if (formData.personnummer && !validatePersonnummer(formData.personnummer)) {
        throw new Error('Personnummer måste vara 12 siffror (YYYYMMDDXXXX)');
      }

      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        throw new Error('För- och efternamn är obligatoriska');
      }

      if (!formData.role || formData.role.trim() === '') {
        throw new Error('En roll måste väljas för användaren');
      }

      // Prepare data for backend
      const userData = {
        email: sanitizeText(formData.email.toLowerCase().trim()),
        password: formData.password,
        firstName: sanitizeText(formData.firstName.trim()),
        lastName: sanitizeText(formData.lastName.trim()),
        role: formData.role,
        
        // Extended profile data
        extendedProfile: {
          personnummer: formData.personnummer ? formData.personnummer.replace(/\D/g, '') : undefined,
          phone: formData.phone || undefined,
          address: {
            street: formData.street || undefined,
            postalCode: formData.postalCode || undefined,
            city: formData.city || undefined,
            country: formData.country || undefined
          },
          bio: formData.bio || undefined,
          organization: formData.organization || undefined,
          job_title: formData.job_title || undefined,
          instagram_handle: formData.instagram_handle || undefined,
          youtube_handle: formData.youtube_handle || undefined,
          tiktok_handle: formData.tiktok_handle || undefined,
          facebook_handle: formData.facebook_handle || undefined,
          twitter_handle: formData.twitter_handle || undefined,
          snapchat_handle: formData.snapchat_handle || undefined
        },
        
        sendInviteEmail: formData.sendInviteEmail
      };

      console.log('Attempting to create user with data:', userData);

      // Call enhanced backend function
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: userData
      });

      console.log('Response from admin-create-user:', { data, error });

      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }

      if (data?.success) {
        console.log('User created successfully:', data);
        toast({
          title: "Användare skapad",
          description: `Användare ${formData.email} har skapats framgångsrikt.${formData.sendInviteEmail ? ' En inbjudan har skickats via e-post.' : ''}`,
        });

        // Reset form
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          personnummer: '',
          phone: '',
          street: '',
          postalCode: '',
          city: '',
          country: 'Sverige',
          role: 'client',
          instagram_handle: '',
          youtube_handle: '',
          tiktok_handle: '',
          facebook_handle: '',
          twitter_handle: '',
          snapchat_handle: '',
          bio: '',
          organization: '',
          job_title: '',
          sendInviteEmail: true
        });
        
        setIsOpen(false);
        onUserCreated?.();
      } else {
        throw new Error(data.error || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      let errorMessage = error.message || "Kunde inte skapa användare";
      
      // Handle specific error cases
      if (errorMessage.includes('Edge Function returned a non-2xx status code')) {
        errorMessage = 'Ett tekniskt fel inträffade. Kontrollera att alla fält är korrekt ifyllda och försök igen.';
      }
      
      toast({
        title: "Fel vid användarskap",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Lägg till användare
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skapa ny användare</DialogTitle>
          <DialogDescription>
            Komplett användarregistrering med CRM-funktionalitet
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Grundinformation
              </CardTitle>
              <CardDescription>
                Obligatoriska personuppgifter och kontaktinformation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Förnamn *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    placeholder="Förnamn"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Efternamn *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    placeholder="Efternamn"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="personnummer">Personnummer</Label>
                <Input
                  id="personnummer"
                  value={formData.personnummer}
                  onChange={(e) => handleInputChange('personnummer', e.target.value)}
                  placeholder="YYYYMMDD-XXXX"
                  maxLength={13}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  12 siffror i format YYYYMMDD-XXXX (valfritt)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-postadress *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    placeholder="anvandare@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefonnummer</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+46 70 123 45 67"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adressinformation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street">Gatuadress</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="Gatunamnsgatan 123"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="postalCode">Postnummer</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="123 45"
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Stad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Stockholm"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Land</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj land" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Åtkomst och säkerhet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="role">Användarroll *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value as AppRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj roll" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map(role => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="password">Lösenord *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      placeholder="Minst 8 tecken"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Generera
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendInviteEmail"
                  checked={formData.sendInviteEmail}
                  onCheckedChange={(checked) => handleInputChange('sendInviteEmail', checked)}
                />
                <Label htmlFor="sendInviteEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Skicka inbjudan via e-post
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Sociala plattformar
              </CardTitle>
              <CardDescription>
                Valfria sociala mediekonton (ange utan @ tecken)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instagram_handle">Instagram</Label>
                  <Input
                    id="instagram_handle"
                    value={formData.instagram_handle}
                    onChange={(e) => handleInputChange('instagram_handle', e.target.value)}
                    placeholder="användarnamn"
                  />
                </div>
                <div>
                  <Label htmlFor="youtube_handle">YouTube</Label>
                  <Input
                    id="youtube_handle"
                    value={formData.youtube_handle}
                    onChange={(e) => handleInputChange('youtube_handle', e.target.value)}
                    placeholder="kanalnamn"
                  />
                </div>
                <div>
                  <Label htmlFor="tiktok_handle">TikTok</Label>
                  <Input
                    id="tiktok_handle"
                    value={formData.tiktok_handle}
                    onChange={(e) => handleInputChange('tiktok_handle', e.target.value)}
                    placeholder="användarnamn"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook_handle">Facebook</Label>
                  <Input
                    id="facebook_handle"
                    value={formData.facebook_handle}
                    onChange={(e) => handleInputChange('facebook_handle', e.target.value)}
                    placeholder="sidnamn"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter_handle">Twitter/X</Label>
                  <Input
                    id="twitter_handle"
                    value={formData.twitter_handle}
                    onChange={(e) => handleInputChange('twitter_handle', e.target.value)}
                    placeholder="användarnamn"
                  />
                </div>
                <div>
                  <Label htmlFor="snapchat_handle">Snapchat</Label>
                  <Input
                    id="snapchat_handle"
                    value={formData.snapchat_handle}
                    onChange={(e) => handleInputChange('snapchat_handle', e.target.value)}
                    placeholder="användarnamn"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Ytterligare information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization">Organisation/Företag</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    placeholder="Företagsnamn"
                  />
                </div>
                <div>
                  <Label htmlFor="job_title">Jobbtitel</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    placeholder="Befattning"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Kort biografi</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Beskriv kort användaren eller deras verksamhet..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Avbryt
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
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
      </DialogContent>
    </Dialog>
  );
}