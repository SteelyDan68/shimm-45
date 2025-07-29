import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Globe, 
  TrendingUp, 
  Users, 
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Loader2
} from 'lucide-react';
import { useGeminiResearch } from '@/hooks/useGeminiResearch';

interface ResearchResult {
  category: string;
  title: string;
  query: string;
  result: string;
  timestamp: string;
}

interface GeminiResearchData {
  query_type: string;
  research_results: ResearchResult[];
  timestamp: string;
}

interface GeminiWidgetProps {
  clientId: string;
  clientName: string;
}

export const GeminiWidget = ({ clientId, clientName }: GeminiWidgetProps) => {
  const [researchData, setResearchData] = useState<GeminiResearchData | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { performResearch, getLatestResearch, isResearching } = useGeminiResearch();

  useEffect(() => {
    loadLatestResearch();
  }, [clientId]);

  const loadLatestResearch = async () => {
    const data = await getLatestResearch(clientId);
    setResearchData(data);
  };

  const handleRunResearch = async (queryType: 'comprehensive' | 'quick' = 'comprehensive') => {
    const result = await performResearch(clientId, queryType);
    if (result) {
      setResearchData(result);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'news_mentions': return <Globe className="h-4 w-4" />;
      case 'industry_trends': return <TrendingUp className="h-4 w-4" />;
      case 'collaboration_opportunities': return <Users className="h-4 w-4" />;
      case 'social_presence': return <Zap className="h-4 w-4" />;
      case 'reputation_analysis': return <Search className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'news_mentions': return 'bg-blue-100 text-blue-800';
      case 'industry_trends': return 'bg-green-100 text-green-800';
      case 'collaboration_opportunities': return 'bg-purple-100 text-purple-800';
      case 'social_presence': return 'bg-orange-100 text-orange-800';
      case 'reputation_analysis': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCategoryName = (category: string) => {
    const names = {
      'news_mentions': 'Nyhetsomnämnanden',
      'industry_trends': 'Branschtrends',
      'collaboration_opportunities': 'Samarbetsmöjligheter',
      'social_presence': 'Social närvaro',
      'reputation_analysis': 'Ryktesanalys'
    };
    return names[category as keyof typeof names] || category;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Gemini Web-Research
            <Badge variant="outline">AI-powered</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRunResearch('quick')}
              disabled={isResearching}
            >
              {isResearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Snabb research
            </Button>
            <Button
              size="sm"
              onClick={() => handleRunResearch('comprehensive')}
              disabled={isResearching}
            >
              {isResearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Researchar...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Djup research
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!researchData ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Ingen web-research utförd</h3>
            <p className="text-sm mb-4">
              Använd Gemini's realtidskunskap för att researcha {clientName}
            </p>
            <div className="space-y-2 text-xs">
              <p>• Senaste nyhetsomnämnanden</p>
              <p>• Branschtrends och konkurrenter</p>
              <p>• Samarbetsmöjligheter</p>
              <p>• Social medier analys</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Research Summary */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">
                  Research av {clientName}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(researchData.timestamp).toLocaleString('sv-SE')}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {researchData.research_results.length} kategorier
              </Badge>
            </div>

            {/* Research Results */}
            <div className="space-y-3">
              {researchData.research_results.map((result, index) => (
                <Card key={index} className="border-l-4 border-l-primary/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(result.category)}
                        <h4 className="font-medium text-sm">{result.title}</h4>
                        <Badge className={getCategoryColor(result.category)} variant="outline">
                          {formatCategoryName(result.category)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedCategory(
                          expandedCategory === result.category ? null : result.category
                        )}
                      >
                        {expandedCategory === result.category ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {expandedCategory === result.category && (
                    <CardContent className="pt-0">
                      <Separator className="mb-3" />
                      <div className="space-y-3">
                        <div className="text-sm bg-muted/30 p-3 rounded">
                          <p className="font-medium mb-1">Query:</p>
                          <p className="text-muted-foreground text-xs">{result.query}</p>
                        </div>
                        <div className="text-sm leading-relaxed">
                          <p className="font-medium mb-2">Resultat:</p>
                          <div className="whitespace-pre-wrap text-muted-foreground">
                            {result.result}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                  
                  {expandedCategory !== result.category && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.result.substring(0, 150)}...
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};