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
  Youtube
} from 'lucide-react';

interface SocialMetrics {
  id: string;
  data_type: string;
  source: string;
  data: {
    platform?: string;
    followers?: number;
    following?: number;
    posts?: number;
    engagement_rate?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    growth_rate?: number;
    posts_per_week?: number;
  };
  created_at: string;
}

interface SocialWidgetProps {
  socialMetrics: SocialMetrics | null;
}

export const SocialWidget = ({ socialMetrics }: SocialWidgetProps) => {
  if (!socialMetrics) {
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

  const data = socialMetrics.data;
  const platform = data.platform?.toLowerCase();

  const getPlatformIcon = () => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sociala medier-siffror
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            {getPlatformIcon()}
            {data.platform || socialMetrics.source}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Followers */}
          {data.followers && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Följare</span>
              </div>
              <p className="text-2xl font-bold">{formatNumber(data.followers)}</p>
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
              <p className="text-2xl font-bold">{data.engagement_rate.toFixed(1)}%</p>
            </div>
          )}

          {/* Posts per Week */}
          {data.posts_per_week && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Inlägg/vecka</span>
              </div>
              <p className="text-2xl font-bold">{data.posts_per_week}</p>
            </div>
          )}

          {/* Total Posts */}
          {data.posts && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Share2 className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Totalt inlägg</span>
              </div>
              <p className="text-2xl font-bold">{formatNumber(data.posts)}</p>
            </div>
          )}
        </div>

        {/* Additional metrics */}
        {(data.likes || data.comments || data.shares) && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Senaste aktivitet</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {data.likes && (
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" />
                  <span>{formatNumber(data.likes)} likes</span>
                </div>
              )}
              {data.comments && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3 text-blue-500" />
                  <span>{formatNumber(data.comments)} kommentarer</span>
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

        <div className="mt-4 text-xs text-muted-foreground text-right">
          Uppdaterad: {new Date(socialMetrics.created_at).toLocaleString('sv-SE')}
        </div>
      </CardContent>
    </Card>
  );
};