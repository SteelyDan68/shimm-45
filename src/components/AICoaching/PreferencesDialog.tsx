import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock, Zap, Target, Settings } from 'lucide-react';

export interface CoachingPreferences {
  intensity: 'chill' | 'moderate' | 'intense';
  duration: number; // weeks
  frequency: 'daily' | 'few-times-week' | 'weekly';
}

interface PreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreferencesSet: (preferences: CoachingPreferences) => void;
}

const intensityOptions = [
  {
    value: 'chill' as const,
    title: 'Chill Mode',
    description: 'Lugn takt, 5-10 min aktiviteter',
    icon: <Clock className="h-5 w-5" />,
    color: 'bg-green-50 border-green-200 text-green-700',
    tasks: '1-2 enkla uppgifter/vecka'
  },
  {
    value: 'moderate' as const,
    title: 'Balanserat',
    description: 'Strukturerad utveckling, 15-30 min',
    icon: <Target className="h-5 w-5" />,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    tasks: '3-4 uppgifter/vecka'
  },
  {
    value: 'intense' as const,
    title: 'Intensivt',
    description: 'Fokuserad tillväxt, 30-60 min',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    tasks: '5-7 uppgifter/vecka'
  }
];

const durationOptions = [
  { value: 2, label: '2 veckor', description: 'Snabb start' },
  { value: 4, label: '4 veckor', description: 'Rekommenderat' },
  { value: 8, label: '8 veckor', description: 'Djup förändring' },
  { value: 12, label: '12 veckor', description: 'Transformation' }
];

export function PreferencesDialog({ open, onOpenChange, onPreferencesSet }: PreferencesDialogProps) {
  const [selectedIntensity, setSelectedIntensity] = useState<CoachingPreferences['intensity']>('moderate');
  const [selectedDuration, setSelectedDuration] = useState(4);
  const [selectedFrequency, setSelectedFrequency] = useState<CoachingPreferences['frequency']>('few-times-week');

  const handleContinue = () => {
    onPreferencesSet({
      intensity: selectedIntensity,
      duration: selectedDuration,
      frequency: selectedFrequency
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Personalisera din AI-coaching
          </DialogTitle>
          <DialogDescription>
            Anpassa intensiteten och längden på din utvecklingsresa för bästa resultat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Intensity Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold">Välj intensitetsnivå</h3>
            <div className="grid gap-3">
              {intensityOptions.map((option) => (
                <Card 
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    selectedIntensity === option.value 
                      ? 'ring-2 ring-primary ' + option.color
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedIntensity(option.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${option.color}`}>
                          {option.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{option.title}</h4>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{option.tasks}</div>
                        <RadioGroup value={selectedIntensity} className="mt-1">
                          <RadioGroupItem 
                            value={option.value} 
                            checked={selectedIntensity === option.value}
                          />
                        </RadioGroup>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold">Välj längd på programmet</h3>
            <RadioGroup value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(Number(value))}>
              <div className="grid grid-cols-2 gap-3">
                {durationOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value.toString()} id={`duration-${option.value}`} />
                    <Label htmlFor={`duration-${option.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Frequency Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold">Frekvens för uppgifter</h3>
            <RadioGroup value={selectedFrequency} onValueChange={(value) => setSelectedFrequency(value as CoachingPreferences['frequency'])}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="freq-daily" />
                  <Label htmlFor="freq-daily">Dagligen - Små konsistenta steg</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="few-times-week" id="freq-few" />
                  <Label htmlFor="freq-few">Några gånger i veckan - Balanserat tempo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="freq-weekly" />
                  <Label htmlFor="freq-weekly">Veckovis - Fokuserade sessioner</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Din personaliserade plan:</h4>
            <div className="text-sm space-y-1">
              <p>• <strong>Intensitet:</strong> {intensityOptions.find(o => o.value === selectedIntensity)?.title}</p>
              <p>• <strong>Längd:</strong> {selectedDuration} veckor</p>
              <p>• <strong>Uppgifter:</strong> {
                selectedFrequency === 'daily' ? 'Dagligen' :
                selectedFrequency === 'few-times-week' ? 'Några gånger/vecka' :
                'Veckovis'
              }</p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button onClick={handleContinue}>
              Skapa min plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}