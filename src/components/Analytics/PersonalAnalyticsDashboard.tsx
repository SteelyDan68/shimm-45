import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDailyCheckIn } from '@/hooks/useDailyCheckIn';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Target,
  Zap,
  Heart,
  Brain,
  Star,
  Award
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const PersonalAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { progress } = useProgress(user?.id);
  const { getCheckInHistory, getCheckInTrends } = useDailyCheckIn(user?.id);
  
  const [checkInHistory, setCheckInHistory] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (user?.id) {
      loadAnalyticsData();
    }
  }, [user?.id, timeRange]);

  const loadAnalyticsData = async () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    const history = await getCheckInHistory(days);
    setCheckInHistory(history);
    
    const trendData = await getCheckInTrends(7);
    setTrends(trendData);
  };

  const getChartData = () => {
    if (!checkInHistory.length) return [];
    
    return checkInHistory
      .slice(0, timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)
      .reverse()
      .map(checkIn => ({
        date: new Date(checkIn.date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
        mood: checkIn.mood_score,
        energy: checkIn.energy_level,
        stress: 10 - checkIn.stress_level, // Invert stress to show "wellness"
        motivation: checkIn.motivation_level
      }));
  };

  const getStreakData = () => {
    if (!progress) return [];
    
    // Generate streak data for visualization based on real progress
    const data = [];
    const currentStreak = progress.current_streak_days;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - currentStreak);
    
    for (let i = 0; i < Math.min(currentStreak, 30); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      data.push({
        date: date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
        streak: i + 1,
        activity: Math.min(Math.floor((i + 1) / 10) + 1, 3) // Activity level based on streak position
      });
    }
    return data;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0.5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < -0.5) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0.5) return 'text-green-600';
    if (trend < -0.5) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const pillars = [
    { key: 'self_care', name: 'Self Care', icon: Heart, color: '#ef4444' },
    { key: 'skills', name: 'Skills', icon: Brain, color: '#3b82f6' },
    { key: 'talent', name: 'Talent', icon: Star, color: '#f59e0b' },
    { key: 'brand', name: 'Brand', icon: Target, color: '#8b5cf6' },
    { key: 'economy', name: 'Economy', icon: TrendingUp, color: '#10b981' }
  ];

  if (!progress) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuvarande streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.current_streak_days}</div>
            <p className="text-xs text-muted-foreground">
              Rekord: {progress.longest_streak_days} dagar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.current_xp}</div>
            <p className="text-xs text-muted-foreground">
              Nivå {progress.current_level}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkInHistory.length}</div>
            <p className="text-xs text-muted-foreground">
              Senaste {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} dagarna
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomsnittligt humör</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {checkInHistory.length > 0 
                ? (checkInHistory.reduce((sum, c) => sum + c.mood_score, 0) / checkInHistory.length).toFixed(1)
                : '0'
              }
            </div>
            <p className="text-xs text-muted-foreground">av 10</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-center">
        <div className="flex bg-muted rounded-lg p-1">
          {[
            { key: '7d', label: '7 dagar' },
            { key: '30d', label: '30 dagar' },
            { key: '90d', label: '90 dagar' }
          ].map(range => (
            <Button
              key={range.key}
              variant={timeRange === range.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range.key as any)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Välbefinnande</TabsTrigger>
          <TabsTrigger value="streak">Streak analys</TabsTrigger>
          <TabsTrigger value="pillars">Pelare fokus</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Välbefinnande över tid</CardTitle>
              <CardDescription>
                Dina trender inom humör, energi, balans och motivation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[1, 10]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Humör"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="energy" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Energi"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stress" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Balans"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="motivation" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Motivation"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4" />
                  <p>Inga check-in data tillgängliga</p>
                  <p className="text-sm">Gör din första dagliga check-in för att se trender</p>
                </div>
              )}

              {trends && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-semibold">Humör</span>
                      {getTrendIcon(trends.mood_trend)}
                    </div>
                    <div className={`text-sm ${getTrendColor(trends.mood_trend)}`}>
                      {trends.mood_trend > 0 ? '+' : ''}{trends.mood_trend.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-semibold">Energi</span>
                      {getTrendIcon(trends.energy_trend)}
                    </div>
                    <div className={`text-sm ${getTrendColor(trends.energy_trend)}`}>
                      {trends.energy_trend > 0 ? '+' : ''}{trends.energy_trend.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-semibold">Balans</span>
                      {getTrendIcon(-trends.stress_trend)} {/* Invert stress trend */}
                    </div>
                    <div className={`text-sm ${getTrendColor(-trends.stress_trend)}`}>
                      {-trends.stress_trend > 0 ? '+' : ''}{(-trends.stress_trend).toFixed(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-semibold">Motivation</span>
                      {getTrendIcon(trends.motivation_trend)}
                    </div>
                    <div className={`text-sm ${getTrendColor(trends.motivation_trend)}`}>
                      {trends.motivation_trend > 0 ? '+' : ''}{trends.motivation_trend.toFixed(1)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streak">
          <Card>
            <CardHeader>
              <CardTitle>Streak utveckling</CardTitle>
              <CardDescription>
                Din konstanta utvecklingsresa över tid
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getStreakData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getStreakData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="activity" fill="#3b82f6" name="Aktivitetsnivå" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="w-12 h-12 mx-auto mb-4" />
                  <p>Ingen streak data ännu</p>
                  <p className="text-sm">Bygg din första streak genom dagliga aktiviteter</p>
                </div>
              )}

              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold">
                    {progress.current_streak_days} dagar i rad
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Rekord: {progress.longest_streak_days} dagar
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pillars">
          <Card>
            <CardHeader>
              <CardTitle>Pelare fokus</CardTitle>
              <CardDescription>
                Vilka utvecklingsområden du fokuserat mest på
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trends?.most_focused_pillar ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      Mest fokuserad pelare: {trends.most_focused_pillar.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="grid gap-4">
                    {pillars.map(pillar => {
                      const Icon = pillar.icon;
                      const isMostFocused = pillar.key === trends.most_focused_pillar;
                      
                      return (
                        <div 
                          key={pillar.key}
                          className={`flex items-center gap-4 p-4 rounded-lg border ${
                            isMostFocused ? 'bg-primary/5 border-primary' : 'bg-muted/50'
                          }`}
                        >
                          <Icon 
                            className="w-6 h-6" 
                            style={{ color: pillar.color }}
                          />
                          <div className="flex-1">
                            <div className="font-semibold">{pillar.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {isMostFocused ? 'Din primära fokusområde' : 'Utvecklingsområde'}
                            </div>
                          </div>
                          {isMostFocused && (
                            <Star className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4" />
                  <p>Ingen fokusdata ännu</p>
                  <p className="text-sm">Gör check-ins för att se dina fokusområden</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};