/**
 * USER PROFILE EDITOR - Complete profile management
 * 
 * Komplett profilredigerare för användardata
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Contact, MapPin, Save, Upload, Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfileEditorProps {
  user: any;
  onUpdate: () => void;
  canEdit: boolean;
}

export const UserProfileEditor: React.FC<UserProfileEditorProps> = ({ 
  user, 
  onUpdate, 
  canEdit 
}) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Sverige',
    date_of_birth: '',
    bio: '',
    avatar_url: '',
    // Social media
    linkedin_url: '',
    twitter_url: '',
    facebook_url: '',
    instagram_url: '',
    // Additional info
    job_title: '',
    organization: '',
    personal_number: '', // Personnummer
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  const [isViewMode, setIsViewMode] = useState(!canEdit);
  const { toast } = useToast();

  useEffect(() => {
    // Load user profile data
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address?.street || '',
        city: user.address?.city || '',
        postal_code: user.address?.postal_code || '',
        country: user.address?.country || 'Sverige',
        date_of_birth: user.date_of_birth || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || '',
        linkedin_url: user.social_links?.linkedin || '',
        twitter_url: user.social_links?.twitter || '',
        facebook_url: user.social_links?.facebook || '',
        instagram_url: user.social_links?.instagram || '',
        job_title: user.job_title || '',
        organization: user.organization || '',
        personal_number: user.profile_extended?.personal_number || '',
        emergency_contact_name: user.profile_extended?.emergency_contact?.name || '',
        emergency_contact_phone: user.profile_extended?.emergency_contact?.phone || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Profilbild uppladdad",
        description: "Profilbilden har laddats upp framgångsrikt",
      });

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda upp profilbilden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;

    setLoading(true);
    try {
      // Mappa fälten till rätt tabellstruktur
      const updateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone: profileData.phone,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
        job_title: profileData.job_title,
        organization: profileData.organization,
        date_of_birth: profileData.date_of_birth || null,
        // Adressinformation som jsonb
        address: {
          street: profileData.address,
          city: profileData.city,
          postal_code: profileData.postal_code,
          country: profileData.country
        },
        // Sociala länkar som jsonb
        social_links: {
          linkedin: profileData.linkedin_url,
          twitter: profileData.twitter_url,
          facebook: profileData.facebook_url,
          instagram: profileData.instagram_url
        },
        // Övrig information i profile_extended
        profile_extended: {
          personal_number: profileData.personal_number,
          emergency_contact: {
            name: profileData.emergency_contact_name,
            phone: profileData.emergency_contact_phone
          }
        }
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profil uppdaterad",
        description: "Användarens profil har uppdaterats framgångsrikt",
      });

      onUpdate();
      setIsViewMode(true);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera profilen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Ej angivet';
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'Ej angivet';
    return phone;
  };

  if (isViewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Användarens Profil</h2>
          {canEdit && (
            <Button onClick={() => setIsViewMode(false)}>
              <Eye className="h-4 w-4 mr-2" />
              Redigera
            </Button>
          )}
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Grundinfo</TabsTrigger>
            <TabsTrigger value="contact">Kontakt</TabsTrigger>
            <TabsTrigger value="social">Sociala Medier</TabsTrigger>
            <TabsTrigger value="additional">Övrigt</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Grundläggande Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {profileData.avatar_url ? (
                    <img 
                      src={profileData.avatar_url} 
                      alt="Profilbild" 
                      className="w-20 h-20 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {profileData.first_name?.charAt(0) || profileData.email?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">
                      {profileData.first_name} {profileData.last_name}
                    </h3>
                    <p className="text-muted-foreground">{profileData.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Förnamn</Label>
                    <p className="font-medium">{profileData.first_name || 'Ej angivet'}</p>
                  </div>
                  <div>
                    <Label>Efternamn</Label>
                    <p className="font-medium">{profileData.last_name || 'Ej angivet'}</p>
                  </div>
                  <div>
                    <Label>Födelsedatum</Label>
                    <p className="font-medium">{formatDate(profileData.date_of_birth)}</p>
                  </div>
                  <div>
                    <Label>Personnummer</Label>
                    <p className="font-medium">{profileData.personal_number || 'Ej angivet'}</p>
                  </div>
                </div>

                {profileData.bio && (
                  <div>
                    <Label>Biografi</Label>
                    <p className="text-sm">{profileData.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Contact className="h-5 w-5" />
                  Kontaktinformation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Telefon</Label>
                    <p className="font-medium">{formatPhone(profileData.phone)}</p>
                  </div>
                  <div>
                    <Label>Land</Label>
                    <p className="font-medium">{profileData.country}</p>
                  </div>
                </div>

                {profileData.address && (
                  <div>
                    <Label>Adress</Label>
                    <p className="font-medium">
                      {profileData.address}
                      {profileData.city && `, ${profileData.city}`}
                      {profileData.postal_code && ` ${profileData.postal_code}`}
                    </p>
                  </div>
                )}

                {(profileData.emergency_contact_name || profileData.emergency_contact_phone) && (
                  <div>
                    <Label>Nödkontakt</Label>
                    <p className="font-medium">
                      {profileData.emergency_contact_name}
                      {profileData.emergency_contact_phone && ` - ${profileData.emergency_contact_phone}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Sociala Medier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['linkedin_url', 'twitter_url', 'facebook_url', 'instagram_url'].map((platform) => {
                  const url = profileData[platform as keyof typeof profileData];
                  if (!url) return null;
                  
                  const platformName = platform.replace('_url', '').charAt(0).toUpperCase() + platform.replace('_url', '').slice(1);
                  
                  return (
                    <div key={platform}>
                      <Label>{platformName}</Label>
                      <p className="font-medium">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {url}
                        </a>
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="additional">
            <Card>
              <CardHeader>
                <CardTitle>Övrig Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileData.job_title && (
                  <div>
                    <Label>Jobbtitel</Label>
                    <p className="font-medium">{profileData.job_title}</p>
                  </div>
                )}
                
                {profileData.organization && (
                  <div>
                    <Label>Organisation</Label>
                    <p className="font-medium">{profileData.organization}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Redigera Användarens Profil</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsViewMode(true)}>
            <EyeOff className="h-4 w-4 mr-2" />
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Sparar...' : 'Spara'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Grundinfo</TabsTrigger>
          <TabsTrigger value="contact">Kontakt</TabsTrigger>
          <TabsTrigger value="social">Sociala Medier</TabsTrigger>
          <TabsTrigger value="additional">Övrigt</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Grundläggande Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {profileData.avatar_url ? (
                  <img 
                    src={profileData.avatar_url} 
                    alt="Profilbild" 
                    className="w-20 h-20 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profileData.first_name?.charAt(0) || profileData.email?.charAt(0)}
                  </div>
                )}
                <div>
                  <Label htmlFor="avatar">Profilbild</Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Förnamn</Label>
                  <Input
                    id="first_name"
                    value={profileData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Efternamn</Label>
                  <Input
                    id="last_name"
                    value={profileData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">E-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_of_birth">Födelsedatum</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={profileData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="personal_number">Personnummer</Label>
                  <Input
                    id="personal_number"
                    value={profileData.personal_number}
                    onChange={(e) => handleInputChange('personal_number', e.target.value)}
                    placeholder="YYYYMMDD-XXXX"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Biografi</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Kort beskrivning..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Contact className="h-5 w-5" />
                Kontaktinformation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+46 70 123 45 67"
                />
              </div>

              <div>
                <Label htmlFor="address">Adress</Label>
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Gatunummer och gatunamn"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Stad</Label>
                  <Input
                    id="city"
                    value={profileData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postnummer</Label>
                  <Input
                    id="postal_code"
                    value={profileData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="123 45"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Land</Label>
                <Select value={profileData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sverige">Sverige</SelectItem>
                    <SelectItem value="Norge">Norge</SelectItem>
                    <SelectItem value="Danmark">Danmark</SelectItem>
                    <SelectItem value="Finland">Finland</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name">Nödkontakt (namn)</Label>
                  <Input
                    id="emergency_contact_name"
                    value={profileData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone">Nödkontakt (telefon)</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={profileData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Sociala Medier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="linkedin_url">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  value={profileData.linkedin_url}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <Label htmlFor="twitter_url">Twitter</Label>
                <Input
                  id="twitter_url"
                  value={profileData.twitter_url}
                  onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <Label htmlFor="facebook_url">Facebook</Label>
                <Input
                  id="facebook_url"
                  value={profileData.facebook_url}
                  onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <Label htmlFor="instagram_url">Instagram</Label>
                <Input
                  id="instagram_url"
                  value={profileData.instagram_url}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="additional">
          <Card>
            <CardHeader>
              <CardTitle>Övrig Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="job_title">Jobbtitel</Label>
                <Input
                  id="job_title"
                  value={profileData.job_title}
                  onChange={(e) => handleInputChange('job_title', e.target.value)}
                  placeholder="t.ex. Marknadsföringschef"
                />
              </div>

              <div>
                <Label htmlFor="organization">Organisation</Label>
                <Input
                  id="organization"
                  value={profileData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  placeholder="Företag eller organisation"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};