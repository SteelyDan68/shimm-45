/**
 * 🎯 INTENT DISCOVERY - Förstår användarens mål innan assessment
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Target, Clock, Zap } from 'lucide-react';

export interface IntentData {
  primaryFocus: string;
  timeCommitment: string;
  mainGoal: string;
  urgency: string;
}

interface IntentDiscoveryProps {
  onComplete: (intentData: IntentData) => void;
  onSkip: () => void;
}

export const IntentDiscovery: React.FC<IntentDiscoveryProps> = ({ 
  onComplete, 
  onSkip 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [intentData, setIntentData] = useState<Partial<IntentData>>({});

  const questions = [
    {
      id: 'primaryFocus',
      title: 'Vad vill du fokusera på just nu?',
      description: 'Välj det område som känns mest relevant för dig idag',
      icon: Target,
      options: [
        { value: 'health', label: 'Hälsa & välmående', description: 'Fysisk och mental hälsa, energi, stress' },
        { value: 'career', label: 'Karriär & utveckling', description: 'Kompetenser, talanger, professionell tillväxt' },
        { value: 'brand', label: 'Synlighet & varumärke', description: 'Personal brand, närvaro, påverkan' },
        { value: 'economy', label: 'Ekonomi & resurser', description: 'Intäkter, investeringar, finansiell trygghet' },
        { value: 'balance', label: 'Balans & struktur', description: 'Livsstil, rutiner, personlig utveckling' }
      ]
    },
    {
      id: 'timeCommitment',
      title: 'Hur mycket tid kan du lägga på utveckling?',
      description: 'Realistisk bedömning av din tillgängliga tid per vecka',
      icon: Clock,
      options: [
        { value: 'minimal', label: '1-2 timmar/vecka', description: 'Små, enkla steg som passar in i vardagen' },
        { value: 'moderate', label: '3-5 timmar/vecka', description: 'Några fokuserade sessioner per vecka' },
        { value: 'dedicated', label: '6+ timmar/vecka', description: 'Jag prioriterar min utveckling högt' }
      ]
    },
    {
      id: 'mainGoal',
      title: 'Vad är ditt huvudmål för nästa 3 månader?',
      description: 'Välj det som känns mest angeläget att uppnå',
      icon: Zap,
      options: [
        { value: 'clarity', label: 'Få klarhet', description: 'Förstå mina styrkor och vart jag ska fokusera' },
        { value: 'momentum', label: 'Skapa fart', description: 'Komma igång med konkreta förändringar' },
        { value: 'results', label: 'Se resultat', description: 'Uppnå mätbara framsteg i specifika områden' },
        { value: 'system', label: 'Bygga system', description: 'Etablera hållbara rutiner och processer' }
      ]
    },
    {
      id: 'urgency',
      title: 'Hur akut känns ditt utvecklingsbehov?',
      description: 'Detta hjälper oss prioritera rätt för dig',
      icon: Target,
      options: [
        { value: 'exploratory', label: 'Utforskande', description: 'Jag vill lära mig mer om mig själv' },
        { value: 'proactive', label: 'Proaktiv', description: 'Jag vill förebygga framtida utmaningar' },
        { value: 'immediate', label: 'Akut behov', description: 'Jag behöver lösningar på nuvarande problem' }
      ]
    }
  ];

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswerSelect = (value: string) => {
    const updatedData = { ...intentData, [currentQuestion.id]: value };
    setIntentData(updatedData);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(updatedData as IntentData);
    }
  };

  const IconComponent = currentQuestion.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Steg {currentStep + 1} av {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-2">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <IconComponent className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">{currentQuestion.title}</CardTitle>
          <p className="text-muted-foreground">{currentQuestion.description}</p>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={intentData[currentQuestion.id as keyof IntentData] || ''} 
            onValueChange={handleAnswerSelect}
            className="space-y-4"
          >
            {currentQuestion.options.map((option) => (
              <div key={option.value} className="relative">
                <Label
                  htmlFor={option.value}
                  className="flex items-start space-x-3 p-4 rounded-lg border-2 border-border hover:border-primary/50 cursor-pointer transition-all"
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="ghost" 
          onClick={onSkip}
          className="text-muted-foreground"
        >
          Hoppa över
        </Button>
        
        {currentStep > 0 && (
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            Föregående
          </Button>
        )}
      </div>
    </div>
  );
};