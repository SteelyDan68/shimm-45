import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle } from 'lucide-react';

export const WelcomeAssessmentReset = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'Är du säker på att du vill återställa din välkomstbedömning? Detta kommer att:\n\n' +
      '• Ta bort alla dina welcome assessment-svar\n' +
      '• Återställa din användarresa till början\n' +
      '• Låta dig göra bedömningen på nytt\n\n' +
      'Detta går inte att ångra!'
    );

    if (!confirmed) return;

    setIsResetting(true);
    try {
      // Delete welcome assessments first
      const { error: deleteError } = await supabase
        .from('welcome_assessments')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Delete welcome assessments error:', deleteError);
        throw deleteError;
      }

      // Check if user_journey_state exists
      const { data: existingJourney } = await supabase
        .from('user_journey_states')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingJourney) {
        // Update existing journey state
        const { error: updateError } = await supabase
          .from('user_journey_states')
          .update({
            current_phase: 'welcome',
            completed_assessments: [],
            journey_progress: 0,
            next_recommended_assessment: null,
            metadata: {},
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Update journey state error:', updateError);
          throw updateError;
        }
      } else {
        // Create new journey state
        const { error: insertError } = await supabase
          .from('user_journey_states')
          .insert({
            user_id: user.id,
            current_phase: 'welcome',
            completed_assessments: [],
            journey_progress: 0,
            next_recommended_assessment: null,
            metadata: {},
            last_activity_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Insert journey state error:', insertError);
          throw insertError;
        }
      }

      toast({
        title: "Återställning slutförd!",
        description: "Din välkomstbedömning har återställts. Ladda om sidan för att se ändringarna.",
      });

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: "Fel vid återställning",
        description: "Kunde inte återställa välkomstbedömningen. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Återställ välkomstbedömning (Debug)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-orange-700">
          Detta är en debug-funktion som låter dig återställa din välkomstbedömning till utgångsläge.
          Använd bara detta för testning och debugging.
        </p>
        
        <div className="bg-orange-100 p-3 rounded border border-orange-200">
          <h4 className="font-medium text-orange-800 mb-2">Vad kommer att hända:</h4>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• Alla dina welcome assessment-svar raderas</li>
            <li>• Din användarresa återställs till "welcome" fas</li>
            <li>• Progressen sätts till 0%</li>
            <li>• Du kan göra välkomstbedömningen igen</li>
          </ul>
        </div>

        <Button 
          onClick={handleReset}
          disabled={isResetting}
          variant="destructive"
          className="w-full"
        >
          {isResetting ? 'Återställer...' : 'Återställ välkomstbedömning'}
        </Button>
      </CardContent>
    </Card>
  );
};