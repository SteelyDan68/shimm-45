import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { Brain, TrendingUp, Target, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { HelpTooltip } from '@/components/HelpTooltip';
import { PrintPDFActions } from '@/components/ui/print-pdf-actions';
import { Link } from 'react-router-dom';

const MyAnalyses = () => {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Mina analyser – AI-insikter';
    const desc = 'Se dina AI-analyser och insikter. Skriv ut eller spara som PDF.';
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
        .from('assessment_detailed_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getPillarDisplayName = (pillarType: string) => {
    const names: Record<string, string> = {
      'self_care': 'Självomvårdnad',
      'skills': 'Kompetenser', 
      'talent': 'Talang',
      'brand': 'Varumärke',
      'economy': 'Ekonomi',
      'open_track': 'Öppna spåret'
    };
    return names[pillarType] || pillarType;
  };

  const getPillarColor = (pillarType: string) => {
    const colors: Record<string, string> = {
      'self_care': 'bg-gradient-to-r from-emerald-500 to-teal-600',
      'skills': 'bg-gradient-to-r from-blue-500 to-indigo-600',
      'talent': 'bg-gradient-to-r from-purple-500 to-violet-600',
      'brand': 'bg-gradient-to-r from-orange-500 to-red-600',
      'economy': 'bg-gradient-to-r from-green-500 to-emerald-600',
      'open_track': 'bg-gradient-to-r from-gray-500 to-slate-600'
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
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
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
    name: "AI-analyser",
    url: typeof window !== 'undefined' ? window.location.origin + '/my-analyses' : undefined,
    numberOfItems: assessmentRounds?.length || 0,
    itemListElement: (assessmentRounds || []).slice(0, 10).map((a: any, idx: number) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Article",
        headline: `${getPillarDisplayName(a.pillar_type)} analys`,
        datePublished: a.created_at,
        inLanguage: 'sv-SE'
      }
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <Brain className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">Mina analyser</h1>
          </div>
          <div className="flex items-center gap-2 no-print">
            <HelpTooltip content="Skriv ut eller spara som PDF för att dela dina självskattningar eller läsa offline." />
            <PrintPDFActions 
              title="Mina Självskattningar och Analyser"
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
              (analysis) => analysis.assessment_round_id === assessment.id
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

                  {/* AI Analysis */}
                  {assessment.ai_analysis && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-500" />
                        Stefans analys
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {assessment.ai_analysis}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Detailed Analysis */}
                  {detailedAnalysis && (
                    <>
                      <Separator className="my-4" />
                      
                      {/* Executive Summary */}
                      {detailedAnalysis.executive_summary && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            Sammanfattning
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {detailedAnalysis.executive_summary}
                          </p>
                        </div>
                      )}

                      {/* Insights */}
                      {detailedAnalysis.insights && Array.isArray(detailedAnalysis.insights) && detailedAnalysis.insights.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Viktiga insikter</h4>
                          <div className="space-y-2">
                            {detailedAnalysis.insights.map((insight: any, index: number) => (
                              <div key={index} className="bg-primary/10 border border-primary/20 rounded p-3">
                                <p className="text-sm font-medium text-primary">
                                  {insight.title || insight.insight || insight}
                                </p>
                                {insight.description && (
                                  <p className="text-xs text-primary mt-1">
                                    {insight.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {detailedAnalysis.recommendations && Array.isArray(detailedAnalysis.recommendations) && detailedAnalysis.recommendations.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Rekommendationer</h4>
                          <div className="space-y-2">
                            {detailedAnalysis.recommendations.map((rec: any, index: number) => (
                              <div key={index} className="bg-success/10 border border-success/20 rounded p-3">
                                <p className="text-sm font-medium text-success">
                                  {rec.title || rec.recommendation || rec}
                                </p>
                                {rec.description && (
                                  <p className="text-xs text-success mt-1">
                                    {rec.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/my-program?pillar=${assessment.pillar_type}`}>
                        Se handlingsplan
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/guided-assessment?retake=${assessment.pillar_type}`}>
                        Gör om självskattning
                      </Link>
                    </Button>
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
    </div>
  );
};

export default MyAnalyses;