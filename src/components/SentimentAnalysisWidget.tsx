import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Target,
  Lightbulb,
  MessageSquare,
  BarChart3,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';

interface SentimentData {
  id: string;
  data_type: string;
  platform: string;
  source: string;
  data: {
    sentiment_score?: number;
    sentiment_summary?: string;
    key_themes?: string[];
    competitive_insights?: string;
    collaboration_opportunities?: string;
    brand_health?: string;
    recommendations?: string;
    data_quality?: string;
    raw_analysis?: string;
  };
  metadata?: {
    data_sources_count?: number;
    twitter_mentions?: number;
    sentiment_sources?: number;
  };
  created_at: string;
}

interface SentimentAnalysisWidgetProps {
  sentimentData: SentimentData[] | null;
  onCollectData?: () => void;
}

export const SentimentAnalysisWidget = ({ sentimentData, onCollectData }: SentimentAnalysisWidgetProps) => {
  if (!sentimentData || sentimentData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Business Intelligence & Sentimentanalys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 mb-4 opacity-50 flex items-center justify-center">
              <BarChart3 className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground mb-4">Ingen sentimentanalys tillgänglig</p>
            <p className="text-sm text-muted-foreground mb-4">
              Kör DataCollector för att generera omfattande business intelligence rapport som inkluderar:
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Badge variant="outline" className="text-xs justify-center">Sentimentanalys</Badge>
              <Badge variant="outline" className="text-xs justify-center">Social övervakning</Badge>
              <Badge variant="outline" className="text-xs justify-center">Branschtrender</Badge>
              <Badge variant="outline" className="text-xs justify-center">Konkurrentanalys</Badge>
              <Badge variant="outline" className="text-xs justify-center">Samarbetsmöjligheter</Badge>
              <Badge variant="outline" className="text-xs justify-center">Realtidsdata</Badge>
            </div>
            {onCollectData && (
              <button 
                onClick={onCollectData}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Kör DataCollector
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the latest analysis - check both ai_analysis and sentiment_analysis types
  const latestAnalysis = sentimentData
    .filter(item => item.data_type === 'ai_analysis' || item.data_type === 'sentiment_analysis')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (!latestAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Business Intelligence & Sentimentanalys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ingen sentimentanalys hittad.</p>
        </CardContent>
      </Card>
    );
  }

  const analysisData = latestAnalysis.data;
  const analysisText = analysisData.raw_analysis || analysisData.sentiment_summary || '';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Business Intelligence & Sentimentanalys
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          Analyserade {latestAnalysis.metadata?.data_sources_count || 0} källor 
          {latestAnalysis.metadata?.twitter_mentions ? ` (inkl. social data)` : ''}
          <Separator orientation="vertical" className="h-4" />
          {new Date(latestAnalysis.created_at).toLocaleDateString('sv-SE')}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New JSON-based analysis display */}
        {analysisData.sentiment_score !== undefined && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Sentimentanalys</h3>
            </div>
            
            {/* Simple Sentiment Score */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {analysisData.sentiment_score > 0.3 ? (
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                ) : analysisData.sentiment_score < -0.3 ? (
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                ) : (
                  <Minus className="h-5 w-5 text-gray-600" />
                )}
                <span className={`font-semibold ${
                  analysisData.sentiment_score > 0.3 ? 'text-green-600' : 
                  analysisData.sentiment_score < -0.3 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  Score: {analysisData.sentiment_score.toFixed(2)}
                </span>
              </div>
            </div>
            
            {analysisData.sentiment_summary && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{analysisData.sentiment_summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Key Themes */}
        {analysisData.key_themes && analysisData.key_themes.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Nyckelteman</h3>
              </div>
              <div className="grid gap-2">
                {analysisData.key_themes.map((theme, index) => (
                  <Badge key={index} variant="outline" className="justify-start">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Competitive Insights */}
        {analysisData.competitive_insights && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Konkurrentanalys</h3>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{analysisData.competitive_insights}</p>
              </div>
            </div>
          </>
        )}

        {/* Collaboration Opportunities */}
        {analysisData.collaboration_opportunities && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Samarbetsmöjligheter</h3>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{analysisData.collaboration_opportunities}</p>
              </div>
            </div>
          </>
        )}

        {/* Brand Health */}
        {analysisData.brand_health && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Varumärkeshälsa</h3>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{analysisData.brand_health}</p>
              </div>
            </div>
          </>
        )}

        {/* Recommendations */}
        {analysisData.recommendations && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Rekommendationer</h3>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{analysisData.recommendations}</p>
              </div>
            </div>
          </>
        )}

        {/* Full Analysis Expandable */}
        <Separator />
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium">
            <Eye className="h-4 w-4" />
            Visa fullständig analys
          </summary>
          <div className="mt-3 p-4 bg-muted/50 rounded-lg">
            <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{analysisText}</pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

// Component to display sentiment score visualization
const SentimentScoreDisplay = ({ sentiment }: { sentiment: any }) => {
  const { positive = 0, neutral = 0, negative = 0 } = sentiment.scores || {};
  const total = positive + neutral + negative;
  
  if (total === 0) return null;

  const positivePercent = (positive / total) * 100;
  const neutralPercent = (neutral / total) * 100;
  const negativePercent = (negative / total) * 100;

  const getOverallSentiment = () => {
    if (positivePercent > 50) return { label: 'Positiv', color: 'text-green-600', icon: ThumbsUp };
    if (negativePercent > 50) return { label: 'Negativ', color: 'text-red-600', icon: ThumbsDown };
    return { label: 'Neutral', color: 'text-gray-600', icon: Minus };
  };

  const overall = getOverallSentiment();
  const Icon = overall.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${overall.color}`} />
        <span className={`font-semibold ${overall.color}`}>
          Övergripande sentiment: {overall.label}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-green-600">Positiv</span>
          <span className="text-green-600">{positivePercent.toFixed(1)}%</span>
        </div>
        <Progress value={positivePercent} className="h-2 bg-gray-200">
          <div 
            className="h-full bg-green-500 transition-all" 
            style={{ width: `${positivePercent}%` }}
          />
        </Progress>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Neutral</span>
          <span className="text-gray-600">{neutralPercent.toFixed(1)}%</span>
        </div>
        <Progress value={neutralPercent} className="h-2 bg-gray-200">
          <div 
            className="h-full bg-gray-500 transition-all" 
            style={{ width: `${neutralPercent}%` }}
          />
        </Progress>
        
        <div className="flex justify-between text-sm">
          <span className="text-red-600">Negativ</span>
          <span className="text-red-600">{negativePercent.toFixed(1)}%</span>
        </div>
        <Progress value={negativePercent} className="h-2 bg-gray-200">
          <div 
            className="h-full bg-red-500 transition-all" 
            style={{ width: `${negativePercent}%` }}
          />
        </Progress>
      </div>
    </div>
  );
};

// Function to parse the AI analysis text into structured sections
function parseAnalysisText(text: string) {
  const sections: any = {};

  try {
    // Extract sentiment analysis
    const sentimentMatch = text.match(/1\.\s*SENTIMENTANALYS\s*\n([\s\S]*?)(?=\n2\.|$)/i);
    if (sentimentMatch) {
      const sentimentText = sentimentMatch[1];
      
      // Try to extract percentages for sentiment scores
      const percentageMatches = sentimentText.match(/(\d+(?:\.\d+)?)\s*%/g);
      let scores = { positive: 0, neutral: 0, negative: 0 };
      
      if (percentageMatches && percentageMatches.length >= 2) {
        // Assume first percentage is positive, others negative (simplified)
        scores.positive = parseFloat(percentageMatches[0]);
        scores.negative = parseFloat(percentageMatches[1]);
        scores.neutral = 100 - scores.positive - scores.negative;
      }
      
      // Extract themes and risks
      const positiveThemes = extractBulletPoints(sentimentText, /positiv/i);
      const riskAreas = extractBulletPoints(sentimentText, /risk/i);
      
      sections.sentiment = {
        scores,
        positiveThemes,
        riskAreas,
        text: sentimentText
      };
    }

    // Extract industry trends
    const trendsMatch = text.match(/2\.\s*BRANSCHTRENDER\s*\n([\s\S]*?)(?=\n3\.|$)/i);
    if (trendsMatch) {
      sections.trends = extractBulletPoints(trendsMatch[1]);
    }

    // Extract competitors
    const competitorsMatch = text.match(/3\.\s*KONKURRENTANALYS\s*\n([\s\S]*?)(?=\n4\.|$)/i);
    if (competitorsMatch) {
      sections.competitors = extractBulletPoints(competitorsMatch[1]);
    }

    // Extract collaborations
    const collabMatch = text.match(/4\.\s*SAMARBETSMÖJLIGHETER\s*\n([\s\S]*?)(?=\n5\.|$)/i);
    if (collabMatch) {
      sections.collaborations = extractBulletPoints(collabMatch[1]);
    }

    // Extract action plan
    const actionMatch = text.match(/5\.\s*HANDLINGSPLAN\s*\n([\s\S]*?)$/i);
    if (actionMatch) {
      sections.actionPlan = extractBulletPoints(actionMatch[1]);
    }

  } catch (error) {
    console.error('Error parsing analysis text:', error);
  }

  return sections;
}

// Helper function to extract bullet points from text
function extractBulletPoints(text: string, filter?: RegExp): string[] {
  const lines = text.split('\n');
  const bulletPoints: string[] = [];

  for (const line of lines) {
    const cleaned = line.trim();
    if (cleaned.startsWith('-') || cleaned.startsWith('•') || cleaned.startsWith('*')) {
      const point = cleaned.substring(1).trim();
      if (point && (!filter || filter.test(line))) {
        bulletPoints.push(point);
      }
    }
  }

  // If no bullet points found and we have a filter, try to find relevant sentences
  if (bulletPoints.length === 0 && filter) {
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (filter.test(sentence) && sentence.trim().length > 10) {
        bulletPoints.push(sentence.trim());
      }
    }
  }

  // If still no bullet points, split by common delimiters
  if (bulletPoints.length === 0) {
    const points = text.split(/\n\s*[-•*]\s*/).filter(p => p.trim().length > 0);
    bulletPoints.push(...points.slice(0, 5)); // Limit to 5 points
  }

  return bulletPoints.slice(0, 5); // Limit to 5 items for clean display
}