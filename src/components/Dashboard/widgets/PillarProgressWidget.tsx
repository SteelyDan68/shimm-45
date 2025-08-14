/**
 * 🎯 PILLAR PROGRESS WIDGET - Six Pillars utvecklingsöversikt
 */

import React, { useState, memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { ActionTooltip } from '@/components/ui/action-tooltip';
import { HelpTooltip } from '@/components/HelpTooltip';
import { WidgetProps } from '../types/dashboard-types';
import { useUserPillars } from '@/hooks/useUserPillars';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { PillarRetakeDialog } from '@/components/Shared/PillarRetakeDialog';
import { useSixPillarsModular } from '@/hooks/useSixPillarsModular';
import { PillarKey } from '@/types/sixPillarsModular';
import { usePerformanceMonitoringV2, useMemoryOptimization } from '@/utils/performanceOptimizationV2';
import { supabase } from '@/integrations/supabase/client';
import { ForceResetButton } from '../ForceResetButton';

const PillarProgressWidgetComponent: React.FC<WidgetProps> = ({ widget, stats, onAction }) => {
  usePerformanceMonitoringV2('PillarProgressWidget');
  const { registerCleanup } = useMemoryOptimization();
  
  const { user } = useAuth();
  const { 
    getCompletedPillars, 
    getActivatedPillars,
    loading 
  } = useUserPillars(user?.id || '');
  
  const { retakePillar } = useSixPillarsModular(user?.id);
  const [retakePillarKey, setRetakePillarKey] = useState<PillarKey | null>(null);
  const [isRetakeLoading, setIsRetakeLoading] = useState(false);

  const completedPillars = getCompletedPillars();
  const activatedPillars = getActivatedPillars();
  
  // OPTIMIZED: Memoized pillar data calculation
  const allPillars = useMemo(() => [
    { key: 'self_care', name: 'Självomvårdnad' },
    { key: 'skills', name: 'Skills' },
    { key: 'talent', name: 'Talent' },
    { key: 'brand', name: 'Brand' },
    { key: 'economy', name: 'Economy' },
    { key: 'open_track', name: 'Öppet spår' }
  ], []);

  // OPTIMIZED: Memoized pillar data processing
  const pillars = useMemo(() => {
    return allPillars.map((pillar, index) => {
      const completed = completedPillars.some(cp => cp === pillar.key);
      const activated = activatedPillars.some(ap => ap === pillar.key);
      
      // Self-service logic: First pillar (self_care) är alltid tillgänglig
      // Resten blir tillgängliga sekventiellt när föregående är klar
      let available = false;
      if (index === 0) {
        // Första pillaren är alltid tillgänglig för self-service
        available = true;
      } else {
        // Sekventiell logik: föregående pillar måste vara slutförd
        const previousPillar = allPillars[index - 1];
        const previousCompleted = completedPillars.some(cp => cp === previousPillar.key);
        available = activated || completed || previousCompleted;
      }
      
      return {
        ...pillar,
        completed,
        inProgress: activated && !completed,
        available
      };
    });
  }, [allPillars, completedPillars, activatedPillars]);

  const { completedCount, totalProgress } = useMemo(() => ({
    completedCount: pillars.filter(p => p.completed).length,
    totalProgress: (pillars.filter(p => p.completed).length / pillars.length) * 100
  }), [pillars]);

  const getPillarStatus = useCallback((pillar: any) => {
    if (pillar.completed) return { label: 'Slutförd', variant: 'default', icon: CheckCircle };
    if (pillar.inProgress) return { label: 'Pågår', variant: 'secondary', icon: Clock };
    return { label: 'Ej påbörjad', variant: 'outline', icon: Target };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mx-auto mb-2" />
            <div className="h-8 bg-muted rounded w-20 mx-auto mb-2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Progress Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-brain" />
          <span className="font-semibold">Din Utvecklingsresa</span>
          <HelpTooltip content="Six Pillars utvecklingssystem - din progress genom alla sex grundpelare för hållbar framgång." />
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-brain">
            0/6 Pillars
          </div>
          <Progress value={0} className="h-2" />
          <p className="text-xs text-muted-foreground">
            0% genomfört
          </p>
        </div>
      </div>

      {/* Pillars List */}
      <div className="space-y-2">
        {pillars.map((pillar) => {
          const status = getPillarStatus(pillar);
          const StatusIcon = status.icon;
          
          return (
            <div 
              key={pillar.key}
              className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-4 h-4 ${
                  pillar.completed ? 'text-success' : 
                  pillar.inProgress ? 'text-primary' : 
                  'text-muted-foreground'
                }`} />
                
                <div>
                  <p className="font-medium text-sm">{pillar.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pillar.completed ? 'Slutförd' : 
                     pillar.inProgress ? 'Pågår' :
                     pillar.available ? 'Tillgänglig - Klicka för att starta' : 'Slutför föregående pillar först'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={status.variant as any} className="text-xs">
                  {status.label}
                </Badge>
                
                {pillar.completed ? (
                  <div className="flex gap-1">
                    <ActionTooltip content="Visa pillar-resultat och analys">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/development-overview?focus=${pillar.key}`}
                        className="w-8 h-8 p-0"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </ActionTooltip>
                    <ActionTooltip content="Gör om bedömningen för denna pillar">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRetakePillarKey(pillar.key as PillarKey)}
                        className="w-8 h-8 p-0 text-warning hover:text-warning/80 hover:bg-warning/10"
                      >
                        ↻
                      </Button>
                    </ActionTooltip>
                  </div>
                ) : pillar.available ? (
                  <ActionTooltip content={`Starta ${pillar.name} assessment`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/six-pillars/${pillar.key}`}
                      className="w-8 h-8 p-0"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </ActionTooltip>
                ) : (
                  <ActionTooltip content="Slutför föregående pillar först för att låsa upp denna">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="w-8 h-8 p-0 opacity-50"
                    >
                      <Target className="w-3 h-3" />
                    </Button>
                  </ActionTooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <ActionTooltip content="Öppna Six Pillars dashboard för fullständig översikt">
          <Button 
            className="flex-1"
            onClick={() => onAction?.('view-pillars')}
          >
            <Target className="w-4 h-4 mr-2" />
            Se Alla Pillars
          </Button>
        </ActionTooltip>
        
        {/* 🔄 LIVE RESET BUTTON för alla pillars */}
        {completedCount > 0 && (
          <ActionTooltip content="Nollställ hela utvecklingsresan och börja om från början">
            <Button 
              variant="outline"
              size="sm"
                onClick={async () => {
                  const confirmReset = window.confirm(
                    '🚨 KRITISK VARNING: Detta kommer att radera ALL din utvecklingsdata PERMANENT. Alla självskattningar, analyser, uppgifter och framsteg kommer att försvinna för alltid. Är du ABSOLUT säker?'
                  );
                  if (confirmReset) {
                    const doubleConfirm = window.confirm(
                      '⚠️ SISTA CHANSEN: Detta kan INTE ångras. All data kommer att raderas från ALLA tabeller i databasen. Tryck OK för att fortsätta med den totala raderingen.'
                    );
                    if (doubleConfirm && user?.id) {
                      try {
                        console.log('🔄 Starting TOTAL SYSTEM RESET...');
                        
                        // STEG 1: Anropa vår totala reset-funktion
                        const { data, error } = await supabase.functions.invoke('total-pillar-reset', {
                          body: { userId: user.id }
                        });
                        
                        if (error) {
                          console.error('Total reset error:', error);
                          throw error;
                        }
                        
                        console.log('✅ Total reset completed:', data);
                        
                        // STEG 2: Force refresh för omedelbar visuell reset
                        setTimeout(() => {
                          window.location.reload();
                        }, 2000);
                        
                      } catch (error) {
                        console.error('KRITISK ERROR - Reset failed:', error);
                        alert('Reset misslyckades. Kontakta support.');
                      }
                    }
                  }
                }}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
            >
              🔄 Reset
            </Button>
          </ActionTooltip>
        )}
        
        {(() => {
          const nextPillar = pillars.find(p => p.available && !p.completed && !p.inProgress);
          return nextPillar ? (
            <Button 
              variant="outline"
              onClick={() => onAction?.(`start-pillar-${nextPillar.key}`)}
            >
              Starta {nextPillar.name}
            </Button>
          ) : completedCount < pillars.length ? (
            <Button 
              variant="outline"
              onClick={() => onAction?.('continue-journey')}
            >
              Fortsätt
            </Button>
          ) : null;
        })()}
      </div>

      {/* KRITISK NÖDLÄGESRESET */}
      <div className="mt-6">
        <ForceResetButton />
      </div>

      {/* Retake Dialog */}
      <PillarRetakeDialog
        isOpen={retakePillarKey !== null}
        pillarKey={retakePillarKey!}
        isLoading={isRetakeLoading}
        onConfirm={async () => {
          if (!retakePillarKey) return;
          
          setIsRetakeLoading(true);
          try {
            await retakePillar(retakePillarKey);
            setRetakePillarKey(null);
            // Force refresh to show visual reset
            window.location.reload();
          } catch (error) {
            console.error('Failed to retake pillar:', error);
          } finally {
            setIsRetakeLoading(false);
          }
        }}
        onCancel={() => setRetakePillarKey(null)}
      />
    </div>
  );
};

// PERFORMANCE OPTIMIZATION: Memoized export
export const PillarProgressWidget = memo(PillarProgressWidgetComponent);

export default PillarProgressWidget;