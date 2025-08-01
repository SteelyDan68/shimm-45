import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Brain, CheckCircle, Loader2, Clock, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface AIPlanningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: {
    id: string;
    title: string;
    details?: string;
    content?: string;
  };
  clientId: string;
  clientName: string;
  onPlanCreated?: () => void;
}

interface PlannedActivity {
  title: string;
  description: string;
  event_date: string;
  pillar: string;
  category: string;
}

export const AIPlanningDialog = ({
  isOpen,
  onClose,
  recommendation,
  clientId,
  clientName,
  onPlanCreated
}: AIPlanningDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'confirm' | 'configure' | 'generating' | 'preview' | 'complete'>('confirm');
  const [weeks, setWeeks] = useState(3);
  const [generatedPlan, setGeneratedPlan] = useState<PlannedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    setStep('configure');
  };

  const handleDecline = () => {
    onClose();
  };

  const generatePlan = async () => {
    setIsLoading(true);
    setStep('generating');

    try {
      const recommendationText = recommendation.content || recommendation.details || recommendation.title;
      
      const { data, error } = await supabase.functions.invoke('generate-ai-planning', {
        body: {
          recommendation_text: recommendationText,
          user_id: clientId,
          weeks: weeks
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      setGeneratedPlan(data.activities || []);
      setStep('preview');

      toast({
        title: "Plan genererad!",
        description: `${data.activities_planned} aktiviteter planerade över ${weeks} veckor.`
      });

    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: "Fel vid plangenerering",
        description: "Kunde inte skapa automatisk plan. Försök igen.",
        variant: "destructive"
      });
      setStep('configure');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPlan = () => {
    setStep('complete');
    onPlanCreated?.();
    
    toast({
      title: "Plan implementerad!",
      description: `${generatedPlan.length} aktiviteter har lagts till i kalendern och uppgiftslistan.`
    });

    setTimeout(() => {
      onClose();
      setStep('confirm'); // Reset for next time
    }, 2000);
  };

  const PILLAR_COLORS = {
    self_care: 'bg-green-100 text-green-800',
    skills: 'bg-blue-100 text-blue-800',
    talent: 'bg-purple-100 text-purple-800',
    brand: 'bg-orange-100 text-orange-800',
    economy: 'bg-red-100 text-red-800'
  };

  const PILLAR_NAMES = {
    self_care: 'Self Care',
    skills: 'Skills',
    talent: 'Talent',
    brand: 'Brand',
    economy: 'Economy'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-genererad planering
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Rekommendation för {clientName}:</h4>
              <p className="text-sm text-muted-foreground">
                {recommendation.content || recommendation.details || recommendation.title}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Ska jag skapa en automatisk kalenderplan utifrån denna rekommendation?</h3>
              <p className="text-sm text-muted-foreground">
                AI:n kommer att föreslå konkreta, schemalagda aktiviteter fördelade över flera veckor 
                baserat på rekommendationen ovan.
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleConfirm} className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Ja, skapa plan
              </Button>
              <Button variant="outline" onClick={handleDecline} className="flex-1">
                Nej, hoppa över
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-medium">Konfigurera planen</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tidsperiod</label>
                <Select value={weeks.toString()} onValueChange={(value) => setWeeks(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 veckor</SelectItem>
                    <SelectItem value="3">3 veckor</SelectItem>
                    <SelectItem value="4">4 veckor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">Vad händer nu?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• AI:n skapar en genomförbar {weeks}-veckorsplan</li>
                <li>• Max 1-2 aktiviteter per dag</li>
                <li>• Automatisk fördelning mellan Five Pillars</li>
                <li>• Kalenderhändelser och uppgifter skapas automatiskt</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button onClick={generatePlan} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Generera plan
              </Button>
              <Button variant="outline" onClick={() => setStep('confirm')}>
                Tillbaka
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generating' && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h3 className="font-medium">Genererar din utvecklingsplan...</h3>
            <p className="text-sm text-muted-foreground">
              AI:n analyserar rekommendationen och skapar en strukturerad plan.
            </p>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Förhandsgranska plan</h3>
              <Badge>{generatedPlan.length} aktiviteter</Badge>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3">
              {generatedPlan.map((activity, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    <Badge className={PILLAR_COLORS[activity.pillar as keyof typeof PILLAR_COLORS]}>
                      {PILLAR_NAMES[activity.pillar as keyof typeof PILLAR_NAMES]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{activity.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(activity.event_date), 'dd MMM yyyy, HH:mm', { locale: sv })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={confirmPlan} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Implementera plan
              </Button>
              <Button variant="outline" onClick={() => setStep('configure')}>
                Ändra inställningar
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <div className="space-y-4 text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="font-medium text-green-700">Plan implementerad!</h3>
            <p className="text-sm text-muted-foreground">
              {generatedPlan.length} aktiviteter har lagts till i kalendern och uppgiftslistan.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};