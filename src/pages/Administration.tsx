import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
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
  FileText
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export function Administration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: "Ninetone Management",
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

  const handleSaveAutomation = () => {
    toast({
      title: "Automationsinställningar sparade", 
      description: "Dina automationsinställningar har uppdaterats."
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground mt-2">
          Hantera dina inställningar och kontrollera systemfunktioner
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Säkerhet</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Automatisering</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

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
                    <Button variant="outline" size="sm">
                      Ändra lösenord
                    </Button>
                    <Button variant="outline" size="sm">
                      Hantera sessioner
                    </Button>
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
                <h4 className="font-medium mb-3">Dataåtgärder</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportera all data
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Begär datarapport
                  </Button>
                  <Button variant="destructive" size="sm">
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
      </Tabs>
    </div>
  );
}