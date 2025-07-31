import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ExtendedProfileData, PRIMARY_ROLES, PLATFORMS, COUNTRIES } from '@/types/extendedProfile';

interface ExtendedProfileFormProps {
  onComplete: (data: ExtendedProfileData) => Promise<void>;
  onUploadProfilePicture: (file: File) => Promise<string>;
  isLoading: boolean;
  initialData: ExtendedProfileData | null;
}

export function ExtendedProfileForm({ 
  onComplete, 
  onUploadProfilePicture, 
  isLoading, 
  initialData 
}: ExtendedProfileFormProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  
  // Safe initialization with proper fallbacks
  const getDefaultFormData = (): ExtendedProfileData => ({
    basicInfo: {
      fullName: '',
      username: '',
      gender: '',
      dateOfBirth: '',
      profilePicture: '',
      bio: ''
    },
    contactInfo: {
      email: '',
      phone: '',
      address: {
        street: '',
        postalCode: '',
        city: '',
        country: ''
      }
    },
    digitalPresence: {
      instagram: '',
      youtube: '',
      tiktok: '',
      facebook: '',
      twitter: '',
      linkedin: '',
      website: ''
    },
    workProfile: {
      primaryRole: '',
      secondaryRole: '',
      niche: '',
      creativeStrengths: '',
      challenges: '',
      activePlatforms: []
    },
    healthInfo: {
      diagnoses: '',
      physicalVariations: '',
      generalHealth: ''
    },
    systemSettings: {
      notificationPreferences: {
        email: true,
        sms: false,
        inApp: true
      },
      allowAiAnalysis: true,
      userRole: ''
    }
  });

  // Safely merge initialData with defaults
  const initializeFormData = (): ExtendedProfileData => {
    const defaults = getDefaultFormData();
    if (!initialData) return defaults;

    return {
      basicInfo: {
        ...defaults.basicInfo,
        ...initialData.basicInfo
      },
      contactInfo: {
        ...defaults.contactInfo,
        ...initialData.contactInfo,
        address: {
          ...defaults.contactInfo.address,
          ...initialData.contactInfo?.address
        }
      },
      digitalPresence: {
        ...defaults.digitalPresence,
        ...initialData.digitalPresence
      },
      workProfile: {
        ...defaults.workProfile,
        ...initialData.workProfile
      },
      healthInfo: {
        ...defaults.healthInfo,
        ...initialData.healthInfo
      },
      systemSettings: {
        ...defaults.systemSettings,
        ...initialData.systemSettings,
        notificationPreferences: {
          ...defaults.systemSettings.notificationPreferences,
          ...initialData.systemSettings?.notificationPreferences
        }
      }
    };
  };

  const [formData, setFormData] = useState<ExtendedProfileData>(initializeFormData());

  const handleInputChange = (section: keyof ExtendedProfileData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (section: keyof ExtendedProfileData, subsection: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [field]: value
        }
      }
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await onUploadProfilePicture(file);
      handleInputChange('basicInfo', 'profilePicture', imageUrl);
      toast({
        title: "Profilbild uppladdad",
        description: "Din profilbild har uppdaterats"
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte ladda upp profilbild",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await onComplete(formData);
      toast({
        title: "Profil sparad",
        description: "Din utökade profil har sparats"
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara profil",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Grundinformation */}
      <Card>
        <CardHeader>
          <CardTitle>Grundinformation</CardTitle>
          <CardDescription>
            Grundläggande information om dig
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {formData.basicInfo.profilePicture ? (
                <img 
                  src={formData.basicInfo.profilePicture} 
                  alt="Profil" 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploading}
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="fullName">Fullständigt namn</Label>
              <Input
                id="fullName"
                value={formData.basicInfo.fullName}
                onChange={(e) => handleInputChange('basicInfo', 'fullName', e.target.value)}
                placeholder="För- och efternamn"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Användarnamn</Label>
              <Input
                id="username"
                value={formData.basicInfo.username}
                onChange={(e) => handleInputChange('basicInfo', 'username', e.target.value)}
                placeholder="Användarnamn"
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Födelsedatum</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.basicInfo.dateOfBirth}
                onChange={(e) => handleInputChange('basicInfo', 'dateOfBirth', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Biografi</Label>
            <Textarea
              id="bio"
              value={formData.basicInfo.bio}
              onChange={(e) => handleInputChange('basicInfo', 'bio', e.target.value)}
              placeholder="Berätta kort om dig själv..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Kontaktuppgifter */}
      <Card>
        <CardHeader>
          <CardTitle>Kontaktuppgifter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={formData.contactInfo.email}
                onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                placeholder="din@email.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.contactInfo.phone}
                onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value)}
                placeholder="+46 70 123 45 67"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Stad</Label>
              <Input
                id="city"
                value={formData.contactInfo.address?.city}
                onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'city', e.target.value)}
                placeholder="Stockholm"
              />
            </div>
            <div>
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                value={formData.contactInfo.address?.country}
                onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'country', e.target.value)}
                placeholder="Sverige"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Systeminställningar */}
      <Card>
        <CardHeader>
          <CardTitle>Inställningar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Notifikationsinställningar</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailNotifications"
                  checked={formData.systemSettings.notificationPreferences.email}
                  onCheckedChange={(checked) => 
                    handleNestedInputChange('systemSettings', 'notificationPreferences', 'email', checked)
                  }
                />
                <Label htmlFor="emailNotifications">E-postnotifikationer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inAppNotifications"
                  checked={formData.systemSettings.notificationPreferences.inApp}
                  onCheckedChange={(checked) => 
                    handleNestedInputChange('systemSettings', 'notificationPreferences', 'inApp', checked)
                  }
                />
                <Label htmlFor="inAppNotifications">Notifikationer i appen</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowAiAnalysis"
              checked={formData.systemSettings.allowAiAnalysis}
              onCheckedChange={(checked) => 
                handleInputChange('systemSettings', 'allowAiAnalysis', checked)
              }
            />
            <Label htmlFor="allowAiAnalysis">Tillåt AI-analys av mitt innehåll</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="min-w-32"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sparar...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Spara profil
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}