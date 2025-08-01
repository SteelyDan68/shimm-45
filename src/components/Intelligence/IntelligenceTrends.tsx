import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Users,
  Eye,
  Heart,
  Share2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface IntelligenceTrendsProps {
  userData: any[];
  userProfile: any;
  isCoachView: boolean;
}

export const IntelligenceTrends = ({ userData, userProfile, isCoachView }: IntelligenceTrendsProps) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('followers');
  
  // Process social media trends
  const socialTrends = useMemo(() => {
    const socialData = userData
      .filter(d => d.data_type === 'social_metrics')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    return socialData.map((item, index) => ({
      date: new Date(item.created_at).toLocaleDateString('sv-SE'),
      followers: item.data?.followers || item.data?.subscribers || 0,
      posts: item.data?.posts || item.data?.videos || 0,
      engagement: item.data?.engagement_rate || 0,
      likes: item.data?.likes || item.data?.avg_likes || 0,
      platform: item.data?.platform || 'unknown',
      timestamp: item.created_at
    }));
  }, [userData]);

  // Process news trends
  const newsTrends = useMemo(() => {
    const newsData = userData
      .filter(d => d.data_type === 'news')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Group by week
    const weeklyData = newsData.reduce((acc: any, item) => {
      const date = new Date(item.created_at);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          week: weekStart.toLocaleDateString('sv-SE'),
          mentions: 0,
          sentiment: 0,
          sources: new Set()
        };
      }
      
      acc[weekKey].mentions++;
      acc[weekKey].sources.add(item.data?.source || 'unknown');
      
      return acc;
    }, {});
    
    return Object.values(weeklyData);
  }, [userData]);

  // Calculate growth metrics
  const calculateGrowth = (data: any[], metric: string) => {
    if (data.length < 2) return { value: 0, trend: 'neutral' };
    
    const latest = data[data.length - 1]?.[metric] || 0;
    const previous = data[data.length - 2]?.[metric] || 0;
    
    if (previous === 0) return { value: 0, trend: 'neutral' };
    
    const growth = ((latest - previous) / previous) * 100;
    const trend = growth > 5 ? 'up' : growth < -5 ? 'down' : 'neutral';
    
    return { value: Math.abs(growth), trend };
  };

  const followerGrowth = calculateGrowth(socialTrends, 'followers');
  const engagementGrowth = calculateGrowth(socialTrends, 'engagement');
  const postsGrowth = calculateGrowth(socialTrends, 'posts');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // AI-generated recommendations based on trends
  const getRecommendations = () => {
    const recommendations = [];
    
    if (followerGrowth.trend === 'up') {
      recommendations.push({
        type: 'success',
        text: isCoachView ? 
          'Klientens följartillväxt är stark - uppmuntra konsekvent innehållsproduktion' : 
          'Din följartillväxt är stark - fortsätt med liknande innehåll'
      });
    } else if (followerGrowth.trend === 'down') {
      recommendations.push({
        type: 'warning',
        text: isCoachView ? 
          'Följartillväxten minskar - överväg ny innehållsstrategi med klienten' : 
          'Din följartillväxt minskar - kanske dags att prova ny innehållsstrategi'
      });
    }
    
    if (engagementGrowth.trend === 'down') {
      recommendations.push({
        type: 'warning',
        text: isCoachView ? 
          'Engagementsraten sjunker - hjälp klienten med interaktivt innehåll' : 
          'Ditt engagement sjunker - prova mer interaktivt innehåll'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        text: isCoachView ? 
          'Stabila trender - bibehåll nuvarande strategi med klienten' : 
          'Stabila trender - fortsätt med din nuvarande strategi'
      });
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Följartillväxt</span>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(followerGrowth.trend)}
                <span className={`text-sm font-bold ${getTrendColor(followerGrowth.trend)}`}>
                  {followerGrowth.value.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Engagement</span>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(engagementGrowth.trend)}
                <span className={`text-sm font-bold ${getTrendColor(engagementGrowth.trend)}`}>
                  {engagementGrowth.value.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Inlägg/Videos</span>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(postsGrowth.trend)}
                <span className={`text-sm font-bold ${getTrendColor(postsGrowth.trend)}`}>
                  {postsGrowth.value.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {isCoachView ? 'Coach-rekommendationer' : 'Strategiska insights'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                rec.type === 'success' ? 'bg-green-50 border border-green-200' :
                rec.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className={`p-1 rounded ${
                  rec.type === 'success' ? 'bg-green-100' :
                  rec.type === 'warning' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  {rec.type === 'success' ? <TrendingUp className="h-3 w-3 text-green-600" /> :
                   rec.type === 'warning' ? <TrendingDown className="h-3 w-3 text-yellow-600" /> :
                   <BarChart3 className="h-3 w-3 text-blue-600" />}
                </div>
                <p className="text-sm">{rec.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Charts */}
      <Tabs defaultValue="social" className="space-y-4">
        <TabsList>
          <TabsTrigger value="social">Sociala Medier</TabsTrigger>
          <TabsTrigger value="news">Nyhetsbevakning</TabsTrigger>
        </TabsList>

        <TabsContent value="social" className="space-y-4">
          {socialTrends.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sociala medier-trender</span>
                  <div className="flex gap-2">
                    {['followers', 'engagement', 'posts'].map(metric => (
                      <Button
                        key={metric}
                        variant={selectedMetric === metric ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedMetric(metric)}
                      >
                        {metric === 'followers' ? 'Följare' : 
                         metric === 'engagement' ? 'Engagement' : 'Inlägg'}
                      </Button>
                    ))}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={socialTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Ingen social media data tillgänglig för trendanalys</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          {newsTrends.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Veckovis nyhetsbevakning</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={newsTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="mentions" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Ingen nyhetsdata tillgänglig för trendanalys</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};