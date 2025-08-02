import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, Camera, Save, User, Briefcase, Phone, Settings } from 'lucide-react';
import type { ExtendedProfileData } from '@/types/extendedProfile';
import { PRIMARY_ROLES, PLATFORMS, COUNTRIES } from '@/types/extendedProfile';

interface ExtendedProfileFormProps {
  onComplete: (data: ExtendedProfileData) => Promise<void>;
  onUploadProfilePicture: (file: File) => Promise<string>;
  isLoading: boolean;
  initialData: ExtendedProfileData | null;
  isClientView?: boolean; // New prop to indicate if this is for client self-editing
}

export function ExtendedProfileForm({ 
  onComplete, 
  onUploadProfilePicture, 
  isLoading, 
  initialData,
  isClientView = false
}: ExtendedProfileFormProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  
  // Initialize form with default values or initialData
  const getDefaultFormData = (): ExtendedProfileData => ({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    bio: '',
    date_of_birth: '',
    gender: '',
    address: {
      street: '',
      postalCode: '',
      city: '',
      country: ''
    },
    location: '',
    organization: '',
    department: '',
    job_title: '',
    primary_role: '',
    secondary_role: '',
    niche: '',
    creative_strengths: '',
    challenges: '',
    instagram_handle: '',
    youtube_handle: '',
    tiktok_handle: '',
    facebook_handle: '',
    twitter_handle: '',
    snapchat_handle: '',
    manager_name: '',
    manager_email: '',
    primary_contact_name: '',
    primary_contact_email: '',
    physical_limitations: '',
    neurodiversity: '',
    client_category: '',
    client_status: 'active',
    tags: [],
    platforms: [],
    preferences: {
      notifications: {
        email: true,
        sms: false,
        inApp: true
      },
      allowAiAnalysis: true
    },
    custom_fields: {},
    profile_metadata: {}
  });

  const [formData, setFormData] = useState<ExtendedProfileData>(() => ({
    ...getDefaultFormData(),
    ...initialData
  }));

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await onUploadProfilePicture(file);
      handleInputChange('avatar_url', imageUrl);
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

  const validateForm = () => {
    const errors: string[] = [];
    
    // Obligatoriska fält
    if (!formData.date_of_birth) {
      errors.push('Födelsedatum är obligatoriskt');
    }
    
    if (!formData.gender) {
      errors.push('Kön är obligatoriskt');
    }
    
    // Minst ett sociala medier-fält måste vara ifyllt
    const socialMediaFields = [
      formData.instagram_handle,
      formData.youtube_handle,
      formData.tiktok_handle,
      formData.facebook_handle,
      formData.twitter_handle,
      formData.snapchat_handle
    ];
    
    const hasSocialMedia = socialMediaFields.some(field => field && field.trim().length > 0);
    if (!hasSocialMedia) {
      errors.push('Minst ett sociala medier-fält måste fyllas i');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    try {
      const validationErrors = validateForm();
      
      if (validationErrors.length > 0) {
        toast({
          title: "Ofullständig profil",
          description: validationErrors.join(', '),
          variant: "destructive"
        });
        return;
      }
      
      await onComplete(formData);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleTagsChange = (value: string) => {
    const tagsArray = value.split(',').map(tag => tag.trim()).filter(Boolean);
    handleInputChange('tags', tagsArray);
  };

  const handlePlatformsChange = (platform: string, checked: boolean) => {
    const currentPlatforms = formData.platforms || [];
    if (checked) {
      handleInputChange('platforms', [...currentPlatforms, platform]);
    } else {
      handleInputChange('platforms', currentPlatforms.filter(p => p !== platform));
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Grundinformation
          </CardTitle>
          <CardDescription>
            {isClientView 
              ? "Namn och e-post hanteras av systemadministratörer och kan inte ändras här"
              : "Namn och kontaktuppgifter hanteras i din kontoprofil och onboarding"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {formData.avatar_url ? (
                <img 
                  src={formData.avatar_url} 
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
            <div className="flex-1 space-y-2">
              <div className="text-sm text-muted-foreground">
                Nuvarande namn: {formData.first_name} {formData.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                E-post: {formData.email}
              </div>
              {isClientView && formData.personnummer && (
                <div className="text-sm text-muted-foreground">
                  Personnummer: {formData.personnummer}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Biografi</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Berätta kort om dig själv..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                Födelsedatum <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className={!formData.date_of_birth ? 'border-destructive' : ''}
              />
              {!formData.date_of_birth && (
                <p className="text-xs text-destructive mt-1">Detta fält är obligatoriskt</p>
              )}
            </div>
            <div>
              <Label htmlFor="gender" className="text-sm font-medium">
                Kön <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger className={!formData.gender ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Välj kön" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="man">Man</SelectItem>
                  <SelectItem value="kvinna">Kvinna</SelectItem>
                  <SelectItem value="annat">Annat</SelectItem>
                  <SelectItem value="vill_inte_ange">Vill inte ange</SelectItem>
                </SelectContent>
              </Select>
              {!formData.gender && (
                <p className="text-xs text-destructive mt-1">Detta fält är obligatoriskt</p>
              )}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="organization">Organisation/Företag</Label>
              <Input
                id="organization"
                value={formData.organization || ''}
                onChange={(e) => handleInputChange('organization', e.target.value)}
                placeholder="Företagsnamn"
              />
            </div>
            <div>
              <Label htmlFor="jobTitle">Jobbtitel</Label>
              <Input
                id="jobTitle"
                value={formData.job_title || ''}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
                placeholder="Din titel"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Avdelning</Label>
              <Input
                id="department"
                value={formData.department || ''}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Avdelning"
              />
            </div>
            <div>
              <Label htmlFor="primaryRole">Primär roll</Label>
              <Select value={formData.primary_role || ''} onValueChange={(value) => handleInputChange('primary_role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj primär roll" />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_ROLES.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="niche">Nisch</Label>
              <Input
                id="niche"
                value={formData.niche || ''}
                onChange={(e) => handleInputChange('niche', e.target.value)}
                placeholder="Din specialitet/nisch"
              />
            </div>
            <div>
              <Label htmlFor="clientCategory">Klientkategori</Label>
              <Input
                id="clientCategory"
                value={formData.client_category || ''}
                onChange={(e) => handleInputChange('client_category', e.target.value)}
                placeholder="Typ av klient"
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Contact & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Kontakt & plats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+46 70 123 45 67"
              />
            </div>
            <div>
              <Label htmlFor="location">Plats</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Stockholm, Sverige"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Select value={formData.address?.country || ''} onValueChange={(value) => handleNestedInputChange('address', 'country', value)}>
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

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle>
            Sociala medier <span className="text-destructive">*</span>
          </CardTitle>
          <CardDescription>
            Fyll i minst ett av dina sociala medier-konton för att aktivera dina pillars
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram_handle || ''}
                onChange={(e) => handleInputChange('instagram_handle', e.target.value)}
                placeholder="användarnamn"
              />
              <p className="text-xs text-muted-foreground mt-1">Endast användarnamnet (utan @ tecken)</p>
            </div>
            <div>
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={formData.youtube_handle || ''}
                onChange={(e) => handleInputChange('youtube_handle', e.target.value)}
                placeholder="Kanalnamn"
              />
              <p className="text-xs text-muted-foreground mt-1">Kanalnamn eller handle (utan @ tecken)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                value={formData.tiktok_handle || ''}
                onChange={(e) => handleInputChange('tiktok_handle', e.target.value)}
                placeholder="användarnamn"
              />
              <p className="text-xs text-muted-foreground mt-1">Endast användarnamnet (utan @ tecken)</p>
            </div>
            <div>
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input
                id="twitter"
                value={formData.twitter_handle || ''}
                onChange={(e) => handleInputChange('twitter_handle', e.target.value)}
                placeholder="@användarnamn"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.facebook_handle || ''}
                onChange={(e) => handleInputChange('facebook_handle', e.target.value)}
                placeholder="Sidnamn"
              />
            </div>
            <div>
              <Label htmlFor="snapchat">Snapchat</Label>
              <Input
                id="snapchat"
                value={formData.snapchat_handle || ''}
                onChange={(e) => handleInputChange('snapchat_handle', e.target.value)}
                placeholder="@användarnamn"
              />
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Platforms & Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Plattformar och taggar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Aktiva plattformar</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {PLATFORMS.map(platform => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform}
                    checked={formData.platforms?.includes(platform) || false}
                    onCheckedChange={(checked) => handlePlatformsChange(platform, checked as boolean)}
                  />
                  <Label htmlFor={platform} className="text-sm">{platform}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Taggar (separera med komma)</Label>
            <Input
              id="tags"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="fitness, livsstil, teknik"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Systeminställningar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Notifikationsinställningar</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailNotifications"
                  checked={formData.preferences?.notifications?.email || false}
                  onCheckedChange={(checked) => 
                    handleNestedInputChange('preferences', 'notifications', {
                      ...formData.preferences?.notifications,
                      email: checked
                    })
                  }
                />
                <Label htmlFor="emailNotifications">E-postnotifikationer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inAppNotifications"
                  checked={formData.preferences?.notifications?.inApp || false}
                  onCheckedChange={(checked) => 
                    handleNestedInputChange('preferences', 'notifications', {
                      ...formData.preferences?.notifications,
                      inApp: checked
                    })
                  }
                />
                <Label htmlFor="inAppNotifications">Notifikationer i appen</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowAiAnalysis"
              checked={formData.preferences?.allowAiAnalysis || false}
              onCheckedChange={(checked) => 
                handleNestedInputChange('preferences', 'allowAiAnalysis', checked)
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