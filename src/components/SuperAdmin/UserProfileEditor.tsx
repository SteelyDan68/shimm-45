/**
 * 🎯 UNIFIED SUPERADMIN USER PROFILE EDITOR
 * 
 * Completely rewritten to use UnifiedProfileForm
 * Ensures consistency across all profile editing interfaces
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { UnifiedProfileForm } from '@/components/Profile/UnifiedProfileForm';
import { User, Eye, EyeOff } from 'lucide-react';
import type { UnifiedProfileData } from '@/types/unifiedProfile';
import { PasswordManagement } from '@/components/UserAdministration/PasswordManagement';

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
  const [isViewMode, setIsViewMode] = useState(!canEdit);
  const [profileData, setProfileData] = useState<UnifiedProfileData | null>(null);
  const { 
    getProfile, 
    saveProfile, 
    uploadProfilePicture, 
    isLoading, 
    isSaving 
  } = useUnifiedProfile();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;
    
    try {
      const data = await getProfile(user.id);
      if (data) {
        setProfileData(data);
      } else {
        // Create profile data from existing user object if unified profile doesn't exist
        const defaultData: UnifiedProfileData = {
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          avatar_url: user.avatar_url || '',
          bio: user.bio || '',
          date_of_birth: user.date_of_birth || '',
          gender: user.profile_extended?.gender || 'vill_inte_ange',
          address: user.address || {
            street: '',
            postal_code: '',
            city: '',
            country: 'Sverige'
          },
          social_media: user.social_links || {
            instagram: '',
            youtube: '',
            tiktok: '',
            facebook: '',
            twitter: '',
            snapchat: '',
            website: ''
          },
          professional: {
            job_title: user.job_title || '',
            organization: user.organization || '',
            department: '',
            primary_role: '',
            niche: '',
            industry: ''
          },
          notes: user.profile_extended?.notes || '',
          gdpr_consent: false,
          data_processing_consent: false,
          marketing_consent: false,
          extended: {
            personal_number: user.profile_extended?.personal_number || '',
            emergency_contact: user.profile_extended?.emergency_contact || {
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
        };
        setProfileData(defaultData);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda profildata",
        variant: "destructive"
      });
    }
  };

  const handleSave = async (data: UnifiedProfileData) => {
    const result = await saveProfile(data, user.id);
    if (result.success) {
      setProfileData(result.data || data);
      onUpdate();
      setIsViewMode(true);
      toast({
        title: "Profil uppdaterad",
        description: "Användarens profil har uppdaterats framgångsrikt",
      });
    }
    return result;
  };

  const handleProfilePictureUpload = async (file: File): Promise<string | null> => {
    return await uploadProfilePicture(file, user.id);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Ej angivet';
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'Ej angivet';
    return phone;
  };

  const getDisplayName = () => {
    if (!profileData) return 'Okänd användare';
    const fullName = `${profileData.first_name} ${profileData.last_name}`.trim();
    return fullName || profileData.email || 'Namnlös användare';
  };

  const getInitials = () => {
    if (!profileData) return 'U';
    return `${profileData.first_name?.[0] || ''}${profileData.last_name?.[0] || ''}`.toUpperCase() || 'U';
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

  if (isViewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Användarens Profil</h2>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <PasswordManagement 
                  userId={user.id} 
                  userEmail={profileData?.email || user.email} 
                  userName={getDisplayName()} 
                />
                <Button onClick={() => setIsViewMode(false)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Redigera
                </Button>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {getDisplayName()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {profileData?.avatar_url ? (
                <img 
                  src={profileData.avatar_url} 
                  alt="Profilbild" 
                  className="w-20 h-20 rounded-full object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials()}
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">{getDisplayName()}</h3>
                <p className="text-muted-foreground">{profileData?.email}</p>
                {profileData?.phone && (
                  <p className="text-sm text-muted-foreground">{formatPhone(profileData.phone)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <h4 className="font-medium mb-2">Grundläggande Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Födelsedatum:</strong> {formatDate(profileData?.date_of_birth || '')}</div>
                  <div><strong>Kön:</strong> {profileData?.gender || 'Ej angivet'}</div>
                  <div><strong>Telefon:</strong> {formatPhone(profileData?.phone || '')}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Professionellt</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Jobbtitel:</strong> {profileData?.professional?.job_title || 'Ej angivet'}</div>
                  <div><strong>Organisation:</strong> {profileData?.professional?.organization || 'Ej angivet'}</div>
                  <div><strong>Avdelning:</strong> {profileData?.professional?.department || 'Ej angivet'}</div>
                </div>
              </div>
            </div>

            {profileData?.bio && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Biografi</h4>
                <p className="text-sm text-muted-foreground">{profileData.bio}</p>
              </div>
            )}

            {/* Social Media Summary */}
            {Object.values(profileData?.social_media || {}).some(Boolean) && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Sociala Medier</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(profileData?.social_media || {}).map(([platform, handle]) => {
                    if (!handle) return null;
                    return (
                      <span key={platform} className="px-2 py-1 bg-muted rounded text-xs">
                        {platform}: @{handle}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Address Summary */}
            {profileData?.address && Object.values(profileData.address).some(Boolean) && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Adress</h4>
                <div className="text-sm text-muted-foreground">
                  {profileData.address.street && <div>{profileData.address.street}</div>}
                  {(profileData.address.city || profileData.address.postal_code) && (
                    <div>{profileData.address.city} {profileData.address.postal_code}</div>
                  )}
                  {profileData.address.country && <div>{profileData.address.country}</div>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
            Visa läge
          </Button>
        </div>
      </div>

      {profileData && (
        <UnifiedProfileForm
          initialData={profileData}
          onSave={handleSave}
          onUploadPicture={handleProfilePictureUpload}
          isLoading={isLoading}
          isSaving={isSaving}
          canEdit={canEdit}
          isClientView={false}
          showGDPRSection={false}
        />
      )}
    </div>
  );
};