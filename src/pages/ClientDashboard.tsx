import React, { useEffect } from 'react';
import { DashboardOrchestrator } from '@/components/Dashboard/DashboardOrchestrator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ClientDashboard = () => {
  const { toast } = useToast();

  useEffect(() => {
    const flag = sessionStorage.getItem('showPasswordResetToast');
    if (flag === '1') {
      toast({
        title: 'Lösenord uppdaterat',
        description: 'Din inloggning är nu säkrad. Välkommen tillbaka!',
      });
      sessionStorage.removeItem('showPasswordResetToast');
    }
  }, [toast]);

  // One-time Resend test email (per session)
  useEffect(() => {
    const alreadySent = sessionStorage.getItem('resendTestEmailSent');
    if (alreadySent === '1') return;

    const sendTestEmail = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            to: 'stefan.hallgren@gmail.com',
            firstName: 'Stefan',
            role: 'client',
            inviterName: 'SHMMS'
          }
        });
        if (error) throw error;
        toast({
          title: 'Testmail skickat',
          description: 'Resend skickade ett mail till stefan.hallgren@gmail.com'
        });
        sessionStorage.setItem('resendTestEmailSent', '1');
      } catch (e: any) {
        toast({
          title: 'Fel vid skickande',
          description: e?.message || 'Kunde inte skicka via Resend'
        });
      }
    };

    sendTestEmail();
  }, [toast]);

  return <DashboardOrchestrator layout="full" />;

};

export default ClientDashboard;