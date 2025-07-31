import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightAssessment } from '@/components/InsightAssessment/InsightAssessment';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export const ClientAssessmentPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && clientId) {
      loadClientProfile();
    }
  }, [user, clientId]);

  const loadClientProfile = async () => {
    if (!user || !clientId) return;
    
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .eq('email', user.email) // Ensure user owns this profile
        .maybeSingle();

      if (clientError) throw clientError;

      if (!clientData) {
        navigate('/client-dashboard');
        return;
      }

      setClientProfile(clientData);
    } catch (error) {
      console.error('Error loading client profile:', error);
      navigate('/client-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentComplete = () => {
    navigate('/client-dashboard');
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
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
      </div>
    );
  }

  if (!clientProfile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">Profil hittades inte</h2>
            <p className="text-muted-foreground">Du har inte behörighet att komma åt denna profil.</p>
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
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Profil komplett!</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Sista steget: Självskattning</h1>
          <p className="text-muted-foreground">
            Nu när vi känner dig bättre, hjälp oss förstå din nuvarande situation
          </p>
        </div>
      </div>

      <Card className="border-2">
        <CardContent className="p-8">
          <InsightAssessment 
            clientId={clientProfile.id} 
            clientName={clientProfile.name}
            onComplete={handleAssessmentComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
};