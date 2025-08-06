/**
 * 🌟 USER GDPR REQUEST FORM 🌟
 * 
 * Användargränssnitt för att skapa GDPR-förfrågningar
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useGDPRRequests } from '@/hooks/useGDPRRequests';
import { 
  Shield, 
  Download, 
  Trash2, 
  ArrowRightLeft, 
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const UserGDPRRequestForm: React.FC = () => {
  const [requestType, setRequestType] = useState<string>('');
  const [reason, setReason] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { requests, createRequest, loading } = useGDPRRequests();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestType) return;

    setIsSubmitting(true);
    try {
      await createRequest(
        requestType as any,
        reason || undefined,
        userMessage || undefined
      );
      
      // Rensa formuläret
      setRequestType('');
      setReason('');
      setUserMessage('');
    } finally {
      setIsSubmitting(false);
    }
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
      case 'data_deletion': return 'Dataradering (Bli bortglömd)';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'under_review': return <AlertCircle className="h-3 w-3" />;
      case 'approved': return <CheckCircle2 className="h-3 w-3" />;
      case 'completed': return <CheckCircle2 className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Väntande';
      case 'under_review': return 'Under granskning';
      case 'approved': return 'Godkänd';
      case 'completed': return 'Genomförd';
      case 'rejected': return 'Avvisad';
      default: return status;
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Mina GDPR-rättigheter</h1>
          <p className="text-muted-foreground">
            Hantera dina personuppgifter enligt GDPR-förordningen
          </p>
        </div>
      </div>

      {/* Skapa ny begäran */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Skapa ny GDPR-begäran
          </CardTitle>
          <CardDescription>
            Begär åtkomst, export, portabilitet eller radering av dina personuppgifter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="request-type">Typ av begäran</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Välj typ av GDPR-begäran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_access">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Dataåtkomst - Se vilka uppgifter som lagras
                    </div>
                  </SelectItem>
                  <SelectItem value="data_export">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Dataexport - Ladda ner mina uppgifter
                    </div>
                  </SelectItem>
                  <SelectItem value="data_portability">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4" />
                      Dataportabilitet - Överför till annan tjänst
                    </div>
                  </SelectItem>
                  <SelectItem value="data_deletion">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Bli bortglömd - Radera alla mina uppgifter
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Anledning (valfritt)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Beskriv varför du gör denna begäran..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="user-message">Meddelande till administratörer (valfritt)</Label>
              <Textarea
                id="user-message"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Ytterligare information eller specifika önskemål..."
                className="mt-1"
                rows={3}
              />
            </div>

            {requestType === 'data_deletion' && (
              <Alert className="border-red-200 bg-red-50">
                <Trash2 className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <strong>Viktigt:</strong> Begäran om dataradering kommer att ta bort alla dina uppgifter permanent. 
                  Denna åtgärd kan inte ångras. Du kommer inte längre att kunna logga in på ditt konto.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={!requestType || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Skickar begäran...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Skicka GDPR-begäran
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mina befintliga begäranden */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mina GDPR-begäranden
          </CardTitle>
          <CardDescription>
            Status för dina tidigare GDPR-begäranden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Du har inga GDPR-begäranden än</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getRequestTypeIcon(request.request_type)}
                      <span className="font-medium">
                        {getRequestTypeLabel(request.request_type)}
                      </span>
                    </div>
                    <Badge variant={getStatusColor(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{getStatusLabel(request.status)}</span>
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Begärd: {new Date(request.requested_at).toLocaleDateString('sv-SE')}</p>
                    {request.reason && (
                      <p><strong>Anledning:</strong> {request.reason}</p>
                    )}
                    {request.user_message && (
                      <p><strong>Meddelande:</strong> {request.user_message}</p>
                    )}
                    {request.admin_notes && (
                      <p><strong>Admin-anteckning:</strong> {request.admin_notes}</p>
                    )}
                    {request.reviewed_at && (
                      <p>Granskad: {new Date(request.reviewed_at).toLocaleDateString('sv-SE')}</p>
                    )}
                    {request.completed_at && (
                      <p>Genomförd: {new Date(request.completed_at).toLocaleDateString('sv-SE')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information om GDPR-rättigheter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dina GDPR-rättigheter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Enligt GDPR har du följande rättigheter:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Rätt till information:</strong> Få veta vilka uppgifter vi behandlar om dig</li>
              <li><strong>Rätt till dataportabilitet:</strong> Få dina uppgifter i ett strukturerat format</li>
              <li><strong>Rätt till rättelse:</strong> Korrigera felaktiga uppgifter</li>
              <li><strong>Rätt till radering:</strong> Begära att dina uppgifter raderas (rätten att bli bortglömd)</li>
              <li><strong>Rätt till begränsning:</strong> Begränsa behandlingen av dina uppgifter</li>
              <li><strong>Rätt att invända:</strong> Motsätta dig behandling av dina uppgifter</li>
            </ul>
          </div>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Alla GDPR-begäranden granskas av våra administratörer inom 30 dagar enligt lag. 
              Du får uppdateringar om statusen för din begäran via denna sida.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};