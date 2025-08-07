import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Target, 
  Zap, 
  Brain, 
  MessageSquare, 
  Calendar,
  Star,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Gift,
  Lightbulb,
  Users,
  BarChart3,
  Heart
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AllPillarsCompletedCelebrationProps {
  completedPillars: string[];
  onContinueToNextPhase: () => void;
  onExploreAdvancedFeatures: () => void;
  onScheduleCheckIn: () => void;
}

export const AllPillarsCompletedCelebration: React.FC<AllPillarsCompletedCelebrationProps> = ({
  completedPillars,
  onContinueToNextPhase,
  onExploreAdvancedFeatures,
  onScheduleCheckIn
}) => {
  const [currentTab, setCurrentTab] = useState('celebration');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(true); // Start with true since we auto-generate
  const [planGenerated, setPlanGenerated] = useState(false);
  const [planResults, setPlanResults] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Automatically trigger AI planning when component mounts
  useEffect(() => {
     if (user?.id && completedPillars.length === 6 && !planGenerated) {
      
      generateComprehensivePlan();
    }
  }, [user?.id, completedPillars.length]);

  const generateComprehensivePlan = async () => {
    if (!user?.id) return;
    
    setIsGeneratingPlan(true);
    
    try {
      
      
      const { data, error } = await supabase.functions.invoke('generate-ai-planning', {
        body: {
          user_id: user.id,
          recommendation_text: `FASE 2: INTEGRERAD LIVSUTVECKLING AKTIVERAD!

Användaren har triumferande genomfört alla 6 livspillars och är nu redo för avancerad, holistisk utveckling som fokuserar på synergieffekter mellan alla områden:

🏃‍♂️ HÄLSA & VÄLMÅENDE - Energigrunden som driver allt annat
🛠️ FÄRDIGHETER - Verktygslådan för att förverkliga visioner  
⭐ TALANG & PASSION - Den unika drivkraften och naturliga styrkan
🎯 VARUMÄRKE & POSITION - Extern påverkan och strategisk positionering
💰 EKONOMI - Resurser, trygghet och finansiell frihet
🚀 ÖPPET SPÅR - Innovation, kreativitet och personlig utveckling

SKAPA EN OMFATTANDE 4-VECKORS PLAN MED:
- Dagliga "små vinnare" som förstärker neuroplastiska förändringar
- Korskorrelationer och synergieffekter mellan olika pillars
- Praktiska aktiviteter som bygger på varandra
- Mätbara framsteg inom varje område
- Innovation och kreativa genombrott

Fokusera på hållbarhet, momentum och exponentiell utveckling!`,
          weeks: 4,
          comprehensive: true,
          intensity: 'balanced'
        }
      });

      if (error) {
        console.error('❌ Error generating comprehensive plan:', error);
        toast({
          title: "AI-planering misslyckades",
          description: "Vi kunde inte generera din utvecklingsplan automatiskt. Försök igen.",
          variant: "destructive"
        });
        setIsGeneratingPlan(false);
        return;
      }

      
      setPlanResults(data);
      setPlanGenerated(true);

      // Show success message with results
      toast({
        title: "🎉 FAS 2 AKTIVERAD!",
        description: `${data?.events_created || 0} kalenderaktiviteter och ${data?.tasks_created || 0} utvecklingsuppgifter har skapats för din 4-veckors integrerade utvecklingsplan!`,
        duration: 8000
      });

      // Dispatch events to update other components
      window.dispatchEvent(new CustomEvent('calendar-updated'));
      window.dispatchEvent(new CustomEvent('tasks-updated'));

      // Auto-navigate to next phase tab after a moment
      setTimeout(() => {
        setCurrentTab('next-phase');
      }, 2000);

    } catch (error) {
      console.error('❌ Error in generateComprehensivePlan:', error);
      toast({
        title: "Fel vid AI-planering",
        description: "Ett fel inträffade vid skapandet av utvecklingsplanen. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Status indicator for plan generation */}
      {isGeneratingPlan && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              <div className="text-center">
                <h3 className="text-xl font-semibold text-blue-700">
                  🤖 AI Stefan arbetar intensivt...
                </h3>
                <p className="text-blue-600 mt-2">
                  Skapar din personliga Fas 2-utvecklingsplan baserat på alla dina genomförda assessments.
                  Detta tar ungefär 15-30 sekunder.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success indicator when plan is generated */}
      {planGenerated && planResults && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-green-700">
                ✅ FAS 2 AKTIVERAD!
              </h3>
              <p className="text-green-600">
                <strong>{planResults.events_created || 0} kalenderaktiviteter</strong> och{' '}
                <strong>{planResults.tasks_created || 0} utvecklingsuppgifter</strong> har skapats!
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <Button 
                  onClick={() => window.open('/calendar', '_blank')}
                  variant="outline" 
                  size="sm"
                  className="border-green-500 text-green-700 hover:bg-green-50"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Se Kalender
                </Button>
                <Button 
                  onClick={() => window.open('/tasks', '_blank')}
                  variant="outline" 
                  size="sm"
                  className="border-green-500 text-green-700 hover:bg-green-50"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Se Uppgifter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Huvudcelebration */}
      <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 border-2 border-purple-200">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Trophy className="w-20 h-20 text-yellow-500 animate-bounce" />
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🎉 FANTASTISKT! Du har genomfört alla 6 pelare! 🎉
          </CardTitle>
          
          <div className="space-y-3">
            <p className="text-xl text-gray-700">
              Du har precis fullföljt en komplett livsutvecklingsresa som omfattar alla viktiga områden.
              {planGenerated ? ' Din personliga Fas 2-plan är nu aktiv!' : ' AI Stefan förbereder din nästa fas...'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Progress value={100} className="w-64 h-3" />
              <Badge variant="default" className="bg-green-500 text-white px-3 py-1">
                6/6 Pelare ✨
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { name: 'Hälsa & Välmående', icon: '🏃‍♂️', color: 'bg-red-100' },
              { name: 'Färdigheter', icon: '🛠️', color: 'bg-blue-100' },
              { name: 'Talang & Passion', icon: '⭐', color: 'bg-yellow-100' },
              { name: 'Varumärke & Position', icon: '🎯', color: 'bg-purple-100' },
              { name: 'Ekonomi', icon: '💰', color: 'bg-green-100' },
              { name: 'Öppet Spår', icon: '🚀', color: 'bg-orange-100' }
            ].map((pillar, index) => (
              <div key={index} className={`${pillar.color} p-3 rounded-lg flex items-center gap-2`}>
                <span className="text-2xl">{pillar.icon}</span>
                <div>
                  <div className="font-medium text-sm">{pillar.name}</div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700">Genomförd</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expertteamets råd och nästa steg */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="celebration" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Belöning
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI-Insikter
          </TabsTrigger>
          <TabsTrigger value="next-phase" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Nästa Fas
          </TabsTrigger>
          <TabsTrigger value="team-advice" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Expertråd
          </TabsTrigger>
        </TabsList>

        <TabsContent value="celebration" className="space-y-4">
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-orange-500" />
                Din Belöning För Att Ha Genomfört Allt!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    Avancerade AI-Funktioner Upplåsta
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Prediktiv coaching baserat på dina mönster</li>
                    <li>• Avancerad trendanalys och förutsägelser</li>
                    <li>• Personliga utvecklingsrekommendationer</li>
                    <li>• Automatiska livsstilsoptimering</li>
                  </ul>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Star className="w-5 h-5 text-purple-500" />
                    Premiumfunktioner Tillgängliga
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Månadsvis djupanalys av din utveckling</li>
                    <li>• Personlig coaching-samtal med AI Stefan</li>
                    <li>• Avancerade insights och rapporter</li>
                    <li>• Tillgång till kommunityfunktioner</li>
                  </ul>
                </div>
              </div>
              
              <Button 
                onClick={onExploreAdvancedFeatures}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={isGeneratingPlan}
              >
                {isGeneratingPlan ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Genererar AI-plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Utforska Dina Nya Funktioner
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-500" />
                AI-Analys: Din Kompletta Utvecklingsprofil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">🎯 Dina Starkaste Områden</h4>
                <p className="text-sm text-gray-700">
                  Baserat på dina assessments visar du särskild styrka inom strategiskt tänkande 
                  och personlig utveckling. Din vilja att genomföra alla sex pelare visar på 
                  exceptionell disciplin och självkännedom.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">🚀 Utvecklingsområden Med Störst Potential</h4>
                <p className="text-sm text-gray-700">
                  Nu när du har en helhetsbild kan du fokusera på synergieffekter mellan områdena. 
                  Kombinationen av dina talanger och ditt varumärke har störst potential för 
                  exponentiell tillväxt.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">🧠 Neuroplasticitets-Profil</h4>
                <p className="text-sm text-gray-700">
                  Din hjärna har nu skapat nya kopplingar inom alla sex livsområden. 
                  Fortsätt med små, dagliga förstärkningar för att permanenta dessa positiva mönster.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="next-phase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6 text-green-500" />
                Fas 2: Integrerad Livsutveckling
                {planGenerated && (
                  <Badge className="bg-green-500 text-white ml-2">
                    AKTIVERAD ✨
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {planGenerated ? (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Din Fas 2-plan är nu aktiv!
                  </h4>
                  <p className="text-green-700 text-sm">
                    {planResults?.events_created || 0} kalenderaktiviteter och {planResults?.tasks_created || 0} utvecklingsuppgifter 
                    har skapats för de kommande 4 veckorna. De fokuserar på synergieffekter mellan alla dina pillar-områden.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={() => window.open('/calendar', '_blank')}
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Öppna Kalender
                    </Button>
                    <Button 
                      onClick={() => window.open('/tasks', '_blank')}
                      size="sm" 
                      variant="outline"
                      className="border-green-500 text-green-700 hover:bg-green-50"
                    >
                      <Target className="w-4 h-4 mr-1" />
                      Se Uppgifter
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                  <p className="text-blue-700">
                    {isGeneratingPlan ? 
                      '🤖 AI Stefan skapar din personliga Fas 2-plan...' : 
                      'Din Fas 2-plan håller på att förbereds...'
                    }
                  </p>
                </div>
              )}

              <p className="text-gray-700">
                Nu börjar den riktiga magin! Istället för att utveckla områden isolerat, 
                arbetar vi nu med <strong>synergieffekter</strong> mellan dina sex pelare.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Dagliga Små Vinnare
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Få mikro-aktiviteter som förstärker neuroplastiska förändringar 
                    och bygger momentum över alla sex områden.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open('/tasks', '_blank')}
                    disabled={!planGenerated}
                  >
                    {planGenerated ? 'Se Dagens Uppgifter' : 'Aktiveras snart...'}
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Synergieffekter
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Upptäck hur dina talanger kan förstärka ditt varumärke, 
                    och hur din hälsa påverkar din kreativitet.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open('/calendar', '_blank')}
                    disabled={!planGenerated}
                  >
                    {planGenerated ? 'Se Planerade Aktiviteter' : 'Aktiveras snart...'}
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Kreativa Kombinationer
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    AI-genererade aktiviteter som kombinerar flera pillars 
                    för maximala genombrott och innovation.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open('/ai-insights', '_blank')}
                    disabled={!planGenerated}
                  >
                    {planGenerated ? 'Utforska AI-Insikter' : 'Aktiveras snart...'}
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    Målinriktad Utveckling
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    4-veckors intensiv plan med dagliga aktiviteter som 
                    bygger på varandra för exponentiell utveckling.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setCurrentTab('team-advice')}
                  >
                    Se Expertråd
                  </Button>
                </div>
              </div>

              {planGenerated && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 text-purple-800">🎯 Ditt Nästa Steg:</h4>
                  <p className="text-purple-700 text-sm mb-3">
                    Gå till din kalender och påbörja dagens första aktivitet. 
                    Systemet kommer automatiskt att anpassa sig efter dina framsteg och preferenser.
                  </p>
                  <Button 
                    onClick={() => window.open('/calendar', '_blank')}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Starta Fas 2: Första Aktiviteten
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team-advice" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🧠 AI Coach Stefan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  "Grattis! Du har visat exceptionell disciplin. Nu kommer den riktiga 
                  utvecklingen - när alla områden börjar förstärka varandra. Fokusera på 
                  <strong>dagliga små vinnare</strong> inom varje pillar istället för stora genombrott."
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chatta med Stefan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🎯 UX/UI Designer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  "Fantastisk resa! Nu bör du skapa <strong>visuella påminnelser</strong> 
                  i din miljö om dina genomförda pillars. Detta förstärker de neuroplastiska 
                  förändringarna och hjälper dig behålla momentumet."
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Skapa Visuell Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📊 Data Analyst
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  "Dina mönster visar på 83% completion rate - över genomsnittet! 
                  Nästa steg är att <strong>spåra korskorrelationer</strong> mellan 
                  pillars för att maximera synergieffekter."
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Se Avancerad Analys
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🚀 DevOps Expert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  "Nu när systemet har full data kan vi aktivera <strong>prediktiv coaching</strong>. 
                  AI:n kommer proaktivt föreslå optimeringar baserat på dina beteendemönster."
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Aktivera Auto-Optimering
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Slutligt handlingsuppmaning */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">
              🎯 Din Nästa Konkreta Handling
            </h3>
            <p className="text-gray-600">
              För att behålla momentumet, boka en 15-minuters check-in med AI Stefan inom 48 timmar.
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={onScheduleCheckIn}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Boka Check-in Nu
              </Button>
              <Button variant="outline">
                Påminn Mig Imorgon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};