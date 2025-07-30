import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Star,
  Clock,
  Calendar,
  BarChart3
} from "lucide-react";

interface ClientStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  pendingClients: number;
  averageVelocityScore: number;
  clientsByCategory: Record<string, number>;
  clientsCreatedThisMonth: number;
  clientsCreatedLastMonth: number;
  topPerformers: Array<{
    id: string;
    name: string;
    velocity_score: number;
    category: string;
  }>;
  recentActivity: Array<{
    id: string;
    name: string;
    action: string;
    timestamp: string;
  }>;
}

export function ClientStatsOverview() {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Hämta alla klienter
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name, category, status, velocity_score, created_at, updated_at');

      if (error) throw error;

      if (!clients) {
        setStats(null);
        return;
      }

      // Beräkna statistik
      const totalClients = clients.length;
      const activeClients = clients.filter(c => c.status === 'active').length;
      const inactiveClients = clients.filter(c => c.status === 'inactive').length;
      const pendingClients = clients.filter(c => c.status === 'pending').length;
      
      const averageVelocityScore = clients.reduce((acc, c) => acc + (c.velocity_score || 0), 0) / totalClients || 0;

      // Klienter per kategori
      const clientsByCategory = clients.reduce((acc, client) => {
        acc[client.category] = (acc[client.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Nya klienter denna månad
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const lastMonth = new Date(thisMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const clientsCreatedThisMonth = clients.filter(c => 
        new Date(c.created_at) >= thisMonth
      ).length;

      const clientsCreatedLastMonth = clients.filter(c => {
        const createdDate = new Date(c.created_at);
        return createdDate >= lastMonth && createdDate < thisMonth;
      }).length;

      // Topp-performers (högsta velocity score)
      const topPerformers = clients
        .filter(c => c.velocity_score && c.velocity_score > 0)
        .sort((a, b) => (b.velocity_score || 0) - (a.velocity_score || 0))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name,
          velocity_score: c.velocity_score || 0,
          category: c.category
        }));

      // Recent activity (senast uppdaterade)
      const recentActivity = clients
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name,
          action: 'Profil uppdaterad',
          timestamp: c.updated_at
        }));

      setStats({
        totalClients,
        activeClients,
        inactiveClients,
        pendingClients,
        averageVelocityScore,
        clientsByCategory,
        clientsCreatedThisMonth,
        clientsCreatedLastMonth,
        topPerformers,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching client stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen data tillgänglig</h3>
            <p className="text-muted-foreground">Kunde inte hämta klientstatistik</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const growthPercentage = stats.clientsCreatedLastMonth > 0 
    ? ((stats.clientsCreatedThisMonth - stats.clientsCreatedLastMonth) / stats.clientsCreatedLastMonth) * 100
    : stats.clientsCreatedThisMonth > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      {/* Main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala klienter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeClients} aktiva, {stats.inactiveClients} inaktiva
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nya denna månad</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientsCreatedThisMonth}</div>
            <div className="flex items-center text-xs">
              {growthPercentage >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={growthPercentage >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(growthPercentage).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">från förra månaden</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomsnittlig hastighet</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageVelocityScore)}</div>
            <p className="text-xs text-muted-foreground">
              av 100 möjliga poäng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Väntande</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingClients}</div>
            <p className="text-xs text-muted-foreground">
              Kräver uppmärksamhet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Klienter per kategori
            </CardTitle>
            <CardDescription>Fördelning av klientkategorier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.clientsByCategory)
                .sort(([,a], [,b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(count / stats.totalClients) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Topp-presterande klienter
            </CardTitle>
            <CardDescription>Klienter med högst velocity score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topPerformers.map((client, index) => (
                <div key={client.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{client.name}</div>
                      <Badge variant="outline" className="text-xs">
                        {client.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{client.velocity_score}</div>
                    <div className="text-xs text-muted-foreground">poäng</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Senaste aktivitet
          </CardTitle>
          <CardDescription>Nyligen uppdaterade klientprofiler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <div className="font-medium text-sm">{activity.name}</div>
                  <div className="text-xs text-muted-foreground">{activity.action}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleDateString('sv-SE', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}