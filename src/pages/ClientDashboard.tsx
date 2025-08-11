import React, { useEffect } from 'react';
import { DashboardOrchestrator } from '@/components/Dashboard/DashboardOrchestrator';
import { useToast } from '@/hooks/use-toast';

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

  return <DashboardOrchestrator layout="full" />;
};

export default ClientDashboard;