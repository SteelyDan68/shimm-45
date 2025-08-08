/**
 * 📱 MOBIL INSTÄLLNINGAR & TILLGÄNGLIGHET
 * 
 * Ger klienter möjlighet att anpassa sin upplevelse med:
 * - Zoom-kontroller
 * - Textstorlek
 * - Färgtema
 * - Tillgänglighetsinställningar
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  Type, 
  Palette, 
  Eye, 
  Accessibility,
  Monitor,
  Sun,
  Moon,
  RotateCcw,
  Smartphone,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

interface MobileSettings {
  zoomLevel: number;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorTheme: 'light' | 'dark' | 'auto';
  highContrast: boolean;
  reducedMotion: boolean;
  largeButtons: boolean;
  hapticFeedback: boolean;
  voiceOver: boolean;
}

const defaultSettings: MobileSettings = {
  zoomLevel: 100,
  fontSize: 'medium',
  colorTheme: 'auto',
  highContrast: false,
  reducedMotion: false,
  largeButtons: false,
  hapticFeedback: true,
  voiceOver: false
};

export default function Mobile() {
  const [settings, setSettings] = useState<MobileSettings>(() => {
    const saved = localStorage.getItem('shimms-mobile-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  
  const { setTheme } = useTheme();

  // Applicera inställningar när de ändras
  useEffect(() => {
    // Spara till localStorage
    localStorage.setItem('shimms-mobile-settings', JSON.stringify(settings));
    
    // Applicera zoom
    document.documentElement.style.zoom = `${settings.zoomLevel}%`;
    
    // Applicera textstorlek
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px'
    };
    document.documentElement.style.fontSize = fontSizeMap[settings.fontSize];
    
    // Applicera färgtema
    if (settings.colorTheme !== 'auto') {
      setTheme(settings.colorTheme);
    }
    
    // Applicera kontrast
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Applicera reduced motion
    if (settings.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    
    // Applicera stora knappar
    if (settings.largeButtons) {
      document.documentElement.classList.add('large-buttons');
    } else {
      document.documentElement.classList.remove('large-buttons');
    }
    
  }, [settings, setTheme]);

  const updateSetting = <K extends keyof MobileSettings>(
    key: K, 
    value: MobileSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success('Inställning uppdaterad', {
      description: 'Dina ändringar sparas automatiskt'
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    toast.success('Inställningar återställda', {
      description: 'Alla inställningar har återställts till standardvärden'
    });
  };

  const adjustZoom = (delta: number) => {
    const newZoom = Math.max(50, Math.min(200, settings.zoomLevel + delta));
    updateSetting('zoomLevel', newZoom);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mobil & Tillgänglighet</h1>
          <p className="text-muted-foreground">
            Anpassa din upplevelse för optimal komfort och tillgänglighet
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Zoom & Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ZoomIn className="h-5 w-5" />
              Zoom & Display
            </CardTitle>
            <CardDescription>
              Anpassa zoom-nivå och visningsinställningar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zoom Controls */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Zoom-nivå</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustZoom(-10)}
                  disabled={settings.zoomLevel <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Slider
                    value={[settings.zoomLevel]}
                    onValueChange={([value]) => updateSetting('zoomLevel', value)}
                    min={50}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustZoom(10)}
                  disabled={settings.zoomLevel >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center">
                <Badge variant="secondary">{settings.zoomLevel}%</Badge>
              </div>
            </div>

            <Separator />

            {/* Font Size */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Type className="h-4 w-4" />
                Textstorlek
              </Label>
              <Select
                value={settings.fontSize}
                onValueChange={(value: MobileSettings['fontSize']) => updateSetting('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Liten (14px)</SelectItem>
                  <SelectItem value="medium">Medium (16px)</SelectItem>
                  <SelectItem value="large">Stor (18px)</SelectItem>
                  <SelectItem value="extra-large">Extra stor (20px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Theme & Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Tema & Utseende
            </CardTitle>
            <CardDescription>
              Välj färgtema och visuella preferenser
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color Theme */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Färgtema</Label>
              <Select
                value={settings.colorTheme}
                onValueChange={(value: MobileSettings['colorTheme']) => updateSetting('colorTheme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Ljust tema
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Mörkt tema
                    </div>
                  </SelectItem>
                  <SelectItem value="auto">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Automatiskt
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Hög kontrast
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ökar kontrasten för bättre läsbarhet
                </p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" />
              Tillgänglighet
            </CardTitle>
            <CardDescription>
              Inställningar för förbättrad tillgänglighet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Reducerad rörelse</Label>
                <p className="text-xs text-muted-foreground">
                  Minskar animationer och övergångar
                </p>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
              />
            </div>

            <Separator />

            {/* Large Buttons */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Stora knappar</Label>
                <p className="text-xs text-muted-foreground">
                  Gör knappar större för enklare interaktion
                </p>
              </div>
              <Switch
                checked={settings.largeButtons}
                onCheckedChange={(checked) => updateSetting('largeButtons', checked)}
              />
            </div>

            <Separator />

            {/* Voice Over Support */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">VoiceOver-stöd</Label>
                <p className="text-xs text-muted-foreground">
                  Förbättrat stöd för skärmläsare
                </p>
              </div>
              <Switch
                checked={settings.voiceOver}
                onCheckedChange={(checked) => updateSetting('voiceOver', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Mobile Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobila funktioner
            </CardTitle>
            <CardDescription>
              Inställningar specifika för mobila enheter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Haptic Feedback */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Haptisk feedback</Label>
                <p className="text-xs text-muted-foreground">
                  Vibration vid interaktioner (endast mobil)
                </p>
              </div>
              <Switch
                checked={settings.hapticFeedback}
                onCheckedChange={(checked) => updateSetting('hapticFeedback', checked)}
              />
            </div>

            <Separator />

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={resetSettings}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Återställ alla inställningar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Förhandsvisning
          </CardTitle>
          <CardDescription>
            Se hur dina inställningar påverkar utseendet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">Exempeltext</h3>
            <p className="text-muted-foreground mb-4">
              Detta är ett exempel på hur text kommer att visas med dina nuvarande inställningar. 
              Du kan justera zoom, textstorlek och andra preferenser ovan för att anpassa upplevelsen.
            </p>
            <div className="flex gap-2">
              <Button size="sm">Exempelknapp</Button>
              <Button variant="outline" size="sm">Sekundär knapp</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}