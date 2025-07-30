import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Users, 
  MapPin, 
  ArrowRight, 
  CheckCircle,
  Info
} from 'lucide-react';
import type { OnboardingData } from '@/types/onboarding';

interface OnboardingFormProps {
  onComplete: (data: OnboardingData) => void;
  isLoading?: boolean;
  initialData?: OnboardingData | null;
  isEditMode?: boolean;
}

const primaryRoles = [
  'Influencer',
  'Content Creator', 
  'Youtuber',
  'Podcaster',
  'Blogger',
  'Musiker',
  'Skådespelare',
  'Entreprenör',
  'Coach/Rådgivare',
  'Expert/Specialist',
  'Författare',
  'Konstnär',
  'Annat'
];

const platforms = [
  'YouTube',
  'Instagram', 
  'TikTok',
  'LinkedIn',
  'Twitter/X',
  'Facebook',
  'Podcast',
  'Blog',
  'Twitch',
  'Discord',
  'Clubhouse',
  'Spotify'
];

export function OnboardingForm({ onComplete, isLoading = false, initialData = null, isEditMode = false }: OnboardingFormProps) {
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    generalInfo: {
      name: '',
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
      instagramHandle: '',
      youtubeHandle: '',
      tiktokHandle: '',
      snapchatHandle: '',
      facebookHandle: '',
      twitterHandle: ''
    },
    lifeMap: {
      location: '',
      livingWith: '',
      hasChildren: '',
      ongoingChanges: '',
      pastCrises: ''
    }
  });

  // Sätt initial data om den finns (för edit-mode)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const updateGeneralInfo = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      generalInfo: { ...prev.generalInfo, [field]: value }
    }));
  };

  const updatePublicRole = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      publicRole: { ...prev.publicRole, [field]: value }
    }));
  };

  const updateLifeMap = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      lifeMap: { ...prev.lifeMap, [field]: value }
    }));
  };

  const togglePlatform = (platform: string) => {
    const platforms = formData.publicRole.platforms;
    if (platforms.includes(platform)) {
      updatePublicRole('platforms', platforms.filter(p => p !== platform));
    } else {
      updatePublicRole('platforms', [...platforms, platform]);
    }
  };

  const isSection1Valid = () => {
    return formData.generalInfo.name.trim() !== '' && formData.generalInfo.age.trim() !== '';
  };

  const isSection2Valid = () => {
    return formData.publicRole.primaryRole !== '' && formData.publicRole.niche.trim() !== '';
  };

  const isSection3Valid = () => {
    return formData.lifeMap.location.trim() !== '' && formData.lifeMap.hasChildren !== '';
  };

  const handleNext = () => {
    if (currentSection < 3) {
      setCurrentSection(currentSection + 1);
    } else {
      onComplete(formData);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  const getSectionIcon = (section: number) => {
    if (section === 1) return <User className="h-5 w-5" />;
    if (section === 2) return <Users className="h-5 w-5" />;
    return <MapPin className="h-5 w-5" />;
  };

  const getSectionColor = (section: number) => {
    if (section === 1) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (section === 2) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const renderSection1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Badge className={getSectionColor(1)} variant="outline">
          {getSectionIcon(1)}
          <span className="ml-2">Sektion 1 av 3</span>
        </Badge>
        <h2 className="text-2xl font-bold mt-2">Allmän information</h2>
        <p className="text-muted-foreground">Berätta om dig själv så vi kan ge dig bättre rådgivning</p>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="flex items-center gap-2">
              Namn <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.generalInfo.name}
              onChange={(e) => updateGeneralInfo('name', e.target.value)}
              placeholder="Ditt fullständiga namn"
              required
            />
          </div>
          <div>
            <Label htmlFor="age" className="flex items-center gap-2">
              Ålder <span className="text-red-500">*</span>
            </Label>
            <Input
              id="age"
              type="number"
              min="13"
              max="100"
              value={formData.generalInfo.age}
              onChange={(e) => updateGeneralInfo('age', e.target.value)}
              placeholder="25"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="gender">Kön/pronomen (valfritt)</Label>
          <Input
            id="gender"
            value={formData.generalInfo.gender}
            onChange={(e) => updateGeneralInfo('gender', e.target.value)}
            placeholder="t.ex. kvinna, man, hen, de/dem"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="height">Längd (valfritt)</Label>
            <Input
              id="height"
              value={formData.generalInfo.height}
              onChange={(e) => updateGeneralInfo('height', e.target.value)}
              placeholder="t.ex. 175 cm"
            />
          </div>
          <div>
            <Label htmlFor="weight">Vikt (valfritt)</Label>
            <Input
              id="weight"
              value={formData.generalInfo.weight}
              onChange={(e) => updateGeneralInfo('weight', e.target.value)}
              placeholder="t.ex. 70 kg"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="physicalLimitations">Fysiska hinder / särskilda behov</Label>
          <Textarea
            id="physicalLimitations"
            value={formData.generalInfo.physicalLimitations}
            onChange={(e) => updateGeneralInfo('physicalLimitations', e.target.value)}
            placeholder="Beskriv eventuella fysiska begränsningar eller behov..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="neurodiversity">Neurodiversitet / psykiska diagnoser (valfritt)</Label>
          <Textarea
            id="neurodiversity"
            value={formData.generalInfo.neurodiversity}
            onChange={(e) => updateGeneralInfo('neurodiversity', e.target.value)}
            placeholder="t.ex. ADHD, autism, depression, ångest..."
            rows={3}
          />
          <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-lg">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Denna information hjälper vår AI att ge mer anpassade råd och ta hänsyn till dina unika behov.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Badge className={getSectionColor(2)} variant="outline">
          {getSectionIcon(2)}
          <span className="ml-2">Sektion 2 av 3</span>
        </Badge>
        <h2 className="text-2xl font-bold mt-2">Vem är du i offentligheten?</h2>
        <p className="text-muted-foreground">Berätta om din roll och närvaro online</p>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryRole" className="flex items-center gap-2">
              Primär roll <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.publicRole.primaryRole} onValueChange={(value) => updatePublicRole('primaryRole', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Välj din huvudroll" />
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
          <div>
            <Label htmlFor="secondaryRole">Sekundär roll (valfritt)</Label>
            <Select value={formData.publicRole.secondaryRole} onValueChange={(value) => updatePublicRole('secondaryRole', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Välj sekundär roll" />
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
        </div>

        <div>
          <Label htmlFor="niche" className="flex items-center gap-2">
            Nisch / genre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="niche"
            value={formData.publicRole.niche}
            onChange={(e) => updatePublicRole('niche', e.target.value)}
            placeholder="t.ex. lifestyle, tech, gaming, hälsa, mode..."
            required
          />
        </div>

        <div>
          <Label htmlFor="creativeStrengths">Kreativa styrkor</Label>
          <Textarea
            id="creativeStrengths"
            value={formData.publicRole.creativeStrengths}
            onChange={(e) => updatePublicRole('creativeStrengths', e.target.value)}
            placeholder="Vad är du bra på? t.ex. storytelling, humor, pedagogik, design..."
            rows={3}
          />
        </div>

        <div>
          <Label>Plattformar du är aktiv på</Label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {platforms.map((platform) => (
              <div key={platform} className="flex items-center space-x-2">
                <Checkbox
                  id={platform}
                  checked={formData.publicRole.platforms.includes(platform)}
                  onCheckedChange={() => togglePlatform(platform)}
                />
                <Label htmlFor={platform} className="text-sm">
                  {platform}
                </Label>
              </div>
            ))}
          </div>
          {formData.publicRole.platforms.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.publicRole.platforms.map((platform) => (
                <Badge key={platform} variant="secondary">
                  {platform}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Dina sociala medier</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Klistra in dina handles/användarnamn för de plattformar du är aktiv på
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instagramHandle">Instagram</Label>
              <Input
                id="instagramHandle"
                value={formData.publicRole.instagramHandle}
                onChange={(e) => updatePublicRole('instagramHandle', e.target.value)}
                placeholder="@dittanvändarnamn"
              />
            </div>
            <div>
              <Label htmlFor="youtubeHandle">YouTube</Label>
              <Input
                id="youtubeHandle"
                value={formData.publicRole.youtubeHandle}
                onChange={(e) => updatePublicRole('youtubeHandle', e.target.value)}
                placeholder="Kanalnamn eller @handle"
              />
            </div>
            <div>
              <Label htmlFor="tiktokHandle">TikTok</Label>
              <Input
                id="tiktokHandle"
                value={formData.publicRole.tiktokHandle}
                onChange={(e) => updatePublicRole('tiktokHandle', e.target.value)}
                placeholder="@dittanvändarnamn"
              />
            </div>
            <div>
              <Label htmlFor="snapchatHandle">Snapchat</Label>
              <Input
                id="snapchatHandle"
                value={formData.publicRole.snapchatHandle}
                onChange={(e) => updatePublicRole('snapchatHandle', e.target.value)}
                placeholder="@dittanvändarnamn"
              />
            </div>
            <div>
              <Label htmlFor="facebookHandle">Facebook</Label>
              <Input
                id="facebookHandle"
                value={formData.publicRole.facebookHandle}
                onChange={(e) => updatePublicRole('facebookHandle', e.target.value)}
                placeholder="Sidnamn eller användarnamn"
              />
            </div>
            <div>
              <Label htmlFor="twitterHandle">Twitter/X</Label>
              <Input
                id="twitterHandle"
                value={formData.publicRole.twitterHandle}
                onChange={(e) => updatePublicRole('twitterHandle', e.target.value)}
                placeholder="@dittanvändarnamn"
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="challenges">Upplevda svagheter / utmaningar</Label>
          <Textarea
            id="challenges"
            value={formData.publicRole.challenges}
            onChange={(e) => updatePublicRole('challenges', e.target.value)}
            placeholder="Vad skulle du vilja förbättra? t.ex. konsistens, teknisk kvalitet, marknadsföring..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderSection3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Badge className={getSectionColor(3)} variant="outline">
          {getSectionIcon(3)}
          <span className="ml-2">Sektion 3 av 3</span>
        </Badge>
        <h2 className="text-2xl font-bold mt-2">Livskarta</h2>
        <p className="text-muted-foreground">Din livssituation hjälper oss förstå din kontext</p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="location" className="flex items-center gap-2">
            Ort <span className="text-red-500">*</span>
          </Label>
          <Input
            id="location"
            value={formData.lifeMap.location}
            onChange={(e) => updateLifeMap('location', e.target.value)}
            placeholder="t.ex. Stockholm, Göteborg, Malmö..."
            required
          />
        </div>

        <div>
          <Label htmlFor="livingWith">Lever med (valfritt)</Label>
          <Input
            id="livingWith"
            value={formData.lifeMap.livingWith}
            onChange={(e) => updateLifeMap('livingWith', e.target.value)}
            placeholder="t.ex. partner, familj, ensam, vänner..."
          />
        </div>

        <div>
          <Label htmlFor="hasChildren" className="flex items-center gap-2">
            Har barn? <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.lifeMap.hasChildren} onValueChange={(value) => updateLifeMap('hasChildren', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Välj svar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">Nej</SelectItem>
              <SelectItem value="yes">Ja</SelectItem>
              <SelectItem value="planning">Planerar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="ongoingChanges">Pågående förändringar</Label>
          <Textarea
            id="ongoingChanges"
            value={formData.lifeMap.ongoingChanges}
            onChange={(e) => updateLifeMap('ongoingChanges', e.target.value)}
            placeholder="t.ex. flytt, jobbyte, relation, utbildning..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="pastCrises">Tidigare livskriser som påverkar nu (valfritt)</Label>
          <Textarea
            id="pastCrises"
            value={formData.lifeMap.pastCrises}
            onChange={(e) => updateLifeMap('pastCrises', e.target.value)}
            placeholder="Beskriv tidigare upplevelser som fortfarande påverkar dig..."
            rows={3}
          />
          <div className="flex items-start gap-2 mt-2 p-3 bg-green-50 rounded-lg">
            <Info className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700">
              Detta hjälper vår AI att vara mer empatisk och ta hänsyn till din bakgrund i rådgivningen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const canProceed = () => {
    if (currentSection === 1) return isSection1Valid();
    if (currentSection === 2) return isSection2Valid();
    if (currentSection === 3) return isSection3Valid();
    return false;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {isEditMode ? 'Redigera din profil ✏️' : 'Starta här! 🚀'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode 
            ? 'Uppdatera din information när du vill' 
            : 'Berätta om dig själv så vi kan ge dig personlig rådgivning från dag ett'
          }
        </p>
      </div>

      {/* Progress indicators */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((section) => (
            <div key={section} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentSection === section 
                  ? 'bg-primary text-primary-foreground' 
                  : currentSection > section 
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }
              `}>
                {currentSection > section ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  section
                )}
              </div>
              {section < 3 && (
                <div className={`w-12 h-0.5 ml-2 ${currentSection > section ? 'bg-green-500' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="border-2">
        <CardContent className="p-8">
          {currentSection === 1 && renderSection1()}
          {currentSection === 2 && renderSection2()}
          {currentSection === 3 && renderSection3()}
        </CardContent>

        <div className="flex justify-between p-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSection === 1}
          >
            Föregående
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="flex items-center gap-2"
          >
            {currentSection === 3 ? (
              isLoading ? 'Sparar...' : (isEditMode ? 'Spara ändringar' : 'Slutför & fortsätt')
            ) : (
              <>
                Nästa
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}