import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Zap, Target, TrendingUp } from 'lucide-react';

export const ProgressDashboard: React.FC = () => {
  const { user } = useAuth();
  const { progress, userAchievements, isLoading } = useProgress(user?.id);

  if (isLoading || !progress) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressToNext = ((progress.xp_to_next_level - (progress.current_xp % 100)) / 100) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Level & XP */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nivå</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress.current_level}</div>
          <Progress value={100 - progressToNext} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {progress.current_xp} XP ({progress.xp_to_next_level} till nästa)
          </p>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Streak</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress.current_streak_days}</div>
          <p className="text-xs text-muted-foreground">
            Rekord: {progress.longest_streak_days} dagar
          </p>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Prestationer</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userAchievements.length}</div>
          <p className="text-xs text-muted-foreground">Utmärkelser låsta upp</p>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sessioner</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress.total_sessions_completed}</div>
          <p className="text-xs text-muted-foreground">Genomförda</p>
        </CardContent>
      </Card>
    </div>
  );
};