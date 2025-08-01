import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { User, MapPin, Phone, Briefcase, Users, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { ExtendedProfileData } from '@/types/extendedProfile';
import { COUNTRIES } from '@/types/extendedProfile';
import { PasswordManagement } from '../UserAdministration/PasswordManagement';

export function ClientProfileEditor() {
  const { user, profile: authProfile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
  const [formData, setFormData] = useState<ExtendedProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    address: {
      street: '',
      postalCode: '',
      city: '',
      country: 'Sverige'
    },
    organization: '',
    job_title: '',
    instagram_handle: '',
    youtube_handle: '',
    tiktok_handle: '',
    facebook_handle: '',
    twitter_handle: '',
    snapchat_handle: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      setIsLoadingProfile(true);
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          toast({
            title: "Fel",
            description: "Kunde inte ladda profildata",
            variant: "destructive"
          });
          return;
        }

        if (profileData) {
          setFormData({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            bio: profileData.bio || '',
            address: (profileData.address as any) || {
              street: '',
              postalCode: '',
              city: '',
              country: 'Sverige'
            },
            organization: profileData.organization || '',
            job_title: profileData.job_title || '',
            instagram_handle: profileData.instagram_handle || '',
            youtube_handle: profileData.youtube_handle || '',
            tiktok_handle: profileData.tiktok_handle || '',
            facebook_handle: profileData.facebook_handle || '',
            twitter_handle: profileData.twitter_handle || '',
            snapchat_handle: profileData.snapchat_handle || '',
            personnummer: (profileData.profile_metadata as any)?.personnummer || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Fel",
          description: "Ett oväntat fel uppstod",
          variant: "destructive"
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.id, toast]);

  const handleInputChange = (field: keyof ExtendedProfileData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (field: keyof ExtendedProfileData, subfield: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as any),
        [subfield]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const updateData: any = {
        phone: formData.phone,
        bio: formData.bio,
        address: formData.address,
        organization: formData.organization,
        job_title: formData.job_title,
        instagram_handle: formData.instagram_handle,
        youtube_handle: formData.youtube_handle,
        tiktok_handle: formData.tiktok_handle,
        facebook_handle: formData.facebook_handle,
        twitter_handle: formData.twitter_handle,
        snapchat_handle: formData.snapchat_handle
      };

      // Add personnummer to metadata if provided
      if (formData.personnummer) {
        updateData.profile_metadata = {
          personnummer: formData.personnummer
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profil uppdaterad",
        description: "Dina ändringar har sparats framgångsrikt"
      });
      
      // Update auth profile cache
      await updateProfile(updateData);
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara ändringar: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Laddar profil...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Min profil</h2>
          <p className="text-muted-foreground">Hantera dina personliga uppgifter och inställningar</p>
        </div>
      </div>

      {/* Basic Information - Read-only display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Grundinformation
          </CardTitle>
          <CardDescription>
            Namn och e-post hanteras av systemadministratörer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Förnamn</Label>
              <Input value={formData.first_name} disabled />
            </div>
            <div>
              <Label>Efternamn</Label>
              <Input value={formData.last_name} disabled />
            </div>
          </div>
          <div>
            <Label>E-postadress</Label>
            <Input value={formData.email} disabled />
          </div>
          
          {formData.personnummer && (
            <div>
              <Label>Personnummer</Label>
              <Input value={formData.personnummer} disabled />
              <p className="text-xs text-muted-foreground mt-1">
                Hanteras av systemadministratörer
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editable Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Kontaktinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          
          <div>
            <Label htmlFor="bio">Biografi</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Berätta kort om dig själv..."
              rows={3}
            />
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
              value={formData.address?.street || ''}
              onChange={(e) => handleNestedInputChange('address', 'street', e.target.value)}
              placeholder="Gatunamnsgatan 123"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="postalCode">Postnummer</Label>
              <Input
                id="postalCode"
                value={formData.address?.postalCode || ''}
                onChange={(e) => handleNestedInputChange('address', 'postalCode', e.target.value)}
                placeholder="123 45"
                maxLength={6}
              />
            </div>
            <div>
              <Label htmlFor="city">Stad</Label>
              <Input
                id="city"
                value={formData.address?.city || ''}
                onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
                placeholder="Stockholm"
              />
            </div>
            <div>
              <Label htmlFor="country">Land</Label>
              <Select 
                value={formData.address?.country || 'Sverige'} 
                onValueChange={(value) => handleNestedInputChange('address', 'country', value)}
              >
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

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professionell information
          </CardTitle>
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
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sociala medier
          </CardTitle>
          <CardDescription>
            Ange endast användarnamnet (utan @ tecken)
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

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="p-0 h-auto font-semibold text-lg"
            >
              {showPasswordSection ? <EyeOff className="h-5 w-5 mr-2" /> : <Eye className="h-5 w-5 mr-2" />}
              Lösenordshantering
            </Button>
          </CardTitle>
          <CardDescription>
            Byt lösenord och hantera säkerhetsinställningar
          </CardDescription>
        </CardHeader>
        {showPasswordSection && (
          <CardContent>
            <PasswordManagement 
              userId={user?.id} 
              userEmail={formData.email || ''} 
              userName={`${formData.first_name} ${formData.last_name}`} 
            />
          </CardContent>
        )}
      </Card>

      <Separator />

      {/* Action Buttons */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Sparar...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Spara ändringar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}