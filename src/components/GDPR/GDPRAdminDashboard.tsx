/**
 * 🌟 ENTERPRISE GDPR ADMIN DASHBOARD 🌟
 * 
 * Komplett administrationsmodul för GDPR-hantering
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGDPRRequests, type GDPRRequest } from '@/hooks/useGDPRRequests';
import { deleteUserCompletely } from '@/utils/userDeletion';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Download, 
  Trash2, 
  ArrowRightLeft, 
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
  BellRing,
  User,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';

export const GDPRAdminDashboard: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<GDPRRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  const { 
    requests, 
    notifications, 
    updateRequestStatus, 
    markNotificationRead,
    refreshRequests,
    refreshNotifications,
    unreadNotificationCount,
    loading 
  } = useGDPRRequests();
  
  const { toast } = useToast();

  // Filtrerade requests
  const filteredRequests = requests.filter(request => {
    const statusMatch = filterStatus === 'all' || request.status === filterStatus;
    const typeMatch = filterType === 'all' || request.request_type === filterType;
    return statusMatch && typeMatch;
  });

  // Gruppera requests efter status för statistik
  const requestStats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    under_review: requests.filter(r => r.status === 'under_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'data_export': return <Download className="h-4 w-4" />;
      case 'data_deletion': return <Trash2 className="h-4 w-4" />;
      case 'data_portability': return <ArrowRightLeft className="h-4 w-4" />;
      case 'data_access': return <Eye className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'data_export': return 'Dataexport';
      case 'data_deletion': return 'Dataradering';
      case 'data_portability': return 'Dataportabilitet';
      case 'data_access': return 'Dataåtkomst';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'under_review': return 'default';
      case 'approved': return 'outline';
      case 'completed': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: GDPRRequest['status']) => {
    setIsProcessing(true);
    try {
      await updateRequestStatus(requestId, newStatus, adminNotes || undefined);
      setAdminNotes('');
      setSelectedRequest(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataDeletion = async (request: GDPRRequest) => {
    if (request.request_type !== 'data_deletion' || !request.user_email) {
      toast({
        title: "Fel",
        description: "Endast dataraderings-begäranden kan genomföras automatiskt",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Genomför dataradering med user_id istället för email
      const result = await deleteUserCompletely(request.user_id);
      
      if (result.user_found) {
        // Uppdatera request som genomförd
        await updateRequestStatus(request.id, 'completed', 
          `Dataradering genomförd automatiskt. ${result.errors?.length ? `Fel: ${result.errors.join(', ')}` : 'Alla data raderade framgångsrikt.'}`
        );
        
        toast({
          title: "Dataradering genomförd",
          description: `Användaren har raderats fullständigt från systemet`,
        });
        
        // Force refresh of ALL data sources
        await Promise.all([
          refreshRequests(),
          refreshNotifications(),
          // Trigger global user data refresh
          window.dispatchEvent(new CustomEvent('userDataChanged'))
        ]);
        
        setSelectedRequest(null);
      } else {
        toast({
          title: "Användaren kunde inte hittas",
          description: "Användaren finns inte längre i systemet",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('GDPR deletion error:', error);
      toast({
        title: "Fel vid dataradering",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotificationClick = (notification: any) => {
    markNotificationRead(notification.id);
    if (notification.request) {
      setSelectedRequest(notification.request);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">GDPR Administrationsmodul</h1>
            <p className="text-muted-foreground">
              Hantera GDPR-förfrågningar och användarrättigheter
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
          {unreadNotificationCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <BellRing className="h-3 w-3" />
              {unreadNotificationCount}
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Översikt</TabsTrigger>
          <TabsTrigger value="requests">Alla Begäranden</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifikationer
            {unreadNotificationCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {unreadNotificationCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="manual">Manuell Radering</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Statistik */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{requestStats.total}</div>
                <div className="text-sm text-muted-foreground">Totalt</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{requestStats.pending}</div>
                <div className="text-sm text-muted-foreground">Väntande</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{requestStats.under_review}</div>
                <div className="text-sm text-muted-foreground">Granskas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{requestStats.approved}</div>
                <div className="text-sm text-muted-foreground">Godkända</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{requestStats.completed}</div>
                <div className="text-sm text-muted-foreground">Genomförda</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{requestStats.rejected}</div>
                <div className="text-sm text-muted-foreground">Avvisade</div>
              </CardContent>
            </Card>
          </div>

          {/* Senaste begäranden */}
          <Card>
            <CardHeader>
              <CardTitle>Senaste GDPR-begäranden</CardTitle>
              <CardDescription>De 5 senaste begärandena som kräver uppmärksamhet</CardDescription>
            </CardHeader>
            <CardContent>
              {requests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                  <div className="flex items-center gap-3">
                    {getRequestTypeIcon(request.request_type)}
                    <div>
                      <p className="font-medium">{request.user_email}</p>
                      <p className="text-sm text-muted-foreground">
                        {getRequestTypeLabel(request.request_type)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                    <Badge variant={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          Hantera
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>GDPR-begäran från {request.user_email}</DialogTitle>
                          <DialogDescription>
                            {getRequestTypeLabel(request.request_type)} - {request.status}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedRequest && (
                          <RequestDetailView 
                            request={selectedRequest}
                            onStatusUpdate={handleStatusUpdate}
                            onDataDeletion={handleDataDeletion}
                            adminNotes={adminNotes}
                            setAdminNotes={setAdminNotes}
                            isProcessing={isProcessing}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alla Begäranden Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrera efter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla statusar</SelectItem>
                      <SelectItem value="pending">Väntande</SelectItem>
                      <SelectItem value="under_review">Under granskning</SelectItem>
                      <SelectItem value="approved">Godkända</SelectItem>
                      <SelectItem value="completed">Genomförda</SelectItem>
                      <SelectItem value="rejected">Avvisade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrera efter typ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla typer</SelectItem>
                      <SelectItem value="data_access">Dataåtkomst</SelectItem>
                      <SelectItem value="data_export">Dataexport</SelectItem>
                      <SelectItem value="data_portability">Dataportabilitet</SelectItem>
                      <SelectItem value="data_deletion">Dataradering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Begäranden lista */}
          <Card>
            <CardHeader>
              <CardTitle>Alla GDPR-begäranden ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getRequestTypeIcon(request.request_type)}
                        <div>
                          <p className="font-medium">{request.user_email}</p>
                          <p className="text-sm text-muted-foreground">
                            {getRequestTypeLabel(request.request_type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              Visa detaljer
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>GDPR-begäran från {request.user_email}</DialogTitle>
                              <DialogDescription>
                                {getRequestTypeLabel(request.request_type)} - {request.status}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedRequest && (
                              <RequestDetailView 
                                request={selectedRequest}
                                onStatusUpdate={handleStatusUpdate}
                                onDataDeletion={handleDataDeletion}
                                adminNotes={adminNotes}
                                setAdminNotes={setAdminNotes}
                                isProcessing={isProcessing}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Begärd: {new Date(request.requested_at).toLocaleDateString('sv-SE')}</p>
                      {request.reason && <p><strong>Anledning:</strong> {request.reason}</p>}
                      {request.user_message && <p><strong>Meddelande:</strong> {request.user_message}</p>}
                    </div>
                  </div>
                ))}
                
                {filteredRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Inga begäranden matchar filtren</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifikationer Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                GDPR-notifikationer ({notifications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BellRing className="h-4 w-4" />
                        <span className="font-medium">{notification.message}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        {!notification.is_read && (
                          <Badge variant="default">Ny</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString('sv-SE')} {new Date(notification.created_at).toLocaleTimeString('sv-SE')}
                    </p>
                  </div>
                ))}
                
                {notifications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Inga notifikationer</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manuell Radering Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Trash2 className="h-5 w-5" />
                Manuell GDPR-dataradering
              </CardTitle>
              <CardDescription className="text-red-600">
                Genomför fullständig dataradering för specifika användare. Använd med försiktighet.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ManualDeletionForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Komponent för detaljerad vy av request
const RequestDetailView: React.FC<{
  request: GDPRRequest;
  onStatusUpdate: (id: string, status: GDPRRequest['status']) => Promise<void>;
  onDataDeletion: (request: GDPRRequest) => Promise<void>;
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  isProcessing: boolean;
}> = ({ request, onStatusUpdate, onDataDeletion, adminNotes, setAdminNotes, isProcessing }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong>Användare:</strong> {request.user_email}
        </div>
        <div>
          <strong>Typ:</strong> {request.request_type}
        </div>
        <div>
          <strong>Status:</strong> {request.status}
        </div>
        <div>
          <strong>Prioritet:</strong> {request.priority}
        </div>
        <div>
          <strong>Begärd:</strong> {new Date(request.requested_at).toLocaleDateString('sv-SE')}
        </div>
        {request.reviewed_at && (
          <div>
            <strong>Granskad:</strong> {new Date(request.reviewed_at).toLocaleDateString('sv-SE')}
          </div>
        )}
      </div>

      {request.reason && (
        <div>
          <strong>Anledning:</strong>
          <p className="mt-1 text-sm text-muted-foreground">{request.reason}</p>
        </div>
      )}

      {request.user_message && (
        <div>
          <strong>Användarmeddelande:</strong>
          <p className="mt-1 text-sm text-muted-foreground">{request.user_message}</p>
        </div>
      )}

      {request.admin_notes && (
        <div>
          <strong>Admin-anteckningar:</strong>
          <p className="mt-1 text-sm text-muted-foreground">{request.admin_notes}</p>
        </div>
      )}

      <div>
        <strong>Admin-anteckningar:</strong>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Lägg till anteckningar..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {request.status === 'pending' && (
          <>
            <Button
              variant="outline"
              onClick={() => onStatusUpdate(request.id, 'under_review')}
              disabled={isProcessing}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Börja granska
            </Button>
            <Button
              variant="destructive"
              onClick={() => onStatusUpdate(request.id, 'rejected')}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Avvisa
            </Button>
          </>
        )}

        {request.status === 'under_review' && (
          <>
            <Button
              variant="default"
              onClick={() => onStatusUpdate(request.id, 'approved')}
              disabled={isProcessing}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Godkänn
            </Button>
            <Button
              variant="destructive"
              onClick={() => onStatusUpdate(request.id, 'rejected')}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Avvisa
            </Button>
          </>
        )}

        {request.status === 'approved' && (
          <>
            <Button
              variant="default"
              onClick={() => onStatusUpdate(request.id, 'completed')}
              disabled={isProcessing}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Markera som genomförd
            </Button>
            {request.request_type === 'data_deletion' && (
              <Button
                variant="destructive"
                onClick={() => onDataDeletion(request)}
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Genomför dataradering
              </Button>
            )}
          </>
        )}
      </div>

      {request.request_type === 'data_deletion' && request.status === 'approved' && (
        <Alert className="border-red-200 bg-red-50">
          <Trash2 className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Varning:</strong> Automatisk dataradering kommer att ta bort alla användarens data permanent.
            Denna åtgärd kan inte ångras.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Komponent för manuell radering
const ManualDeletionForm: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();

  const handleManualDeletion = async () => {
    if (!userEmail.trim() || !deletionReason.trim() || confirmationText !== 'GDPR DELETE') {
      toast({
        title: "Ofullständiga uppgifter",
        description: "Alla fält måste fyllas i korrekt",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await deleteUserCompletely(userEmail);
      
      if (result.user_found) {
        toast({
          title: "Användaren raderad",
          description: `${userEmail} har raderats fullständigt från systemet`,
        });
        setUserEmail('');
        setDeletionReason('');
        setConfirmationText('');
      } else {
        toast({
          title: "Användaren kunde inte hittas",
          description: `Ingen användare med e-post ${userEmail} hittades`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Fel vid radering",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          <strong>VARNING:</strong> Denna funktion raderar användaren och ALL relaterad data permanent.
          Använd endast när det krävs för GDPR-efterlevnad.
        </AlertDescription>
      </Alert>

      <div>
        <label className="text-sm font-medium">Användarens e-postadress</label>
        <input
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="användare@exempel.se"
          className="w-full mt-1 px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="text-sm font-medium">GDPR-anledning för radering</label>
        <Textarea
          value={deletionReason}
          onChange={(e) => setDeletionReason(e.target.value)}
          placeholder="Beskriv varför manuell GDPR-radering krävs..."
          rows={3}
        />
      </div>

      <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
        <label className="text-sm font-medium text-red-700">
          Bekräftelse - Skriv exakt: <strong>GDPR DELETE</strong>
        </label>
        <input
          type="text"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder="Skriv 'GDPR DELETE' här"
          className="w-full mt-2 px-3 py-2 border border-red-300 rounded-md focus:border-red-500"
        />
      </div>

      <Button
        onClick={handleManualDeletion}
        disabled={isProcessing || !userEmail || !deletionReason || confirmationText !== 'GDPR DELETE'}
        variant="destructive"
        className="w-full bg-red-600 hover:bg-red-700"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            GDPR-radering pågår...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            Genomför manuell GDPR-radering
          </>
        )}
      </Button>
    </div>
  );
};