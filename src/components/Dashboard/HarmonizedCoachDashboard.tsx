/**
 * 🌟 HARMONIZED COACH DASHBOARD - Six Pillars Design System
 * 
 * Använder samma semantiska design som Six Pillars för konsistens
 * Coach-specifika funktioner med pedagogisk UX från klientdesign
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useRealCoachDashboard } from '@/hooks/useRealCoachDashboard';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Brain, 
  TrendingUp,
  MessageSquare,
  Calendar,
  ClipboardList,
  Star,
  Heart,
  Lightbulb,
  Palette,
  DollarSign,
  Route,
  UserCheck,
  ArrowRight,
  Plus,
  Eye,
  Activity
} from 'lucide-react';

// Samma färgsystem som Six Pillars
const pillarColors = {
  self_care: '#EF4444',
  skills: '#F59E0B', 
  talent: '#8B5CF6',
  brand: '#06B6D4',
  economy: '#10B981',
  open_track: '#EC4899'
};

const pillarIcons = {
  self_care: Heart,
  skills: Lightbulb,
  talent: Star,
  brand: Palette,
  economy: DollarSign,
  open_track: Route
};

export const HarmonizedCoachDashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { clients, coachStats, loading, refreshData } = useRealCoachDashboard();
  const { toast } = useToast();

  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  if (!hasRole('coach')) {
    return (
      <div className="p-6">
        <Alert className="max-w-2xl mx-auto">
          <Users className="h-4 w-4" />
          <AlertDescription>
            Du behöver coach-behörighet för att komma åt denna dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <UserCheck className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p>Laddar coach dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Hero Section - Samma design som Six Pillars */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <UserCheck className="h-10 w-10 text-green-600" />
          <h1 className="text-4xl font-bold">Coach Dashboard</h1>
          <HelpTooltip content="Din centrala kontrollpanel för coaching och klienthantering med Six Pillars metodiken." />
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Stöd dina klienter genom deras Six Pillars-resa med kraftfulla verktyg och insikter
        </p>
        
        <Alert className="max-w-2xl mx-auto bg-green-50 border-green-200">
          <Brain className="h-5 w-5" />
          <AlertDescription className="text-center">
            <strong>Coach-läge aktiverat!</strong> Du kan nu hantera dina {clients.length} tilldelade klienter 
            och följa deras utveckling genom Six Pillars systemet.
          </AlertDescription>
        </Alert>
      </div>

      {/* Stats Cards - Samma stil som Six Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Klienter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Tilldelade via systemet</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomförda Sessioner</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Denna månad</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Självskattningar</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Pågående bedömningar</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomsnittlig Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Över alla Six Pillars</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Six Pillars stil */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Snabbåtgärder</h2>
          <p className="text-muted-foreground">
            Vanliga coaching-uppgifter för effektiv klienthantering
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Skicka Meddelande</h3>
                  <p className="text-sm text-muted-foreground">Kontakta klienter direkt</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Ny Coaching Session</h3>
                  <p className="text-sm text-muted-foreground">Boka tid med klient</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Analysera Progress</h3>
                  <p className="text-sm text-muted-foreground">Six Pillars översikt</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Client Overview - Six Pillars grid design */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Dina Klienter</h2>
            <p className="text-muted-foreground">
              Hantera och följ upp dina tilldelade klienter
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visa alla
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card 
              key={client.id}
              className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 cursor-pointer"
              onClick={() => setSelectedClient(client.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {client.name?.charAt(0) || client.email.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{client.name || client.email}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Aktiv klient
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Six Pillars Status:
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(pillarColors).slice(0, 6).map(([key, color]) => {
                      const Icon = pillarIcons[key as keyof typeof pillarIcons];
                      return (
                        <div 
                          key={key}
                          className="flex items-center gap-1 p-2 rounded"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Icon className="h-3 w-3" style={{ color }} />
                          <span className="text-xs font-medium">75%</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Chatta
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Boka
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {clients.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Inga klienter tilldelade</h3>
            <p className="text-muted-foreground mb-4">
              Kontakta din admin för att få klienter tilldelade till dig
            </p>
            <Button variant="outline">
              Kontakta Admin
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};