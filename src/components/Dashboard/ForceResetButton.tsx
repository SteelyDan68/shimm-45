/**
 * 🚨 KRITISK FORCE RESET BUTTON
 * 
 * Denna komponent ger användaren möjlighet att göra en total systemreset
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export const ForceResetButton: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handleForceReset = async () => {
    if (!user?.id) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att göra reset",
        variant: "destructive"
      });
      return;
    }

    // STEG 1: Första varning
    const firstConfirm = window.confirm(
      '🚨 KRITISK VARNING!\n\n' +
      'Detta kommer att radera ALL din utvecklingsdata PERMANENT:\n' +
      '• Alla självskattningar\n' +
      '• Alla AI-analyser\n' +
      '• Alla uppgifter och handlingsplaner\n' +
      '• All framstegshistorik\n\n' +
      'Är du säker på att du vill fortsätta?'
    );

    if (!firstConfirm) return;

    // STEG 2: Sista chansen
    const finalConfirm = window.confirm(
      '⚠️ SISTA CHANSEN!\n\n' +
      'Detta kan INTE ångras. All data kommer att raderas permanent från alla tabeller i databasen.\n\n' +
      'Skriv "RADERA ALLT" i nästa ruta för att bekräfta.'
    );

    if (!finalConfirm) return;

    // STEG 3: Textbekräftelse
    const textConfirm = window.prompt(
      'Skriv "RADERA ALLT" (utan citattecken) för att bekräfta den permanenta raderingen:'
    );

    if (textConfirm !== 'RADERA ALLT') {
      toast({
        title: "Reset avbruten",
        description: "Felaktig bekräftelse. Reset avbruten.",
        variant: "default"
      });
      return;
    }

    setIsResetting(true);

    try {
      console.log('🔄 Starting FORCE TOTAL RESET for user:', user.id);

      // ANROPA EDGE FUNCTION för total reset
      const { data, error } = await supabase.functions.invoke('total-pillar-reset', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function fel: ${error.message}`);
      }

      console.log('✅ Edge function success:', data);

      toast({
        title: "🔄 TOTAL RESET GENOMFÖRD",
        description: "All utvecklingsdata har raderats permanent. Sidan kommer att laddas om.",
        variant: "default"
      });

      // FORCE RELOAD för att visa reset state
      setTimeout(() => {
        window.location.href = '/client-dashboard';
      }, 3000);

    } catch (error: any) {
      console.error('KRITISK ERROR - Reset failed:', error);
      
      toast({
        title: "❌ Reset misslyckades",
        description: `Fel: ${error.message}. Kontakta support om problemet kvarstår.`,
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 text-sm">Nödläge: Total systemreset</h3>
          <p className="text-red-700 text-xs mt-1">
            Om dina data inte försvinner trots reset, använd denna nödknapp för att tvinga fram en total rensning.
          </p>
          <Button
            onClick={handleForceReset}
            disabled={isResetting}
            variant="destructive"
            size="sm"
            className="mt-3"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isResetting ? 'Genomför reset...' : 'FORCE TOTAL RESET'}
          </Button>
        </div>
      </div>
    </div>
  );
};