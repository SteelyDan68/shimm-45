import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { Trophy, Star, Target, Zap, Crown, Lock, Check } from 'lucide-react';

interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'progress' | 'streak' | 'pillar' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: 'xp' | 'streak' | 'tasks' | 'assessments' | 'check_ins' | 'level';
    value: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  };
  xp_reward: number;
  hidden?: boolean; // Secret achievements
}

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Progress Achievements
  {
    key: 'first_steps',
    name: 'Första stegen',
    description: 'Genomförde första aktiviteten',
    icon: Target,
    category: 'progress',
    rarity: 'common',
    requirements: { type: 'xp', value: 10 },
    xp_reward: 25
  },
  {
    key: 'dedicated_learner',
    name: 'Hängiven lärare',
    description: 'Nådde 500 XP',
    icon: Star,
    category: 'progress',
    rarity: 'rare',
    requirements: { type: 'xp', value: 500 },
    xp_reward: 100
  },
  {
    key: 'level_master',
    name: 'Nivåmästare',
    description: 'Nådde nivå 10',
    icon: Crown,
    category: 'milestone',
    rarity: 'epic',
    requirements: { type: 'level', value: 10 },
    xp_reward: 200
  },

  // Streak Achievements
  {
    key: 'consistency_starter',
    name: 'Konsistens-starter',
    description: '3 dagar i rad',
    icon: Zap,
    category: 'streak',
    rarity: 'common',
    requirements: { type: 'streak', value: 3 },
    xp_reward: 50
  },
  {
    key: 'week_warrior',
    name: 'Veckokriger',
    description: '7 dagar i rad',
    icon: Trophy,
    category: 'streak',
    rarity: 'rare',
    requirements: { type: 'streak', value: 7 },
    xp_reward: 150
  },
  {
    key: 'month_master',
    name: 'Månadsmästare',
    description: '30 dagar i rad',
    icon: Crown,
    category: 'streak',
    rarity: 'legendary',
    requirements: { type: 'streak', value: 30 },
    xp_reward: 500
  },

  // Activity Achievements
  {
    key: 'check_in_champion',
    name: 'Check-in champion',
    description: '10 dagliga check-ins',
    icon: Check,
    category: 'pillar',
    rarity: 'rare',
    requirements: { type: 'check_ins', value: 10 },
    xp_reward: 100
  },

  // Hidden Achievements
  {
    key: 'night_owl',
    name: 'Nattugla',
    description: 'Check-in efter midnatt',
    icon: Star,
    category: 'special',
    rarity: 'rare',
    requirements: { type: 'check_ins', value: 1 },
    xp_reward: 75,
    hidden: true
  }
];

