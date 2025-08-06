/**
 * 🎯 UNIFIED PROFILE PAGE
 * 
 * Ersätter EditProfilePage och använder nya unified systemet
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { UnifiedProfileForm } from '@/components/Profile/UnifiedProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit } from 'lucide-react';
import type { UnifiedProfileData } from '@/types/unifiedProfile';

export default function UnifiedProfilePage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { 
    getProfile, 
    saveProfile, 
    uploadProfilePicture, 
    isLoading, 
    isSaving 
  } = useUnifiedProfile();
  
  const [profileData, setProfileData] = React.useState<UnifiedProfileData | null>(null);

  React.useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      const data = await getProfile(user.id);
      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleProfileSave = async (data: UnifiedProfileData) => {
    const result = await saveProfile(data);
    
    if (result.success) {
      setProfileData(result.data || data);
      
      // Navigate based on user role
      if (hasRole('client')) {
        navigate('/client-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
    
    return result;
  };

  const handleProfilePictureUpload = async (file: File): Promise<string | null> => {
    return await uploadProfilePicture(file);
  };

  const getBackUrl = () => {
    if (hasRole('client')) return '/client-dashboard';
    return '/dashboard';
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(getBackUrl())}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till dashboard
        </Button>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Redigera din profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {hasRole('client') 
                ? 'Här kan du uppdatera din profilinformation. Använd flikarna för att navigera mellan olika sektioner av din profil.'
                : 'Här kan du uppdatera din omfattande profilinformation. Dina ändringar sparas säkert och används för att ge dig bättre personliga råd.'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <UnifiedProfileForm 
        initialData={profileData || undefined}
        onSave={handleProfileSave}
        onUploadPicture={handleProfilePictureUpload}
        isLoading={isLoading}
        isSaving={isSaving}
        canEdit={true}
        isClientView={hasRole('client')}
        showGDPRSection={true}
      />
    </div>
  );
}