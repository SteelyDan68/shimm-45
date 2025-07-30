import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AssessmentForm } from './AssessmentForm';
import { Brain, BarChart3 } from 'lucide-react';

interface InsightAssessmentProps {
  clientId: string;
  clientName: string;
  onComplete?: () => void;
}

export function InsightAssessment({ clientId, clientName, onComplete }: InsightAssessmentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = () => {
    setIsOpen(false);
    onComplete?.(); // Anropa callback om den finns
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Gör självskattning
          <Brain className="h-4 w-4 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Självskattning med AI-analys</DialogTitle>
          <DialogDescription>
            Skatta dina hinder inom 13 områden och få personlig AI-coaching baserat på dina svar
          </DialogDescription>
        </DialogHeader>
        
        <AssessmentForm 
          clientId={clientId}
          clientName={clientName}
          onComplete={handleComplete}
        />
      </DialogContent>
    </Dialog>
  );
}