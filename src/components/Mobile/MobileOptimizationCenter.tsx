import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Settings,
  Download,
  Share,
  Palette
} from 'lucide-react';

export function MobileOptimizationCenter() {
  const { deviceInfo, isNativeApp, isIOS, isAndroid, hapticFeedback } = useMobileCapabilities();
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Detect orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.innerHeight > window.innerWidth) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Detect dark mode preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
    document.body.style.zoom = `${Math.min(zoom + 10, 200)}%`;
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
    document.body.style.zoom = `${Math.max(zoom - 10, 50)}%`;
  };

  const handleResetZoom = () => {
    setZoom(100);
    document.body.style.zoom = '100%';
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const getDeviceTypeIcon = () => {
    if (deviceInfo?.platform === 'web') return <Monitor className="h-5 w-5" />;
    if (window.innerWidth < 768) return <Smartphone className="h-5 w-5" />;
    return <Tablet className="h-5 w-5" />;
  };

  const getScreenSize = () => {
    const width = window.innerWidth;
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    return 'xl';
  };

  const downloadInstructions = () => {
    const instructions = `
# Mobile App Installation

## iOS (iPhone/iPad)
1. Öppna Safari och gå till appen
2. Tryck på delningsknappen (kvadrat med pil uppåt)
3. Välj "Lägg till på hemskärm"
4. Bekräfta genom att trycka "Lägg till"

## Android
1. Öppna Chrome och gå till appen
2. Tryck på menyn (tre prickar)
3. Välj "Lägg till på startskärm"
4. Bekräfta genom att trycka "Lägg till"

## Desktop
1. Öppna Chrome, Edge eller Safari
2. Klicka på installationsikonen i adressfältet
3. Välj "Installera"
`;

    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mobile-app-installation.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {getDeviceTypeIcon()}
            Mobiloptimering
          </h1>
          <p className="text-muted-foreground">
            Optimera din upplevelse för mobila enheter
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {getScreenSize().toUpperCase()} skärm
          </Badge>
          <Badge variant="outline">
            {orientation === 'portrait' ? 'Stående' : 'Liggande'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Inställningar</TabsTrigger>
          <TabsTrigger value="device">Enhetsinformation</TabsTrigger>
          <TabsTrigger value="optimization">Optimering</TabsTrigger>
          <TabsTrigger value="installation">Installation</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ZoomIn className="h-5 w-5" />
                  Zoom & Visning
                </CardTitle>
                <CardDescription>
                  Anpassa zoom och visningsinställningar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Zoom: {zoom}%</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleZoomOut}>
                      <ZoomOut className="h-4 w-4 mr-2" />
                      Förminska
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleResetZoom}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Återställ
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleZoomIn}>
                      <ZoomIn className="h-4 w-4 mr-2" />
                      Förstora
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Helskärmsläge</p>
                    <p className="text-xs text-muted-foreground">Maximera skärmyta</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={toggleFullscreen}
                  >
                    {fullscreen ? (
                      <>
                        <Minimize className="h-4 w-4 mr-2" />
                        Avsluta
                      </>
                    ) : (
                      <>
                        <Maximize className="h-4 w-4 mr-2" />
                        Aktivera
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Tillgänglighetsinställningar
                </CardTitle>
                <CardDescription>
                  Anpassa för bättre tillgänglighet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Mörkt tema</p>
                    <p className="text-xs text-muted-foreground">
                      Systempreferens: {darkMode ? 'Aktivt' : 'Inaktivt'}
                    </p>
                  </div>
                  <Badge variant={darkMode ? "default" : "outline"}>
                    {darkMode ? 'Mörkt' : 'Ljust'}
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Reducerad animation</p>
                    <p className="text-xs text-muted-foreground">
                      Systempreferens: {reducedMotion ? 'Aktivt' : 'Inaktivt'}
                    </p>
                  </div>
                  <Badge variant={reducedMotion ? "default" : "outline"}>
                    {reducedMotion ? 'Reducerat' : 'Normalt'}
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-rotation</p>
                    <p className="text-xs text-muted-foreground">Rotera automatiskt vid vändning</p>
                  </div>
                  <Switch 
                    checked={autoRotate} 
                    onCheckedChange={setAutoRotate}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="device" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Enhetsinformation kommer snart...</p>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Responsive Design</CardTitle>
                <CardDescription>
                  Designen anpassar sig automatiskt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mobilvy (&lt; 640px)</span>
                    <Badge variant={getScreenSize() === 'xs' ? "default" : "outline"}>
                      {getScreenSize() === 'xs' ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tabletvy (640px - 1024px)</span>
                    <Badge variant={['sm', 'md'].includes(getScreenSize()) ? "default" : "outline"}>
                      {['sm', 'md'].includes(getScreenSize()) ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Desktopvy (&gt; 1024px)</span>
                    <Badge variant={['lg', 'xl'].includes(getScreenSize()) ? "default" : "outline"}>
                      {['lg', 'xl'].includes(getScreenSize()) ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Touch-optimering</CardTitle>
                <CardDescription>
                  Touchvänliga interaktioner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Stora touch-ytor</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Swipe-gester</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Haptisk feedback</span>
                    <Badge variant={isNativeApp ? "default" : "outline"}>
                      {isNativeApp ? '✓' : 'Endast i app'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pinch-to-zoom</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prestanda</CardTitle>
                <CardDescription>
                  Optimerat för mobila enheter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Lazy loading</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bildoptimering</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Offline-support</span>
                    <Badge variant="outline">Planerat</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>PWA-kompatibel</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isNativeApp && (
            <Card>
              <CardHeader>
                <CardTitle>Testa Touch-interaktioner</CardTitle>
                <CardDescription>
                  Prova de olika touch-funktionerna
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    className="h-16"
                    onClick={() => hapticFeedback.light()}
                  >
                    Tryck för lätt vibration
                  </Button>
                  <Button 
                    className="h-16"
                    variant="outline"
                    onClick={() => hapticFeedback.medium()}
                  >
                    Medium vibration
                  </Button>
                  <Button 
                    className="h-16"
                    variant="secondary"
                    onClick={() => hapticFeedback.heavy()}
                  >
                    Stark vibration
                  </Button>
                  <Button 
                    className="h-16"
                    variant="destructive"
                    onClick={() => {
                      hapticFeedback.heavy();
                      setTimeout(() => hapticFeedback.light(), 100);
                      setTimeout(() => hapticFeedback.light(), 200);
                    }}
                  >
                    Mönstervibration
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="installation" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Installera som app
                </CardTitle>
                <CardDescription>
                  Få en mer app-liknande upplevelse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p><strong>Fördelar med installerad app:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Snabbare laddning</li>
                    <li>Offline-funktioner</li>
                    <li>Push-notifikationer</li>
                    <li>Fullskärmsupplevelse</li>
                    <li>Hemskärmsgenväg</li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button onClick={downloadInstructions} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Ladda ner installationsguide
                  </Button>
                  
                  {navigator.share && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        navigator.share({
                          title: 'Shimm-45 App',
                          text: 'Kolla in denna fantastiska app!',
                          url: window.location.href
                        });
                      }}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Dela app
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Installationsstatus</CardTitle>
                <CardDescription>
                  Din nuvarande installation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Typ</span>
                    <Badge variant={isNativeApp ? "default" : "outline"}>
                      {isNativeApp ? 'Native App' : 'Webbläsare'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Plattform</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {isIOS ? '🍎 iOS' : isAndroid ? '🤖 Android' : '🌐 Webb'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">PWA-stöd</span>
                    <Badge variant="default">✓</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Offline-läge</span>
                    <Badge variant="outline">Kommer snart</Badge>
                  </div>
                </div>

                {!isNativeApp && (
                  <>
                    <Separator />
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Installera appen för bästa upplevelse
                      </p>
                      <Button size="sm" onClick={downloadInstructions}>
                        Se instruktioner
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}