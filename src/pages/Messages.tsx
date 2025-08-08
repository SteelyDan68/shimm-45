import { useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { EnhancedMessagingHub } from '@/components/Messaging/EnhancedMessagingHub';

export function Messages() {
  const { user } = useAuth();

  // Show loading state while authentication is loading
  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar meddelanden...</p>
            <p className="text-xs text-muted-foreground mt-2">
              Initierar säker anslutning...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SEO
  useEffect(() => {
    document.title = 'Meddelanden | SHMMS - Intelligent Kommunikation';
    const ensureMeta = (name: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      return el as HTMLMetaElement;
    };
    const desc = ensureMeta('description');
    desc.setAttribute('content', 'Intelligent meddelandecenter med AI-stöd, real-time kommunikation och självinstruerande gränssnitt för optimal användarupplevelse.');
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', window.location.href);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <header className="text-center space-y-2 mb-6">
        <h1 className="text-3xl font-bold">Intelligent Meddelandecenter</h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          Real-time kommunikation med AI-stöd, självinstruerande gränssnitt och avancerad coaching-integration. 
          En enhetlig plattform för all din kommunikation.
        </p>
      </header>

      <main className="h-[calc(100vh-200px)] min-h-[600px]">
        <EnhancedMessagingHub 
          className="h-full"
        />
      </main>
    </div>
  );
}