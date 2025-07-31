import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Shield, 
  Users,
  RefreshCw,
  Settings
} from "lucide-react";
import { runSystemDiagnosis, quickHealthCheck, type SystemDiagnosisResult } from "@/utils/systemDiagnosis";
import { useToast } from "@/hooks/use-toast";

export function SystemHealthDashboard() {
  const { toast } = useToast();
  const [diagnosis, setDiagnosis] = useState<SystemDiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runDiagnosis = async () => {
    setLoading(true);
    try {
      console.log('🔍 Running system diagnosis...');
      const result = await runSystemDiagnosis();
      setDiagnosis(result);
      setLastCheck(new Date());
      
      const criticalIssues = result.database.errors.length + result.authentication.errors.length + result.permissions.errors.length;
      
      if (criticalIssues === 0) {
        toast({
          title: "✅ System Health Check",
          description: "All core systems are operational"
        });
      } else {
        toast({
          title: "⚠️ System Issues Detected", 
          description: `Found ${criticalIssues} issues requiring attention`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Diagnosis Failed",
        description: `Could not complete system check: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run diagnosis on component mount
    runDiagnosis();
  }, []);

  const getStatusIcon = (hasErrors: boolean, isWorking: boolean = true) => {
    if (hasErrors) return <XCircle className="h-5 w-5 text-red-500" />;
    if (isWorking) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (hasErrors: boolean, isWorking: boolean = true) => {
    if (hasErrors) return <Badge variant="destructive">Fel</Badge>;
    if (isWorking) return <Badge variant="default" className="bg-green-500">OK</Badge>;
    return <Badge variant="secondary">Varning</Badge>;
  };

  if (!diagnosis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Systemhälsa
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Kontrollerar systemhälsa...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Systemhälsa Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastCheck && (
                <span className="text-sm text-muted-foreground">
                  Senast kontrollerad: {lastCheck.toLocaleTimeString('sv-SE')}
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runDiagnosis}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Uppdatera
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Database Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Databas
                  {getStatusIcon(diagnosis.database.errors.length > 0, diagnosis.database.connected)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  {getStatusBadge(diagnosis.database.errors.length > 0, diagnosis.database.connected)}
                </div>
                <div className="text-sm">
                  <p>Tabeller: {diagnosis.database.tables.length}</p>
                  <p>Användare: {diagnosis.database.profiles_count}</p>
                  <p>Roller: {diagnosis.database.roles_count}</p>
                </div>
                {diagnosis.database.errors.length > 0 && (
                  <div className="text-xs text-red-600 space-y-1">
                    {diagnosis.database.errors.map((error, i) => (
                      <p key={i}>• {error}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Authentication Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Autentisering
                  {getStatusIcon(diagnosis.authentication.errors.length > 0, diagnosis.authentication.working)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  {getStatusBadge(diagnosis.authentication.errors.length > 0, diagnosis.authentication.working)}
                </div>
                <div className="text-sm">
                  <p>Session: {diagnosis.authentication.session_valid ? 'Aktiv' : 'Inaktiv'}</p>
                  {diagnosis.authentication.current_user && (
                    <p className="truncate">
                      Användare: {diagnosis.authentication.current_user.email}
                    </p>
                  )}
                </div>
                {diagnosis.authentication.errors.length > 0 && (
                  <div className="text-xs text-red-600 space-y-1">
                    {diagnosis.authentication.errors.map((error, i) => (
                      <p key={i}>• {error}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Permissions Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Behörigheter
                  {getStatusIcon(diagnosis.permissions.errors.length > 0, diagnosis.permissions.role_system_working)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  {getStatusBadge(diagnosis.permissions.errors.length > 0, diagnosis.permissions.role_system_working)}
                </div>
                <div className="text-sm">
                  <p>Rollsystem: {diagnosis.permissions.role_system_working ? 'Aktivt' : 'Inaktivt'}</p>
                  <p>Superadmin: {diagnosis.permissions.superadmin_exists ? 'Finns' : 'Saknas'}</p>
                  <p>Användarroller: {diagnosis.permissions.user_has_roles ? 'Tilldelade' : 'Saknas'}</p>
                </div>
                {diagnosis.permissions.errors.length > 0 && (
                  <div className="text-xs text-red-600 space-y-1">
                    {diagnosis.permissions.errors.map((error, i) => (
                      <p key={i}>• {error}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {diagnosis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Rekommendationer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {diagnosis.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Health */}
      <Card>
        <CardHeader>
          <CardTitle>Komponenthälsa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <span className="text-sm">Användarhanterare:</span>
              {getStatusBadge(false, diagnosis.components.user_manager_loading)}
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <span className="text-sm">Admin verktyg:</span>
              {getStatusBadge(false, diagnosis.components.admin_creation_working)}
            </div>
          </div>
          {diagnosis.components.critical_errors.length > 0 && (
            <div className="mt-4 text-sm text-red-600 space-y-1">
              <p className="font-medium">Kritiska komponentfel:</p>
              {diagnosis.components.critical_errors.map((error, i) => (
                <p key={i}>• {error}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}