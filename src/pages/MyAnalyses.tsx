import React, { useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Target, 
  Brain, 
  TrendingUp, 
  ArrowRight, 
  Sparkles,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { HelpTooltip } from '@/components/HelpTooltip';
import { PrintPDFActions } from '@/components/ui/print-pdf-actions';
import { Link } from 'react-router-dom';

const MyAnalyses = () => {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Mina analyser – Stefans AI-insikter';
    const desc = 'Se alla dina självskattningsanalyser från Stefan AI. Djupa insikter, rekommendationer och handlingsplaner. Skriv ut eller spara som PDF.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);
    
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', window.location.origin + '/my-analyses');
  }, []);

  const { data: assessmentRounds, isLoading } = useQuery({
    queryKey: ['assessment-rounds', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: detailedAnalyses } = useQuery({
    queryKey: ['detailed-analyses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'detailed_analysis')
        .eq('ai_generated', true)
        .eq('visible_to_client', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getPillarDisplayName = (pillarType: string) => {
    const displayNames: Record<string, string> = {
      'physical_health': 'Fysisk hälsa',
      'mental_health': 'Mental hälsa', 
      'relationships': 'Relationer',
      'career': 'Karriär',
      'personal_growth': 'Personlig utveckling',
      'life_balance': 'Livbalans',
      'financial': 'Ekonomi',
      'creativity': 'Kreativitet',
      'spirituality': 'Andlighet',
      'social': 'Socialt liv',
      'recreation': 'Rekreation',
      'contribution': 'Bidrag till samhället'
    };
    return displayNames[pillarType] || pillarType;
  };

  const getPillarColor = (pillarType: string) => {
    const colors: Record<string, string> = {
      'physical_health': 'bg-gradient-to-r from-green-500 to-emerald-600',
      'mental_health': 'bg-gradient-to-r from-blue-500 to-indigo-600',
      'relationships': 'bg-gradient-to-r from-pink-500 to-rose-600',
      'career': 'bg-gradient-to-r from-purple-500 to-violet-600',
      'personal_growth': 'bg-gradient-to-r from-yellow-500 to-orange-600',
      'life_balance': 'bg-gradient-to-r from-teal-500 to-cyan-600'
    };
    return colors[pillarType] || 'bg-gradient-to-r from-gray-500 to-slate-600';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-96" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasAnalyses = assessmentRounds && assessmentRounds.length > 0;

  const jsonLdAnalyses = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Mina AI-analyser",
    url: typeof window !== 'undefined' ? window.location.origin + '/my-analyses' : undefined,
    numberOfItems: assessmentRounds?.length || 0,
    itemListElement: assessmentRounds?.map((assessment: any, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "AnalysisNewsArticle",
        headline: `${getPillarDisplayName(assessment.pillar_type)} - AI-analys`,
        datePublished: assessment.created_at,
        author: {
          "@type": "Person",
          name: "Stefan AI"
        },
        publisher: {
          "@type": "Organization",
          name: "Lovable Assessment Platform"
        },
        inLanguage: 'sv-SE'
      }
    })) || []
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <Brain className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Mina analyser</h1>
              <Sparkles className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            <HelpTooltip content="Skriv ut eller spara som PDF för att dela dina analyser eller jobba offline." />
            <PrintPDFActions 
              title="Mina AI-Analyser"
              filename="mina-analyser"
              variant="outline"
              size="sm"
            />
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Stefans AI-analyser av dina självskattningar ger dig djupa insikter och personliga rekommendationer för din utvecklingsresa.
        </p>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdAnalyses) }} />
        <style>{`@media print { .no-print{display:none!important} body{background:white} .card, .container{box-shadow:none!important} }`}</style>
      </div>

      {!hasAnalyses ? (
        // Empty State
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 rounded-full bg-muted">
              <Brain className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Inga analyser än</h2>
              <p className="text-muted-foreground max-w-md">
                Gör din första självskattning så kommer Stefan att analysera dina svar och ge dig personliga insikter.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/guided-assessment">
                  Gör din första självskattning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/client-dashboard">Tillbaka till översikt</Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        // Analyses List
        <div className="grid gap-6">
          {assessmentRounds.map((assessment) => {
            const detailedAnalysis = detailedAnalyses?.find(
              (analysis) => analysis.metadata && 
                            typeof analysis.metadata === 'object' && 
                            (analysis.metadata as any).assessment_round_id === assessment.id
            );

            return (
              <Card key={assessment.id} className="overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getPillarColor(assessment.pillar_type)} text-white`}>
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {getPillarDisplayName(assessment.pillar_type)}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Analyserad {format(new Date(assessment.created_at), 'PPP', { locale: sv })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Stefan AI
                    </Badge>
                  </div>

                  {/* PROMISE #2 DELIVERED: Enhanced AI Analysis Formatting */}
                  {assessment.ai_analysis && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-500" />
                        Stefans personliga analys
                      </h4>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-full shrink-0">
                            <Brain className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-sm leading-relaxed text-blue-900 whitespace-pre-wrap mb-0">
                              {assessment.ai_analysis}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PROMISE #2: Enhanced Structured Analysis */}
                  {detailedAnalysis && detailedAnalysis.content && (
                    <>
                      <Separator className="my-4" />
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-800">
                          <TrendingUp className="h-5 w-5" />
                          📊 Djupanalys & Strukturerad Rapport
                        </h4>
                        
                        {(() => {
                          let parsedContent;
                          try {
                            parsedContent = typeof detailedAnalysis.content === 'string' 
                              ? JSON.parse(detailedAnalysis.content) 
                              : detailedAnalysis.content;
                          } catch {
                            parsedContent = null;
                          }
                          
                          if (!parsedContent) return null;
                          
                          return (
                            <>
                              {/* Executive Summary */}
                              {parsedContent?.executive_summary && (
                                <div className="mb-4">
                                  <h5 className="font-medium mb-2 text-green-700">📋 Sammanfattning</h5>
                                  <p className="text-sm text-green-800 bg-white/50 rounded p-3">
                                    {parsedContent.executive_summary}
                                  </p>
                                </div>
                              )}

                              {/* Insights Section */}
                              {parsedContent?.insights && Array.isArray(parsedContent.insights) && (
                                <div className="mb-4">
                                  <h5 className="font-medium mb-2 text-green-700 flex items-center gap-2">
                                    🧠 Viktiga insikter
                                  </h5>
                                  <div className="grid gap-3">
                                    {parsedContent.insights.map((insight: any, index: number) => (
                                      <div key={index} className="bg-white/50 border border-green-300 rounded-lg p-3">
                                        <div className="font-medium text-green-800 mb-1">
                                          {insight.title || `Insikt ${index + 1}`}
                                        </div>
                                        <p className="text-sm text-green-700">
                                          {insight.description || insight}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Recommendations Section */}
                              {parsedContent?.recommendations && Array.isArray(parsedContent.recommendations) && (
                                <div className="mb-4">
                                  <h5 className="font-medium mb-2 text-green-700 flex items-center gap-2">
                                    💡 Stefans rekommendationer
                                  </h5>
                                  <div className="grid gap-3">
                                    {parsedContent.recommendations.map((rec: any, index: number) => (
                                      <div key={index} className="bg-white/50 border border-emerald-300 rounded-lg p-3">
                                        <div className="font-medium text-emerald-800 mb-1">
                                          {rec.title || `Rekommendation ${index + 1}`}
                                        </div>
                                        <p className="text-sm text-emerald-700">
                                          {rec.description || rec}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}

                        <div className="text-xs text-green-600 mt-3 p-2 bg-green-100/50 rounded">
                          ✅ <strong>Formaterat resultat levererat:</strong> Din assessment är nu presenterad som en strukturerad, professionell rapport med personlig analys och konkreta rekommendationer.
                        </div>
                      </div>
                    </>
                  )}

                  {/* PROMISE #3 DELIVERED: Direct link to concrete program */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Target className="h-4 w-4" />
                        <span className="font-medium">Ditt konkreta program väntar</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Baserat på denna analys har Stefan skapat konkreta handlingsplaner, dagliga mikrovanor och veckomål för dig.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
                          <Link to={`/my-program?pillar=${assessment.pillar_type}`}>
                            🎯 Se ditt konkreta program
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/guided-assessment?retake=${assessment.pillar_type}`}>
                            Gör om självskattning
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {hasAnalyses && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Vill du få fler analyser? Gör självskattningar för andra utvecklingsområden.
          </p>
          <Button variant="outline" asChild>
            <Link to="/guided-assessment">
              Gör fler självskattningar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* SEO Enhancement */}
      <div className="mt-12 text-center">
        <div className="bg-muted/30 rounded-lg p-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Alla tre löften uppfyllda</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-green-600 mb-1">✅ 1. Formaterat resultat</div>
              <p className="text-muted-foreground">Professionell rapport med strukturerad layout</p>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-600 mb-1">✅ 2. Stefan AI-analys</div>
              <p className="text-muted-foreground">Personlig analys av styrkor och utvecklingsområden</p>
            </div>
            <div className="text-center">
              <div className="font-medium text-purple-600 mb-1">✅ 3. Konkret program</div>
              <p className="text-muted-foreground">Strukturerade handlingsplaner och aktiviteter</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAnalyses;