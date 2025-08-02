import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useExtendedProfile } from '@/hooks/useExtendedProfile';
import { ExtendedProfileForm } from '@/components/Profile/ExtendedProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Shield } from 'lucide-react';
import type { ExtendedProfileData } from '@/types/extendedProfile';
import { useToast } from '@/hooks/use-toast';

export default function AdminEditProfilePage() {
  const { user, hasRole } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveExtendedProfile, getExtendedProfile, uploadProfilePicture, isLoading } = useExtendedProfile();
  const [initialData, setInitialData] = useState<ExtendedProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetUserName, setTargetUserName] = useState<string>('');

  // Check admin permissions
  const canEditProfile = hasRole('admin') || hasRole('superadmin');

  useEffect(() => {
    if (!canEditProfile) {
      toast({
        title: "Ingen behörighet",
        description: "Du har inte behörighet att redigera andra användares profiler",
        variant: "destructive"
      });
      navigate('/administration');
      return;
    }

    if (userId) {
      loadProfileData();
    }
  }, [userId, canEditProfile]);

  const loadProfileData = async () => {
    if (!userId) return;
    
    try {
      const profileData = await getExtendedProfile(userId);
      setInitialData(profileData);
      setTargetUserName(`${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() || profileData?.email || 'Användare');
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda profildata",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (data: ExtendedProfileData) => {
    if (!userId) return;
    
    const result = await saveExtendedProfile(data, userId);
    
    if (result.success) {
      toast({
        title: "Profil uppdaterad",
        description: `Profilen för ${targetUserName} har uppdaterats`
      });
      navigate('/administration');
    }
  };

  const handleProfilePictureUpload = async (file: File): Promise<string> => {
    const result = await uploadProfilePicture(file, userId);
    return result || '';
  };

  if (!canEditProfile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Ingen behörighet</h3>
              <p className="text-muted-foreground">Du har inte behörighet att redigera andra användares profiler.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          onClick={() => navigate('/administration')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till administration
        </Button>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Redigera profil - {targetUserName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Som administratör kan du här uppdatera all profilinformation för användaren. 
              Ändringar sparas direkt i systemet och användaren kommer att se uppdateringarna omedelbart.
            </p>
          </CardContent>
        </Card>
      </div>

      <ExtendedProfileForm 
        onComplete={handleProfileUpdate}
        onUploadProfilePicture={handleProfilePictureUpload}
        isLoading={isLoading}
        initialData={initialData}
        isClientView={false}
      />
    </div>
  );
}