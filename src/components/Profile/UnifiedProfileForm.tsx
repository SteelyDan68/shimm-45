/**
 * 🎯 UNIFIED PROFILE FORM
 * 
 * En enda profilformulär som används överallt i systemet
 * Ersätter ExtendedProfileForm, UserProfileEditor och alla andra
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  MessageSquare,
  Camera,
  Save,
  AlertCircle,
  Shield,
  StickyNote
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserGDPRRequestForm } from '@/components/GDPR/UserGDPRRequestForm';
import { 
  UnifiedProfileData,
  SOCIAL_PLATFORMS,
  GENDER_OPTIONS,
  COUNTRIES
} from '@/types/unifiedProfile';

interface UnifiedProfileFormProps {
  initialData?: Partial<UnifiedProfileData>;
  onSave: (data: UnifiedProfileData) => Promise<{ success: boolean }>;
  onUploadPicture?: (file: File) => Promise<string | null>;
  isLoading?: boolean;
  isSaving?: boolean;
  canEdit?: boolean;
  isClientView?: boolean;
  showGDPRSection?: boolean;
}

export const UnifiedProfileForm: React.FC<UnifiedProfileFormProps> = ({
  initialData = {},
  onSave,
  onUploadPicture,
  isLoading = false,
  isSaving = false,
  canEdit = true,
  isClientView = false,
  showGDPRSection = true
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize form data with defaults
  const getDefaultFormData = (): UnifiedProfileData => ({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    bio: '',
    date_of_birth: '',
    gender: 'vill_inte_ange',
    address: {
      street: '',
      postal_code: '',
      city: '',
      country: 'Sverige'
    },
    social_media: {
      instagram: '',
      youtube: '',
      tiktok: '',
      facebook: '',
      twitter: '',
      snapchat: '',
      website: ''
    },
    professional: {
      job_title: '',
      organization: '',
      department: '',
      primary_role: '',
      niche: '',
      industry: ''
    },
    notes: '',
    gdpr_consent: false,
    data_processing_consent: false,
    marketing_consent: false,
    extended: {
      personal_number: '',
      emergency_contact: {
        name: '',
        phone: '',
        relationship: ''
      },
      preferences: {
        language: 'sv',
        timezone: 'Europe/Stockholm',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      },
      health_info: {
        physical_limitations: '',
        neurodiversity: '',
        dietary_restrictions: ''
      }
    }
  });

  const [formData, setFormData] = useState<UnifiedProfileData>(() => ({
    ...getDefaultFormData(),
    ...initialData
  }));

  // Update form when initialData changes
  useEffect(() => {
    setFormData(prev => ({
      ...getDefaultFormData(),
      ...initialData,
      // Preserve nested objects properly
      address: {
        ...getDefaultFormData().address,
        ...initialData.address
      },
      social_media: {
        ...getDefaultFormData().social_media,
        ...initialData.social_media
      },
      professional: {
        ...getDefaultFormData().professional,
        ...initialData.professional
      },
      extended: {
        ...getDefaultFormData().extended,
        ...initialData.extended,
        emergency_contact: {
          ...getDefaultFormData().extended?.emergency_contact,
          ...initialData.extended?.emergency_contact
        },
        preferences: {
          ...getDefaultFormData().extended?.preferences,
          ...initialData.extended?.preferences,
          notifications: {
            ...getDefaultFormData().extended?.preferences?.notifications,
            ...initialData.extended?.preferences?.notifications
          }
        },
        health_info: {
          ...getDefaultFormData().extended?.health_info,
          ...initialData.extended?.health_info
        }
      }
    }));
  }, [initialData]);

  // === INPUT HANDLERS ===
  const handleInputChange = (field: keyof UnifiedProfileData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (
    parentField: keyof UnifiedProfileData,
    childField: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as any),
        [childField]: value
      }
    }));
  };

  const handleExtendedChange = (
    section: string,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      extended: {
        ...prev.extended,
        [section]: {
          ...(prev.extended?.[section as keyof typeof prev.extended] as any),
          [field]: value
        }
      }
    }));
  };

  // === FILE UPLOAD ===
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadPicture) return;

    setUploading(true);
    try {
      const imageUrl = await onUploadPicture(file);
      if (imageUrl) {
        handleInputChange('avatar_url', imageUrl);
        toast({
          title: "Profilbild uppladdad",
          description: "Din profilbild har uppdaterats"
        });
      }
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

  // === VALIDATION ===
  const validateForm = async () => {
    try {
      const { validateProfile } = await import('@/types/unifiedProfile');
      const validation = validateProfile(formData);
      setValidationErrors(validation.errors);
      return validation.isValid;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  };

  // === SUBMIT ===
  const handleSubmit = async () => {
    if (!canEdit) return;

    const isValid = await validateForm();
    if (!isValid) {
      toast({
        title: "Ofullständig profil",
        description: validationErrors.join(', '),
        variant: "destructive"
      });
      return;
    }

    const result = await onSave(formData);
    if (result.success) {
      setValidationErrors([]);
    }
  };

  // === CALCULATE AGE ===
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laddar profildata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Fyll i följande obligatoriska fält:</strong>
            <ul className="list-disc list-inside mt-2">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Grunddata</TabsTrigger>
          <TabsTrigger value="contact">Kontakt</TabsTrigger>
          <TabsTrigger value="social">Sociala Medier</TabsTrigger>
          <TabsTrigger value="professional">Professionellt</TabsTrigger>
          <TabsTrigger value="personal">Personligt</TabsTrigger>
          {showGDPRSection && <TabsTrigger value="gdpr">GDPR</TabsTrigger>}
        </TabsList>

        {/* === GRUNDDATA === */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Grundläggande Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt="Profil" 
                      className="w-20 h-20 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {canEdit && onUploadPicture && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {canEdit ? 'Klicka för att ladda upp en ny profilbild' : 'Profilbild'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rekommenderad storlek: 400x400px
                  </p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">
                    Förnamn <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    disabled={!canEdit || isClientView}
                    className={!formData.first_name ? 'border-destructive' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">
                    Efternamn <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    disabled={!canEdit || isClientView}
                    className={!formData.last_name ? 'border-destructive' : ''}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">
                  E-postadress <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!canEdit || isClientView}
                  className={!formData.email ? 'border-destructive' : ''}
                />
                {isClientView && (
                  <p className="text-xs text-muted-foreground mt-1">
                    E-post kan endast ändras av administratörer
                  </p>
                )}
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_of_birth">
                    Födelsedatum <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    disabled={!canEdit}
                    className={!formData.date_of_birth ? 'border-destructive' : ''}
                  />
                  {formData.date_of_birth && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ålder: {calculateAge(formData.date_of_birth)} år
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gender">
                    Kön <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleInputChange('gender', value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className={!formData.gender ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Välj kön" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Biografi</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Berätta kort om dig själv..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === KONTAKT & ADRESS === */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Kontakt & Adressinformation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phone */}
              <div>
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!canEdit}
                  placeholder="+46 70 123 45 67"
                />
              </div>

              {/* Address */}
              <Separator />
              <h4 className="font-medium">Adressinformation</h4>
              
              <div>
                <Label htmlFor="street">Gatuadress</Label>
                <Input
                  id="street"
                  value={formData.address?.street || ''}
                  onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Gatunavn 123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postal_code">Postnummer</Label>
                  <Input
                    id="postal_code"
                    value={formData.address?.postal_code || ''}
                    onChange={(e) => handleNestedChange('address', 'postal_code', e.target.value)}
                    disabled={!canEdit}
                    placeholder="123 45"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Stad</Label>
                  <Input
                    id="city"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Stockholm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Land</Label>
                <Select 
                  value={formData.address?.country || 'Sverige'} 
                  onValueChange={(value) => handleNestedChange('address', 'country', value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj land" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Emergency Contact */}
              <Separator />
              <h4 className="font-medium">Nödkontakt</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_name">Namn</Label>
                  <Input
                    id="emergency_name"
                    value={formData.extended?.emergency_contact?.name || ''}
                    onChange={(e) => handleExtendedChange('emergency_contact', 'name', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Kontaktperson"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_phone">Telefon</Label>
                  <Input
                    id="emergency_phone"
                    type="tel"
                    value={formData.extended?.emergency_contact?.phone || ''}
                    onChange={(e) => handleExtendedChange('emergency_contact', 'phone', e.target.value)}
                    disabled={!canEdit}
                    placeholder="+46 70 123 45 67"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="emergency_relationship">Relation</Label>
                <Input
                  id="emergency_relationship"
                  value={formData.extended?.emergency_contact?.relationship || ''}
                  onChange={(e) => handleExtendedChange('emergency_contact', 'relationship', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Familjemedlem, vän, etc."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === SOCIALA MEDIER === */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Sociala Medier <span className="text-destructive">*</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Fyll i minst en social media-plattform för att aktivera dina pillars
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {SOCIAL_PLATFORMS.map(platform => (
                <div key={platform.key}>
                  <Label htmlFor={platform.key}>{platform.label}</Label>
                  <div className="flex">
                    {platform.prefix && (
                      <span className="flex items-center px-3 border border-r-0 bg-muted text-muted-foreground rounded-l-md">
                        {platform.prefix}
                      </span>
                    )}
                    <Input
                      id={platform.key}
                      value={formData.social_media?.[platform.key as keyof typeof formData.social_media] || ''}
                      onChange={(e) => handleNestedChange('social_media', platform.key, e.target.value)}
                      disabled={!canEdit}
                      placeholder={platform.placeholder}
                      className={platform.prefix ? 'rounded-l-none' : ''}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === PROFESSIONELLT === */}
        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professionell Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="job_title">Jobbtitel</Label>
                  <Input
                    id="job_title"
                    value={formData.professional?.job_title || ''}
                    onChange={(e) => handleNestedChange('professional', 'job_title', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Din titel"
                  />
                </div>
                <div>
                  <Label htmlFor="organization">Organisation/Företag</Label>
                  <Input
                    id="organization"
                    value={formData.professional?.organization || ''}
                    onChange={(e) => handleNestedChange('professional', 'organization', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Företagsnamn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Avdelning</Label>
                  <Input
                    id="department"
                    value={formData.professional?.department || ''}
                    onChange={(e) => handleNestedChange('professional', 'department', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Avdelning"
                  />
                </div>
                <div>
                  <Label htmlFor="primary_role">Primär roll</Label>
                  <Input
                    id="primary_role"
                    value={formData.professional?.primary_role || ''}
                    onChange={(e) => handleNestedChange('professional', 'primary_role', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Din huvudroll"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="niche">Nisch/Specialitet</Label>
                <Input
                  id="niche"
                  value={formData.professional?.niche || ''}
                  onChange={(e) => handleNestedChange('professional', 'niche', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Din specialitet eller nisch"
                />
              </div>

              <div>
                <Label htmlFor="industry">Bransch</Label>
                <Input
                  id="industry"
                  value={formData.professional?.industry || ''}
                  onChange={(e) => handleNestedChange('professional', 'industry', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Vilken bransch arbetar du i?"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === PERSONLIGT === */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Personliga Anteckningar & Hälsoinformation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Notes */}
              <div>
                <Label htmlFor="notes">Anteckningar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Personliga anteckningar..."
                  rows={4}
                />
              </div>

              {/* Personal Number (Swedish) */}
              <div>
                <Label htmlFor="personal_number">Personnummer</Label>
                <Input
                  id="personal_number"
                  value={formData.extended?.personal_number || ''}
                  onChange={(e) => handleExtendedChange('personal_number', '', e.target.value)}
                  disabled={!canEdit}
                  placeholder="YYYYMMDD-XXXX"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Endast för svenska medborgare
                </p>
              </div>

              <Separator />

              {/* Health Information */}
              <h4 className="font-medium">Hälsoinformation (frivilligt)</h4>
              
              <div>
                <Label htmlFor="physical_limitations">Fysiska begränsningar</Label>
                <Textarea
                  id="physical_limitations"
                  value={formData.extended?.health_info?.physical_limitations || ''}
                  onChange={(e) => handleExtendedChange('health_info', 'physical_limitations', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Eventuella fysiska begränsningar..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="neurodiversity">Neurodiversitet</Label>
                <Textarea
                  id="neurodiversity"
                  value={formData.extended?.health_info?.neurodiversity || ''}
                  onChange={(e) => handleExtendedChange('health_info', 'neurodiversity', e.target.value)}
                  disabled={!canEdit}
                  placeholder="ADHD, Autism, Dyslexi, etc..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="dietary_restrictions">Kostbegränsningar</Label>
                <Textarea
                  id="dietary_restrictions"
                  value={formData.extended?.health_info?.dietary_restrictions || ''}
                  onChange={(e) => handleExtendedChange('health_info', 'dietary_restrictions', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Allergier, vegetarian, etc..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === GDPR === */}
        {showGDPRSection && (
          <TabsContent value="gdpr">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  GDPR & Dataskydd
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <UserGDPRRequestForm />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Save Button */}
      {canEdit && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving}
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sparar...' : 'Spara Profil'}
          </Button>
        </div>
      )}
    </div>
  );
};