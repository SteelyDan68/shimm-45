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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Administration</h1>
          <HelpTooltip content="Hantera dina inställningar, användare och kontrollera systemfunktioner. Här hittar du också GDPR-relaterade verktyg." />
        </div>
        <p className="text-muted-foreground mt-2">
          Hantera dina inställningar och kontrollera systemfunktioner
        </p>
      </div>

      

      <Tabs defaultValue="users" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="flex w-full min-w-max gap-1 justify-start">
            <TabsTrigger value="users" className="flex items-center gap-2 min-w-fit px-4">
              <Users className="h-4 w-4" />
              <span>Användare</span>
            </TabsTrigger>
            <TabsTrigger value="stefan-overview" className="flex items-center gap-2 min-w-fit px-4">
              <Bot className="h-4 w-4" />
              <span>Stefan AI</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2 min-w-fit px-4">
              <Shield className="h-4 w-4" />
              <span>Behörigheter</span>
            </TabsTrigger>
            <TabsTrigger value="api-status" className="flex items-center gap-2 min-w-fit px-4">
              <Activity className="h-4 w-4" />
              <span>API Status</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2 min-w-fit px-4">
              <Bot className="h-4 w-4" />
              <span>Automatisering</span>
            </TabsTrigger>
            <TabsTrigger value="gdpr" className="flex items-center gap-2 min-w-fit px-4">
              <Shield className="h-4 w-4" />
              <span>GDPR</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2 min-w-fit px-4">
              <Database className="h-4 w-4" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profilinformation</CardTitle>
              <CardDescription>
                Uppdatera din personliga information och preferenser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">NM</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Ändra avatar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG eller GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Namn</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Tidszon</Label>
                  <Input
                    id="timezone"
                    value={profileData.timezone}
                    onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Språk</Label>
                  <Input
                    id="language"
                    value={profileData.language}
                    onChange={(e) => setProfileData({...profileData, language: e.target.value})}
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile}>
                Spara profil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users">
          <div className="space-y-6">
            <CentralUserManager />
            
            <Card>
              <CardHeader>
                <CardTitle>Five Pillars Management</CardTitle>
                <CardDescription>
                  Hantera och tilldela Five Pillars pelare till klienter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminPillarManagement />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stefan AI Overview Tab */}
        <TabsContent value="stefan-overview">
          <StefanOverviewPanel />
        </TabsContent>

        {/* API Status Tab */}
        <TabsContent value="api-status">
          <EnhancedApiStatusChecker />
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Behörighetshantering</CardTitle>
              <CardDescription>
                Hantera användarroller och åtkomstbehörigheter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                  <h4 className="font-medium mb-3">Rollöversikt</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">Superadmin</span>
                        <p className="text-sm text-muted-foreground">Full systemkontroll</p>
                      </div>
                      <Badge variant="destructive">1 användare</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">Admin</span>
                        <p className="text-sm text-muted-foreground">Användarhantering och systemövervakning</p>
                      </div>
                      <Badge variant="secondary">3 användare</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">Coach</span>
                        <p className="text-sm text-muted-foreground">Klienthantering och coaching-funktioner</p>
                      </div>
                      <Badge variant="outline">8 användare</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">Client</span>
                        <p className="text-sm text-muted-foreground">Grundläggande användarfunktioner</p>
                      </div>
                      <Badge variant="outline">124 användare</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSecurity}>
                Spara behörighetsinställningar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Säkerhet & Integritet</CardTitle>
              <CardDescription>
                Kontrollera din datasäkerhet och integritetsinställningar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Tvåfaktorsautentisering</h4>
                    <p className="text-sm text-muted-foreground">Extra säkerhet för ditt konto</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactor}
                    onCheckedChange={(checked) => 
                      setSecuritySettings({...securitySettings, twoFactor: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Analytiska cookies</h4>
                    <p className="text-sm text-muted-foreground">Hjälp oss förbättra tjänsten</p>
                  </div>
                  <Switch
                    checked={securitySettings.analyticalCookies}
                    onCheckedChange={(checked) => 
                      setSecuritySettings({...securitySettings, analyticalCookies: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Datadelning</h4>
                    <p className="text-sm text-muted-foreground">Dela aggregerad data med partners</p>
                  </div>
                  <Switch
                    checked={securitySettings.dataSharing}
                    onCheckedChange={(checked) => 
                      setSecuritySettings({...securitySettings, dataSharing: checked})
                    }
                  />
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Säkerhetsåtgärder</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleChangePassword}>
                      Ändra lösenord
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleManageSessions}>
                      Hantera sessioner
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">GDPR & Integritet</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ Krypterad datalagring i Sverige</p>
                    <p>✓ Inga cookies utan samtycke</p>
                    <p>✓ Rätt till korrigering och radering</p>
                    <p>✓ Dataportabilitet (export)</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSecurity}>
                Spara säkerhetsinställningar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Automatisering</CardTitle>
              <CardDescription>
                Konfigurera automatiska processer och AI-funktioner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
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

                <div className="flex items-center justify-between">
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

                <div className="flex items-center justify-between">
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

                <div className="flex items-center justify-between">
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

              <Button onClick={handleSaveAutomation}>
                Spara automationsinställningar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Datahantering</CardTitle>
              <CardDescription>
                Hantera din data och få insyn i vad som lagras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-2xl">42</h4>
                  <p className="text-sm text-muted-foreground">Klientprofiler</p>
                  <Badge variant="secondary" className="mt-1">aktiva profiler</Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-2xl">1,247</h4>
                  <p className="text-sm text-muted-foreground">Nyhetsartiklar</p>
                  <Badge variant="secondary" className="mt-1">omnämnanden</Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-2xl">156</h4>
                  <p className="text-sm text-muted-foreground">AI Insights</p>
                  <Badge variant="secondary" className="mt-1">genererade</Badge>
                </div>
              </div>

              <Separator />


              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-medium">Dataåtgärder</h4>
                  <HelpTooltip content={helpTexts.administration.dataExport} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportera all data
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRequestReport}>
                    <FileText className="h-4 w-4 mr-2" />
                    Begär datarapport
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDeleteAllData}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Radera all data
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Datalagring</h4>
                <p className="text-sm text-muted-foreground">
                  All data lagras säkert i Sverige enligt GDPR. Vi sparar bara nödvändig data för att 
                  tillhandahålla tjänsten. Du kan när som helst begära att få se, korrigera eller 
                  radera din data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stefan Training Data Tab */}
        <TabsContent value="stefan-data">
          <StefanTrainingData />
        </TabsContent>

        {/* Stefan Memory Manager Tab */}
        <TabsContent value="stefan-memory">
          <StefanMemoryManager />
        </TabsContent>

        {/* GDPR Tab */}
        <TabsContent value="gdpr">
          <DataRightsCenter />
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health">
          <div className="space-y-6">
            <SystemHealthDashboard />
            <SystemIntegrityPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}