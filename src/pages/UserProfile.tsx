import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  User,
  Brain, 
  TrendingUp, 
  RefreshCw,
  Settings,
  Activity,
  Clock,
  Zap,
  Trophy
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useUserData } from '@/hooks/useUserData';
import { useUserPillars } from '@/hooks/useUserPillars';
import { useUserTasks } from '@/hooks/useUserTasks';
import { useUserAssessments } from '@/hooks/useUserAssessments';
import { supabase } from '@/integrations/supabase/client';
import { ModularPillarDashboard } from '@/components/SixPillars/ModularPillarDashboard';
import { CalendarModule } from '@/components/Calendar/CalendarModule';
import { ClientTaskList } from '@/components/ClientTasks/ClientTaskList';
import { TaskScheduler } from '@/components/TaskScheduler/TaskScheduler';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';

interface UserStats {
  totalAssessments: number;
  activePillars: number;
  pendingTasks: number;
  completedTasks: number;
  weeklyProgress: number;
}

export const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<UserStats>({
    totalAssessments: 0,
    activePillars: 0,
    pendingTasks: 0,
    completedTasks: 0,
    weeklyProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  
  // User-centric hooks
  const { profile, roles, loading: profileLoading, getDisplayName, isClient, getClientId } = useUserData(userId);
  const { getActivatedPillars, assessments } = useUserPillars(userId!);
  const { getTaskCounts } = useUserTasks(userId!);
  const { assessmentRounds, getPendingAssignments } = useUserAssessments(userId!);

  useEffect(() => {
    if (userId && user) {
      loadUserStats();
      fetchClientId();
    }
  }, [userId, user]);

  const fetchClientId = async () => {
    if (!userId) return;
    const id = await getClientId();
    setClientId(id);
  };

  const loadUserStats = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Calculate comprehensive user statistics
      const activePillars = getActivatedPillars();
      const taskCounts = getTaskCounts();
      const pendingAssignments = getPendingAssignments();
      
      // Calculate weekly progress (mock calculation)
      const weeklyProgress = Math.min(
        ((taskCounts.completed / Math.max(taskCounts.total, 1)) * 100), 
        100
      );

      setStats({
        totalAssessments: assessmentRounds.length,
        activePillars: activePillars.length,
        pendingTasks: taskCounts.planned + taskCounts.in_progress,
        completedTasks: taskCounts.completed,
        weeklyProgress: Math.round(weeklyProgress)
      });

    } catch (error) {
      console.error('Error loading user stats:', error);
      toast({
        title: "Error",
        description: "Failed to load user statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canViewUser = () => {
    // Users can view their own profile
    if (user?.id === userId) return true;
    
    // Admins and coaches can view other users
    if (hasRole('admin') || hasRole('superadmin') || hasRole('coach')) return true;
    
    return false;
  };

  if (!canViewUser()) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this user profile.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading || profileLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading user profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <p className="text-muted-foreground">The requested user profile could not be found.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;
  const displayName = getDisplayName();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Enhanced Header with User Avatar */}
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-lg font-semibold bg-primary/10">
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
                {isOwnProfile && (
                  <Badge variant="outline" className="bg-primary/10 border-primary/30">
                    You
                  </Badge>
                )}
                <HelpTooltip content="User profile showing personal development progress and achievements" />
              </div>
              
              <div className="flex items-center gap-3 mt-2">
                {roles.map(role => (
                  <Badge 
                    key={role.id} 
                    variant={role.role === 'client' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {role.role}
                  </Badge>
                ))}
                
                {profile.location && (
                  <span className="text-sm text-muted-foreground">📍 {profile.location}</span>
                )}
                
                {profile.bio && (
                  <HelpTooltip content={profile.bio} />
                )}
              </div>
            </div>
          </div>
          
          {isOwnProfile && (
            <Button 
              onClick={() => navigate('/edit-profile')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Pillars</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.activePillars}</p>
                </div>
                <Trophy className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Completed Tasks</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completedTasks}</p>
                </div>
                <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending Tasks</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.pendingTasks}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Assessments</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalAssessments}</p>
                </div>
                <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Weekly Progress</p>
                  <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">{stats.weeklyProgress}%</p>
                </div>
                <Activity className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs with Better UX */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-background/60 backdrop-blur">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="pillars" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Six Pillars</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="development" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Development</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Enhanced User Profile */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Personal Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.first_name && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">First Name</label>
                        <p className="text-sm">{profile.first_name}</p>
                      </div>
                    )}
                    {profile.last_name && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                        <p className="text-sm">{profile.last_name}</p>
                      </div>
                    )}
                    {profile.email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm">{profile.email}</p>
                      </div>
                    )}
                    {profile.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-sm">{profile.phone}</p>
                      </div>
                    )}
                    {profile.primary_role && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Primary Role</label>
                        <p className="text-sm">{profile.primary_role}</p>
                      </div>
                    )}
                    {profile.niche && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Niche</label>
                        <p className="text-sm">{profile.niche}</p>
                      </div>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bio</label>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{profile.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions & Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isClient() && (
                    <>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => navigate('/client-dashboard')}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Client Dashboard
                      </Button>
                      
                      {stats.pendingTasks > 0 && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                            You have {stats.pendingTasks} pending tasks
                          </p>
                          <Button 
                            size="sm" 
                            className="mt-2 w-full" 
                            onClick={() => {/* Switch to tasks tab */}}
                          >
                            View Tasks
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {profile.onboarding_completed ? (
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        ✅ Onboarding completed
                      </p>
                      {profile.onboarding_completed_at && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {new Date(profile.onboarding_completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⏳ Onboarding pending
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2 w-full" 
                        onClick={() => navigate('/onboarding')}
                      >
                        Complete Onboarding
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Six Pillars Tab - User-Centric */}
          <TabsContent value="pillars" className="space-y-6">
            {clientId ? (
              <ModularPillarDashboard 
                userId={userId}
                userName={displayName}
                isCoachView={!isOwnProfile}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No client profile found for pillar assessments.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tasks Tab - User-Centric */}
          <TabsContent value="tasks" className="space-y-6">
            {clientId ? (
              <>
                <ClientTaskList clientId={clientId} clientName={displayName} />
                {!isOwnProfile && (
                  <TaskScheduler clientId={clientId} clientName={displayName} />
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No task data available.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Calendar Tab - User-Centric */}
          <TabsContent value="calendar" className="space-y-6">
            {clientId ? (
              <CalendarModule 
                clientId={clientId}
                clientName={displayName}
                isCoachView={!isOwnProfile}
                showNotifications={isOwnProfile}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No calendar data available.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab - User-Centric */}
          <TabsContent value="analytics" className="space-y-6">
            {clientId ? (
              <AnalyticsDashboard clientId={clientId} showClientName={false} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No analytics data available.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Development Tab - Enhanced */}
          <TabsContent value="development" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Personal Development Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Advanced development tracking and insights coming soon.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This section will include goal tracking, skill development, and personalized recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};