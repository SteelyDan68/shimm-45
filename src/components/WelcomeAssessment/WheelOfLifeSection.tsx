import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { WHEEL_OF_LIFE_AREAS } from '@/config/welcomeAssessment';

interface WheelOfLifeSectionProps {
  scores: Record<string, number>;
  onScoresChange: (scores: Record<string, number>) => void;
}

export const WheelOfLifeSection = ({ scores, onScoresChange }: WheelOfLifeSectionProps) => {
  const handleScoreChange = (areaKey: string, value: number[]) => {
    const updatedScores = {
      ...scores,
      [areaKey]: value[0],
    };
    onScoresChange(updatedScores);
  };

  // Säkerställ att alla områden har default-värden när komponenten laddas
  useEffect(() => {
    const defaultScores: Record<string, number> = {};
    let hasUpdates = false;

    WHEEL_OF_LIFE_AREAS.forEach(area => {
      if (!(area.key in scores)) {
        defaultScores[area.key] = 5; // Standardvärde
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      onScoresChange({ ...scores, ...defaultScores });
    }
  }, []);

  const getScoreColor = (score: number) => {
    if (score <= 3) return "text-red-500";
    if (score <= 5) return "text-yellow-500";
    if (score <= 7) return "text-blue-500";
    return "text-green-500";
  };

  const getScoreLabel = (score: number) => {
    if (score <= 3) return "Behöver uppmärksamhet";
    if (score <= 5) return "Okej";
    if (score <= 7) return "Bra";
    return "Utmärkt";
  };

  const averageScore = Object.values(scores).length > 0 
    ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Livets hjul - Betygsätt varje område</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ge varje livsområde en poäng från 1-10 baserat på hur nöjd du är just nu
        </p>
        {averageScore > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg inline-block">
            <span className="text-sm text-muted-foreground">Genomsnitt: </span>
            <span className={`font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)}/10
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WHEEL_OF_LIFE_AREAS.map((area) => (
          <Card key={area.key} className="p-4">
            <CardContent className="p-0">
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-medium">{area.name}</Label>
                  <p className="text-sm text-muted-foreground">{area.description}</p>
                </div>
                
                <div className="space-y-2">
                  <Slider
                    value={[scores[area.key] || 5]}
                    onValueChange={(value) => handleScoreChange(area.key, value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Låg (1)</span>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(scores[area.key] || 5)}`}>
                        {scores[area.key] || 5}
                      </div>
                      <div className={`text-xs ${getScoreColor(scores[area.key] || 5)}`}>
                        {getScoreLabel(scores[area.key] || 5)}
                      </div>
                    </div>
                    <span className="text-muted-foreground">Hög (10)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips för bedömningen</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Var ärlig - detta är bara för dig och din utveckling</li>
          <li>• Tänk på din situation just nu, inte hur det "borde" vara</li>
          <li>• Låga poäng är okej - de hjälper oss identifiera utvecklingsområden</li>
          <li>• Du kan alltid komma tillbaka och uppdatera din bedömning senare</li>
        </ul>
      </div>
    </div>
  );
};