import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  User, 
  Phone, 
  Globe, 
  Briefcase, 
  Heart, 
  Settings,
  CalendarIcon,
  Camera,
  Upload
} from 'lucide-react';
import type { ExtendedProfileData } from '@/types/extendedProfile';
import { PRIMARY_ROLES, PLATFORMS, COUNTRIES } from '@/types/extendedProfile';

interface ExtendedProfileFormProps {
  onComplete: (data: ExtendedProfileData) => void;
  onUploadProfilePicture: (file: File) => Promise<string | null>;
  isLoading?: boolean;
  initialData?: ExtendedProfileData | null;
}

export function ExtendedProfileForm({ 
  onComplete, 
  onUploadProfilePicture,
  isLoading = false, 
  initialData = null 
}: ExtendedProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ExtendedProfileData>({
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

  // Sätt initial data om den finns
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        basicInfo: { ...prev.basicInfo, ...initialData.basicInfo },
        contactInfo: { 
          ...prev.contactInfo, 
          ...initialData.contactInfo,
          address: { ...prev.contactInfo.address, ...initialData.contactInfo.address }
        },
        digitalPresence: { ...prev.digitalPresence, ...initialData.digitalPresence },
        workProfile: { ...prev.workProfile, ...initialData.workProfile },
        healthInfo: { ...prev.healthInfo, ...initialData.healthInfo },
        systemSettings: { ...prev.systemSettings, ...initialData.systemSettings }
      }));
    }
  }, [initialData]);

  const updateFormData = (section: keyof ExtendedProfileData, field: string, value: any) => {
    setFormData(prev => {
      if (section === 'contactInfo' && field.startsWith('address.')) {
        const addressField = field.split('.')[1];
        return {
          ...prev,
          contactInfo: {
            ...prev.contactInfo,
            address: {
              ...prev.contactInfo.address,
              [addressField]: value
            }
          }
        };
      }
      
      if (section === 'systemSettings' && field.startsWith('notificationPreferences.')) {
        const notificationField = field.split('.')[1];
        return {
          ...prev,
          systemSettings: {
            ...prev.systemSettings,
            notificationPreferences: {
              ...prev.systemSettings.notificationPreferences,
              [notificationField]: value
            }
          }
        };
      }

      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
    });
  };

  const togglePlatform = (platform: string) => {
    const currentPlatforms = formData.workProfile.activePlatforms;
    if (currentPlatforms.includes(platform)) {
      updateFormData('workProfile', 'activePlatforms', currentPlatforms.filter(p => p !== platform));
    } else {
      updateFormData('workProfile', 'activePlatforms', [...currentPlatforms, platform]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validera filtyp
    if (!file.type.startsWith('image/')) {
      alert('Vänligen välj en bildfil');
      return;
    }

    // Validera filstorlek (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Bilden är för stor. Maximal storlek är 5MB.');
      return;
    }

    const imageUrl = await onUploadProfilePicture(file);
    if (imageUrl) {
      updateFormData('basicInfo', 'profilePicture', imageUrl);
    }
  };

  const isFormValid = () => {
    return formData.basicInfo.fullName.trim() !== '' && 
           formData.contactInfo.email.trim() !== '';
  };

  const handleSubmit = () => {
    if (isFormValid()) {
      onComplete(formData);
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'basic': return <User className="h-5 w-5" />;
      case 'contact': return <Phone className="h-5 w-5" />;
      case 'digital': return <Globe className="h-5 w-5" />;
      case 'work': return <Briefcase className="h-5 w-5" />;
      case 'health': return <Heart className="h-5 w-5" />;
      case 'system': return <Settings className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Grundinformation */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            {getSectionIcon('basic')}
            🟦 Grundinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profilbild */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.basicInfo.profilePicture} />
              <AvatarFallback>
                {formData.basicInfo.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Ändra profilbild
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Max 5MB. Formaten: JPG, PNG, GIF
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName" className="flex items-center gap-2">
                Fullständigt namn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.basicInfo.fullName}
                onChange={(e) => updateFormData('basicInfo', 'fullName', e.target.value)}
                placeholder="För- och efternamn"
                required
              />
            </div>
            <div>
              <Label htmlFor="username">Användarnamn (valfritt)</Label>
              <Input
                id="username"
                value={formData.basicInfo.username || ''}
                onChange={(e) => updateFormData('basicInfo', 'username', e.target.value)}
                placeholder="@dittanvändarnamn"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Kön / pronomen</Label>
              <Input
                id="gender"
                value={formData.basicInfo.gender || ''}
                onChange={(e) => updateFormData('basicInfo', 'gender', e.target.value)}
                placeholder="t.ex. kvinna, man, hen, de/dem"
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Födelsedatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.basicInfo.dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.basicInfo.dateOfBirth ? (
                      format(new Date(formData.basicInfo.dateOfBirth), "PPP", { locale: sv })
                    ) : (
                      <span>Välj datum</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.basicInfo.dateOfBirth ? new Date(formData.basicInfo.dateOfBirth) : undefined}
                    onSelect={(date) => updateFormData('basicInfo', 'dateOfBirth', date?.toISOString().split('T')[0])}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Kort biografi</Label>
            <Textarea
              id="bio"
              value={formData.basicInfo.bio || ''}
              onChange={(e) => updateFormData('basicInfo', 'bio', e.target.value)}
              placeholder="Berätta kort om dig själv..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Kontaktuppgifter */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            {getSectionIcon('contact')}
            🟧 Kontaktuppgifter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                E-postadress <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.contactInfo.email}
                onChange={(e) => updateFormData('contactInfo', 'email', e.target.value)}
                placeholder="din@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                id="phone"
                value={formData.contactInfo.phone || ''}
                onChange={(e) => updateFormData('contactInfo', 'phone', e.target.value)}
                placeholder="+46 70 123 45 67"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Adress</h4>
            <div>
              <Label htmlFor="street">Gata</Label>
              <Input
                id="street"
                value={formData.contactInfo.address?.street || ''}
                onChange={(e) => updateFormData('contactInfo', 'address.street', e.target.value)}
                placeholder="Gatunamn 123"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="postalCode">Postnummer</Label>
                <Input
                  id="postalCode"
                  value={formData.contactInfo.address?.postalCode || ''}
                  onChange={(e) => updateFormData('contactInfo', 'address.postalCode', e.target.value)}
                  placeholder="123 45"
                />
              </div>
              <div>
                <Label htmlFor="city">Stad</Label>
                <Input
                  id="city"
                  value={formData.contactInfo.address?.city || ''}
                  onChange={(e) => updateFormData('contactInfo', 'address.city', e.target.value)}
                  placeholder="Stockholm"
                />
              </div>
              <div>
                <Label htmlFor="country">Land</Label>
                <Select 
                  value={formData.contactInfo.address?.country || ''} 
                  onValueChange={(value) => updateFormData('contactInfo', 'address.country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj land" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Digital närvaro */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            {getSectionIcon('digital')}
            🟩 Digital närvaro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.digitalPresence.instagram || ''}
                onChange={(e) => updateFormData('digitalPresence', 'instagram', e.target.value)}
                placeholder="@dittanvändarnamn"
              />
            </div>
            <div>
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={formData.digitalPresence.youtube || ''}
                onChange={(e) => updateFormData('digitalPresence', 'youtube', e.target.value)}
                placeholder="Kanalnamn eller @handle"
              />
            </div>
            <div>
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                value={formData.digitalPresence.tiktok || ''}
                onChange={(e) => updateFormData('digitalPresence', 'tiktok', e.target.value)}
                placeholder="@dittanvändarnamn"
              />
            </div>
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.digitalPresence.facebook || ''}
                onChange={(e) => updateFormData('digitalPresence', 'facebook', e.target.value)}
                placeholder="Sidnamn eller användarnamn"
              />
            </div>
            <div>
              <Label htmlFor="twitter">X (Twitter)</Label>
              <Input
                id="twitter"
                value={formData.digitalPresence.twitter || ''}
                onChange={(e) => updateFormData('digitalPresence', 'twitter', e.target.value)}
                placeholder="@dittanvändarnamn"
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.digitalPresence.linkedin || ''}
                onChange={(e) => updateFormData('digitalPresence', 'linkedin', e.target.value)}
                placeholder="Profillänk eller användarnamn"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="website">Webbplats / Portfolio</Label>
              <Input
                id="website"
                value={formData.digitalPresence.website || ''}
                onChange={(e) => updateFormData('digitalPresence', 'website', e.target.value)}
                placeholder="https://dinwebbplats.se"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Arbetsprofil & AI-kontext */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            {getSectionIcon('work')}
            🟨 Arbetsprofil & AI-kontext
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryRole">Primär roll</Label>
              <Select 
                value={formData.workProfile.primaryRole || ''} 
                onValueChange={(value) => updateFormData('workProfile', 'primaryRole', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj din huvudroll" />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="secondaryRole">Sekundär roll</Label>
              <Select 
                value={formData.workProfile.secondaryRole || ''} 
                onValueChange={(value) => updateFormData('workProfile', 'secondaryRole', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj sekundär roll" />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="niche">Nisch / genre</Label>
            <Input
              id="niche"
              value={formData.workProfile.niche || ''}
              onChange={(e) => updateFormData('workProfile', 'niche', e.target.value)}
              placeholder="t.ex. lifestyle, tech, gaming, hälsa, mode..."
            />
          </div>

          <div>
            <Label htmlFor="creativeStrengths">Kreativa styrkor</Label>
            <Textarea
              id="creativeStrengths"
              value={formData.workProfile.creativeStrengths || ''}
              onChange={(e) => updateFormData('workProfile', 'creativeStrengths', e.target.value)}
              placeholder="Vad är du bra på? t.ex. storytelling, humor, pedagogik, design..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="challenges">Upplevda svagheter / utmaningar</Label>
            <Textarea
              id="challenges"
              value={formData.workProfile.challenges || ''}
              onChange={(e) => updateFormData('workProfile', 'challenges', e.target.value)}
              placeholder="Vad skulle du vilja förbättra? t.ex. konsistens, teknisk kvalitet, marknadsföring..."
              rows={3}
            />
          </div>

          <div>
            <Label>Aktiva plattformar</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {PLATFORMS.map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform}
                    checked={formData.workProfile.activePlatforms.includes(platform)}
                    onCheckedChange={() => togglePlatform(platform)}
                  />
                  <Label htmlFor={platform} className="text-sm">
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
            {formData.workProfile.activePlatforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.workProfile.activePlatforms.map((platform) => (
                  <Badge key={platform} variant="secondary">
                    {platform}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hälsa och särskilda behov */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            {getSectionIcon('health')}
            🟫 Hälsa och särskilda behov
            <Badge variant="outline" className="ml-2">Konfidentiell</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="diagnoses">Diagnoser / neurodiversitet</Label>
            <Textarea
              id="diagnoses"
              value={formData.healthInfo?.diagnoses || ''}
              onChange={(e) => updateFormData('healthInfo', 'diagnoses', e.target.value)}
              placeholder="t.ex. ADHD, autism, depression, ångest..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="physicalVariations">Fysiska funktionsvariationer</Label>
            <Textarea
              id="physicalVariations"
              value={formData.healthInfo?.physicalVariations || ''}
              onChange={(e) => updateFormData('healthInfo', 'physicalVariations', e.target.value)}
              placeholder="Beskriv eventuella fysiska begränsningar eller behov..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="generalHealth">Allmänt hälsotillstånd</Label>
            <Textarea
              id="generalHealth"
              value={formData.healthInfo?.generalHealth || ''}
              onChange={(e) => updateFormData('healthInfo', 'generalHealth', e.target.value)}
              placeholder="Övrig hälsoinformation som kan vara relevant..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Systeminställningar */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            {getSectionIcon('system')}
            🟪 Systeminställningar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium">Notifikationsinställningar</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications">E-post</Label>
                <Switch
                  id="emailNotifications"
                  checked={formData.systemSettings.notificationPreferences.email}
                  onCheckedChange={(checked) => updateFormData('systemSettings', 'notificationPreferences.email', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="smsNotifications">SMS</Label>
                <Switch
                  id="smsNotifications"
                  checked={formData.systemSettings.notificationPreferences.sms}
                  onCheckedChange={(checked) => updateFormData('systemSettings', 'notificationPreferences.sms', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="inAppNotifications">In-app notifikationer</Label>
                <Switch
                  id="inAppNotifications"
                  checked={formData.systemSettings.notificationPreferences.inApp}
                  onCheckedChange={(checked) => updateFormData('systemSettings', 'notificationPreferences.inApp', checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowAiAnalysis" className="text-base font-medium">
                Tillåt AI-analys på min data
              </Label>
              <p className="text-sm text-muted-foreground">
                Tillåter AI:n att analysera din data för bättre personliga råd
              </p>
            </div>
            <Switch
              id="allowAiAnalysis"
              checked={formData.systemSettings.allowAiAnalysis}
              onCheckedChange={(checked) => updateFormData('systemSettings', 'allowAiAnalysis', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Spara knapp */}
      <div className="flex justify-end space-x-4">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid() || isLoading}
          size="lg"
          className="min-w-40"
        >
          {isLoading ? 'Sparar...' : 'Spara profil'}
        </Button>
      </div>
    </div>
  );
}