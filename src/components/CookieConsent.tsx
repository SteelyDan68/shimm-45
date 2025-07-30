import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, X } from 'lucide-react';
import { useGDPR } from '@/hooks/useGDPR';

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const CookieConsent = () => {
  const { saveConsent } = useGDPR();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true, // Alltid sant
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Kontrollera om användaren redan har gett sitt samtycke
    const savedConsent = localStorage.getItem('cookie-consent');
    if (!savedConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = async () => {
    const fullConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(fullConsent));
    
    // Spara samtycken i GDPR-systemet
    await saveConsent('analytics', true, 'cookie_banner');
    await saveConsent('marketing', true, 'cookie_banner');
    
    setIsVisible(false);
  };

  const handleAcceptSelected = async () => {
    const selectedConsent = {
      ...consent,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(selectedConsent));
    
    // Spara individulella samtycken
    await saveConsent('analytics', consent.analytics, 'cookie_banner');
    await saveConsent('marketing', consent.marketing, 'cookie_banner');
    
    setIsVisible(false);
  };

  const handleDeclineAll = async () => {
    const minimalConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(minimalConsent));
    
    // Spara avvisade samtycken
    await saveConsent('analytics', false, 'cookie_banner');
    await saveConsent('marketing', false, 'cookie_banner');
    
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              <CardTitle className="text-lg">Vi använder cookies</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Vi använder cookies för att förbättra din upplevelse på vår webbplats.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {showDetails && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="necessary" className="font-medium">
                    Nödvändiga cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Krävs för att webbplatsen ska fungera korrekt
                  </p>
                </div>
                <Switch
                  id="necessary"
                  checked={consent.necessary}
                  disabled
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics" className="font-medium">
                    Analytiska cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Hjälper oss förstå hur du använder webbplatsen
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={consent.analytics}
                  onCheckedChange={(checked) => 
                    setConsent(prev => ({ ...prev, analytics: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing" className="font-medium">
                    Marknadsföringscookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Används för att visa relevanta annonser
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={consent.marketing}
                  onCheckedChange={(checked) => 
                    setConsent(prev => ({ ...prev, marketing: checked }))
                  }
                />
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button onClick={handleAcceptAll} className="flex-1">
              Acceptera alla
            </Button>
            
            {showDetails ? (
              <Button onClick={handleAcceptSelected} variant="outline" className="flex-1">
                Acceptera valda
              </Button>
            ) : (
              <Button 
                onClick={() => setShowDetails(true)} 
                variant="outline" 
                className="flex-1"
              >
                Anpassa inställningar
              </Button>
            )}
            
            <Button onClick={handleDeclineAll} variant="ghost" className="flex-1">
              Avböj alla
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Läs mer i vår{' '}
            <a href="/privacy" className="underline hover:no-underline">
              integritetspolicy
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};