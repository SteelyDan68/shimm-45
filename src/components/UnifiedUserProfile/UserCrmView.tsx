import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  X
} from 'lucide-react';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { UnifiedProfileForm } from '@/components/Profile/UnifiedProfileForm';
import { RealUserData } from './RealUserData';
import { useToast } from '@/hooks/use-toast';
import type { UnifiedProfileData } from '@/types/unifiedProfile';

interface UserCrmViewProps {
  userId: string;
  profile: any;
  extendedProfile: any;
  canEdit: boolean;
  onProfileUpdate: () => void;
}

/**
 * USER CRM VIEW
 * Updated to use UnifiedProfileForm for consistency
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
  const [profileData, setProfileData] = useState<UnifiedProfileData | null>(null);
  const { 
    getProfile, 
    saveProfile, 
    uploadProfilePicture, 
    isLoading, 
    isSaving 
  } = useUnifiedProfile();
  const { toast } = useToast();

  React.useEffect(() => {
    if (userId && isEditing && !profileData) {
      loadUnifiedProfile();
    }
  }, [userId, isEditing]);

  const loadUnifiedProfile = async () => {
    try {
      const data = await getProfile(userId);
      setProfileData(data);
    } catch (error) {
      console.error('Error loading unified profile:', error);
    }
  };

  const handleSave = async (data: UnifiedProfileData) => {
    const result = await saveProfile(data, userId);
    if (result.success) {
      setIsEditing(false);
      setProfileData(result.data || data);
      onProfileUpdate();
      toast({
        title: "Profil uppdaterad",
        description: "Användarens profil har uppdaterats framgångsrikt"
      });
    }
    return result;
  };

  const handleProfilePictureUpload = async (file: File): Promise<string | null> => {
    return await uploadProfilePicture(file, userId);
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
                setProfileData(null);
              }}>
                <X className="h-4 w-4 mr-2" />
                Avbryt
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

      {/* UNIFIED PROFILE EDITING */}
      {isEditing ? (
        <div className="space-y-6">
          {profileData ? (
            <UnifiedProfileForm
              initialData={profileData}
              onSave={handleSave}
              onUploadPicture={handleProfilePictureUpload}
              isLoading={isLoading}
              isSaving={isSaving}
              canEdit={true}
              isClientView={false}
              showGDPRSection={false}
            />
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Laddar profildata...</p>
            </div>
          )}
        </div>
      ) : (
        <ProfileDisplayView 
          profile={profile} 
          extendedProfile={extendedProfile} 
        />
      )}
    </div>
  );
};

/**
 * PROFILE DISPLAY VIEW
 * Read-only view of profile data using tabs
 */
const ProfileDisplayView = ({ profile, extendedProfile }: { profile: any; extendedProfile: any }) => {
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

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Okänd ålder';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} år`;
  };

  return (
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
            <CardContent className="space-y-3">
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
              {(profile.date_of_birth || extendedProfile?.date_of_birth) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ålder:</span>
                  <span>{calculateAge(profile.date_of_birth || extendedProfile?.date_of_birth)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kön:</span>
                <span>{extendedProfile?.profile_extended?.gender || 'Ej angivet'}</span>
              </div>
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
                <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                  {profile.is_active ? 'Aktiv' : 'Inaktiv'}
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
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Adress</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>{profile.address?.street || extendedProfile?.address?.street || 'Ingen adress'}</div>
                  <div>{profile.address?.city || extendedProfile?.address?.city || ''} {profile.address?.postal_code || extendedProfile?.address?.postal_code || ''}</div>
                  <div>{profile.address?.country || extendedProfile?.address?.country || ''}</div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { platform: 'Instagram', handle: profile.social_links?.instagram || extendedProfile?.instagram_handle },
                { platform: 'YouTube', handle: profile.social_links?.youtube || extendedProfile?.youtube_handle },
                { platform: 'TikTok', handle: profile.social_links?.tiktok || extendedProfile?.tiktok_handle },
                { platform: 'Facebook', handle: profile.social_links?.facebook || extendedProfile?.facebook_handle },
                { platform: 'Twitter/X', handle: profile.social_links?.twitter || extendedProfile?.twitter_handle },
                { platform: 'Snapchat', handle: profile.social_links?.snapchat || extendedProfile?.snapchat_handle },
                { platform: 'Webbsida', handle: profile.social_links?.website || extendedProfile?.website }
              ].filter(item => item.handle).map((social, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getSocialIcon(social.platform)}
                  <div>
                    <div className="font-medium">{social.platform}</div>
                    <div className="text-sm text-muted-foreground">
                      {social.platform === 'Webbsida' ? social.handle : `@${social.handle}`}
                    </div>
                  </div>
                </div>
              ))}
              {![
                profile.social_links?.instagram || extendedProfile?.instagram_handle,
                profile.social_links?.youtube || extendedProfile?.youtube_handle,
                profile.social_links?.tiktok || extendedProfile?.tiktok_handle,
                profile.social_links?.facebook || extendedProfile?.facebook_handle,
                profile.social_links?.twitter || extendedProfile?.twitter_handle,
                profile.social_links?.snapchat || extendedProfile?.snapchat_handle,
                profile.social_links?.website || extendedProfile?.website
              ].some(Boolean) && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  Inga sociala plattformar registrerade
                </div>
              )}
            </div>
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
                  <span className="text-muted-foreground">Jobbtitel:</span>
                  <span>{profile.job_title || extendedProfile?.job_title || 'Ej angivet'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organisation:</span>
                  <span>{profile.organization || extendedProfile?.organization || 'Ej angivet'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avdelning:</span>
                  <span>{extendedProfile?.professional?.department || 'Ej angivet'}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primär roll:</span>
                  <span>{extendedProfile?.professional?.primary_role || 'Ej angivet'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nisch:</span>
                  <span>{extendedProfile?.professional?.nische || 'Ej angivet'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bransch:</span>
                  <span>{extendedProfile?.professional?.industry || 'Ej angivet'}</span>
                </div>
              </div>
            </div>
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
            {profile.bio && (
              <div>
                <h4 className="font-medium mb-2">Biografi</h4>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}
            
            {extendedProfile?.profile_extended?.notes && (
              <div>
                <h4 className="font-medium mb-2">Anteckningar</h4>
                <p className="text-sm text-muted-foreground">{extendedProfile.profile_extended.notes}</p>
              </div>
            )}

            {extendedProfile?.profile_extended?.personal_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Personnummer:</span>
                <span>{extendedProfile.profile_extended.personal_number}</span>
              </div>
            )}

            {extendedProfile?.profile_extended?.emergency_contact?.name && (
              <div>
                <h4 className="font-medium mb-2">Nödkontakt</h4>
                <div className="text-sm space-y-1">
                  <div>{extendedProfile.profile_extended.emergency_contact.name}</div>
                  {extendedProfile.profile_extended.emergency_contact.phone && (
                    <div className="text-muted-foreground">{extendedProfile.profile_extended.emergency_contact.phone}</div>
                  )}
                  {extendedProfile.profile_extended.emergency_contact.relationship && (
                    <div className="text-muted-foreground">{extendedProfile.profile_extended.emergency_contact.relationship}</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Activity */}
      <TabsContent value="activity">
        <RealUserData userId={profile.id} profile={profile} />
      </TabsContent>
    </Tabs>
  );
};