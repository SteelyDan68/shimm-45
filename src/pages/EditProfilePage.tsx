import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingForm } from '@/components/Onboarding/OnboardingForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit } from 'lucide-react';
import type { OnboardingData } from '@/types/onboarding';

export const EditProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { saveOnboardingData, getOnboardingData, isLoading } = useOnboarding();
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [initialData, setInitialData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadClientProfile();
    }
  }, [user]);

  const loadClientProfile = async () => {
    if (!user) return;
    
    try {
      // Hitta klient som matchar användarens email
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (clientError) throw clientError;

      if (!clientData) {
        // Om ingen klientprofil finns, redirecta till dashboard
        navigate('/client-dashboard');
        return;
      }

      setClientProfile(clientData);

      // Hämta befintlig onboarding data
      const existingData = await getOnboardingData(clientData.id);
      setInitialData(existingData);

    } catch (error) {
      console.error('Error loading client profile:', error);
      navigate('/client-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (data: OnboardingData) => {
    if (!clientProfile) return;

    const result = await saveOnboardingData(clientProfile.id, data);
    
    if (result.success) {
      // Efter uppdatering, gå tillbaka till dashboard
      navigate('/client-dashboard');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientProfile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">Ingen klientprofil hittades</h2>
            <p className="text-muted-foreground">Kontakta din coach för att få en profil skapad.</p>
            <Button 
              onClick={() => navigate('/client-dashboard')}
              className="mt-4"
            >
              Tillbaka till dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
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
              Här kan du uppdatera din allmänna information när som helst. Dina ändringar sparas automatiskt.
            </p>
          </CardContent>
        </Card>
      </div>

      <OnboardingForm 
        onComplete={handleProfileUpdate}
        isLoading={isLoading}
        initialData={initialData}
        isEditMode={true}
      />
    </div>
  );
};