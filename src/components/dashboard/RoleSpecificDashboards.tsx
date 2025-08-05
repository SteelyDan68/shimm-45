/**
 * 👥 ROLE-SPECIFIC DASHBOARD SYSTEM
 * SCRUM-TEAM PERSONALIZED USER EXPERIENCE IMPLEMENTATION
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Target, 
  Calendar, 
  MessageCircle,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  BarChart3,
  FileText,
  Settings,
  Plus,
  Eye,
  Edit3,
  Award
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';

export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  variant?: 'default' | 'secondary' | 'outline';
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'success' | 'info' | 'warning';
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Superadmin Dashboard - System Overview & Management
 */
export const SuperadminDashboard: React.FC = () => {
  const metrics: DashboardMetric[] = [
    {
      id: 'total_users',
      title: 'Total Users',
      value: '2,847',
      change: 12,
      trend: 'up',
      icon: Users,
      description: 'Active users in the system'
    },
    {
      id: 'system_health',
      title: 'System Health',
      value: '99.8%',
      change: 0.2,
      trend: 'up',
      icon: TrendingUp,
      description: 'Uptime in last 30 days'
    },
    {
      id: 'monthly_revenue',
      title: 'Monthly Revenue',
      value: '€45,230',
      change: 8.5,
      trend: 'up',
      icon: BarChart3,
      description: 'Current month performance'
    },
    {
      id: 'support_tickets',
      title: 'Open Tickets',
      value: 23,
      change: -15,
      trend: 'down',
      icon: MessageCircle,
      description: 'Pending support requests'
    }
  ];

  const quickActions: QuickAction[] = [
    {
      id: 'user_management',
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: Users,
      action: () => console.log('Navigate to user management')
    },
    {
      id: 'system_settings',
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: Settings,
      action: () => console.log('Navigate to system settings')
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'View detailed analytics',
      icon: BarChart3,
      action: () => console.log('Navigate to analytics')
    },
    {
      id: 'audit_logs',
      title: 'Audit Logs',
      description: 'Review system audit logs',
      icon: FileText,
      action: () => console.log('Navigate to audit logs')
    }
  ];

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      title: 'System Update Deployed',
      description: 'Version 2.1.0 successfully deployed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'success',
      icon: CheckCircle
    },
    {
      id: '2',
      title: 'New Admin User Created',
      description: 'john.doe@company.com added as admin',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      type: 'info',
      icon: Users
    },
    {
      id: '3',
      title: 'High Memory Usage Alert',
      description: 'Server memory usage at 85%',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      type: 'warning',
      icon: TrendingUp
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Overview</h1>
        <p className="text-muted-foreground">Monitor and manage the entire platform</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change !== undefined && (
                <p className={`text-xs ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}% from last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center text-center"
                  onClick={action.action}
                >
                  <action.icon className="h-6 w-6 mb-2" />
                  <span className="font-medium">{action.title}</span>
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${
                    activity.type === 'success' ? 'bg-green-100 text-green-600' :
                    activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.icon && <activity.icon className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Admin Dashboard - Organization Management
 */
export const AdminDashboard: React.FC = () => {
  const metrics: DashboardMetric[] = [
    {
      id: 'active_coaches',
      title: 'Active Coaches',
      value: 24,
      change: 3,
      trend: 'up',
      icon: Users,
      description: 'Coaches in your organization'
    },
    {
      id: 'total_clients',
      title: 'Total Clients',
      value: 187,
      change: 12,
      trend: 'up',
      icon: Target,
      description: 'Clients across all coaches'
    },
    {
      id: 'monthly_sessions',
      title: 'Monthly Sessions',
      value: 342,
      change: 8,
      trend: 'up',
      icon: Calendar,
      description: 'Sessions completed this month'
    },
    {
      id: 'completion_rate',
      title: 'Completion Rate',
      value: '94%',
      change: 2,
      trend: 'up',
      icon: CheckCircle,
      description: 'Goal completion rate'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Dashboard</h1>
        <p className="text-muted-foreground">Manage your coaching organization</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change !== undefined && (
                <p className={`text-xs ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}% from last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Top performing coaches this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Sarah Johnson', sessions: 28, rating: 4.9 },
                { name: 'Mike Chen', sessions: 24, rating: 4.8 },
                { name: 'Emma Wilson', sessions: 22, rating: 4.7 }
              ].map((coach, index) => (
                <div key={coach.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{coach.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {coach.sessions} sessions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{coach.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest organization events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New client onboarded', user: 'Sarah Johnson', time: '2h ago' },
                { action: 'Session completed', user: 'Mike Chen', time: '4h ago' },
                { action: 'Goal milestone achieved', user: 'Emma Wilson', time: '6h ago' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Coach Dashboard - Client Management & Coaching Tools
 */
export const CoachDashboard: React.FC = () => {
  const metrics: DashboardMetric[] = [
    {
      id: 'active_clients',
      title: 'Active Clients',
      value: 12,
      icon: Users,
      description: 'Currently coaching'
    },
    {
      id: 'this_week_sessions',
      title: 'This Week',
      value: 8,
      icon: Calendar,
      description: 'Sessions scheduled'
    },
    {
      id: 'completion_rate',
      title: 'Goal Progress',
      value: '87%',
      icon: Target,
      description: 'Average client progress'
    },
    {
      id: 'client_satisfaction',
      title: 'Satisfaction',
      value: '4.8',
      icon: Star,
      description: 'Average client rating'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coach Dashboard</h1>
        <p className="text-muted-foreground">Manage your clients and coaching sessions</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { client: 'Anna Andersson', time: '10:00', type: 'Goal Setting' },
                { client: 'Erik Johansson', time: '14:00', type: 'Progress Review' },
                { client: 'Lisa Karlsson', time: '16:00', type: 'Strategy Session' }
              ].map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{session.client}</p>
                    <p className="text-sm text-muted-foreground">{session.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{session.time}</p>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Client Progress</CardTitle>
            <CardDescription>Recent achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { client: 'Anna Andersson', goal: 'Leadership Skills', progress: 85 },
                { client: 'Erik Johansson', goal: 'Time Management', progress: 72 },
                { client: 'Lisa Karlsson', goal: 'Public Speaking', progress: 93 }
              ].map((client, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{client.client}</span>
                    <span className="text-muted-foreground">{client.progress}%</span>
                  </div>
                  <Progress value={client.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{client.goal}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Client Dashboard - Personal Progress & Goals
 */
export const ClientDashboard: React.FC = () => {
  const metrics: DashboardMetric[] = [
    {
      id: 'current_goals',
      title: 'Active Goals',
      value: 3,
      icon: Target,
      description: 'Goals in progress'
    },
    {
      id: 'completed_sessions',
      title: 'Sessions',
      value: 15,
      icon: Calendar,
      description: 'Completed sessions'
    },
    {
      id: 'overall_progress',
      title: 'Progress',
      value: '78%',
      icon: TrendingUp,
      description: 'Overall goal progress'
    },
    {
      id: 'next_session',
      title: 'Next Session',
      value: '2d',
      icon: Clock,
      description: 'Days until next session'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Journey</h1>
        <p className="text-muted-foreground">Track your progress and achieve your goals</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Current Goals</CardTitle>
            <CardDescription>Your active development goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { goal: 'Improve Public Speaking', progress: 85, deadline: '2 weeks' },
                { goal: 'Leadership Development', progress: 65, deadline: '1 month' },
                { goal: 'Time Management', progress: 92, deadline: '1 week' }
              ].map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{goal.goal}</span>
                    <Badge variant="outline">{goal.deadline}</Badge>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{goal.progress}% complete</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your latest coaching activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { activity: 'Completed session with coach', time: '2 days ago', type: 'session' },
                { activity: 'Achieved milestone: 50 presentations', time: '1 week ago', type: 'achievement' },
                { activity: 'Updated goal progress', time: '1 week ago', type: 'progress' }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`p-1 rounded-full ${
                    item.type === 'achievement' ? 'bg-green-100 text-green-600' :
                    item.type === 'session' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {item.type === 'achievement' ? <Award className="h-3 w-3" /> :
                     item.type === 'session' ? <Calendar className="h-3 w-3" /> :
                     <Edit3 className="h-3 w-3" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.activity}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Role-Specific Dashboard Router
 */
export const RoleSpecificDashboard: React.FC = () => {
  const { user, hasRole } = useAuth();

  if (hasRole('superadmin')) {
    return <SuperadminDashboard />;
  }
  
  if (hasRole('admin')) {
    return <AdminDashboard />;
  }
  
  if (hasRole('coach')) {
    return <CoachDashboard />;
  }
  
  if (hasRole('client')) {
    return <ClientDashboard />;
  }

  // Fallback for users without specific roles
  return <ClientDashboard />;
};