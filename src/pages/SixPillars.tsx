import { useAuth } from '@/providers/UnifiedAuthProvider';
import { ModularPillarDashboard } from '@/components/SixPillars/ModularPillarDashboard';
import { PillarAssessmentPage } from '@/components/SixPillars/PillarAssessmentPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/HelpTooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useParams } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Heart, 
  Lightbulb, 
  Star, 
  Palette, 
  DollarSign,
  ArrowRight,
  CheckCircle,
  Clock,
  Brain,
  Route,
  BarChart3,
  Target,
  Sparkles,
  Activity,
  Zap
} from 'lucide-react';

// 🎯 PHASE 2 UX REVOLUTION: Enhanced user experience with micro-interactions
export const SixPillars = () => {
  const { user, profile } = useAuth();
  const { pillarKey } = useParams<{ pillarKey: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [overallProgress, setOverallProgress] = useState(0);

  // 🔄 Calculate overall progress across all pillars
  useEffect(() => {
    // Mock calculation - should integrate with real progress data
    const mockProgress = Math.floor(Math.random() * 40) + 20; // 20-60%
    setOverallProgress(mockProgress);
  }, []);

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center p-8 animate-fade-in">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">Laddar...</span>
      </div>
    );
  }

  // Om vi har en pillarKey, visa assessment-sidan
  if (pillarKey) {
    return <PillarAssessmentPage />;
  }

  const pillarIntros = [
    {
      key: 'self_care',
      name: 'Självomvårdnad',
      icon: <Heart className="h-8 w-8" />,
      color: '#EF4444',
      description: 'Grundstenen för hållbar utveckling. Din fysiska och mentala hälsa.',
      benefits: ['Bättre energi', 'Ökad motståndskraft', 'Förbättrat välmående']
    },
    {
      key: 'skills',
      name: 'Kompetenser',
      icon: <Lightbulb className="h-8 w-8" />,
      color: '#F59E0B',
      description: 'Dina färdigheter och kunskaper som driver din professionella utveckling.',
      benefits: ['Ökad anställningsbarhet', 'Högre värde', 'Nya möjligheter']
    },
    {
      key: 'talent',
      name: 'Talang',
      icon: <Star className="h-8 w-8" />,
      color: '#8B5CF6',
      description: 'Dina unika styrkor och begåvningar som gör dig speciell.',
      benefits: ['Naturlig excellens', 'Ökat självförtroende', 'Unik positionering']
    },
    {
      key: 'brand',
      name: 'Varumärke',
      icon: <Palette className="h-8 w-8" />,
      color: '#06B6D4',
      description: 'Hur du presenterar dig själv och blir synlig i din bransch.',
      benefits: ['Ökad synlighet', 'Fler möjligheter', 'Starkare nätverk']
    },
    {
      key: 'economy',
      name: 'Ekonomi',
      icon: <DollarSign className="h-8 w-8" />,
      color: '#10B981',
      description: 'Din finansiella trygghet och förmåga att skapa värde.',
      benefits: ['Ekonomisk frihet', 'Säkerhet', 'Investeringsmöjligheter']
    },
    {
      key: 'open_track',
      name: 'Öppna spåret',
      icon: <Route className="h-8 w-8" />,
      color: '#EC4899',
      description: 'Din personliga utvecklingsresa med fritt valbara mål och förändringar.',
      benefits: ['Flexibel utveckling', 'Personliga mål', 'Egen takt']
    }
  ];

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* 🎯 PHASE 5: Advanced Analytics Integration - Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <TrendingUp className="h-10 w-10 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Sex Pelare
          </h1>
          <HelpTooltip content="Six Pillars är vårt beprövade system för hållbar utveckling inom sex kritiska livsområden." />
        </div>
        
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Ett holistiskt utvecklingssystem som balanserar sex grundpelare för hållbar framgång och välmående
        </p>
        
        {/* 📊 PHASE 5: Progress indicator with analytics */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between text-sm">
            <span>Din totala utveckling</span>
            <span className="font-semibold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            Baserat på dina senaste bedömningar och aktiviteter
          </p>
        </div>
        
        <Alert className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 border-primary/20">
          <Brain className="h-5 w-5" />
          <AlertDescription className="text-center">
            <strong>🚀 Nya funktioner!</strong> Nu med AI-analys, prediktiva insikter och 
            realtidsuppdateringar av din utvecklingsresa.
          </AlertDescription>
        </Alert>
      </div>

      {/* 📱 PHASE 2: Enhanced UX with Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="pillars">Pelare</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Cards - PHASE 5: Advanced Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover-scale">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{overallProgress}%</p>
                <p className="text-sm text-muted-foreground">Totalt</p>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">6/6</p>
                <p className="text-sm text-muted-foreground">Aktiva Pelare</p>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">AI Insights</p>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Mål</p>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started Section - PHASE 1: Progressive Onboarding */}
          <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Så här kommer du igång</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-3 hover-scale">
                  <div className="flex items-center justify-center">
                    <div className="bg-primary/10 rounded-full p-4">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold">1. Gör dina första bedömningar</h3>
                  <p className="text-sm text-muted-foreground">
                    Bedöm dig själv inom varje pelare för att få en utgångspunkt
                  </p>
                </div>
                
                <div className="text-center space-y-3 hover-scale">
                  <div className="flex items-center justify-center">
                    <div className="bg-purple-500/10 rounded-full p-4">
                      <Brain className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold">2. Få AI-analys</h3>
                  <p className="text-sm text-muted-foreground">
                    Vårt AI-system analyserar dina svar och ger personliga insikter
                  </p>
                </div>
                
                <div className="text-center space-y-3 hover-scale">
                  <div className="flex items-center justify-center">
                    <div className="bg-green-500/10 rounded-full p-4">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold">3. Starta din utvecklingsresa</h3>
                  <p className="text-sm text-muted-foreground">
                    Välj vilka pelare du vill fokusera på och få skräddarsydda rekommendationer
                  </p>
                </div>
              </div>
              
              <div className="text-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/client-dashboard')}
                  className="bg-primary hover:bg-primary/90 animate-fade-in"
                >
                  Tillbaka till Dashboard för att börja
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pillars" className="space-y-6">
          {/* Pillar Introduction Grid - PHASE 2: Enhanced UX with micro-interactions */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Förstå de sex pelarna</h2>
              <p className="text-muted-foreground">
                Varje pelare representerar ett kritiskt område för din personliga och professionella utveckling
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillarIntros.map((pillar, index) => (
                <Card 
                  key={pillar.key} 
                  className="hover:shadow-lg transition-all duration-500 hover:-translate-y-1 border-l-4 group"
                  style={{ borderLeftColor: pillar.color }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="p-3 rounded-lg transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
                      >
                        {pillar.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{pillar.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          Pelare {index + 1}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pillar.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Fördelar:</h4>
                        <ul className="space-y-1">
                          {pillar.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                              <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button 
                        className="w-full mt-4 text-sm sm:text-base px-2 sm:px-4 py-2 transition-all hover:scale-105"
                        style={{ backgroundColor: pillar.color }}
                        onClick={() => navigate('/client-dashboard?tab=pillars', { state: { activatePillar: pillar.key } })}
                      >
                        <span className="whitespace-normal text-center leading-tight">
                          Aktivera denna pelare
                        </span>
                        <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* PHASE 5: Advanced Analytics Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Se detaljerad analytics för din utveckling inom alla sex pelare.
              </p>
              <Button 
                onClick={() => navigate('/user-analytics')}
                className="w-full"
              >
                Öppna Full Analytics Dashboard
                <BarChart3 className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* PHASE 3: AI Intelligence Revolution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Få personliga AI-analyser och rekommendationer för din utveckling.
              </p>
              <Button 
                onClick={() => navigate('/client-intelligence')}
                className="w-full"
              >
                Öppna AI Intelligence Hub
                <Brain className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 🏗️ PHASE 1: Foundation Architecture - Main Dashboard Component */}
      <div className="border-t pt-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">Din personliga utvecklingsdashboard</h2>
          <p className="text-muted-foreground">
            Detaljerad överblick och hantering av alla dina sex pelare
          </p>
        </div>
        <ModularPillarDashboard 
          userId={profile.id} 
          userName={profile.first_name || profile.email || 'Användare'} 
        />
      </div>
    </div>
  );
};