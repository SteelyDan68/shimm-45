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
            <p className="text-sm">Kör dataCollector för att samla metrics</p>
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
        {socialMetrics.map((metric, index) => {
          const data = metric.data;
          const platform = data.platform?.toLowerCase() || 'unknown';
          
          return (
            <div key={index} className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="flex items-center gap-1">
                  {getPlatformIcon(platform)}
                  {data.platform || metric.source}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(metric.created_at).toLocaleDateString('sv-SE')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Followers/Subscribers */}
                {(data.followers || data.subscribers) && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        {platform === 'youtube' ? 'Prenumeranter' : 'Följare'}
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">
                      {formatNumber(data.followers || data.subscribers || 0)}
                    </p>
                    {data.growth_rate !== undefined && (
                      <div className="flex items-center gap-1 text-xs">
                        {getGrowthIcon(data.growth_rate)}
                        <span className={data.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {data.growth_rate > 0 ? '+' : ''}{data.growth_rate.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Engagement Rate */}
                {data.engagement_rate && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Engagement</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{data.engagement_rate.toFixed(1)}%</p>
                  </div>
                )}

                {/* Posts/Videos */}
                {(data.posts || data.videos) && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Share2 className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">
                        {platform === 'youtube' ? 'Videos' : 'Inlägg'}
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">
                      {formatNumber(data.posts || data.videos || 0)}
                    </p>
                  </div>
                )}

                {/* Platform specific metrics */}
                {platform === 'youtube' && data.views && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Visningar</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{formatNumber(data.views)}</p>
                  </div>
                )}

                {platform === 'tiktok' && data.likes && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Likes</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{formatNumber(data.likes)}</p>
                  </div>
                )}

                {(platform === 'instagram' || platform === 'facebook') && data.following && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Följer</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{formatNumber(data.following)}</p>
                  </div>
                )}
              </div>

              {/* Additional metrics */}
              {(data.likes || data.comments || data.shares || data.avg_likes || data.avg_comments) && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Genomsnittlig aktivitet</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    {(data.avg_likes || data.likes) && (
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span>{formatNumber(data.avg_likes || data.likes || 0)} likes</span>
                      </div>
                    )}
                    {(data.avg_comments || data.comments) && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-blue-500" />
                        <span>{formatNumber(data.avg_comments || data.comments || 0)} kommentarer</span>
                      </div>
                    )}
                    {data.shares && (
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3 w-3 text-green-500" />
                        <span>{formatNumber(data.shares)} delningar</span>
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