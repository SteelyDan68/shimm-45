import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowRight
} from 'lucide-react';
import { AutonomousMessagingInterface } from '@/components/Stefan/AutonomousMessagingInterface';
import { ProactiveCoachingDashboard } from '@/components/Stefan/ProactiveCoachingDashboard';
import { IntegratedStefanInterface } from '@/components/Stefan/IntegratedStefanInterface';
import { StefanAIManagementCenter } from '@/components/Admin/StefanAIManagementCenter';
import { useStefanInterventions } from '@/hooks/useStefanInterventions';
import { useStefanProactiveCoaching } from '@/hooks/useStefanProactiveCoaching';
import { useAuth } from '@/providers/UnifiedAuthProvider';

/**
 * 🧠 STEFAN AI CENTRAL HUB
 * Unified navigation center för alla Stefan AI funktioner
 * Sprint 2: Intelligent Coaching integration
 */

export const StefanAICentralHub: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  const { getInterventionStats } = useStefanInterventions();
  const { coachingMetrics } = useStefanProactiveCoaching();
  
  const stats = getInterventionStats();
  const isAdmin = hasRole('admin') || hasRole('superadmin');

  const navigationCards = [
    {
      id: 'chat',
      title: 'Stefan Chat',
      description: 'Direkt konversation med Stefan AI för personlig coaching',
      icon: MessageSquare,
      route: '/stefan/chat',
      color: 'from-blue-500 to-purple-500',
      stats: `${stats.total} meddelanden`,
      available: true
    },
    {
      id: 'interventions',
      title: 'Proaktiva Meddelanden',
      description: 'Stefans intelligenta interventioner och coaching-meddelanden',
      icon: Brain,
      route: '/stefan/interventions',
      color: 'from-purple-500 to-pink-500',
      stats: `${stats.responseRate}% svar`,
      available: true
    },
    {
      id: 'coaching',
      title: 'Proaktiv Coaching',
      description: 'AI-driven coaching insights och personaliserade rekommendationer',
      icon: Target,
      route: '/stefan/coaching',
      color: 'from-green-500 to-blue-500',
      stats: coachingMetrics?.interventionNeeded ? 'Intervention behövs' : 'Status OK',
      available: true,
      urgent: coachingMetrics?.interventionNeeded && coachingMetrics?.urgencyLevel === 'high'
    },
    {
      id: 'management',
      title: 'Stefan Management',
      description: 'Admin center för Stefan AI konfiguration och analytics',
      icon: Settings,
      route: '/stefan/management',
      color: 'from-orange-500 to-red-500',
      stats: 'Admin Only',
      available: isAdmin
    }
  ];

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

  return (
    <div className="space-y-8 p-6">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Stefan AI Central Hub
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Din personliga AI-coach för utveckling, reflektion och framsteg. Välj hur du vill interagera med Stefan idag.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Totala Interventioner</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Svarsfrekvens</span>
            </div>
            <p className="text-2xl font-bold">{stats.responseRate}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Coaching Status</span>
            </div>
            <p className="text-sm font-medium">
              {coachingMetrics?.interventionNeeded ? 'Aktiv' : 'Standby'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">AI Insights</span>
            </div>
            <p className="text-sm font-medium">Tillgängliga</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {navigationCards.filter(card => card.available).map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.id} 
              className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg cursor-pointer group ${
                card.urgent ? 'border-red-500 animate-pulse' : 'hover:border-primary/50'
              }`}
              onClick={() => navigate(card.route)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      <CardDescription className="text-sm">{card.description}</CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {card.urgent && (
                      <Badge variant="destructive" className="text-xs">
                        URGENT
                      </Badge>
                    )}
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {card.stats}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Klicka för att öppna
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Snabbåtgärder
          </CardTitle>
          <CardDescription>
            Vanliga Stefan AI-funktioner för snabb åtkomst
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 justify-start"
              onClick={() => navigate('/stefan/chat')}
            >
              <MessageSquare className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Starta Chat</p>
                <p className="text-xs text-muted-foreground">Prata direkt med Stefan</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 justify-start"
              onClick={() => navigate('/stefan/coaching')}
            >
              <Target className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Coaching Check</p>
                <p className="text-xs text-muted-foreground">Se dina coaching insights</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 justify-start"
              onClick={() => navigate('/stefan/interventions')}
            >
              <Brain className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Se Meddelanden</p>
                <p className="text-xs text-muted-foreground">Stefans proaktiva tips</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coaching Status Alert */}
      {coachingMetrics?.interventionNeeded && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">
                  Stefan har nya coaching-insights för dig
                </p>
                <p className="text-sm text-orange-600">
                  Baserat på din senaste aktivitet rekommenderar Stefan en check-in.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/stefan/coaching')}
                className="border-orange-500 text-orange-700 hover:bg-orange-100"
              >
                Se Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};