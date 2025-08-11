import { useAuth } from '@/providers/UnifiedAuthProvider';
import { ModularPillarDashboard } from '@/components/SixPillars/ModularPillarDashboard';
import { PillarAssessmentPage } from '@/components/SixPillars/PillarAssessmentPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useNavigate, useParams } from 'react-router-dom';
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
  Route
} from 'lucide-react';

// Huvudpolicy från UX Expert: Pedagogisk progression och tydlig informationsarkitektur
export const SixPillars = () => {
  const { user, profile } = useAuth();
  const { pillarKey } = useParams<{ pillarKey: string }>();
  const navigate = useNavigate();

  if (!user || !profile) {
    return <div>Laddar...</div>;
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
    <div className="p-6 space-y-8">
      {/* Hero Section - Huvudpolicy från UX Expert: Första intryck räknas */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <TrendingUp className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold">Six Pillars</h1>
          <HelpTooltip content="Six Pillars är vårt beprövade system för hållbar utveckling inom sex kritiska livsområden." />
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Ett holistiskt utvecklingssystem som balanserar sex grundpelare för hållbar framgång och välmående
        </p>
        
        <Alert className="max-w-2xl mx-auto bg-blue-50 border-blue-200">
          <Brain className="h-5 w-5" />
          <AlertDescription className="text-center">
            <strong>Första gången här?</strong> Börja med att läsa om varje pelare nedan, 
            sedan gör du dina första bedömningar för att få personliga rekommendationer.
          </AlertDescription>
        </Alert>
      </div>

      {/* Pillar Introduction Grid - Huvudpolicy från Coaching Psykolog: Bygga förståelse */}
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
              className="hover:shadow-lg transition-all duration-300 border-l-4"
              style={{ borderLeftColor: pillar.color }}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="p-3 rounded-lg"
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
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    className="w-full mt-4 text-sm sm:text-base px-2 sm:px-4 py-2"
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

      {/* Getting Started Section - Huvudpolicy från Product Manager: Clear next steps */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Så här kommer du igång</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center">
                <div className="bg-blue-100 rounded-full p-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="font-semibold">1. Gör dina första bedömningar</h3>
              <p className="text-sm text-muted-foreground">
                Bedöm dig själv inom varje pelare för att få en utgångspunkt
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center">
                <div className="bg-purple-100 rounded-full p-4">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h3 className="font-semibold">2. Få AI-analys</h3>
              <p className="text-sm text-muted-foreground">
                Vårt AI-system analyserar dina svar och ger personliga insikter
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center">
                <div className="bg-green-100 rounded-full p-4">
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              Tillbaka till översikt för att börja
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};