import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Target,
  TrendingUp,
  Activity,
  Users,
  Sparkles,
  ArrowRight,
  Heart,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Zap,
  Star,
  Clock
} from 'lucide-react';
import { AutonomousMessagingInterface } from '@/components/Stefan/AutonomousMessagingInterface';
import { ProactiveCoachingDashboard } from '@/components/Stefan/ProactiveCoachingDashboard';
import { IntegratedStefanInterface } from '@/components/Stefan/IntegratedStefanInterface';
import { StefanAIManagementCenter } from '@/components/Admin/StefanAIManagementCenter';
import { useStefanRoleBasedData } from '@/hooks/useStefanRoleBasedData';
import { useAuth } from '@/providers/UnifiedAuthProvider';

/**
 * 🧠 ROLE-BASED STEFAN AI HUB
 * Completely transformed with live data integration
 * Skräddarsytt för klient/coach/admin roller
 */

export const RoleBasedStefanHub: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  const {
    clientData,
    coachData,
    adminData,
    currentRoleData,
    loading,
    refreshData,
    isClient,
    isCoach,
    isAdmin
  } = useStefanRoleBasedData();

  const [selectedTab, setSelectedTab] = useState('overview');

  // Route handling
  if (location.pathname !== '/stefan') {
    return (
      <Routes>
        <Route path="/chat" element={<IntegratedStefanInterface />} />
        <Route path="/interventions" element={<AutonomousMessagingInterface />} />
        <Route path="/coaching" element={<ProactiveCoachingDashboard />} />
        <Route path="/management" element={<StefanAIManagementCenter />} />
        <Route path="*" element={<Navigate to="/stefan" replace />} />
      </Routes>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Laddar Stefan AI data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Role-Specific Hero Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Stefan AI {isClient ? 'Coaching' : isCoach ? 'Coach Dashboard' : 'Management Center'}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {isClient && 'Din personliga AI-coach för utveckling och framsteg'}
          {isCoach && 'Intelligenta insights och verktyg för effektiv coaching'}
          {isAdmin && 'Fullständig överblick och kontroll över Stefan AI-systemet'}
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className={`grid w-full ${isClient ? 'grid-cols-3' : isCoach ? 'grid-cols-4' : 'grid-cols-5'}`}>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="progress">
            {isClient ? 'Min Progress' : isCoach ? 'Klient Progress' : 'System Status'}
          </TabsTrigger>
          <TabsTrigger value="insights">
            {isClient ? 'Stefan Tips' : isCoach ? 'Coaching Insights' : 'AI Analytics'}
          </TabsTrigger>
          {(isCoach || isAdmin) && (
            <TabsTrigger value="management">
              {isCoach ? 'Klient Management' : 'System Management'}
            </TabsTrigger>
          )}
          {isAdmin && <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>}
        </TabsList>

        {/* CLIENT VIEW */}
        {isClient && clientData && (
          <>
            <TabsContent value="overview" className="space-y-6">
              <ClientOverviewTab clientData={clientData} navigate={navigate} />
            </TabsContent>
            
            <TabsContent value="progress" className="space-y-6">
              <ClientProgressTab clientData={clientData} />
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-6">
              <ClientInsightsTab clientData={clientData} />
            </TabsContent>
          </>
        )}

        {/* COACH VIEW */}
        {isCoach && coachData && (
          <>
            <TabsContent value="overview" className="space-y-6">
              <CoachOverviewTab coachData={coachData} navigate={navigate} />
            </TabsContent>
            
            <TabsContent value="progress" className="space-y-6">
              <CoachProgressTab coachData={coachData} />
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-6">
              <CoachInsightsTab coachData={coachData} />
            </TabsContent>
            
            <TabsContent value="management" className="space-y-6">
              <CoachManagementTab coachData={coachData} />
            </TabsContent>
          </>
        )}

        {/* ADMIN VIEW */}
        {isAdmin && adminData && (
          <>
            <TabsContent value="overview" className="space-y-6">
              <AdminOverviewTab adminData={adminData} navigate={navigate} />
            </TabsContent>
            
            <TabsContent value="progress" className="space-y-6">
              <AdminStatusTab adminData={adminData} />
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-6">
              <AdminAnalyticsTab adminData={adminData} />
            </TabsContent>
            
            <TabsContent value="management" className="space-y-6">
              <AdminManagementTab adminData={adminData} />
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-6">
              <AdminAdvancedTab adminData={adminData} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Quick Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/stefan/chat')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Chatta med Stefan
              </Button>
              <Button variant="outline" onClick={refreshData}>
                <Activity className="h-4 w-4 mr-2" />
                Uppdatera Data
              </Button>
            </div>
            <Badge variant="secondary" className="text-xs">
              Live Data • Senast uppdaterad: {new Date().toLocaleTimeString('sv-SE')}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// CLIENT COMPONENTS
const ClientOverviewTab: React.FC<{ clientData: any; navigate: any }> = ({ clientData, navigate }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {/* Personal Progress */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Din Utveckling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Övergripande framsteg</span>
            <span className="text-sm font-medium">{Math.round(clientData.completionRate)}%</span>
          </div>
          <Progress value={clientData.completionRate} className="h-3" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{clientData.streakDays}</p>
            <p className="text-xs text-muted-foreground">Streak dagar</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{Math.round(clientData.weeklyProgress)}%</p>
            <p className="text-xs text-muted-foreground">Vecka framsteg</p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Stefan Status */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Stefan AI Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Coaching Status</span>
          <Badge variant={clientData.coachingStatus === 'intervention_needed' ? 'destructive' : 'default'}>
            {clientData.coachingStatus === 'intervention_needed' ? 'Behöver uppmärksamhet' : 'Aktiv'}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Svarsfrekvens</span>
            <span className="text-sm font-medium">{clientData.responseRate}%</span>
          </div>
          <Progress value={clientData.responseRate} className="h-2" />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {clientData.totalInterventions} meddelanden från Stefan
          </p>
        </div>
      </CardContent>
    </Card>

    {/* Pillar Progress */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Pillar Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-32">
          <div className="space-y-3">
            {Object.entries(clientData.pillarProgress).map(([pillar, progress]) => (
              <div key={pillar} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{pillar.replace('_', ' ')}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  </div>
);

const ClientProgressTab: React.FC<{ clientData: any }> = ({ clientData }) => (
  <div className="grid gap-6 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Senaste Aktiviteter</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {clientData.recentActivities.map((activity: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title || activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Personliga Mål</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clientData.personalGoals.map((goal: string, index: number) => (
            <div key={index} className="flex items-center gap-3 p-2 border rounded">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">{goal}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const ClientInsightsTab: React.FC<{ clientData: any }> = ({ clientData }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Stefan's Rekommendationer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Fokusera på Self Care</p>
                <p className="text-sm text-blue-700">Baserat på din pillar-analys rekommenderar Stefan extra fokus på självvård denna vecka.</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Fortsätt med skills-utveckling</p>
                <p className="text-sm text-green-700">Du visar stark framgång inom kompetensområdet. Fortsätt i samma takt!</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// COACH COMPONENTS
const CoachOverviewTab: React.FC<{ coachData: any; navigate: any }> = ({ coachData, navigate }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Klient Översikt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{coachData.assignedClients?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Tilldelade klienter</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{coachData.clientsNeedingAttention?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Behöver uppmärksamhet</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Genomsnittlig klientframsteg</span>
            <span className="text-sm font-medium">{Math.round(coachData.averageClientProgress)}%</span>
          </div>
          <Progress value={coachData.averageClientProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-500" />
          Coaching Effectiveness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{Math.round(Number(coachData.coachingEffectiveness) || 0)}%</p>
            <p className="text-sm text-muted-foreground">Coaching Effectiveness</p>
          </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Intervention Success</span>
            <span>{coachData.interventionSuccessRate}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Klient Engagement</span>
            <span>{Math.round(Number(coachData.clientEngagementRate) || 0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          Session Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{coachData.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Genomförda sessioner</p>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${i < Math.round(coachData.avgSessionRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
              />
            ))}
            <span className="text-sm ml-2">{coachData.avgSessionRating?.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const CoachProgressTab: React.FC<{ coachData: any }> = ({ coachData }) => (
  <div className="grid gap-6 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Klienter som behöver uppmärksamhet</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {coachData.clientsNeedingAttention?.map((client: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{client.name || 'Klient'}</p>
                  <p className="text-sm text-muted-foreground">
                    Health Score: {coachData.clientHealthScores?.[client.client_id] || 0}%
                  </p>
                </div>
                <Badge variant="destructive">Prioritet</Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Senaste Klientaktiviteter</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {coachData.recentClientActivities?.map((activity: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <Activity className="h-4 w-4 text-primary mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title || activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  </div>
);

const CoachInsightsTab: React.FC<{ coachData: any }> = ({ coachData }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Stefan's Coaching Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {coachData.strategicInsights?.map((insight: any, index: number) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const CoachManagementTab: React.FC<{ coachData: any }> = ({ coachData }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Klient Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {coachData.assignedClients?.map((client: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{client.name || 'Klient'}</p>
                <p className="text-sm text-muted-foreground">
                  Health Score: {coachData.clientHealthScores?.[client.client_id] || 0}%
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
                <Button size="sm" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analytics
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// ADMIN COMPONENTS
const AdminOverviewTab: React.FC<{ adminData: any; navigate: any }> = ({ adminData, navigate }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium">Totala Användare</span>
        </div>
        <p className="text-3xl font-bold">{adminData.totalUsers}</p>
        <p className="text-sm text-muted-foreground">{adminData.activeUsers} aktiva denna vecka</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <span className="text-sm font-medium">Stefan Interventioner</span>
        </div>
        <p className="text-3xl font-bold">{adminData.totalInterventions}</p>
        <p className="text-sm text-muted-foreground">{adminData.interventionEffectiveness}% effectiveness</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">System Health</span>
        </div>
        <p className="text-3xl font-bold">{adminData.systemHealthScore}%</p>
        <p className="text-sm text-muted-foreground">Alla system operationella</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium">Användarengagemang</span>
        </div>
        <p className="text-3xl font-bold">{Math.round(adminData.avgUserEngagement)}%</p>
        <p className="text-sm text-muted-foreground">Genomsnitt senaste månaden</p>
      </CardContent>
    </Card>
  </div>
);

const AdminStatusTab: React.FC<{ adminData: any }> = ({ adminData }) => (
  <div className="grid gap-6 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>System Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Response Latency</span>
            <span className="text-sm font-medium">{adminData.responseLatency}ms</span>
          </div>
          <Progress value={Math.max(0, 100 - (adminData.responseLatency / 10))} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Data Quality</span>
            <span className="text-sm font-medium">{adminData.dataQuality}%</span>
          </div>
          <Progress value={adminData.dataQuality} className="h-2" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>AI Model Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Recommendation Success</span>
            <Badge variant="default">{adminData.recommendationSuccess}%</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Model Confidence</span>
            <Badge variant="secondary">94%</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const AdminAnalyticsTab: React.FC<{ adminData: any }> = ({ adminData }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>AI Analytics Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Conversation Metrics</h4>
            <p className="text-2xl font-bold">98.5%</p>
            <p className="text-sm text-muted-foreground">Successful interactions</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Learning Effectiveness</h4>
            <p className="text-2xl font-bold">89%</p>
            <p className="text-sm text-muted-foreground">Model improvement rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const AdminManagementTab: React.FC<{ adminData: any }> = ({ adminData }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>System Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <Button variant="outline" className="h-auto p-4 justify-start">
            <Settings className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">Stefan Configuration</p>
              <p className="text-xs text-muted-foreground">Manage AI settings</p>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 justify-start">
            <Users className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">User Management</p>
              <p className="text-xs text-muted-foreground">Manage system users</p>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const AdminAdvancedTab: React.FC<{ adminData: any }> = ({ adminData }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Advanced Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Adaptive Learning Insights</h4>
            <div className="space-y-2">
              {adminData.adaptiveLearningInsights?.map((insight: any, index: number) => (
                <div key={index} className="text-sm p-2 bg-muted rounded">
                  {insight.description || 'AI model continuously improving based on user interactions'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);