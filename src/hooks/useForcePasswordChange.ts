import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useForcePasswordChange() {
  const { user } = useAuth();
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkPasswordChangeRequired = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Kontrollera user metadata från auth
        const forcePasswordChange = user.user_metadata?.force_password_change;
        const tempPassword = user.user_metadata?.temp_password;
        
        if (forcePasswordChange || tempPassword) {
          setMustChangePassword(true);
        }

        // Bara kolla user metadata eftersom force_password_change kanske inte finns i DB än
        // Efter migration kommer den att finnas i profiles tabellen också

      } catch (error) {
        console.error('Error checking password change requirement:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPasswordChangeRequired();
  }, [user]);

  const updatePassword = async (newPassword: string) => {
    if (!user) throw new Error('Ingen användare inloggad');

    try {
      // Uppdatera lösenord i Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          force_password_change: false,
          temp_password: false,
          password_changed_at: new Date().toISOString()
        }
      });

      if (updateError) throw updateError;

      // Uppdatera profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          force_password_change: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't fail completely for profile update
      }

      // Logga lösenordsändring
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: user.id,
          action: 'password_change_forced',
          target_user_id: user.id,
          details: {
            changed_at: new Date().toISOString(),
            user_initiated: true
          }
        });

      setMustChangePassword(false);
      
      toast({
        title: "Lösenord uppdaterat",
        description: "Ditt lösenord har uppdaterats framgångsrikt"
      });

      return true;
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte uppdatera lösenord",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    mustChangePassword,
    isLoading,
    updatePassword
  };
}