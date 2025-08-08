import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import systemMapMd from '../../docs/system-map.md?raw';
import repoInventoryMd from '../../docs/repo-inventory.md?raw';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShieldAlert, BookOpen, ListChecks } from 'lucide-react';

const markdownComponents = {
  // Basic typography mapping to design system classes
  h1: (props: any) => <h1 className="text-3xl font-bold tracking-tight mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-semibold mt-8 mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-xl font-semibold mt-6 mb-2" {...props} />,
  p: (props: any) => <p className="text-muted-foreground leading-relaxed mb-4" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-6 space-y-2 mb-4" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-6 space-y-2 mb-4" {...props} />,
  code: (props: any) => <code className="rounded bg-muted px-1 py-0.5 text-sm" {...props} />,
  pre: (props: any) => <pre className="rounded bg-muted p-4 overflow-x-auto text-sm mb-4" {...props} />,
  table: (props: any) => <div className="overflow-x-auto"><table className="w-full text-sm" {...props} /></div>,
  th: (props: any) => <th className="text-left font-medium p-2 border-b" {...props} />,
  td: (props: any) => <td className="p-2 border-b align-top" {...props} />,
};

export default function SystemMapPage() {
  const { user, hasRole } = useAuth();
  const [tab, setTab] = useState<'system' | 'inventory'>('system');

  // SEO: title + meta description + canonical + structured data
  useEffect(() => {
    document.title = 'SHMMS Systemkarta – Superadmin';
    const desc = 'Systemkarta och repo-inventering för SHMMS (endast superadmin).';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/system-map`;

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'SHMMS Systemkarta',
      about: 'Arkitektur, dataflöden, roller och repo-inventering',
      author: { '@type': 'Organization', name: 'SHMMS' },
      inLanguage: 'sv-SE',
      dateModified: new Date().toISOString(),
    };

    const scriptId = 'ld-system-map';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(ld);

    return () => {
      // Optional cleanup: keep canonical/meta as they are harmless
    };
  }, []);

  const content = useMemo(() => (tab === 'system' ? systemMapMd : repoInventoryMd), [tab]);

  if (!user || !hasRole('superadmin')) {
    return (
      <main id="main-content" className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                Åtkomst nekad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Denna sida är endast tillgänglig för superadmin.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-6 px-6">
          <h1 className="text-3xl font-bold tracking-tight">SHMMS Systemkarta</h1>
          <p className="text-muted-foreground mt-1">Arkitektur, dataflöden och repository-inventering</p>
        </div>
      </header>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant={tab === 'system' ? 'default' : 'outline'} onClick={() => setTab('system')} size="sm">
            <BookOpen className="h-4 w-4 mr-2" /> Systemkarta
          </Button>
          <Button variant={tab === 'inventory' ? 'default' : 'outline'} onClick={() => setTab('inventory')} size="sm">
            <ListChecks className="h-4 w-4 mr-2" /> Repo-inventering
          </Button>
        </div>
        <Separator className="my-4" />
        <article className="prose prose-sm md:prose max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}
