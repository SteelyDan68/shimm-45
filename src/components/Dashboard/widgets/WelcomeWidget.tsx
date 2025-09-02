/**
 * 🌟 WELCOME WIDGET - Välkomstmeddelande och översikt
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Trophy, Target } from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useNavigation } from '@/hooks/useNavigation';
import { DevelopmentOverviewContent } from './DevelopmentOverviewContent';
import StefanGuidanceWidget from '@/components/Stefan/StefanGuidanceWidget';

const WelcomeWidget: React.FC<WidgetProps> = ({ widget, stats, onAction }) => {
  const { user, profile } = useAuth();
  const { goTo } = useNavigation();
  
  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Användare';

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'God morgon';
    if (hour < 17) return 'God middag'; 
    return 'God kväll';
  };

  const getMotivationalMessage = () => {
    if (!stats) return "Välkommen till din utvecklingsresa!";
    
    if (stats.completedPillars && stats.completedPillars >= 5) {
      return "🎉 Fantastiskt! Du har nästan slutfört hela utvecklingsresan!";
    }
    
    if (stats.completedPillars && stats.completedPillars >= 3) {
      return "💪 Du gör stora framsteg! Fortsätt så här bra!";
    }
    
    if (stats.activeTasks && stats.activeTasks > 0) {
      return "🎯 Du har aktiva uppgifter att arbeta med - kör på!";
    }
    
    return "🚀 Dags att sätta igång med din utvecklingsresa!";
  };

  return (
    <div className="space-y-4">
      {/* Välkomsttext */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold">
          <Sparkles className="w-6 h-6 text-purple-600" />
          {getWelcomeMessage()}, {displayName}! 👋
        </div>
        
        <p className="text-muted-foreground">
          {getMotivationalMessage()}
        </p>
      </div>

      {/* Progress Highlights */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600">
              0/6
            </div>
            <p className="text-xs text-muted-foreground">Pillars klara</p>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">
              0
            </div>
            <p className="text-xs text-muted-foreground">Aktiva uppgifter</p>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-purple-600">
              0%
            </div>
            <p className="text-xs text-muted-foreground">Progress</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 justify-center flex-wrap">
        {stats && stats.completedAssessments && stats.completedAssessments > 0 ? (
          <>
            <Button 
              size="sm"
              onClick={() => goTo.myAssessments()}
              className="flex items-center gap-1"
            >
              <Target className="w-4 h-4" />
              Se mina självskattningar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => goTo.myAnalyses()}
              className="flex items-center gap-1"
            >
              Mina analyser
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => goTo.myProgram()}
              className="flex items-center gap-1"
            >
              Mitt program
            </Button>
          </>
        ) : (
          <Button 
            size="sm"
            onClick={() => goTo.guidedAssessment()}
            className="flex items-center gap-1"
          >
            <Target className="w-4 h-4" />
             Gör din första självskattning
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Stefan Guidance */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Stefan säger
          </h3>
          <StefanGuidanceWidget />
        </div>
      </div>

      {/* Development Overview Content */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <DevelopmentOverviewContent />
      </div>
    </div>
  );
};

export { WelcomeWidget };
export default WelcomeWidget;