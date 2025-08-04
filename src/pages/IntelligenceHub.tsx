import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Brain,
  Users,
  TrendingUp,
  Search,
  Lightbulb,
  Target,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  Plus,
  Database
} from 'lucide-react';
import { EnhancedIntelligenceSearchPanel } from '@/components/Intelligence/EnhancedIntelligenceSearchPanel';
import { IntelligenceProfileView } from '@/components/Intelligence/IntelligenceProfileView';
import { useIntelligenceHub } from '@/hooks/useIntelligenceHub';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';

export function IntelligenceHubPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { hasRole } = useAuth();
  const { toast } = useToast();
  
  const {
    selectedProfile,
    loading,
    loadProfile,
    refreshProfile,
    exportProfile
  } = useIntelligenceHub({
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
    enableRealtime: true
  });

  // Load profile when user is selected
  useEffect(() => {
    if (selectedUserId && selectedUserId !== selectedProfile?.userId) {
      loadProfile(selectedUserId);
    }
  }, [selectedUserId, selectedProfile?.userId, loadProfile]);

  const handleProfileSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleRefresh = () => {
    if (selectedUserId) {
      refreshProfile(selectedUserId);
    }
  };

  const handleExport = () => {
    if (selectedUserId) {
      exportProfile(selectedUserId, 'json');
      toast({
        title: "Export framgångsrik",
        description: "Intelligence-profilen har exporterats som JSON",
      });
    }
  };

  // Improved permissions - även för coach
  if (!hasRole('admin') && !hasRole('superadmin') && !hasRole('coach')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Ingen åtkomst</h3>
            <p className="text-muted-foreground">
              Du behöver admin-, coach- eller superadmin-behörighet för att komma åt Intelligence Hub.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Intelligence Hub</h1>
                <p className="text-muted-foreground">
                  Centraliserad intelligensplattform för djupgående klientanalys
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Database className="h-3 w-3 mr-1" />
                AI-driven Analytics
              </Badge>
              
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Real-time Data
              </Badge>

              {hasRole('superadmin') && (
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Konfiguration
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex h-[calc(100vh-140px)]">
          {/* Search Panel */}
          <EnhancedIntelligenceSearchPanel
            onProfileSelect={handleProfileSelect}
            selectedUserId={selectedUserId}
          />

          {/* Main View */}
          <div className="flex-1 bg-white">
            {selectedProfile ? (
              <IntelligenceProfileView
                profile={selectedProfile}
                onRefresh={handleRefresh}
                onExport={handleExport}
                loading={loading}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                    <Brain className="w-12 h-12 text-purple-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Välkommen till Intelligence Hub
                  </h2>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    En kraftfull plattform för att analysera och förstå dina klienters digitala fotavtryck, 
                    beteendemönster och utvecklingsresor.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Search className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Sök & Filtrera</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Hitta klienter baserat på kategori, aktivitet eller progress
                      </p>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Real-time Analytics</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Live data från sociala medier, nyheter och coaching-sessioner
                      </p>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium">AI Insights</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Automatiska insikter och rekommendationer från AI-analys
                      </p>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">Progress Tracking</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Följ utveckling inom Six Pillars och coaching-mål
                      </p>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Börja genom att söka efter en klient i panelen till vänster
                    </p>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>Tillgänglig för {hasRole('superadmin') ? 'Superadmins' : hasRole('admin') ? 'Admins' : 'Coaches'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="bg-white border-t px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Intelligence Hub v2.0</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Powered by AI & Real-time Data</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span>Automatisk uppdatering: Aktiverad</span>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}