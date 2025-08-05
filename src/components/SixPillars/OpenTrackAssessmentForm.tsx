import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useUserPillars } from '@/hooks/useUserPillars';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { Compass } from 'lucide-react';

interface OpenTrackAssessmentFormProps {
  onComplete?: () => void;
}

export function OpenTrackAssessmentForm({ onComplete }: OpenTrackAssessmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { savePillarAssessment } = useUserPillars(user?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    exploration_areas: [] as string[],
    motivation_level: '',
    exploration_style: '',
    personal_interests: '',
    time_investment: ''
  });

  const explorationAreas = [
    'Kreativitet & Konstnärligt uttryck',
    'Relationer & Kommunikation', 
    'Spiritualitet & Inre utveckling',
    'Livslångt lärande & Nyfikenhet',
    'Äventyr & Nya upplevelser',
    'Syfte & Meningsfullhet'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      const score = (formData.exploration_areas.length * 15) + 
        (formData.motivation_level === 'high' ? 30 : 20);

      // Use new attribute-based pillar system
      await savePillarAssessment(
        'open_track',
        formData,
        Math.min(score, 100)
      );

      toast({
        title: "Öppna spåret-bedömning genomförd!",
        description: "Din utforskningsresa har dokumenterats.",
      });

      onComplete?.();
    } catch (error) {
      console.error('Full error details:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara bedömningen.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-purple-500" />
          Öppna spåret - Utforskningsbedömning
        </CardTitle>
        <CardDescription>
          Utforska dina intressen och sök ny mening bortom traditionella utvecklingsområden
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">Vilka områden lockar dig att utforska?</Label>
            <div className="space-y-2">
              {explorationAreas.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={area}
                    checked={formData.exploration_areas.includes(area)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({ ...prev, exploration_areas: [...prev.exploration_areas, area] }));
                      } else {
                        setFormData(prev => ({ ...prev, exploration_areas: prev.exploration_areas.filter(a => a !== area) }));
                      }
                    }}
                  />
                  <Label htmlFor={area} className="text-sm">{area}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Hur stark är din motivation att utforska nytt?</Label>
            <RadioGroup 
              value={formData.motivation_level} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, motivation_level: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="motivation-high" />
                <Label htmlFor="motivation-high">Hög - Jag är redo för nya äventyr</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="motivation-medium" />
                <Label htmlFor="motivation-medium">Medium - Jag är nyfiken men försiktig</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personal_interests" className="text-base font-medium">
              Vad väcker din nyfikenhet just nu?
            </Label>
            <Textarea
              id="personal_interests"
              value={formData.personal_interests}
              onChange={(e) => setFormData(prev => ({ ...prev, personal_interests: e.target.value }))}
              placeholder="Dela dina nuvarande intressen..."
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || formData.exploration_areas.length === 0}
          >
            {isSubmitting ? 'Sparar...' : 'Genomför Öppna spåret-bedömning'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}