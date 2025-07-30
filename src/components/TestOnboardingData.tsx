import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { OnboardingData } from '@/types/onboarding';

export const TestOnboardingData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testBorjeOnboarding = async () => {
    setIsLoading(true);
    
    const testData: OnboardingData = {
      generalInfo: {
        name: 'Börje Sandhill',
        age: '45',
        gender: 'Man',
        height: '180 cm',
        weight: '75 kg',
        physicalLimitations: '',
        neurodiversity: ''
      },
      publicRole: {
        primaryRole: 'Influencer',
        secondaryRole: 'Entreprenör',
        niche: 'Livsstil och motivation',
        creativeStrengths: 'Storytelling, autentisk kommunikation, coaching',
        platforms: ['Instagram', 'YouTube', 'LinkedIn'],
        challenges: 'Konsistens i content creation',
        instagramHandle: '@borje.sandhill',
        youtubeHandle: 'BörjeSandhill',
        tiktokHandle: '',
        snapchatHandle: '',
        facebookHandle: 'Börje Sandhill',
        twitterHandle: '@borjesandhill'
      },
      lifeMap: {
        location: 'Stockholm',
        livingWith: 'Familj',
        hasChildren: 'yes',
        ongoingChanges: 'Utveckling av ny coachingverksamhet',
        pastCrises: ''
      },
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString()
    };

    try {
      // Hitta Börjes klient-ID
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', 'borje.sandhill@gmail.com')
        .single();

      if (clientError) throw clientError;

      // Spara onboarding-data
      const profileMetadata = {
        generalInfo: testData.generalInfo,
        publicRole: testData.publicRole,
        lifeMap: testData.lifeMap,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('clients')
        .update({ 
          profile_metadata: profileMetadata,
          name: testData.generalInfo.name,
          instagram_handle: testData.publicRole.instagramHandle,
          youtube_channel: testData.publicRole.youtubeHandle,
          tiktok_handle: testData.publicRole.tiktokHandle
        })
        .eq('id', clientData.id);

      if (updateError) throw updateError;

      toast({
        title: "Test lyckades!",
        description: "Börje Sandhills onboarding-data har sparats.",
      });

      // Verifiera att data sparades
      const { data: verifyData, error: verifyError } = await supabase
        .from('clients')
        .select('name, profile_metadata, instagram_handle, youtube_channel')
        .eq('id', clientData.id)
        .single();

      if (verifyError) throw verifyError;

      console.log('Sparad data för Börje:', verifyData);
      
    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: "Test misslyckades",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearOnboardingData = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          profile_metadata: {},
          instagram_handle: null,
          youtube_channel: null,
          tiktok_handle: null
        })
        .eq('email', 'borje.sandhill@gmail.com');

      if (error) throw error;

      toast({
        title: "Data rensad",
        description: "Börje Sandhills onboarding-data har rensats.",
      });
      
    } catch (error: any) {
      console.error('Clear error:', error);
      toast({
        title: "Rensning misslyckades",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Test Onboarding Data</CardTitle>
        <CardDescription>
          Testa att spara och rensa onboarding-data för Börje Sandhill
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testBorjeOnboarding}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Sparar...' : 'Spara test-data för Börje'}
        </Button>
        
        <Button 
          onClick={clearOnboardingData}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? 'Rensar...' : 'Rensa onboarding-data'}
        </Button>
      </CardContent>
    </Card>
  );
};