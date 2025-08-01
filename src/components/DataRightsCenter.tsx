import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Trash2, 
  Shield, 
  Eye, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useGDPR } from '@/hooks/useGDPR';
import { useToast } from '@/hooks/use-toast';
import { UserSelfDeleteButton } from '@/components/Profile/UserSelfDeleteButton';

export const DataRightsCenter = () => {
  const { 
    requestDataExport, 
    requestDataDeletion, 
    getExportRequests, 
    getDeletionRequests, 
    getConsentRecords,
    getAuditLogs,
    loading 
  } = useGDPR();
  const { toast } = useToast();

  const [exportRequests, setExportRequests] = useState<any[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]);
  const [consentRecords, setConsentRecords] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [deletionReason, setDeletionReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [exports, deletions, consents, audits] = await Promise.all([
      getExportRequests(),
      getDeletionRequests(),
      getConsentRecords(),
      getAuditLogs()
    ]);
    
    setExportRequests(exports);
    setDeletionRequests(deletions);
    setConsentRecords(consents);
    setAuditLogs(audits);
  };

  const handleExportRequest = async () => {
    await requestDataExport();
    loadData();
  };

  const handleDeletionRequest = async () => {
    if (!deletionReason.trim()) {
      toast({
        title: "Anledning krävs",
        description: "Du måste ange en anledning för att radera dina data",
        variant: "destructive"
      });
      return;
    }
    
    await requestDataDeletion(deletionReason);
    setDeletionReason('');
    loadData();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; text: string }> = {
      pending: { variant: 'secondary', icon: Clock, text: 'Väntar' },
      processing: { variant: 'default', icon: Clock, text: 'Behandlas' },
      completed: { variant: 'default', icon: CheckCircle, text: 'Klar' },
      failed: { variant: 'destructive', icon: XCircle, text: 'Misslyckades' },
      approved: { variant: 'default', icon: CheckCircle, text: 'Godkänd' },
      rejected: { variant: 'destructive', icon: XCircle, text: 'Avvisad' }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Datarättigheter</h2>
        <p className="text-muted-foreground">
          Hantera dina datarättigheter enligt GDPR
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Översikt
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="deletion" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Radering
          </TabsTrigger>
          <TabsTrigger value="consent" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Samtycken
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Aktivitetslogg
          </TabsTrigger>
        </TabsList>

        {/* Översikt */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Rätt till tillgång
                </CardTitle>
                <CardDescription>
                  Se vilken data vi har om dig
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Du har rätt att få en kopia av all personlig data vi har lagrad om dig.
                </p>
                <Button onClick={handleExportRequest} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Begär dataexport
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Rätt att bli bortglömd
                </CardTitle>
                <CardDescription>
                  Begär att vi raderar dina data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Du kan begära att vi raderar all din personliga data från våra system.
                </p>
                <UserSelfDeleteButton />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Samtycken
                </CardTitle>
                <CardDescription>
                  Hantera dina samtycken
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Aktiva samtycken: {consentRecords.filter(c => c.consent_given).length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Totalt: {consentRecords.length} samtycken registrerade
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Aktivitetslogg
                </CardTitle>
                <CardDescription>
                  Se din datanvändningshistorik
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Senaste aktiviteter: {auditLogs.length} poster
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Export */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Dataexport</CardTitle>
              <CardDescription>
                Begär och hantera dina dataexporter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Begär ny export</h4>
                  <p className="text-sm text-muted-foreground">
                    Exportera all din data i JSON-format
                  </p>
                </div>
                <Button onClick={handleExportRequest} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Begär export
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Dina exportförfrågningar</h4>
                <div className="space-y-2">
                  {exportRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Inga exportförfrågningar än
                    </p>
                  ) : (
                    exportRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(request.request_date).toLocaleDateString('sv-SE')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.error_message || 'Export av användardata'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          {request.download_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={request.download_url} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Radering */}
        <TabsContent value="deletion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Dataradering
              </CardTitle>
              <CardDescription>
                Begär permanent radering av dina data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 p-4 rounded-lg">
                <p className="text-sm text-destructive font-medium mb-2">
                  ⚠️ Varning: Detta kan inte ångras
                </p>
                <p className="text-sm text-muted-foreground">
                  När din data raderas kan du inte återfå åtkomst till ditt konto eller data. 
                  All historik, meddelanden och inställningar kommer att försvinna permanent.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deletion-reason">Anledning till radering</Label>
                <Textarea
                  id="deletion-reason"
                  placeholder="Beskriv varför du vill radera din data..."
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                />
              </div>

              <Button 
                variant="destructive" 
                onClick={handleDeletionRequest} 
                disabled={loading || !deletionReason.trim()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Begär dataradering
              </Button>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Dina raderingsförfrågningar</h4>
                <div className="space-y-2">
                  {deletionRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Inga raderingsförfrågningar än
                    </p>
                  ) : (
                    deletionRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(request.request_date).toLocaleDateString('sv-SE')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.reason}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Samtycken */}
        <TabsContent value="consent">
          <Card>
            <CardHeader>
              <CardTitle>Samtyckeshistorik</CardTitle>
              <CardDescription>
                Se alla dina registrerade samtycken
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {consentRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Inga samtycken registrerade än
                  </p>
                ) : (
                  consentRecords.map((consent) => (
                    <div key={consent.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {consent.consent_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(consent.consent_timestamp).toLocaleDateString('sv-SE')} via {consent.consent_source}
                        </p>
                      </div>
                      <Badge variant={consent.consent_given ? 'default' : 'secondary'}>
                        {consent.consent_given ? 'Godkänt' : 'Avvisat'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aktivitetslogg */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitetslogg</CardTitle>
              <CardDescription>
                Dina GDPR-relaterade aktiviteter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Inga aktiviteter att visa
                  </p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {log.action.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString('sv-SE')}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {JSON.stringify(log.details, null, 2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};