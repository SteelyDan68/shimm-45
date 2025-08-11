/**
 * 🎯 PILLAR ASSESSMENT PAGE
 * Dedicerad sida för att genomföra pillar-assessment
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { ModularPillarAssessment } from './ModularPillarAssessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Target } from 'lucide-react';
import { HelpTooltip } from '@/components/HelpTooltip';
import { PillarKey } from '@/types/sixPillarsModular';

const PILLAR_NAMES: Record<PillarKey, string> = {
  'self_care': 'Self Care',
  'skills': 'Skills', 
  'talent': 'Talent',
  'brand': 'Brand',
  'economy': 'Economy',
  'open_track': 'Open Track'
};

export const PillarAssessmentPage: React.FC = () => {
  const { pillarKey } = useParams<{ pillarKey: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Validera pillar key
  const validPillarKey = pillarKey as PillarKey;
  const isValidPillar = Object.keys(PILLAR_NAMES).includes(validPillarKey);

  useEffect(() => {
    if (!isValidPillar) {
      console.error('Invalid pillar key:', pillarKey);
      navigate('/six-pillars');
    }
  }, [pillarKey, isValidPillar, navigate]);

  if (!user) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Inloggning krävs</h2>
        <p className="text-muted-foreground">Du måste vara inloggad för att genomföra assessments.</p>
      </div>
    );
  }

  if (!isValidPillar) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Ogiltig pelare</h2>
        <p className="text-muted-foreground">Pelaren "{pillarKey}" existerar inte.</p>
        <Button 
          onClick={() => navigate('/six-pillars')}
          className="mt-4"
        >
          Tillbaka till Six Pillars
        </Button>
      </div>
    );
  }

  const pillarName = PILLAR_NAMES[validPillarKey];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/six-pillars')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>
        
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{pillarName} Assessment</h1>
              <HelpTooltip content={`Självskattning för ${pillarName}. Dina svar används för AI‑analys och rekommendationer.`} />
            </div>
            <p className="text-muted-foreground">
              Bedöm din nuvarande nivå inom {pillarName.toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Container */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Bedömning för {pillarName}</CardTitle>
            <HelpTooltip content={`Denna sektion innehåller alla frågor för ${pillarName}. Du kan spara och återkomma senare.`} />
          </div>
        </CardHeader>
        <CardContent>
          <ModularPillarAssessment 
            pillarKey={validPillarKey}
            userId={user.id}
            onComplete={() => {
              // Navigera tillbaka med framgångsmeddelande
              navigate('/client-dashboard?tab=pillars', { 
                state: { message: `${pillarName} assessment slutförd!` }
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};