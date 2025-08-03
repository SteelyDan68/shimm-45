import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Briefcase, 
  Target, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import type { OnboardingData } from '@/types/onboarding';

type StreamlinedStep = 'welcome' | 'essentials' | 'goals' | 'complete';

interface StreamlinedOnboardingFlowProps {
  onComplete: () => void;
  initialData?: Partial<OnboardingData>;
}

const primaryRoles = [
  'Influencer', 'Content Creator', 'Youtuber', 'Podcaster', 'Blogger',
  'Musiker', 'Skådespelare', 'Entreprenör', 'Coach/Rådgivare', 'Expert/Specialist',
  'Författare', 'Konstnär', 'Annat'
];

export const StreamlinedOnboardingFlow: React.FC<StreamlinedOnboardingFlowProps> = ({ 
  onComplete, 
  initialData 
}) => {
  const [currentStep, setCurrentStep] = useState<StreamlinedStep>('welcome');
  const [formData, setFormData] = useState<OnboardingData>({
    generalInfo: {
      name: '',
      first_name: '',
      last_name: '',
      age: '',
      gender: '',
      height: '',
      weight: '',
      physicalLimitations: '',
      neurodiversity: ''
    },
    publicRole: {
      primaryRole: '',
      secondaryRole: '',
      niche: '',
      creativeStrengths: '',
      platforms: [],
      challenges: '',
      instagramHandle: '', youtubeHandle: '', tiktokHandle: '',
      snapchatHandle: '', facebookHandle: '', twitterHandle: ''
    },
    lifeMap: {
      location: '',
      livingWith: '',
      hasChildren: '',
      ongoingChanges: '',
      pastCrises: ''
    }
  });

  const { user } = useAuth();
  const { saveOnboardingData, isLoading } = useOnboarding();
  const { toast } = useToast();

  const steps = [
    { id: 'welcome', title: 'Välkommen', icon: User },
    { id: 'essentials', title: 'Grundinfo', icon: Briefcase },
    { id: 'goals', title: 'Mål & Vision', icon: Target },
    { id: 'complete', title: 'Klar', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Pre-fill data from user profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        generalInfo: {
          ...prev.generalInfo,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
        }
      }));
    }

    if (initialData) {
      setFormData(prev => ({
        generalInfo: { ...prev.generalInfo, ...(initialData.generalInfo || {}) },
        publicRole: { ...prev.publicRole, ...(initialData.publicRole || {}) },
        lifeMap: { ...prev.lifeMap, ...(initialData.lifeMap || {}) }
      }));
    }
  }, [user, initialData]);

  const updateFormData = (section: keyof OnboardingData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any>),
        [field]: value
      }
    }));
  };

  const isStepValid = (step: StreamlinedStep): boolean => {
    switch (step) {
      case 'welcome':
        return true;
      case 'essentials':
        return !!(
          formData.generalInfo.first_name?.trim() &&
          formData.generalInfo.last_name?.trim() &&
          formData.generalInfo.age?.trim() &&
          formData.publicRole.primaryRole &&
          formData.lifeMap.location?.trim()
        );
      case 'goals':
        return !!(
          formData.publicRole.niche?.trim() &&
          formData.lifeMap.ongoingChanges?.trim()
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    const stepOrder: StreamlinedStep[] = ['welcome', 'essentials', 'goals', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const stepOrder: StreamlinedStep[] = ['welcome', 'essentials', 'goals', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      const result = await saveOnboardingData(user.id, formData);
      
      if (result.success) {
        setCurrentStep('complete');
        toast({
          title: "Välkommen ombord! 🎉",
          description: "Din profil är skapad. Nu kan vi börja din utvecklingsresa!",
        });
        setTimeout(onComplete, 2000);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Fel",
        description: "Kunde inte slutföra onboarding. Försök igen.",
        variant: "destructive"
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Välkommen till din utvecklingsresa!</CardTitle>
              <CardDescription className="text-base">
                Vi hjälper dig skapa en personlig utvecklingsplan baserad på våra fem pelare:
                <span className="font-semibold"> Self Care, Skills, Talent, Brand & Economy</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                {[
                  { name: 'Self Care', desc: 'Hälsa & balans', color: 'bg-self-care/10 border-self-care/20 text-self-care' },
                  { name: 'Skills', desc: 'Kompetenser', color: 'bg-skills/10 border-skills/20 text-skills' },
                  { name: 'Talent', desc: 'Naturliga gåvor', color: 'bg-talent/10 border-talent/20 text-talent' },
                  { name: 'Brand', desc: 'Din image', color: 'bg-brand/10 border-brand/20 text-brand' },
                  { name: 'Economy', desc: 'Ekonomi', color: 'bg-economy/10 border-economy/20 text-economy' }
                ].map((pillar) => (
                  <div key={pillar.name} className={`p-3 rounded-lg border ${pillar.color}`}>
                    <div className="font-semibold">{pillar.name}</div>
                    <div className="text-xs opacity-70 mt-1">{pillar.desc}</div>
                  </div>
                ))}
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg text-left space-y-2">
                <h3 className="font-semibold text-sm">Vad händer nu?</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Några snabba frågor om dig och dina mål (2 min)</li>
                  <li>• Stefan (vår AI-coach) skapar din personliga plan</li>
                  <li>• Du får konkreta steg för att nå dina mål</li>
                </ul>
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                Låt oss börja! <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        );

      case 'essentials':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Grundläggande information
              </CardTitle>
              <CardDescription>
                Berätta kort om dig själv så vi kan personalisera din upplevelse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="flex items-center gap-1">
                    Förnamn <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.generalInfo.first_name || ''}
                    onChange={(e) => updateFormData('generalInfo', 'first_name', e.target.value)}
                    placeholder="Ditt förnamn"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="flex items-center gap-1">
                    Efternamn <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.generalInfo.last_name || ''}
                    onChange={(e) => updateFormData('generalInfo', 'last_name', e.target.value)}
                    placeholder="Ditt efternamn"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-1">
                    Ålder <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="13"
                    max="100"
                    value={formData.generalInfo.age}
                    onChange={(e) => updateFormData('generalInfo', 'age', e.target.value)}
                    placeholder="25"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-1">
                    Ort <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={formData.lifeMap.location}
                    onChange={(e) => updateFormData('lifeMap', 'location', e.target.value)}
                    placeholder="Stockholm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryRole" className="flex items-center gap-1">
                  Din huvudroll <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.publicRole.primaryRole} 
                  onValueChange={(value) => updateFormData('publicRole', 'primaryRole', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vad beskriver dig bäst?" />
                  </SelectTrigger>
                  <SelectContent>
                    {primaryRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Progress validation feedback */}
              {!isStepValid('essentials') && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <div className="h-4 w-4 rounded-full bg-amber-200 flex items-center justify-center">
                      <span className="text-xs font-bold">!</span>
                    </div>
                    <span className="text-sm font-medium">Fyll i alla obligatoriska fält för att fortsätta</span>
                  </div>
                  <ul className="text-xs text-amber-700 mt-2 ml-6 space-y-1">
                    {!formData.generalInfo.first_name?.trim() && <li>• Förnamn krävs</li>}
                    {!formData.generalInfo.last_name?.trim() && <li>• Efternamn krävs</li>}
                    {!formData.generalInfo.age?.trim() && <li>• Ålder krävs</li>}
                    {!formData.publicRole.primaryRole && <li>• Huvudroll krävs</li>}
                    {!formData.lifeMap.location?.trim() && <li>• Ort krävs</li>}
                  </ul>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Tillbaka
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!isStepValid('essentials')}
                  className={!isStepValid('essentials') ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  Nästa <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'goals':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Dina mål och vision
              </CardTitle>
              <CardDescription>
                Berätta om vad du vill utveckla så skapar vi en plan för dig
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="niche" className="flex items-center gap-1">
                  Ditt fokusområde <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="niche"
                  value={formData.publicRole.niche}
                  onChange={(e) => updateFormData('publicRole', 'niche', e.target.value)}
                  placeholder="t.ex. lifestyle, tech, hälsa, business, kreativitet..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Vad är ditt huvudsakliga intresse eller expertområde?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals" className="flex items-center gap-1">
                  Ditt huvudmål just nu <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="goals"
                  value={formData.lifeMap.ongoingChanges}
                  onChange={(e) => updateFormData('lifeMap', 'ongoingChanges', e.target.value)}
                  placeholder="Vad vill du utveckla eller förändra i ditt liv? T.ex. bygga en personlig brand, förbättra hälsan, starta eget företag..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenges">Största utmaningen (valfritt)</Label>
                <Textarea
                  id="challenges"
                  value={formData.publicRole.challenges}
                  onChange={(e) => updateFormData('publicRole', 'challenges', e.target.value)}
                  placeholder="Vad hindrar dig från att nå dina mål? T.ex. tidsbrist, osäkerhet, tekniska kunskaper..."
                  rows={2}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Tillbaka
                </Button>
                <div className="flex flex-col gap-2">
                  {!isStepValid('goals') && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded text-center">
                      Fyll i fokusområde och huvudmål för att slutföra
                    </div>
                  )}
                  <Button 
                    onClick={handleComplete} 
                    disabled={!isStepValid('goals') || isLoading}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    {isLoading ? 'Skapar profil...' : 'Skapa min plan'} 
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-600">Välkommen ombord!</CardTitle>
              <CardDescription className="text-base">
                Din utvecklingsprofil är skapad och Stefan kommer nu att skapa din personliga utvecklingsplan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Nästa steg:</h3>
                <ul className="text-sm text-green-700 space-y-1 text-left">
                  <li>• Stefan analyserar din profil och skapar en utvecklingsplan</li>
                  <li>• Du får konkreta åtgärder för varje pelare</li>
                  <li>• Börja utforska din dashboard för att se framsteg</li>
                </ul>
              </div>
              
              <Badge variant="secondary" className="text-sm px-4 py-2">
                🎯 Din utvecklingsresa börjar nu!
              </Badge>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-semibold">Onboarding</h1>
              <span className="text-sm text-muted-foreground">
                {currentStepIndex + 1} av {steps.length}
              </span>
            </div>
            <Progress value={progress} className="w-full h-2" />
            
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isComplete = index < currentStepIndex;
                
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center space-y-1 transition-colors ${
                      isActive ? 'text-primary' : isComplete ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    <div className={`p-2 rounded-full transition-colors ${
                      isActive ? 'bg-primary text-primary-foreground' : 
                      isComplete ? 'bg-green-600 text-white' : 
                      'bg-muted'
                    }`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="text-xs text-center hidden sm:block">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {renderStep()}
    </div>
  );
};