import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Share2,
  TrendingUp,
  TrendingDown,
  Instagram,
  Twitter,
  Youtube,
  Music,
  Facebook
} from 'lucide-react';

interface SocialMetrics {
  id: string;
  data_type: string;
  source: string;
  data: {
    platform?: string;
    followers?: number;
    subscribers?: number;
    following?: number;
    posts?: number;
    videos?: number;
    views?: number;
    engagement_rate?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    growth_rate?: number;
    posts_per_week?: number;
    avg_likes?: number;
    avg_comments?: number;
    avg_views?: number;
    page_views?: number;
    handle?: string;
    raw_data?: any;
    last_updated?: string;
    source?: string; // For auto-discovery source
    url?: string;
    confidence_score?: number;
    discovery_method?: string;
  };
  created_at: string;
}

interface SocialWidgetProps {
  socialMetrics: SocialMetrics[] | null;
}

export const SocialWidget = ({ socialMetrics }: SocialWidgetProps) => {
  if (!socialMetrics || socialMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sociala medier-siffror
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Inga sociala siffror hittade</p>
            <p className="text-sm">Kör DataCollector för att samla metrics från:</p>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">Instagram</Badge>
              <Badge variant="outline" className="text-xs">TikTok</Badge>
              <Badge variant="outline" className="text-xs">YouTube (Manuell)</Badge>
              <Badge variant="outline" className="text-xs">Facebook</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <Music className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Sociala medier-siffror
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {socialMetrics
          .filter(metric => metric && metric.data && Object.keys(metric.data).length > 0)
          .reduce((uniqueMetrics: SocialMetrics[], metric) => {
            // Remove duplicates based on platform and handle
            const platform = metric.data.platform?.toLowerCase() || 'unknown';
            const handle = metric.data.handle || '';
            const exists = uniqueMetrics.find(m => 
              m.data.platform?.toLowerCase() === platform && 
              m.data.handle === handle
            );
            if (!exists) {
              uniqueMetrics.push(metric);
            }
            return uniqueMetrics;
          }, [])
          .map((metric, index) => {
          const data = metric.data || {};
          const platform = data.platform?.toLowerCase() || 'unknown';
          const rawData = data.raw_data;
          const dataSource = data.source || metric.source || '';
          
          // Extract metrics from raw_data structure
          let followers = 0;
          let posts = 0;
          let likes = 0;
          let engagement = 0;
          let following = 0;
          let views = 0;
          
          if (platform === 'instagram' && rawData?.data) {
            const stats = rawData.data.statistics?.total;
            const daily = rawData.data.daily?.[0]; // Latest day
            followers = stats?.followers || daily?.followers || 0;
            posts = stats?.media || daily?.media || 0;
            likes = Math.round(stats?.avg_likes || daily?.avg_likes || 0);
            engagement = Math.round((stats?.engagement_rate || 0) * 100) / 100;
            following = stats?.following || daily?.following || 0;
          } else if (platform === 'tiktok' && rawData?.data) {
            const stats = rawData.data.statistics?.total;
            const daily = rawData.data.daily?.[0]; // Latest day
            followers = stats?.followers || daily?.followers || 0;
            posts = stats?.uploads || daily?.uploads || 0;
            likes = stats?.likes || daily?.likes || 0;
            following = stats?.following || daily?.following || 0;
          } else if (platform === 'youtube') {
            // YouTube data will only be manual input - no API processing
            followers = data.subscribers || 0;
            posts = data.videos || 0;
            views = data.views || 0;
            following = 0; // YouTube doesn't have following concept
          }
          
          // Check for direct data properties (fallback)
          if (followers === 0 && data.subscribers) {
            followers = data.subscribers; // YouTube subscribers
          }
          if (followers === 0 && data.followers) {
            followers = data.followers; // Instagram/TikTok followers
          }
          if (posts === 0 && data.videos) {
            posts = data.videos; // YouTube videos
          }
          if (posts === 0 && data.posts) {
            posts = data.posts; // Instagram posts
          }
          if (views === 0 && data.page_views) {
            views = data.page_views; // YouTube total views
          }
          if (views === 0 && data.views) {
            views = data.views; // General views
          }
          
          return (
            <div key={index} className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="flex items-center gap-1">
                  {getPlatformIcon(platform)}
                  {data.platform || metric.source}
                  {data.source === 'auto_discovery' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded ml-1">
                      Auto-upptäckt
                    </span>
                  )}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(metric.created_at).toLocaleDateString('sv-SE')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Followers/Subscribers */}
                {followers > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        {platform === 'youtube' ? 'Prenumeranter' : 'Följare'}
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">
                      {formatNumber(followers)}
                    </p>
                  </div>
                )}

                {/* Engagement Rate */}
                {engagement > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Engagement</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{engagement.toFixed(1)}%</p>
                  </div>
                )}

                {/* Posts/Videos */}
                {posts > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Share2 className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">
                        {platform === 'youtube' ? 'Videos' : platform === 'tiktok' ? 'Videos' : 'Inlägg'}
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">
                      {formatNumber(posts)}
                    </p>
                  </div>
                )}

                {/* TikTok likes */}
                {platform === 'tiktok' && likes > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Likes</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{formatNumber(likes)}</p>
                  </div>
                )}

                {/* Instagram average likes */}
                {platform === 'instagram' && likes > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Snitt-likes</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{formatNumber(likes)}</p>
                  </div>
                )}

                {/* YouTube total views */}
                {platform === 'youtube' && views > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Totala visningar</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{formatNumber(views)}</p>
                  </div>
                )}

                {/* Following */}
                {following > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Följer</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{formatNumber(following)}</p>
                  </div>
                )}
              </div>

              {/* Data source info */}
              {dataSource && (
                <div className="pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    Källa: {dataSource === 'rapidapi_instagram_premium' ? 'RapidAPI (Premium)' : 
                           dataSource === 'socialblade' ? 'Social Blade' : 
                           dataSource.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
              )}

              {/* Additional metrics from daily data */}
              {rawData?.daily?.[0] && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Senaste aktivitet</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    {platform === 'instagram' && rawData.daily[0].avg_comments && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-blue-500" />
                        <span>{formatNumber(Math.round(rawData.daily[0].avg_comments))} snitt-kommentarer</span>
                      </div>
                    )}
                    {rawData.daily[0].uploads && platform === 'tiktok' && (
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3 w-3 text-green-500" />
                        <span>{formatNumber(rawData.daily[0].uploads)} totala videos</span>
                      </div>
                    )}
                    {rawData.daily[0].media && platform === 'instagram' && (
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3 w-3 text-green-500" />
                        <span>{formatNumber(rawData.daily[0].media)} totala inlägg</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {index < socialMetrics.length - 1 && <hr className="my-4" />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};