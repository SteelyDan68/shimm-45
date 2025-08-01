import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Newspaper,
  AlertCircle,
  CheckCircle,
  Target,
  Lightbulb
} from 'lucide-react';

interface IntelligenceOverviewProps {
  userData: any[];
  userProfile: any;
  isCoachView: boolean;
}

export const IntelligenceOverview = ({ userData, userProfile, isCoachView }: IntelligenceOverviewProps) => {
  // Calculate metrics
  const totalDataPoints = userData.length;
  const newsCount = userData.filter(d => d.data_type === 'news').length;
  const socialCount = userData.filter(d => d.data_type === 'social_metrics').length;
  const aiAnalysisCount = userData.filter(d => d.data_type === 'ai_analysis').length;
  
  // Get latest data
  const latestNews = userData
    .filter(d => d.data_type === 'news')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 1)[0];
  
  const latestSocial = userData
    .filter(d => d.data_type === 'social_metrics')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 1)[0];

  // AI-generated insights based on role
  const getAIInsights = () => {
    if (isCoachView) {
      return {
        title: "Coach-rekommendationer",
        insights: [
          "Klienten visar stark aktivitet på sociala medier - bra momentum för innehållsstrategi",
          "Nyhetsomnämnanden indikerar växande synlighet - överväg PR-strategi",
          "Engagementsraten kan förbättras - föreslå taktik för bättre interaktion"
        ],
        priority: "medium"
      };
    } else {
      return {
        title: "Personliga insights",
        insights: [
          "Din synlighet online växer stadigt - fortsätt med konsekvent innehåll",
          "Dina senaste inlägg får bra respons - utveckla liknande content",
          "Överväg att engagera mer med din community för bättre reach"
        ],
        priority: "high"
      };
    }
  };

  const insights = getAIInsights();

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totala datapunkter</p>
                <p className="text-2xl font-bold">{totalDataPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Newspaper className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nyhetsartiklar</p>
                <p className="text-2xl font-bold">{newsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sociala metrics</p>
                <p className="text-2xl font-bold">{socialCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI-analyser</p>
                <p className="text-2xl font-bold">{aiAnalysisCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            {insights.title}
            <Badge variant={insights.priority === 'high' ? 'default' : 'secondary'}>
              {insights.priority === 'high' ? 'Hög prioritet' : 'Medium prioritet'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-background/60 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Data-hälsa & Täckning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Nyhetsbevakning</span>
                <span>{newsCount > 0 ? 'Aktiv' : 'Inaktiv'}</span>
              </div>
              <Progress value={newsCount > 0 ? 100 : 0} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sociala medier-spårning</span>
                <span>{socialCount > 0 ? 'Aktiv' : 'Inaktiv'}</span>
              </div>
              <Progress value={socialCount > 0 ? 100 : 0} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>AI-analys</span>
                <span>{aiAnalysisCount > 0 ? 'Aktiv' : 'Inaktiv'}</span>
              </div>
              <Progress value={aiAnalysisCount > 0 ? 100 : 0} className="h-2" />
            </div>
          </div>
          
          {totalDataPoints === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Ingen data insamlad ännu. Gå till fliken "Datainsamling" för att börja samla intelligence-data.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest Updates */}
      {(latestNews || latestSocial) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {latestNews && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Senaste nyhet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm line-clamp-2">
                    {latestNews.data?.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {latestNews.data?.source} • {new Date(latestNews.created_at).toLocaleDateString('sv-SE')}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {latestNews.data?.snippet}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {latestSocial && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Senaste social media data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{latestSocial.data?.platform}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(latestSocial.created_at).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {latestSocial.data?.followers && (
                      <div>
                        <span className="text-muted-foreground">Följare:</span>{' '}
                        <span className="font-medium">{latestSocial.data.followers.toLocaleString()}</span>
                      </div>
                    )}
                    {latestSocial.data?.engagement_rate && (
                      <div>
                        <span className="text-muted-foreground">Engagement:</span>{' '}
                        <span className="font-medium">{latestSocial.data.engagement_rate}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};