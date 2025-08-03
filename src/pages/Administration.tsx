import { useState } from "react";
import { useAuth } from "@/providers/UnifiedAuthProvider";
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
import { PRDDashboard } from '@/components/Admin/PRDDashboard';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserManagementTabs } from "@/components/UserAdministration/UserManagementTabs";
import { AssessmentManager } from "@/components/AssessmentEngine/AssessmentManager";
import { AdminPillarManagement } from "@/components/AdminPillarManagement";
import { SystemHealthDashboard } from "@/components/SystemHealthDashboard";
import { SystemIntegrityPanel } from "@/components/SystemIntegrityPanel";
import { IntegratedAdminDashboard } from "@/components/Admin/IntegratedAdminDashboard";

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
  const [automationSettings, setAutomationSettings] = useState({
    autoDataCollection: true,
    scheduledReports: false,
    aiAnalysis: true,
    alertThresholds: false
  });


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
                   <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
                   <p className="text-sm text-muted-foreground">
                     Användarhantering och systemkonfiguration
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
        <Tabs defaultValue="dashboard" className="space-y-8">
          {/* Navigation Tabs */}
          <div className="bg-card rounded-lg border p-1 mb-8">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-1">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-4 py-2"
              >
                <Activity className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
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
                value="api-status" 
                className="flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-4 py-2"
              >
                <Activity className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Systemhälsa</span>
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
                value="prd" 
                className="flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-4 py-2"
              >
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">PRD System</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Integrated Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-12">
            <IntegratedAdminDashboard onNavigateToTab={(tab) => {
              // Navigera till angiven tab programmatiskt
              const tabTrigger = document.querySelector(`[value="${tab}"]`) as HTMLElement;
              tabTrigger?.click();
            }} />
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6 mt-12">
            <div className="bg-card rounded-lg border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Användarhantering
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hantera användare, skapa nya och tilldela roller
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <UserManagementTabs />
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
          <TabsContent value="stefan-overview" className="space-y-6 mt-12">
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

          {/* System Health Tab */}
          <TabsContent value="api-status" className="space-y-6 mt-12">
            <div className="bg-card rounded-lg border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Systemhälsa & Övervakning
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Övervaka systemets hälsa, API:er och integritet
                </p>
              </div>
              <div className="p-6 space-y-6">
                <EnhancedApiStatusChecker />
                <Separator />
                <SystemHealthDashboard />
                <Separator />
                <SystemIntegrityPanel />
              </div>
            </div>
          </TabsContent>


          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6 mt-12">
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
          <TabsContent value="gdpr" className="space-y-6 mt-12">
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

          {/* PRD SYSTEM TAB - ENDAST för superadmin och admin */}
          <TabsContent value="prd" className="space-y-6 mt-12">
            <PRDDashboard />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}