import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowRight, 
  BookOpen,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { HelpTooltip } from '@/components/HelpTooltip';
import { Printer } from 'lucide-react';

const MyProgram = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('active');

  useEffect(() => {
    document.title = 'Mitt program – AI-coachad plan';
    const desc = 'Se din personliga handlingsplan och rekommendationer. Skriv ut eller spara som PDF.';
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
    link.setAttribute('href', window.location.origin + '/my-program');
  }, []);

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['ai-coaching-recommendations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('ai_coaching_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: actionables } = useQuery({
    queryKey: ['calendar-actionables', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('calendar_actionables')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-destructive/10 text-destructive border-destructive/20',
      medium: 'bg-warning/10 text-warning border-warning/20',
      low: 'bg-success/10 text-success border-success/20'
    };
    return colors[priority] || colors['medium'];
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-success/10 text-success border-success/20',
      in_progress: 'bg-primary/10 text-primary border-primary/20',
      pending: 'bg-muted text-muted-foreground border-border',
      paused: 'bg-warning/10 text-warning border-warning/20'
    };
    return colors[status] || colors['pending'];
  };
  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      'completed': <CheckCircle2 className="h-4 w-4" />,
      'in_progress': <Play className="h-4 w-4" />,
      'pending': <Clock className="h-4 w-4" />,
      'paused': <Pause className="h-4 w-4" />
    };
    return icons[status] || icons['pending'];
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'completed': 'Slutförd',
      'in_progress': 'Pågående',
      'pending': 'Väntande',
      'paused': 'Pausad'
    };
    return labels[status] || status;
  };

  const activeRecommendations = recommendations?.filter(r => 
    r.status === 'pending' || r.status === 'in_progress'
  ) || [];
  
  const completedRecommendations = recommendations?.filter(r => 
    r.status === 'completed'
  ) || [];

  const activeActionables = actionables?.filter(a => 
    a.completion_status === 'pending' || a.completion_status === 'in_progress'
  ) || [];

  const completedActionables = actionables?.filter(a => 
    a.completion_status === 'completed'
  ) || [];

  const totalItems = (recommendations?.length || 0) + (actionables?.length || 0);
  const completedItems = completedRecommendations.length + completedActionables.length;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

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

  const hasProgram = totalItems > 0;

  const jsonLdProgram = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Personligt utvecklingsprogram",
    url: typeof window !== 'undefined' ? window.location.origin + '/my-program' : undefined,
    numberOfItems: totalItems,
    itemListElement: [
      ...activeRecommendations.map((rec: any, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "CreativeWork",
          name: rec.title,
          description: rec.description,
          dateCreated: rec.created_at,
          inLanguage: 'sv-SE'
        }
      })),
      ...activeActionables.map((act: any, index: number) => ({
        "@type": "ListItem",
        position: activeRecommendations.length + index + 1,
        item: {
          "@type": "HowTo",
          name: act.title,
          description: act.description,
          totalTime: act.estimated_duration ? `PT${act.estimated_duration}M` : undefined,
          inLanguage: 'sv-SE'
        }
      }))
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <Target className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">Mitt program</h1>
          </div>
          <div className="flex items-center gap-2 no-print">
            <HelpTooltip content="Skriv ut eller spara som PDF för att dela ditt program eller jobba offline." />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              aria-label="Skriv ut eller spara som PDF"
            >
              <Printer className="h-4 w-4 mr-2" />
              Skriv ut / PDF
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Dina personliga handlingsplaner och rekommendationer baserat på Stefans AI-analyser av dina assessments.
        </p>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProgram) }} />
        <style>{`@media print { .no-print{display:none!important} body{background:white} .card, .container{box-shadow:none!important} }`}</style>
      </div>

      {!hasProgram ? (
        // Empty State
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 rounded-full bg-muted">
              <Target className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Inget program än</h2>
              <p className="text-muted-foreground max-w-md">
                Gör dina assessments så kommer Stefan att skapa personliga handlingsplaner och rekommendationer för dig.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <a href="/guided-assessment">
                  Gör din första assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/my-analyses">Se analyser</a>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Progress Overview */}
          <Card className="p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{completedItems}</div>
                <div className="text-sm text-muted-foreground">Slutförda aktiviteter</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{activeRecommendations.length + activeActionables.length}</div>
                <div className="text-sm text-muted-foreground">Aktiva aktiviteter</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">{progressPercentage}%</div>
                <div className="text-sm text-muted-foreground">Framsteg totalt</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Övergripande framsteg</span>
                <span className="text-sm text-muted-foreground">{completedItems}/{totalItems}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </Card>

          {/* Content Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Aktiva ({activeRecommendations.length + activeActionables.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Slutförda ({completedItems})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-6 mt-6">
              {/* Active Recommendations */}
              {activeRecommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    Stefans rekommendationer
                  </h3>
                  <div className="space-y-4">
                    {activeRecommendations.map((rec) => (
                      <Card key={rec.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg mb-2">{rec.title}</h4>
                            <p className="text-muted-foreground mb-3">{rec.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority === 'high' ? 'Hög' : rec.priority === 'medium' ? 'Medel' : 'Låg'} prioritet
                            </Badge>
                            <Badge variant="outline" className={`${getStatusColor(rec.status)} flex items-center gap-1`}>
                              {getStatusIcon(rec.status)}
                              {getStatusLabel(rec.status)}
                            </Badge>
                          </div>
                        </div>

                        {rec.reasoning && (
                          <div className="bg-primary/10 border border-primary/20 rounded p-3 mb-4">
                            <p className="text-sm text-primary">
                              <strong>Stefans resonemang:</strong> {rec.reasoning}
                            </p>
                          </div>
                        )}

                        {rec.expected_outcome && (
                          <div className="bg-success/10 border border-success/20 rounded p-3 mb-4">
                            <p className="text-sm text-success">
                              <strong>Förväntat resultat:</strong> {rec.expected_outcome}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {rec.estimated_time_minutes > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{rec.estimated_time_minutes} min</span>
                              </div>
                            )}
                            {rec.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Senast {format(new Date(rec.due_date), 'PPP', { locale: sv })}</span>
                              </div>
                            )}
                          </div>
                          <Button size="sm">
                            Markera som slutförd
                            <CheckCircle2 className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Actionables */}
              {activeActionables.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Handlingsplaner
                  </h3>
                  <div className="space-y-4">
                    {activeActionables.map((action) => (
                      <Card key={action.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg mb-2">{action.title}</h4>
                            {action.description && (
                              <p className="text-muted-foreground mb-3">{action.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(action.priority || 'medium')}>
                              {action.priority === 'high' ? 'Hög' : action.priority === 'medium' ? 'Medel' : 'Låg'} prioritet
                            </Badge>
                            <Badge variant="outline" className={`${getStatusColor(action.completion_status || 'pending')} flex items-center gap-1`}>
                              {getStatusIcon(action.completion_status || 'pending')}
                              {getStatusLabel(action.completion_status || 'pending')}
                            </Badge>
                          </div>
                        </div>

                        {action.completion_percentage > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Framsteg</span>
                              <span className="text-sm text-muted-foreground">{action.completion_percentage}%</span>
                            </div>
                            <Progress value={action.completion_percentage} className="h-2" />
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {action.estimated_duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{action.estimated_duration} min</span>
                              </div>
                            )}
                            {action.scheduled_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(action.scheduled_date), 'PPP', { locale: sv })}</span>
                              </div>
                            )}
                          </div>
                          <Button size="sm">
                            Uppdatera framsteg
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeRecommendations.length === 0 && activeActionables.length === 0 && (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 rounded-full bg-muted">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Inga aktiva aktiviteter</h3>
                      <p className="text-muted-foreground">
                        Bra jobbat! Du har slutfört alla aktiva aktiviteter.
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <a href="/guided-assessment">
                        Gör fler assessments för nya rekommendationer
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-6 mt-6">
              {/* Completed Items */}
              <div className="space-y-4">
                {[...completedRecommendations, ...completedActionables].map((item) => (
                  <Card key={item.id} className="p-6 opacity-75">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          {item.title}
                        </h4>
                        <p className="text-muted-foreground mb-2">{item.description}</p>
                        <div className="text-sm text-muted-foreground">
                          Slutförd {('completed_at' in item && item.completed_at) && format(new Date(item.completed_at), 'PPP', { locale: sv })}
                        </div>
                      </div>
                      <Badge className="bg-success/10 text-success border-success/20">
                        Slutförd
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>

              {completedItems === 0 && (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 rounded-full bg-muted">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Inga slutförda aktiviteter än</h3>
                      <p className="text-muted-foreground">
                        När du slutför aktiviteter kommer de att visas här.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {hasProgram && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Vill du ha fler rekommendationer? Gör assessments för andra utvecklingsområden.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <a href="/guided-assessment">
                Gör fler assessments
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="/my-analyses">
                Se analyser
                <RotateCcw className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProgram;