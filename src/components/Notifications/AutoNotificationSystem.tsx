import React, { useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const AutoNotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id) return;

    // Set up real-time subscriptions for notifications
    const subscription = supabase
      .channel('auto-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.ai_generated) {
            toast({
              title: "🤖 Ny AI-uppgift tillagd!",
              description: `Stefan har skapat: "${payload.new.title}"`,
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calendar_events',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.created_by_role === 'ai') {
            toast({
              title: "📅 Ny aktivitet i kalender!",
              description: `AI Stefan har schemalagt: "${payload.new.title}"`,
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.status === 'completed' && payload.old?.status !== 'completed') {
            toast({
              title: "🎉 Uppgift slutförd!",
              description: "Bra jobbat! Stefan analyserar dina framsteg.",
              duration: 4000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, toast]);

  return null; // This is an invisible component that handles notifications
};