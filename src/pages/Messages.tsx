import { useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { StableMessagingHub } from '@/components/Messaging/StableMessagingHub';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
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
  // Kör ett engångstest av send-welcome-email när sidan laddats och användaren finns
  useEffect(() => {
    if (!user) return;
    const flagKey = 'welcomeEmailTestSent';
    if (sessionStorage.getItem(flagKey)) return;

    async function run() {
      try {
        console.log('[send-welcome-email] Triggering test email...');
        const { data, error } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            to: 'stefan.hallgren@gmail.com',
            firstName: (user as any)?.user_metadata?.first_name || 'Stefan',
            role: 'client',
            inviterName: 'SHIMMS',
          },
        });
        if (error) {
          console.error('[send-welcome-email] Error:', error);
          toast({ title: 'E-post misslyckades', description: String((error as any)?.message || error), variant: 'destructive' });
        } else {
          console.log('[send-welcome-email] Success:', data);
          toast({ title: 'Testmail skickat', description: 'Kontrollera inkorgen för stefan.hallgren@gmail.com' });
          sessionStorage.setItem(flagKey, '1');
        }
      } catch (e: any) {
        console.error('[send-welcome-email] Unexpected error:', e);
        toast({ title: 'E-post fel', description: String(e?.message || e), variant: 'destructive' });
      }
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">

      <main className="h-[calc(100vh-200px)] min-h-[600px]">
        <StableMessagingHub />
      </main>
    </div>
  );
}