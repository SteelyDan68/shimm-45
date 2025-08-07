/**
 * 🎯 SMART RECOMMENDATION ENGINE
 * Intelligent rekommendationssystem med neuroplasticitet och adaptivt lärande
 * Phase 3: AI Intelligence Revolution
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb, 
  TrendingUp, 
  Star, 
  Clock, 
  Target,
  Brain,
  Zap,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Activity
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUserPillars } from '@/hooks/useUserPillars';
import { useToast } from '@/hooks/use-toast';

interface SmartRecommendation {
  id: string;
  type: 'skill_development' | 'behavioral_change' | 'goal_optimization' | 'habit_formation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  timeInvestment: number; // minutes
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  expectedImpact: number; // 1-100
  neuroplasticityFactor: number; // 1-10
  adaptiveScore: number; // how well it matches user pattern
  pillarConnection: string[];
  actionSteps: string[];
  successMetrics: string[];
  personalizedContext: string;
}

interface SmartRecommendationEngineProps {
  userId?: string;
  maxRecommendations?: number;
  focusArea?: 'all' | 'skills' | 'behavior' | 'goals' | 'habits';
  className?: string;
}

export const SmartRecommendationEngine: React.FC<SmartRecommendationEngineProps> = ({
  userId,
  maxRecommendations = 8,
  focusArea = 'all',
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const effectiveUserId = userId || user?.id;
  
  const { getCompletedPillars, getActivatedPillars } = useUserPillars(effectiveUserId || '');
  
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>(focusArea);
  const [userPreferences, setUserPreferences] = useState({
    preferredDifficulty: 3,
    availableTime: 30,
    focusAreas: [] as string[]
  });

  // 🧠 INTELLIGENT RECOMMENDATION GENERATION
  const generateSmartRecommendations = async () => {
    setIsGenerating(true);
    
    try {
      const completedPillars = getCompletedPillars();
      const activatedPillars = getActivatedPillars();
      
      const smartRecommendations: SmartRecommendation[] = [];
      
      // 📈 SKILL DEVELOPMENT RECOMMENDATIONS
      if (completedPillars.length > 0) {
        smartRecommendations.push({
          id: 'skill-advanced-coaching',
          type: 'skill_development',
          priority: 'high',
          title: 'Utveckla avancerade coaching-färdigheter',
          description: 'Baserat på dina genomförda pillars, är du redo för mer avancerade tekniker.',
          rationale: 'Din framgångsfrekvens visar på stark grund för vidare utveckling.',
          timeInvestment: 45,
          difficultyLevel: 4,
          expectedImpact: 85,
          neuroplasticityFactor: 8,
          adaptiveScore: 92,
          pillarConnection: completedPillars.map(p => String(p)),
          actionSteps: [
            'Välj en specifik coaching-nisch att fördjupa dig i',
            'Genomför 5 praktiska övningar inom området',
            'Reflektera över resultaten i din utvecklingsjournal',
            'Planera nästa steg i din färdighetsresa'
          ],
          successMetrics: [
            'Genomfört 5 avancerade övningar',
            'Dokumenterat lärande i journal',
            'Identifierat nästa utvecklingsområde'
          ],
          personalizedContext: `Du har genomfört ${completedPillars.length} pillars, vilket visar stark commitment.`
        });
      }

      // 🔄 BEHAVIORAL CHANGE RECOMMENDATIONS
      if (activatedPillars.length > completedPillars.length) {
        const incompletionRate = ((activatedPillars.length - completedPillars.length) / activatedPillars.length) * 100;
        
        smartRecommendations.push({
          id: 'behavior-completion-optimization',
          type: 'behavioral_change',
          priority: incompletionRate > 50 ? 'urgent' : 'medium',
          title: 'Optimera din genomförandeprocess',
          description: 'Förbättra din förmåga att genomföra påbörjade utvecklingsområden.',
          rationale: 'Mönster visar potential för förbättrad completion rate.',
          timeInvestment: 25,
          difficultyLevel: 2,
          expectedImpact: 75,
          neuroplasticityFactor: 7,
          adaptiveScore: 88,
          pillarConnection: activatedPillars.map(p => String(p)),
          actionSteps: [
            'Identifiera vad som hindrar dig från att slutföra',
            'Dela upp stora uppgifter i mindre steg',
            'Sätt upp belöningssystem för framsteg',
            'Skapa accountability-struktur'
          ],
          successMetrics: [
            'Förbättrad completion rate med 20%',
            'Reducerad tid mellan aktivering och slutförande',
            'Ökad självförtroende i måluppfyllelse'
          ],
          personalizedContext: `${Math.round(incompletionRate)}% av dina aktiverade pillars väntar på genomförande.`
        });
      }

      // 🎯 GOAL OPTIMIZATION RECOMMENDATIONS
      if (completedPillars.length >= 2) {
        smartRecommendations.push({
          id: 'goal-holistic-integration',
          type: 'goal_optimization',
          priority: 'high',
          title: 'Integrera dina utvecklingsområden holistiskt',
          description: 'Skapa synergier mellan dina genomförda utvecklingsområden.',
          rationale: 'Multipla genomförda pillars skapar möjlighet för djupare integration.',
          timeInvestment: 60,
          difficultyLevel: 3,
          expectedImpact: 90,
          neuroplasticityFactor: 9,
          adaptiveScore: 95,
          pillarConnection: completedPillars.map(p => String(p)),
          actionSteps: [
            'Kartlägg kopplingar mellan dina genomförda pillars',
            'Identifiera överlappande färdigheter och insikter',
            'Skapa en integrerad utvecklingsplan',
            'Implementera korsningspunkter i din dagliga praktik'
          ],
          successMetrics: [
            'Skapade holistisk utvecklingsplan',
            'Identifierat 3+ synergier mellan pillars',
            'Implementerat integrerade dagliga rutiner'
          ],
          personalizedContext: `Dina ${completedPillars.length} genomförda pillars har stor potential för synergi.`
        });
      }

      // 🔄 HABIT FORMATION RECOMMENDATIONS
      smartRecommendations.push({
        id: 'habit-neuroplasticity-routine',
        type: 'habit_formation',
        priority: 'medium',
        title: 'Etablera neuroplasticitet-stödjande rutiner',
        description: 'Bygg dagliga vanor som förstärker din hjärnas förmåga att utvecklas.',
        rationale: 'Neuroplasticitet förbättras dramatiskt genom konsekventa, små vanor.',
        timeInvestment: 15,
        difficultyLevel: 2,
        expectedImpact: 70,
        neuroplasticityFactor: 10,
        adaptiveScore: 80,
        pillarConnection: ['self_care', 'skills'],
        actionSteps: [
          'Välj 1-2 enkla dagliga aktiviteter för hjärnträning',
          'Koppla nya vanor till befintliga rutiner',
          'Tracka genomförande i 21 dagar',
          'Gradvis öka komplexiteten när vanan är etablerad'
        ],
        successMetrics: [
          '21 dagar konsekvent genomförande',
          'Märkbar förbättring i fokus och minne',
          'Etablerad automatisk rutin'
        ],
        personalizedContext: 'Små dagliga vanor skapar stora förändringar över tid.'
      });

      // 🚀 ADVANCED RECOMMENDATIONS based on user patterns
      if (completedPillars.length === 0 && activatedPillars.length > 0) {
        smartRecommendations.push({
          id: 'skill-foundation-building',
          type: 'skill_development',
          priority: 'urgent',
          title: 'Bygg stark grund med din första genomförda pillar',
          description: 'Fokusera all energi på att slutföra din första pillar för att skapa momentum.',
          rationale: 'Den första genomförda pillar skapar psykologisk momentum för framtida framgång.',
          timeInvestment: 30,
          difficultyLevel: 1,
          expectedImpact: 95,
          neuroplasticityFactor: 8,
          adaptiveScore: 98,
          pillarConnection: [String(activatedPillars[0] || '')],
          actionSteps: [
            'Välj din enklaste aktiverade pillar',
            'Dedikera 15 minuter dagligen i en vecka',
            'Dokumentera dagliga framsteg',
            'Fira genomförandet när det är klart'
          ],
          successMetrics: [
            'Första pillar genomförd',
            'Ökad självförtroende',
            'Etablerat utvecklingsmönster'
          ],
          personalizedContext: 'Din första genomförda pillar blir grunden för allt som kommer efter.'
        });
      }

      setRecommendations(smartRecommendations.slice(0, maxRecommendations));
      
    } catch (error) {
      console.error('Error generating smart recommendations:', error);
      toast({
        title: "Rekommendationer misslyckades",
        description: "Kunde inte generera personaliserade rekommendationer just nu.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (effectiveUserId) {
      generateSmartRecommendations();
    }
  }, [effectiveUserId]);

  const filteredRecommendations = useMemo(() => {
    if (selectedFilter === 'all') return recommendations;
    return recommendations.filter(rec => {
      switch (selectedFilter) {
        case 'skills': return rec.type === 'skill_development';
        case 'behavior': return rec.type === 'behavioral_change';
        case 'goals': return rec.type === 'goal_optimization';
        case 'habits': return rec.type === 'habit_formation';
        default: return true;
      }
    });
  }, [recommendations, selectedFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skill_development': return Brain;
      case 'behavioral_change': return TrendingUp;
      case 'goal_optimization': return Target;
      case 'habit_formation': return Activity;
      default: return Lightbulb;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Smart Recommendation Engine</CardTitle>
                <CardDescription>
                  Personaliserade rekommendationer baserade på AI-analys av dina mönster
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={generateSmartRecommendations}
              disabled={isGenerating}
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Genererar...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Uppdatera
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">Alla</TabsTrigger>
          <TabsTrigger value="skills">Färdigheter</TabsTrigger>
          <TabsTrigger value="behavior">Beteende</TabsTrigger>
          <TabsTrigger value="goals">Mål</TabsTrigger>
          <TabsTrigger value="habits">Vanor</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedFilter} className="space-y-4">
          {filteredRecommendations.map((recommendation) => {
            const TypeIcon = getTypeIcon(recommendation.type);
            
            return (
              <Card key={recommendation.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <TypeIcon className="h-5 w-5 mt-1 text-blue-600" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(recommendation.priority)}`} />
                        </div>
                        <CardDescription>{recommendation.description}</CardDescription>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {recommendation.timeInvestment} min
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Svårighet: {recommendation.difficultyLevel}/5
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Impact: {recommendation.expectedImpact}%
                          </div>
                          <div className="flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            Neuroplasticitet: {recommendation.neuroplasticityFactor}/10
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {recommendation.adaptiveScore}% match
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Rationale */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-900 mb-1">Varför denna rekommendation?</h5>
                      <p className="text-sm text-blue-800">{recommendation.rationale}</p>
                    </div>
                    
                    {/* Personalized Context */}
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h5 className="text-sm font-medium text-purple-900 mb-1">Personlig kontext</h5>
                      <p className="text-sm text-purple-800">{recommendation.personalizedContext}</p>
                    </div>
                    
                    {/* Action Steps */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Handlingsplan:</h5>
                      <ul className="space-y-1">
                        {recommendation.actionSteps.map((step, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Success Metrics */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Framgångsmått:</h5>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.successMetrics.map((metric, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {metric}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Connected Pillars */}
                    {recommendation.pillarConnection.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Kopplade utvecklingsområden:</h5>
                        <div className="flex flex-wrap gap-2">
                          {recommendation.pillarConnection.map((pillar, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {pillar}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Button className="w-full sm:w-auto">
                      Implementera rekommendation
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredRecommendations.length === 0 && !isGenerating && (
            <Card>
              <CardContent className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Inga rekommendationer för denna kategori</h3>
                <p className="text-muted-foreground">
                  Prova en annan kategori eller generera nya rekommendationer
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};