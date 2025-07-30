import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useExtendedProfile } from '@/hooks/useExtendedProfile';
import { ExtendedProfileForm } from '@/components/Profile/ExtendedProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit } from 'lucide-react';
import type { ExtendedProfileData } from '@/types/extendedProfile';

export const EditProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { saveExtendedProfile, getExtendedProfile, uploadProfilePicture, isLoading } = useExtendedProfile();
  const [initialData, setInitialData] = useState<ExtendedProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      const profileData = await getExtendedProfile();
      setInitialData(profileData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (data: ExtendedProfileData) => {
    const result = await saveExtendedProfile(data);
    
    if (result.success) {
      // Efter uppdatering, gå tillbaka till dashboard
      navigate('/client-dashboard');
    }
  };

  const handleProfilePictureUpload = async (file: File): Promise<string | null> => {
    return await uploadProfilePicture(file);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/client-dashboard')}
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
              Här kan du uppdatera din omfattande profilinformation. Dina ändringar sparas säkert och används för att ge dig bättre personliga råd.
            </p>
          </CardContent>
        </Card>
      </div>

      <ExtendedProfileForm 
        onComplete={handleProfileUpdate}
        onUploadProfilePicture={handleProfilePictureUpload}
        isLoading={isLoading}
        initialData={initialData}
      />
    </div>
  );
};