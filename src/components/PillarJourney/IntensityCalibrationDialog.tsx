import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Target, Zap, Coffee, Rocket } from 'lucide-react';

interface IntensityCalibrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCalibrationComplete: (intensity: IntensityLevel, duration: DurationLevel) => void;
  pillarName: string;
}

export interface IntensityLevel {
  key: 'light' | 'moderate' | 'intensive';
  label: string;
  description: string;
  minutesPerDay: number;
  activitiesPerWeek: number;
  icon: React.ReactNode;
  color: string;
}

export interface DurationLevel {
  key: 'sprint' | 'journey' | 'marathon';
  label: string;
  description: string;
  weeks: number;
  icon: React.ReactNode;
  color: string;
}

const INTENSITY_LEVELS: IntensityLevel[] = [
  {
    key: 'light',
    label: 'Chill Läge',
    description: 'Perfekt för upptagna dagar. Små, enkla steg som lätt får plats.',
    minutesPerDay: 10,
    activitiesPerWeek: 3,
    icon: <Coffee className="w-5 h-5" />,
    color: 'bg-green-100 text-green-700 border-green-200'
  },
  {
    key: 'moderate',
    label: 'Balanserat Tempo',
    description: 'Lagom utmaning. Bra mix av reflektion och action.',
    minutesPerDay: 25,
    activitiesPerWeek: 5,
    icon: <Target className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  {
    key: 'intensive',
    label: 'Full Power',
    description: 'För dig som verkligen vill se snabba resultat. Mer intensivt.',
    minutesPerDay: 45,
    activitiesPerWeek: 7,
    icon: <Rocket className="w-5 h-5" />,
    color: 'bg-purple-100 text-purple-700 border-purple-200'
  }
];

const DURATION_LEVELS: DurationLevel[] = [
  {
    key: 'sprint',
    label: 'Snabb Sprint',
    description: 'Intensiv fokus i 2 veckor. Perfekt för snabba genombrott.',
    weeks: 2,
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-red-100 text-red-700 border-red-200'
  },
  {
    key: 'journey',
    label: 'Stadig Resa',
    description: 'Balanserad utveckling över en månad. Hållbart och effektivt.',
    weeks: 4,
    icon: <Calendar className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  {
    key: 'marathon',
    label: 'Djup Transformation',
    description: 'Långsiktig förändring över 8 veckor. För djupgående utveckling.',
    weeks: 8,
    icon: <Target className="w-5 h-5" />,
    color: 'bg-green-100 text-green-700 border-green-200'
  }
];

const IntensityCalibrationDialog: React.FC<IntensityCalibrationDialogProps> = ({
  isOpen,
  onClose,
  onCalibrationComplete,
  pillarName
}) => {
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<DurationLevel | null>(null);
  const [step, setStep] = useState<'intensity' | 'duration' | 'confirm'>('intensity');

  const handleContinue = () => {
    if (step === 'intensity' && selectedIntensity) {
      setStep('duration');
    } else if (step === 'duration' && selectedDuration) {
      setStep('confirm');
    }
  };

  const handleConfirm = () => {
    if (selectedIntensity && selectedDuration) {
      onCalibrationComplete(selectedIntensity, selectedDuration);
      onClose();
      // Reset for next time
      setSelectedIntensity(null);
      setSelectedDuration(null);
      setStep('intensity');
    }
  };

  const getTotalActivities = () => {
    if (!selectedIntensity || !selectedDuration) return 0;
    return selectedIntensity.activitiesPerWeek * selectedDuration.weeks;
  };

  const getTotalTimeCommitment = () => {
    if (!selectedIntensity || !selectedDuration) return 0;
    return selectedIntensity.minutesPerDay * 7 * selectedDuration.weeks;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            🎯 Anpassa din {pillarName}-resa
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Intensity Selection */}
        {step === 'intensity' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Hur mycket tid har du per dag?</h3>
              <p className="text-muted-foreground">
                Vi anpassar aktiviteterna efter ditt tempo och din vardag.
              </p>
            </div>

            <div className="grid gap-4">
              {INTENSITY_LEVELS.map((intensity) => (
                <Card 
                  key={intensity.key}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedIntensity?.key === intensity.key 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedIntensity(intensity)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${intensity.color}`}>
                          {intensity.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold">{intensity.label}</h4>
                          <p className="text-sm text-muted-foreground">
                            {intensity.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {intensity.minutesPerDay} min/dag
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {intensity.activitiesPerWeek} aktiviteter/vecka
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button 
              onClick={handleContinue}
              disabled={!selectedIntensity}
              className="w-full"
            >
              Fortsätt till tidslängd →
            </Button>
          </div>
        )}

        {/* Step 2: Duration Selection */}
        {step === 'duration' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Över hur lång tid?</h3>
              <p className="text-muted-foreground">
                Välj den tidsram som känns rätt för din {pillarName}-utveckling.
              </p>
            </div>

            <div className="grid gap-4">
              {DURATION_LEVELS.map((duration) => (
                <Card 
                  key={duration.key}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedDuration?.key === duration.key 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDuration(duration)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${duration.color}`}>
                          {duration.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold">{duration.label}</h4>
                          <p className="text-sm text-muted-foreground">
                            {duration.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          <Calendar className="w-3 h-3 mr-1" />
                          {duration.weeks} veckor
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('intensity')}
                className="flex-1"
              >
                ← Tillbaka
              </Button>
              <Button 
                onClick={handleContinue}
                disabled={!selectedDuration}
                className="flex-1"
              >
                Se sammanfattning →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedIntensity && selectedDuration && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">🎉 Perfekt! Här är din plan</h3>
              <p className="text-muted-foreground">
                Vi skapar nu en personlig utvecklingsplan baserat på dina val.
              </p>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center space-y-2">
                    <div className={`inline-flex p-3 rounded-full ${selectedIntensity.color}`}>
                      {selectedIntensity.icon}
                    </div>
                    <h4 className="font-semibold">{selectedIntensity.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedIntensity.minutesPerDay} min/dag
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className={`inline-flex p-3 rounded-full ${selectedDuration.color}`}>
                      {selectedDuration.icon}
                    </div>
                    <h4 className="font-semibold">{selectedDuration.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedDuration.weeks} veckor
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h5 className="font-semibold text-center">Din personliga plan:</h5>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{getTotalActivities()}</p>
                      <p className="text-xs text-muted-foreground">Totalt aktiviteter</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(getTotalTimeCommitment() / 60)}h
                      </p>
                      <p className="text-xs text-muted-foreground">Total tid</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedDuration.weeks}
                      </p>
                      <p className="text-xs text-muted-foreground">Veckor</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('duration')}
                className="flex-1"
              >
                ← Ändra
              </Button>
              <Button 
                onClick={handleConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                🚀 Skapa min plan!
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IntensityCalibrationDialog;