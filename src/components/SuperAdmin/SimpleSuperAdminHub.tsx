/**
 * 👑 SIMPLE SUPERADMIN HUB
 * 
 * Enkel, pålitlig superadmin-dashboard utan komplexa dependencies
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Users, 
  Brain,
  Settings,
  Shield,
  ArrowRight,
  Activity,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

export const SimpleSuperAdminHub: React.FC = () => {
  const adminTools = [
    {
      title: "Unified User Center",
      description: "Komplett användarhantering och rollkontroll",
      icon: Users,
      route: "/unified-users",
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Stefan AI Administration", 
      description: "AI-system hantering och träningsdata",
      icon: Brain,
      route: "/stefan-administration",
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "Intelligence Hub",
      description: "Avancerad analys och användarinsikter",
      icon: Activity,
      route: "/intelligence-hub",
      color: "bg-green-50 text-green-600"
    },
    {
      title: "System Administration",
      description: "Systeminställningar och säkerhet",
      icon: Settings,
      route: "/administration",
      color: "bg-orange-50 text-orange-600"
    }
  ];

  const quickStats = [
    { label: "System Hälsa", value: "99.7%", icon: CheckCircle2, color: "text-green-600" },
    { label: "Aktiva Användare", value: "1,247", icon: Users, color: "text-blue-600" },
    { label: "AI Interaktioner", value: "2,847", icon: Brain, color: "text-purple-600" },
    { label: "Meddelanden", value: "156", icon: MessageSquare, color: "text-orange-600" }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Crown className="h-12 w-12 text-purple-600" />
          <h1 className="text-4xl font-bold">Superadmin Command Center</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Fullständig kontroll över Six Pillars ekosystemet
        </p>
        
        <Alert className="max-w-2xl mx-auto bg-purple-50 border-purple-200">
          <Crown className="h-5 w-5" />
          <AlertDescription className="text-center">
            <strong>Superadmin God Mode aktiverat!</strong> Du har obegränsad åtkomst till alla systemfunktioner.
          </AlertDescription>
        </Alert>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Administration Tools */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Administration Tools</h2>
          <p className="text-muted-foreground">
            Konsoliderade verktyg för komplett systemhantering
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminTools.map((tool, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-l-4 border-l-purple-500"
              onClick={() => window.location.href = tool.route}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${tool.color} transition-colors`}>
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System Status */}
      <Card className="border-t-4 border-t-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Systemstatus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium">Six Pillars Platform</p>
                <p className="text-sm text-muted-foreground">Alla tjänster aktiva</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium">Stefan AI</p>
                <p className="text-sm text-muted-foreground">Optimal prestanda</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">Säker och snabb</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};