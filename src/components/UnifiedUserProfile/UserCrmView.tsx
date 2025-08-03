import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building2,
  Globe,
  Instagram,
  Youtube,
  MessageSquare,
  Facebook,
  Twitter,
  Camera,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useExtendedProfile } from '@/hooks/useExtendedProfile';
import { RealUserData } from './RealUserData';
import { useToast } from '@/hooks/use-toast';
import type { ExtendedProfileData } from '@/types/extendedProfile';

interface UserCrmViewProps {
  userId: string;
  profile: any;
  extendedProfile: any;
  canEdit: boolean;
  onProfileUpdate: () => void;
}

/**
 * USER CRM VIEW
 * Default view for user profiles - CRM data and contact information
 * Uses ONLY user_id - Single Source of Truth principle
 */
export const UserCrmView = ({ 
  userId, 
  profile, 
  extendedProfile, 
  canEdit, 
  onProfileUpdate 
}: UserCrmViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ExtendedProfileData>(extendedProfile || {});
  const { saveExtendedProfile } = useExtendedProfile();
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      const result = await saveExtendedProfile(editData);
      if (result.success) {
        setIsEditing(false);
        onProfileUpdate();
        toast({
          title: "Profil uppdaterad",
          description: "Användarens profil har uppdaterats framgångsrikt"
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara profilen",
        variant: "destructive"
      });
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <MessageSquare className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'snapchat': return <Camera className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Ej angivet';
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  return (
    <div className="space-y-6">
      {/* Edit Controls */}
      {canEdit && (
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setEditData(extendedProfile || {});
              }}>
                <X className="h-4 w-4 mr-2" />
                Avbryt
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Spara
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Redigera
            </Button>
          )}
        </div>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Grunddata</TabsTrigger>
          <TabsTrigger value="contact">Kontakt & Adress</TabsTrigger>
          <TabsTrigger value="social">Sociala Plattformar</TabsTrigger>
          <TabsTrigger value="professional">Professionellt</TabsTrigger>
          <TabsTrigger value="personal">Personligt</TabsTrigger>
          <TabsTrigger value="activity">Aktivitet</TabsTrigger>
        </TabsList>

        {/* Grunddata */}
        <TabsContent value="basic">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personuppgifter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Förnamn</Label>
                        <Input 
                          value={editData.first_name || ''} 
                          onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Efternamn</Label>
                        <Input 
                          value={editData.last_name || ''} 
                          onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>E-post</Label>
                      <Input 
                        type="email"
                        value={editData.email || ''} 
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input 
                        value={editData.phone || ''} 
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Födelsedata</Label>
                      <Input 
                        type="date"
                        value={editData.date_of_birth || ''} 
                        onChange={(e) => setEditData({...editData, date_of_birth: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Förnamn:</span>
                      <span>{profile.first_name || extendedProfile?.first_name || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Efternamn:</span>
                      <span>{profile.last_name || extendedProfile?.last_name || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">E-post:</span>
                      <span>{profile.email || extendedProfile?.email || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefon:</span>
                      <span>{profile.phone || extendedProfile?.phone || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Födelsedata:</span>
                      <span>{formatDate(profile.date_of_birth || extendedProfile?.date_of_birth)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Systemuppgifter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Användar-ID:</span>
                  <span className="font-mono text-xs">{profile.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                    {profile.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registrerad:</span>
                  <span>{formatDate(profile.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Senast uppdaterad:</span>
                  <span>{formatDate(profile.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Onboarding:</span>
                  <Badge variant={profile.onboarding_completed ? 'default' : 'secondary'}>
                    {profile.onboarding_completed ? 'Klar' : 'Ej klar'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contact & Address */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Kontakt & Adressinformation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email || 'Ingen e-post'}</span>
                  </div>
                  
                  {(profile.phone || extendedProfile?.phone) && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.phone || extendedProfile?.phone}</span>
                    </div>
                  )}
                  
                  {(profile.location || extendedProfile?.location) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.location || extendedProfile?.location}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Adress</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>{extendedProfile?.address?.street || 'Ingen adress'}</div>
                    <div>{extendedProfile?.address?.city || ''} {extendedProfile?.address?.postalCode || ''}</div>
                    <div>{extendedProfile?.address?.country || ''}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Platforms */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Sociala Plattformar</CardTitle>
            </CardHeader>
            <CardContent>
              {extendedProfile?.social_platforms?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extendedProfile.social_platforms.map((platform: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getSocialIcon(platform.platform)}
                      <div>
                        <div className="font-medium">{platform.platform}</div>
                        <div className="text-sm text-muted-foreground">{platform.username}</div>
                        {platform.followerCount && (
                          <div className="text-xs text-muted-foreground">
                            {platform.followerCount.toLocaleString()} följare
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Inga sociala plattformar registrerade
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional */}
        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Professionell Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primär roll:</span>
                    <span>{profile.primary_role || extendedProfile?.primary_role || 'Ej angivet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bransch:</span>
                    <span>{extendedProfile?.professional?.industry || 'Ej angivet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Företag:</span>
                    <span>{extendedProfile?.professional?.company || 'Ej angivet'}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <span>{extendedProfile?.professional?.position || 'Ej angivet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Erfarenhet:</span>
                    <span>{extendedProfile?.professional?.experience || 'Ej angivet'}</span>
                  </div>
                </div>
              </div>
              
              {extendedProfile?.professional?.bio && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Professionell beskrivning</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {extendedProfile.professional.bio}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personlig Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kön:</span>
                    <span>{profile.gender || extendedProfile?.gender || 'Ej angivet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Födelseort:</span>
                    <span>{extendedProfile?.personal?.birthplace || 'Ej angivet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nationalitet:</span>
                    <span>{extendedProfile?.personal?.nationality || 'Ej angivet'}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Språk:</span>
                    <span>{extendedProfile?.personal?.languages?.join(', ') || 'Ej angivet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hobbyer:</span>
                    <span>{extendedProfile?.personal?.hobbies?.join(', ') || 'Ej angivet'}</span>
                  </div>
                </div>
              </div>
              
              {extendedProfile?.personal?.notes && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Personliga anteckningar</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {extendedProfile.personal.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <RealUserData userId={userId} profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};