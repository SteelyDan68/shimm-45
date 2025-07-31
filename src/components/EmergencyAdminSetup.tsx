import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { emergencySuperadminSetup } from '@/utils/emergencySetup';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function EmergencyAdminSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    const checkUserRoles = async () => {
      if (!user) return;
      
      try {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        setNeedsSetup(!roles || roles.length === 0);
      } catch (error) {
        console.error('Failed to check user roles:', error);
        setNeedsSetup(true);
      } finally {
        setLoading(false);
      }
    };

    checkUserRoles();
  }, [user]);

  const handleEmergencySetup = async () => {
    setSetupLoading(true);
    try {
      const success = await emergencySuperadminSetup();
      if (success) {
        toast({
          title: "✅ Superadmin-behörighet tilldelad",
          description: "Du har nu superadmin-behörighet. Sidan kommer att laddas om.",
        });
        setNeedsSetup(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast({
          title: "❌ Misslyckades med att tilldela behörighet",
          description: "Kontakta support för hjälp.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Ett fel uppstod",
        description: "Kunde inte tilldela superadmin-behörighet.",
        variant: "destructive"
      });
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!needsSetup) {
    return null;
  }

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <strong>Första gången-setup krävs</strong>
            <p className="text-sm mt-1">
              Ditt konto behöver superadmin-behörighet för att komma åt alla funktioner.
            </p>
          </div>
          <Button 
            onClick={handleEmergencySetup} 
            disabled={setupLoading}
            variant="outline"
            size="sm"
          >
            {setupLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tilldelar...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Tilldela behörighet
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}