import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  RefreshCw,
  Activity,
  Heart,
  MessageCircle,
  Share,
  Eye
} from 'lucide-react';

interface SocialProfile {
  platform: string;
  handle?: string;
  verified?: boolean;
  followers?: number;
  following?: number;
  posts?: number;
  engagement?: number;
  url?: string;
  lastUpdated?: Date;
  growth?: {
    followers: number;
    engagement: number;
  };
}

interface IntelligenceSocialCardProps {
  socialProfiles: SocialProfile[];
  title?: string;
  showGrowthMetrics?: boolean;
  onRefreshPlatform?: (platform: string, handle: string) => void;
  refreshing?: string[];
}

export function IntelligenceSocialCard({ 
  socialProfiles, 
  title = "Social Media Profiler",
  showGrowthMetrics = true,
  onRefreshPlatform,
  refreshing = []
}: IntelligenceSocialCardProps) {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-5 w-5 text-pink-600" />;
      case 'youtube': return <Youtube className="h-5 w-5 text-red-600" />;
      case 'facebook': return <Facebook className="h-5 w-5 text-blue-600" />;
      case 'twitter': return <Twitter className="h-5 w-5 text-blue-400" />;
      default: return <Users className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'border-pink-200 bg-pink-50';
      case 'youtube': return 'border-red-200 bg-red-50';
      case 'facebook': return 'border-blue-200 bg-blue-50';
      case 'twitter': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatNumber = (num?: number) => {
    if (!num || num === 0) return 'N/A';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const getEngagementLevel = (engagement?: number) => {
    if (!engagement) return { level: 'unknown', color: 'gray' };
    
    const percentage = engagement * 100;
    if (percentage >= 5) return { level: 'excellent', color: 'green' };
    if (percentage >= 2) return { level: 'good', color: 'blue' };
    if (percentage >= 1) return { level: 'average', color: 'yellow' };
    return { level: 'low', color: 'red' };
  };

  const getGrowthIcon = (growth?: number) => {
    if (!growth) return null;
    return growth > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // Filter out profiles without handles
  const validProfiles = socialProfiles.filter(profile => profile.handle);

  if (validProfiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Inga social media handles konfigurerade. 
              Lägg till handles i profilen för att samla data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          {title}
          <Badge variant="outline" className="ml-2">
            {validProfiles.length} plattformar
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validProfiles.map((profile, index) => {
            const engagementLevel = getEngagementLevel(profile.engagement);
            const isRefreshing = refreshing.includes(profile.platform.toLowerCase());
            const isExpanded = expandedPlatform === profile.platform;
            
            return (
              <Card 
                key={`${profile.platform}-${index}`}
                className={`transition-all duration-200 hover:shadow-md ${getPlatformColor(profile.platform)}`}
              >
                <CardContent className="p-4">
                  {/* Header with platform and verification */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getPlatformIcon(profile.platform)}
                      <div>
                        <h4 className="font-semibold capitalize">
                          {profile.platform}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          @{profile.handle}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {profile.verified && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      
                      {onRefreshPlatform && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRefreshPlatform(profile.platform, profile.handle!)}
                          disabled={isRefreshing}
                        >
                          {isRefreshing ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Main metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(profile.followers)}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" />
                        Följare
                        {showGrowthMetrics && profile.growth?.followers && (
                          <span className="flex items-center gap-1">
                            {getGrowthIcon(profile.growth.followers)}
                            {Math.abs(profile.growth.followers)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatNumber(profile.posts)}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Activity className="h-3 w-3" />
                        Inlägg
                      </div>
                    </div>
                  </div>

                  {/* Engagement metrics */}
                  {profile.engagement !== undefined && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Engagement</span>
                        <Badge 
                          variant="outline" 
                          className={`bg-${engagementLevel.color}-100 text-${engagementLevel.color}-800`}
                        >
                          {(profile.engagement * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress 
                        value={Math.min(profile.engagement * 100, 100)} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1 capitalize">
                        {engagementLevel.level} nivå
                        {showGrowthMetrics && profile.growth?.engagement && (
                          <span className="ml-2 flex items-center gap-1">
                            {getGrowthIcon(profile.growth.engagement)}
                            {(Math.abs(profile.growth.engagement) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional metrics toggle */}
                  {(profile.following || profile.url) && (
                    <div className="mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedPlatform(isExpanded ? null : profile.platform)}
                        className="w-full text-xs"
                      >
                        {isExpanded ? 'Visa mindre' : 'Visa mer'} 
                        <Eye className="h-3 w-3 ml-1" />
                      </Button>
                      
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          {profile.following && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Följer</span>
                              <span className="font-medium">{formatNumber(profile.following)}</span>
                            </div>
                          )}
                          
                          {profile.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="w-full text-xs"
                            >
                              <a 
                                href={profile.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                Besök profil
                              </a>
                            </Button>
                          )}
                          
                          {profile.lastUpdated && (
                            <div className="text-xs text-muted-foreground text-center">
                              Uppdaterad: {profile.lastUpdated.toLocaleDateString('sv-SE')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Summary stats */}
        {validProfiles.length > 1 && (
          <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-center">Sammanfattning</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatNumber(validProfiles.reduce((sum, p) => sum + (p.followers || 0), 0))}
                  </div>
                  <div className="text-xs text-muted-foreground">Totala följare</div>
                </div>
                
                <div>
                  <div className="text-xl font-bold text-purple-600">
                    {formatNumber(validProfiles.reduce((sum, p) => sum + (p.posts || 0), 0))}
                  </div>
                  <div className="text-xs text-muted-foreground">Totala inlägg</div>
                </div>
                
                <div>
                  <div className="text-xl font-bold text-green-600">
                    {validProfiles.filter(p => p.engagement && p.engagement > 0.02).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Aktiva plattformar</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}