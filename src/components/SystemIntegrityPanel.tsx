import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Wrench,
  RefreshCw,
  Shield
} from "lucide-react";
import { checkSystemIntegrity, autoFixIntegrityIssues, type SystemIntegrityReport, type IntegrityIssue } from "@/utils/systemIntegrityChecker";
import { useToast } from "@/hooks/use-toast";

export function SystemIntegrityPanel() {
  const { toast } = useToast();
  const [report, setReport] = useState<SystemIntegrityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);

  const runIntegrityCheck = async () => {
    setLoading(true);
    try {
      const result = await checkSystemIntegrity();
      setReport(result);
      
      toast({
        title: "✅ Integritetskontroll slutförd",
        description: result.summary
      });
    } catch (error: any) {
      toast({
        title: "❌ Kontrollen misslyckades",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runAutoFix = async () => {
    if (!report) return;
    
    setFixing(true);
    try {
      const result = await autoFixIntegrityIssues();
      
      if (result.fixed.length > 0) {
        toast({
          title: "🔧 Automatisk reparation slutförd",
          description: `Fixade ${result.fixed.length} problem`
        });
      }
      
      if (result.failed.length > 0) {
        toast({
          title: "⚠️ Vissa problem kunde inte fixas",
          description: `${result.failed.length} problem kräver manuell åtgärd`,
          variant: "destructive"
        });
      }

      // Re-run integrity check
      await runIntegrityCheck();
    } catch (error: any) {
      toast({
        title: "❌ Automatisk reparation misslyckades",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setFixing(false);
    }
  };

  const getIssueIcon = (type: IntegrityIssue['type']) => {
    switch (type) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getIssueVariant = (type: IntegrityIssue['type']) => {
    switch (type) {
      case 'critical': return 'destructive' as const;
      case 'warning': return 'default' as const;
      case 'info': return 'default' as const;
    }
  };

  const getStatusColor = (status: SystemIntegrityReport['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'issues': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Systemintegritet
          </CardTitle>
          <div className="flex gap-2">
            {report && report.issues.some(i => i.action) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={runAutoFix}
                disabled={fixing || loading}
              >
                {fixing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4" />
                )}
                Auto-fix
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={runIntegrityCheck}
              disabled={loading || fixing}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Kontrollera
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!report ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Klicka på "Kontrollera" för att köra integritetskontroll</p>
          </div>
        ) : (
          <>
            {/* Status Summary */}
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <div className={`font-medium ${getStatusColor(report.status)}`}>
                  Status: {report.summary}
                </div>
                {report.status === 'healthy' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {report.status === 'issues' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                {report.status === 'critical' && <XCircle className="h-4 w-4 text-red-500" />}
              </AlertDescription>
            </Alert>

            {/* Issues List */}
            {report.issues.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Funna problem:</h3>
                {report.issues.map((issue, index) => (
                  <Alert key={index} variant={getIssueVariant(issue.type)}>
                    <div className="flex items-start gap-3">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{issue.message}</span>
                          <Badge variant="outline" className="text-xs">
                            {issue.category}
                          </Badge>
                        </div>
                        {issue.action && (
                          <p className="text-sm text-muted-foreground">
                            Åtgärd: {issue.action}
                          </p>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Rekommendationer:</h3>
                {report.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Summary */}
            {report.issues.length === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  🎉 Inga integritetsfel hittades! Systemet är i bra skick.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}