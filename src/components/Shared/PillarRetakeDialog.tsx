/**
 * 🔄 PILLAR RETAKE DIALOG
 * 
 * Återanvändbar dialog för att bekräfta och genomföra pillar retake
 * Hanterar dependency integrity enligt SCRUM team policy
 */

import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { PILLAR_MODULES } from '@/config/pillarModules';
import { PillarKey } from '@/types/sixPillarsModular';

interface PillarRetakeDialogProps {
  isOpen: boolean;
  pillarKey: PillarKey;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PillarRetakeDialog: React.FC<PillarRetakeDialogProps> = ({
  isOpen,
  pillarKey,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const pillarConfig = PILLAR_MODULES[pillarKey];

  if (!isOpen) return null;

  const handleConfirmWithWarnings = async () => {
    // STEG 1: Första varning
    const firstConfirm = window.confirm(
      '🚨 KRITISK VARNING!\n\n' +
      `Detta kommer att radera ALL din ${pillarConfig?.name} data PERMANENT:\n` +
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
      alert('Felaktig bekräftelse. Reset avbruten.');
      return;
    }

    // Genomför reset om alla varningar bekräftats
    await onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Gör om {pillarConfig?.name}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Är du säker på att du vill göra om denna pillar? 
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-orange-800 mb-2">⚠️ Detta kommer att radera:</p>
              <ul className="text-orange-700 space-y-1 list-disc list-inside">
                <li>Alla dina tidigare resultat och poäng</li>
                <li>Alla AI-genererade rekommendationer</li>
                <li>Alla todos och uppgifter i kalendern</li>
                <li>All progress och analys för denna pillar</li>
                <li>Alla path entries och milstolpar</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-800 mb-1">✨ Du får:</p>
              <p className="text-blue-700">
                Möjlighet att göra en helt ny bedömning från början med dina nuvarande kunskaper och erfarenheter.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Observera:</strong> Denna åtgärd kan inte ångras.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Avbryt
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmWithWarnings}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-600"
          >
            {isLoading ? 'Återställer...' : 'Ja, gör om pillaren'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};