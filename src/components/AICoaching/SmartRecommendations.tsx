import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdvancedAICoaching } from '@/hooks/useAdvancedAICoaching';
import { 
  Target, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Star,
  Brain,
  Timer,
  Zap
} from 'lucide-react';

interface SmartRecommendationsProps {
  userId?: string;
  context?: any;
  compact?: boolean;
}

export function SmartRecommendations({ userId, context, compact = false }: SmartRecommendationsProps) {
  const {
    recommendations,
    isAnalyzing,
    getAdaptiveRecommendations,
    implementRecommendation
  } = useAdvancedAICoaching();

  const [implementedIds, setImplementedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load adaptive recommendations on mount
  useEffect(() => {
    getAdaptiveRecommendations();
  }, [getAdaptiveRecommendations]);

  const categories = React.useMemo(() => {
    const cats = ['all', ...new Set(recommendations.map(r => r.category))];
    return cats;
  }, [recommendations]);

  const filteredRecommendations = React.useMemo(() => {
    if (selectedCategory === 'all') return recommendations;
    return recommendations.filter(r => r.category === selectedCategory);
  }, [recommendations, selectedCategory]);

  const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
  const sortedRecommendations = React.useMemo(() => {
    return [...filteredRecommendations].sort((a, b) => {
      return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
             (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
    });
  }, [filteredRecommendations]);

  const handleImplement = async (recommendationId: string) => {
    await implementRecommendation(recommendationId);
    setImplementedIds(prev => [...prev, recommendationId]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'action': return <Target className="h-4 w-4" />;
      case 'reflection': return <Brain className="h-4 w-4" />;
      case 'learning': return <BookOpen className="h-4 w-4" />;
      case 'habit': return <CheckCircle className="h-4 w-4" />;
      case 'goal': return <Star className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-success';
      case 'medium': return 'text-warning';
      case 'hard': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Rekommendationer
            <Badge variant="secondary" className="ml-auto">
              {recommendations.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {isAnalyzing ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Analyserar...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-4">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Inga rekommendationer ännu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedRecommendations.slice(0, 5).map((rec) => (
                  <Card key={rec.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getTypeIcon(rec.type)}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm truncate">
                              {rec.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {rec.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge 
                            variant={getPriorityColor(rec.priority) as any}
                            className="text-xs px-1 py-0"
                          >
                            {rec.priority}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            {rec.estimatedTime}m
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full text-xs h-7"
                          onClick={() => handleImplement(rec.id)}
                          disabled={implementedIds.includes(rec.id)}
                        >
                          {implementedIds.includes(rec.id) ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Genomförd
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3 mr-1" />
                              Implementera
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6" />
            Smart Rekommendationer
          </h2>
          <p className="text-muted-foreground">
            AI-genererade förslag baserat på din utveckling
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Analyserar...
            </div>
          )}
          <Badge variant="outline">
            {recommendations.length} rekommendationer
          </Badge>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Alla ({recommendations.length})</TabsTrigger>
          {categories.slice(1, 4).map((category) => (
            <TabsTrigger key={category} value={category}>
              {category} ({recommendations.filter(r => r.category === category).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {sortedRecommendations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Inga rekommendationer</h3>
                <p className="text-muted-foreground">
                  Rekommendationer kommer att visas här när AI:n har analyserat dina data
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedRecommendations.map((rec) => (
                <Card 
                  key={rec.id} 
                  className={`transition-all duration-200 hover:shadow-md ${
                    implementedIds.includes(rec.id) ? 'bg-muted/50 border-success' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(rec.type)}
                        <Badge variant={getPriorityColor(rec.priority) as any}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          {rec.estimatedTime}m
                        </div>
                        <div className={`text-xs ${getDifficultyColor(rec.difficulty)}`}>
                          {rec.difficulty}
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-base">{rec.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {rec.category}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <p className="text-sm">{rec.description}</p>
                    
                    <div className="p-2 bg-muted/50 rounded text-xs">
                      <p className="font-medium mb-1">Motivering:</p>
                      <p>{rec.reasoning}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium mb-1">Förväntat resultat:</p>
                      <p className="text-xs text-muted-foreground">{rec.expectedOutcome}</p>
                    </div>

                    {rec.metrics && rec.metrics.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Mätvärden:</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.metrics.map((metric, index) => (
                            <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {rec.resources && rec.resources.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Resurser:</p>
                        <div className="space-y-1">
                          {rec.resources.slice(0, 2).map((resource, index) => (
                            <div key={index} className="flex items-center gap-1 text-xs">
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {resource.type}
                              </Badge>
                              <span className="truncate">{resource.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button 
                        onClick={() => handleImplement(rec.id)}
                        disabled={implementedIds.includes(rec.id)}
                        size="sm"
                        className="w-full"
                        variant={implementedIds.includes(rec.id) ? "outline" : "default"}
                      >
                        {implementedIds.includes(rec.id) ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Genomförd
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Implementera
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}