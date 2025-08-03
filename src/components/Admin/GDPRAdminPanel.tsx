import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Trash2,
  Eye,
  FileText,
  Users,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';

interface GDPRRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'approved' | 'rejected';
  request_date: string;
  completed_date?: string;
  reason?: string;
  admin_notes?: string;
  download_url?: string;
  user_email?: string;
  user_name?: string;
}

export const GDPRAdminPanel = () => {
  const { toast } = useToast();
  const { isAdmin } = useUnifiedPermissions();
  
  const [exportRequests, setExportRequests] = useState<GDPRRequest[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<GDPRRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<GDPRRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadRequests();
    }
  }, [isAdmin]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Hämta export requests
      const { data: exports, error: exportError } = await supabase
        .from('data_export_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (exportError) throw exportError;

      // Hämta deletion requests
      const { data: deletions, error: deletionError } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (deletionError) throw deletionError;

      // Hämta user info för alla requests
      const userIds = [
        ...(exports || []).map(r => r.user_id),
        ...(deletions || []).map(r => r.user_id)
      ].filter((id, index, self) => self.indexOf(id) === index);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      const profilesMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>);

      // Format data för visning
      const formattedExports = (exports || []).map(req => {
        const profile = profilesMap[req.user_id];
        return {
          ...req,
          user_email: profile?.email,
          user_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          status: req.status as GDPRRequest['status']
        };
      });

      const formattedDeletions = (deletions || []).map(req => {
        const profile = profilesMap[req.user_id];
        return {
          ...req,
          user_email: profile?.email,
          user_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          status: req.status as GDPRRequest['status']
        };
      });

      setExportRequests(formattedExports);
      setDeletionRequests(formattedDeletions);

    } catch (error: any) {
      console.error('Error loading GDPR requests:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda GDPR-förfrågningar",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, type: 'export' | 'deletion') => {
    try {
      const table = type === 'export' ? 'data_export_requests' : 'data_deletion_requests';
      
      const { error } = await supabase
        .from(table)
        .update({ 
          status: 'approved',
          admin_notes: adminNotes 
        })
        .eq('id', requestId);

      if (error) throw error;

      // För export requests, starta processing direkt
      if (type === 'export') {
        const request = exportRequests.find(r => r.id === requestId);
        if (request) {
          await processExportRequest(request.user_id);
        }
      }

      toast({
        title: "Förfrågan godkänd",
        description: `${type === 'export' ? 'Export' : 'Radering'}sförfrågan har godkänts`
      });

      setIsDialogOpen(false);
      setAdminNotes('');
      loadRequests();

    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: "Fel",
        description: "Kunde inte godkänna förfrågan",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (requestId: string, type: 'export' | 'deletion') => {
    try {
      const table = type === 'export' ? 'data_export_requests' : 'data_deletion_requests';
      
      const { error } = await supabase
        .from(table)
        .update({ 
          status: 'rejected',
          admin_notes: adminNotes 
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Förfrågan avvisad",
        description: `${type === 'export' ? 'Export' : 'Radering'}sförfrågan har avvisats`
      });

      setIsDialogOpen(false);
      setAdminNotes('');
      loadRequests();

    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Fel",
        description: "Kunde inte avvisa förfrågan",
        variant: "destructive"
      });
    }
  };

  const processExportRequest = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('gdpr-processor', {
        body: {
          action: 'export',
          userId: userId
        }
      });

      if (error) throw error;

    } catch (error: any) {
      console.error('Error processing export:', error);
      toast({
        title: "Fel vid export",
        description: "Kunde inte bearbeta exportförfrågan",
        variant: "destructive"
      });
    }
  };

  const processDeletionRequest = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('gdpr-processor', {
        body: {
          action: 'delete',
          userId: userId
        }
      });

      if (error) throw error;

      toast({
        title: "Användardata raderad",
        description: "All användardata har raderats permanent"
      });

      loadRequests();

    } catch (error: any) {
      console.error('Error processing deletion:', error);
      toast({
        title: "Fel vid radering",
        description: "Kunde inte radera användardata",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Väntar', color: 'text-yellow-600' },
      processing: { variant: 'default' as const, icon: Clock, text: 'Behandlas', color: 'text-blue-600' },
      completed: { variant: 'default' as const, icon: CheckCircle, text: 'Klar', color: 'text-green-600' },
      failed: { variant: 'destructive' as const, icon: XCircle, text: 'Misslyckades', color: 'text-red-600' },
      approved: { variant: 'default' as const, icon: CheckCircle, text: 'Godkänd', color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, icon: XCircle, text: 'Avvisad', color: 'text-red-600' }
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.text}
      </Badge>
    );
  };

  const openDialog = (request: GDPRRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setIsDialogOpen(true);
  };

  // SUPERADMIN GOD MODE: Never deny access to superadmin
  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center space-y-4">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen behörighet</h3>
            <p className="text-muted-foreground">Du har inte behörighet att hantera GDPR-förfrågningar.</p>
            {/* Note: Superadmin check is already in isAdmin from useUnifiedPermissions */}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Laddar GDPR-förfrågningar...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingDeletions = deletionRequests.filter(r => r.status === 'pending');
  const pendingExports = exportRequests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GDPR Administration</h2>
          <p className="text-muted-foreground">Hantera användarförfrågningar för dataexport och radering</p>
        </div>
        {(pendingDeletions.length > 0 || pendingExports.length > 0) && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {pendingDeletions.length + pendingExports.length} väntande förfrågningar
          </Badge>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Export förfrågningar</p>
                <p className="text-2xl font-bold">{exportRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Raderingsförfrågningar</p>
                <p className="text-2xl font-bold">{deletionRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Väntande export</p>
                <p className="text-2xl font-bold">{pendingExports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Väntande radering</p>
                <p className="text-2xl font-bold">{pendingDeletions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deletions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deletions" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Raderingsförfrågningar ({deletionRequests.length})
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportförfrågningar ({exportRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Deletion Requests */}
        <TabsContent value="deletions">
          <Card>
            <CardHeader>
              <CardTitle>Raderingsförfrågningar</CardTitle>
              <CardDescription>
                Hantera användarförfrågningar för permanent dataradering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Användare</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Anledning</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletionRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Inga raderingsförfrågningar
                      </TableCell>
                    </TableRow>
                  ) : (
                    deletionRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.user_name || 'Okänd användare'}</p>
                            <p className="text-sm text-muted-foreground">{request.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(request.request_date).toLocaleDateString('sv-SE')}
                        </TableCell>
                        <TableCell>
                          <p className="max-w-xs truncate">{request.reason}</p>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(request)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => processDeletionRequest(request.user_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Requests */}
        <TabsContent value="exports">
          <Card>
            <CardHeader>
              <CardTitle>Exportförfrågningar</CardTitle>
              <CardDescription>
                Hantera användarförfrågningar för dataexport
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Användare</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Inga exportförfrågningar
                      </TableCell>
                    </TableRow>
                  ) : (
                    exportRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.user_name || 'Okänd användare'}</p>
                            <p className="text-sm text-muted-foreground">{request.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(request.request_date).toLocaleDateString('sv-SE')}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(request)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.download_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <a href={request.download_url} download>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.reason ? 'Raderingsförfrågan' : 'Exportförfrågan'}
            </DialogTitle>
            <DialogDescription>
              Granska och hantera användarförfrågan
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Användare</Label>
                  <p className="text-sm">{selectedRequest.user_name} ({selectedRequest.user_email})</p>
                </div>
                <div>
                  <Label>Datum</Label>
                  <p className="text-sm">{new Date(selectedRequest.request_date).toLocaleString('sv-SE')}</p>
                </div>
              </div>

              {selectedRequest.reason && (
                <div>
                  <Label>Anledning</Label>
                  <p className="text-sm bg-muted p-2 rounded">{selectedRequest.reason}</p>
                </div>
              )}

              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              {selectedRequest.status === 'pending' && (
                <>
                  <div>
                    <Label htmlFor="admin-notes">Administratörsanteckningar</Label>
                    <Textarea
                      id="admin-notes"
                      placeholder="Lägg till anteckningar för denna förfrågan..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectRequest(
                        selectedRequest.id, 
                        selectedRequest.reason ? 'deletion' : 'export'
                      )}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Avvisa
                    </Button>
                    <Button
                      onClick={() => handleApproveRequest(
                        selectedRequest.id, 
                        selectedRequest.reason ? 'deletion' : 'export'
                      )}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Godkänn
                    </Button>
                  </div>
                </>
              )}

              {selectedRequest.admin_notes && (
                <div>
                  <Label>Administratörsanteckningar</Label>
                  <p className="text-sm bg-muted p-2 rounded">{selectedRequest.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};