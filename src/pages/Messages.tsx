import { useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { ModernMessagingApp } from '@/components/MessagingV2/ModernMessagingApp';

import { AiReplyAssistant } from '@/components/MessagingV2/AiReplyAssistant';

export function Messages() {
  const { user, hasRole } = useAuth();

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
    document.title = 'Meddelanden & AI Chat | Live meddelanden';
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
    desc.setAttribute('content', 'Meddelanden och Stefan AI-chat med live funktioner och självinstruerande UX.');
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', window.location.href);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <header className="text-center space-y-2 mb-2">
        <h1 className="text-2xl font-bold">Meddelanden & AI Chat</h1>
        <p className="text-muted-foreground text-sm">
          Live-meddelanden med Stefan AI-stöd – snabbt, tydligt och självinstruerande
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Huvudchatten */}
        <section aria-label="Meddelanden" className="lg:col-span-2">
          <div className="h-[calc(100vh-220px)] min-h-[500px] overflow-hidden">
            <ModernMessagingApp className="h-full" />
          </div>
        </section>

        {/* AI-hjälp och proaktiva meddelanden */}
        <aside className="space-y-6">
          {(hasRole('coach') || hasRole('admin') || hasRole('superadmin')) && (
            <AiReplyAssistant />
          )}
        </aside>
      </main>
    </div>
  );
}