export const AchievementGallery: React.FC = () => {
  const { user } = useAuth();
  const { progress, userAchievements } = useProgress(user?.id);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCelebration, setShowCelebration] = useState<string | null>(null);

  const earnedAchievementKeys = userAchievements.map(ua => ua.achievement_key);

  const getAchievementProgress = (achievement: AchievementDefinition): number => {
    if (!progress) return 0;

    switch (achievement.requirements.type) {
      case 'xp':
        return Math.min((progress.current_xp / achievement.requirements.value) * 100, 100);
      case 'level':
        return Math.min((progress.current_level / achievement.requirements.value) * 100, 100);
      case 'streak':
        return Math.min((progress.current_streak_days / achievement.requirements.value) * 100, 100);
      case 'check_ins':
        // Approximate based on sessions
        return Math.min((progress.total_sessions_completed / achievement.requirements.value) * 100, 100);
      default:
        return 0;
    }
  };

  const isAchievementEarned = (key: string) => earnedAchievementKeys.includes(key);

  const getRarityColor = (rarity: AchievementDefinition['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'rare': return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'epic': return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'legendary': return 'bg-yellow-100 border-yellow-300 text-yellow-700';
    }
  };

  const categories = [
    { key: 'all', name: 'Alla', count: ACHIEVEMENT_DEFINITIONS.length },
    { key: 'progress', name: 'Framsteg', count: ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'progress').length },
    { key: 'streak', name: 'Streak', count: ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'streak').length },
    { key: 'pillar', name: 'Aktivitet', count: ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'pillar').length },
    { key: 'milestone', name: 'Milstolpar', count: ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'milestone').length },
    { key: 'special', name: 'Special', count: ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'special').length }
  ];

  const filteredAchievements = ACHIEVEMENT_DEFINITIONS.filter(achievement => {
    if (selectedCategory === 'all') return true;
    return achievement.category === selectedCategory;
  });

  const visibleAchievements = filteredAchievements.filter(achievement => {
    // Show hidden achievements only if earned
    if (achievement.hidden) {
      return isAchievementEarned(achievement.key);
    }
    return true;
  });

  // Check for new achievements (in real app, this would come from the progress hook)
  useEffect(() => {
    const latestAchievement = userAchievements[0];
    if (latestAchievement && !showCelebration) {
      const timeSinceEarned = Date.now() - new Date(latestAchievement.earned_at).getTime();
      if (timeSinceEarned < 5000) { // Show if earned within last 5 seconds
        setShowCelebration(latestAchievement.achievement_key);
        setTimeout(() => setShowCelebration(null), 3000);
      }
    }
  }, [userAchievements, showCelebration]);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Prestationsutmärkelser
          </CardTitle>
          <CardDescription>
            Du har låst upp {earnedAchievementKeys.length} av {ACHIEVEMENT_DEFINITIONS.length} prestationer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Progress 
              value={(earnedAchievementKeys.length / ACHIEVEMENT_DEFINITIONS.length) * 100} 
              className="flex-1"
            />
            <span className="text-sm font-medium">
              {Math.round((earnedAchievementKeys.length / ACHIEVEMENT_DEFINITIONS.length) * 100)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category.key}
            variant={selectedCategory === category.key ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category.key)}
            className="h-auto py-2"
          >
            {category.name}
            <Badge variant="secondary" className="ml-2">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleAchievements.map(achievement => {
          const isEarned = isAchievementEarned(achievement.key);
          const progressPercent = getAchievementProgress(achievement);
          const Icon = achievement.icon;
          const isCelebrating = showCelebration === achievement.key;

          return (
            <Card 
              key={achievement.key} 
              className={`relative transition-all duration-500 ${
                isEarned ? getRarityColor(achievement.rarity) : 'opacity-75'
              } ${isCelebrating ? 'animate-pulse ring-2 ring-yellow-400' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isEarned ? 'bg-white/50' : 'bg-muted'
                    }`}>
                      {isEarned ? (
                        <Icon className="w-6 h-6" />
                      ) : (
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{achievement.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {achievement.rarity}
                      </Badge>
                    </div>
                  </div>
                  {isEarned && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {achievement.description}
                </p>
                
                {!isEarned && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Framsteg</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {achievement.requirements.type === 'xp' && `${achievement.requirements.value} XP`}
                    {achievement.requirements.type === 'streak' && `${achievement.requirements.value} dagar streak`}
                    {achievement.requirements.type === 'level' && `Nivå ${achievement.requirements.value}`}
                    {achievement.requirements.type === 'check_ins' && `${achievement.requirements.value} check-ins`}
                  </span>
                  <Badge variant="secondary">
                    +{achievement.xp_reward} XP
                  </Badge>
                </div>
              </CardContent>

              {/* Celebration Overlay */}
              {isCelebrating && (
                <div className="absolute inset-0 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-2 animate-bounce" />
                    <p className="font-bold text-yellow-800">Låst upp!</p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Achievement Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {categories.slice(1).map(category => {
              const earned = userAchievements.filter(ua => {
                const def = ACHIEVEMENT_DEFINITIONS.find(d => d.key === ua.achievement_key);
                return def?.category === category.key;
              }).length;
              
              return (
                <div key={category.key}>
                  <div className="text-2xl font-bold">{earned}</div>
                  <div className="text-xs text-muted-foreground">
                    {category.name} ({earned}/{category.count})
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};