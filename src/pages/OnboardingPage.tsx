import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingForm } from '@/components/Onboarding/OnboardingForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { OnboardingData } from '@/types/onboarding';

export const OnboardingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { saveOnboardingData, isLoading } = useOnboarding();
  const [clientProfile, setClientProfile] = useState<any>(null);
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
        // Om ingen klientprofil finns, redirecta till vanlig dashboard
        navigate('/client-dashboard');
        return;
      }

      setClientProfile(clientData);

      // Om onboarding redan är klar, gå vidare till dashboard
      const metadata = clientData.profile_metadata as any;
      const hasOnboardingData = !!(
        metadata?.onboardingCompleted || 
        (metadata?.generalInfo?.name && metadata?.publicRole?.primaryRole && metadata?.lifeMap?.location)
      );
      
      if (hasOnboardingData) {
        navigate('/client-dashboard');
        return;
      }

    } catch (error) {
      console.error('Error loading client profile:', error);
      navigate('/client-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    if (!clientProfile) return;

    const result = await saveOnboardingData(clientProfile.id, data);
    
    if (result.success) {
      // Efter onboarding, gå till insight assessment
      navigate(`/client-assessment/${clientProfile.id}`);
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/client-dashboard')}
          className="text-muted-foreground"
        >
          Hoppa över och gå till dashboard
        </Button>
      </div>
      
      <OnboardingForm 
        onComplete={handleOnboardingComplete}
        isLoading={isLoading}
      />
    </div>
  );
};