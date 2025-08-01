import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Shield, 
  Bot, 
  Database,
  Upload,
  Download,
  Trash2,
  FileText,
  Users,
  Key,
  Activity
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { CentralUserManager } from "@/components/UserAdministration/CentralUserManager";
import { AssessmentManager } from "@/components/AssessmentEngine/AssessmentManager";
import { AdminPillarManagement } from "@/components/AdminPillarManagement";
import { SystemHealthDashboard } from "@/components/SystemHealthDashboard";
import { SystemIntegrityPanel } from "@/components/SystemIntegrityPanel";

import { DataRightsCenter } from "@/components/DataRightsCenter";
import StefanTrainingData from "@/components/StefanTrainingData";
import StefanMemoryManager from "@/components/Admin/StefanMemoryManager";
import StefanOverviewPanel from "@/components/Admin/StefanOverviewPanel";
import { EnhancedApiStatusChecker } from "@/components/EnhancedApiStatusChecker";

import { HelpTooltip } from "@/components/HelpTooltip";
import { helpTexts } from "@/data/helpTexts";


export function Administration() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: "SHIMM Management",
    email: user?.email || "",
    timezone: "Stockholm (UTC+1)",
    language: "Svenska"
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    analyticalCookies: true,
    dataSharing: false
  });

  const [automationSettings, setAutomationSettings] = useState({
    autoDataCollection: true,
    scheduledReports: false,
    aiAnalysis: true,
    alertThresholds: false
  });

  const handleSaveProfile = () => {
    toast({
      title: "Profil sparad",
      description: "Dina profilinställningar har uppdaterats."
    });
  };

  const handleSaveSecurity = () => {
    toast({
      title: "Säkerhetsinställningar sparade",
      description: "Dina säkerhetsinställningar har uppdaterats."
    });
  };

  const handleSaveAutomation = async () => {
    try {
      // Save automation settings to user preferences
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: { automation: automationSettings }
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Automationsinställningar sparade", 
        description: "Dina automationsinställningar har uppdaterats."
      });
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte spara inställningar: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        user?.email || '',
        { redirectTo: `${window.location.origin}/auth` }
      );

      if (error) throw error;

      toast({
        title: "Lösenordsändring initierad",
        description: "En länk för lösenordsändring har skickats till din e-post."
      });
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte initiera lösenordsändring: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleManageSessions = async () => {
    try {
      // Get user sessions (simplified - in production would be more comprehensive)
      const sessionCount = session ? 1 : 0;
      
      toast({
        title: "Sessionhantering",
        description: `Du har för närvarande ${sessionCount} aktiv session. För att avsluta alla sessioner, logga ut och in igen.`
      });
    } catch (error) {
      toast({
        title: "Fel", 
        description: "Kunde inte hämta sessionsinformation",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async () => {
    try {
      // Export user's data as JSON
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const exportData = {
        profile,
        exported_at: new Date().toISOString(),
        export_type: 'user_data'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user_data_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      toast({
        title: "Dataexport genomförd",
        description: "Din data har exporterats och laddats ner."
      });
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte exportera data: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleRequestReport = () => {
    // TODO: Implementera datarapport
    toast({
      title: "Datarapport begärd",
      description: "En detaljerad rapport kommer skickas till din e-post."
    });
  };

  const handleDeleteAllData = () => {
    // TODO: Implementera datasläckning med bekräftelse
    toast({
      title: "Varning",
      description: "Detta kräver ytterligare bekräftelse. Kontakta support.",
      variant: "destructive"
    });
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Central Användaradministration</h1>
                  <p className="text-sm text-muted-foreground">
                    Hantera användare, roller och systemkonfiguration
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex">
                <Activity className="h-3 w-3 mr-1" />
                System aktiv
              </Badge>
              <HelpTooltip content="Här kan du hantera alla användare, tilldela roller och konfigurera systemets centrala funktioner." />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <Tabs defaultValue="users" className="space-y-6">
          {/* Navigation Tabs */}
          <div className="bg-card rounded-lg border p-1">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 gap-1">
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-4 py-2"
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Användare</span>
              </TabsTrigger>
              <TabsTrigger 
                value="stefan-overview" 
                className="flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-4 py-2"
              >
                <Bot className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Stefan AI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="permissions" 
                className="flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-4 py-2"
              >
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Roller</span>
              </TabsTrigger>
              <TabsTrigger 
                value="api-status" 
                className="flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-4 py-2"
              >
                <Activity className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">API Status</span>
              </TabsTrigger>
              <TabsTrigger 
                value="automation" 
                className="flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-4 py-2"
              >
                <Database className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Automation</span>
              </TabsTrigger>
              <TabsTrigger 
                value="gdpr" 
                className="flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-4 py-2"
              >
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">GDPR</span>
              </TabsTrigger>
              <TabsTrigger 
                value="health" 
                className="flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-4 py-2"
              >
                <Key className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="bg-card rounded-lg border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Användarhantering
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Centraliserad hantering av alla användare i systemet
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <CentralUserManager />
              </div>
            </div>
              
            <div className="bg-card rounded-lg border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Five Pillars Management
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Hantera och tilldela Five Pillars pelare till klienter
                </p>
              </div>
              <div className="p-6">
                <AdminPillarManagement />
              </div>
            </div>
          </TabsContent>

          {/* Stefan AI Overview Tab */}
          <TabsContent value="stefan-overview" className="space-y-6">
            <div className="bg-card rounded-lg border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Stefan AI Översikt
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Hantera och övervaka Stefan AI-funktionalitet
                </p>
              </div>
              <div className="p-6">
                <StefanOverviewPanel />
              </div>
            </div>
          </TabsContent>

          {/* API Status Tab */}
          <TabsContent value="api-status" className="space-y-6">
            <div className="bg-card rounded-lg border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  API Status & Övervakning
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Övervaka systemets API:er och tjänster
                </p>
              </div>
              <div className="p-6">
                <EnhancedApiStatusChecker />
              </div>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <div className="bg-card rounded-lg border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Behörighetshantering
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Hantera användarroller och åtkomstbehörigheter
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Automatisk rollhantering</h4>
                      <p className="text-sm text-muted-foreground">Tilldela roller automatiskt baserat på inbjudningstyp</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactor}
                      onCheckedChange={(checked) => 
                        setSecuritySettings({...securitySettings, twoFactor: checked})
                      }
                    />
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Rollöversikt</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                        <div>
                          <span className="font-medium">Superadmin</span>
                          <p className="text-sm text-muted-foreground">Full systemkontroll</p>
                        </div>
                        <Badge variant="destructive">1 användare</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                        <div>
                          <span className="font-medium">Admin</span>
                          <p className="text-sm text-muted-foreground">Användarhantering och systemövervakning</p>
                        </div>
                        <Badge variant="secondary">3 användare</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                        <div>
                          <span className="font-medium">Coach</span>
                          <p className="text-sm text-muted-foreground">Klienthantering och coaching-funktioner</p>
                        </div>
                        <Badge variant="outline">8 användare</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                        <div>
                          <span className="font-medium">Client</span>
                          <p className="text-sm text-muted-foreground">Grundläggande användarfunktioner</p>
                        </div>
                        <Badge variant="outline">124 användare</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleSaveSecurity}>
                    Spara behörighetsinställningar
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="bg-card rounded-lg border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Automatisering
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Konfigurera automatiska processer och AI-funktioner
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Automatisk datainsamling</h4>
                      <p className="text-sm text-muted-foreground">Samla klientdata automatiskt varje dag</p>
                    </div>
                    <Switch
                      checked={automationSettings.autoDataCollection}
                      onCheckedChange={(checked) => 
                        setAutomationSettings({...automationSettings, autoDataCollection: checked})
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Schemalagda rapporter</h4>
                      <p className="text-sm text-muted-foreground">Generera rapporter automatiskt</p>
                    </div>
                    <Switch
                      checked={automationSettings.scheduledReports}
                      onCheckedChange={(checked) => 
                        setAutomationSettings({...automationSettings, scheduledReports: checked})
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">AI-analys</h4>
                      <p className="text-sm text-muted-foreground">Automatiska insights från AI Coach</p>
                    </div>
                    <Switch
                      checked={automationSettings.aiAnalysis}
                      onCheckedChange={(checked) => 
                        setAutomationSettings({...automationSettings, aiAnalysis: checked})
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Alert-trösklar</h4>
                      <p className="text-sm text-muted-foreground">Automatiska varningar vid viktiga förändringar</p>
                    </div>
                    <Switch
                      checked={automationSettings.alertThresholds}
                      onCheckedChange={(checked) => 
                        setAutomationSettings({...automationSettings, alertThresholds: checked})
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleSaveAutomation}>
                    Spara automationsinställningar
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* GDPR Tab */}
          <TabsContent value="gdpr" className="space-y-6">
            <div className="bg-card rounded-lg border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  GDPR & Datahantering
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Hantera användardata enligt GDPR-regler
                </p>
              </div>
              <div className="p-6">
                <DataRightsCenter />
              </div>
            </div>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="health" className="space-y-6">
            <div className="bg-card rounded-lg border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Systemhälsa
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Övervaka systemets prestanda och integritet
                </p>
              </div>
              <div className="p-6 space-y-6">
                <SystemHealthDashboard />
                <SystemIntegrityPanel />
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}