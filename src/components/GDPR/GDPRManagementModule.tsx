import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { deleteUserCompletely } from '@/utils/userDeletion';
import { 
  Trash2, 
  AlertTriangle, 
  Shield, 
  FileX, 
  UserX,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';

interface GDPRDeleteRequest {
  id: string;
  user_email: string;
  reason: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'completed';
}

export const GDPRManagementModule: React.FC = () => {
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [pendingRequests] = useState<GDPRDeleteRequest[]>([]);
  
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  
  const isSuperAdmin = user && hasRole('superadmin');

  if (!isSuperAdmin) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Åtkomst nekad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Endast superadmins har tillgång till GDPR-hanteringsmodulen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleGDPRDeletion = async () => {
    if (!selectedUserEmail.trim()) {
      toast({
        title: "Fel",
        description: "E-postadress krävs",
        variant: "destructive"
      });
      return;
    }

    if (!deletionReason.trim()) {
      toast({
        title: "Fel", 
        description: "Anledning för radering krävs",
        variant: "destructive"
      });
      return;
    }

    if (confirmationText !== 'GDPR DELETE') {
      toast({
        title: "Fel",
        description: "Du måste skriva 'GDPR DELETE' för att bekräfta",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await deleteUserCompletely(selectedUserEmail);
      
      if (result.errors && result.errors.length > 0) {
        toast({
          title: "Delvis fel vid GDPR-radering",
          description: `Vissa data kunde inte tas bort: ${result.errors.join(', ')}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "GDPR-radering genomförd",
          description: `Användaren ${selectedUserEmail} har raderats fullständigt enligt GDPR`,
        });
      }
      
      // Reset form
      setSelectedUserEmail('');
      setDeletionReason('');
      setConfirmationText('');
      
    } catch (error: any) {
      console.error('GDPR deletion error:', error);
      toast({
        title: "GDPR-radering misslyckades",
        description: error.message || "Ett fel uppstod vid raderingen",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-red-600">GDPR-hantering</h1>
          <p className="text-muted-foreground">
            Fullständig dataradering enligt GDPR-förordningen
          </p>
        </div>
      </div>

      {/* Direct Stefan Deletion */}
      <Card className="border-orange-200">
        <CardHeader className="bg-orange-50">
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <UserX className="h-5 w-5" />
            Direktradering: Stefan Hallgren
          </CardTitle>
          <CardDescription className="text-orange-600">
            Manuell radering av stefan.hallgren@happyminds.com för testning.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button
            onClick={async () => {
              try {
                setIsProcessing(true);
                const result = await deleteUserCompletely('stefan.hallgren@happyminds.com');
                
                if (result.errors && result.errors.length > 0) {
                  toast({
                    title: "Radering delvis misslyckades",
                    description: `${result.errors.join(', ')}`,
                    variant: "destructive"
                  });
                } else if (result.user_found) {
                  toast({
                    title: "Stefan Hallgren raderad",
                    description: "Användaren har raderats fullständigt från systemet",
                  });
                } else {
                  toast({
                    title: "Användaren kunde inte hittas",
                    description: "Stefan Hallgren fanns inte i systemet",
                    variant: "destructive"
                  });
                }
              } catch (error: any) {
                console.error('Direct deletion error:', error);
                toast({
                  title: "Radering misslyckades",
                  description: error.message,
                  variant: "destructive"
                });
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
            variant="destructive"
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Raderar Stefan...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Radera Stefan Hallgren fullständigt
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* GDPR Deletion Section */}
      <Card className="border-red-200">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <FileX className="h-5 w-5" />
            Fullständig GDPR-radering
          </CardTitle>
          <CardDescription className="text-red-600">
            Denna åtgärd raderar ALLA användardata permanent och kan INTE ångras.
            Använd endast när GDPR kräver fullständig dataradering.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>VARNING:</strong> Detta raderar användaren och ALL relaterad data permanent från databasen.
              Användaren kommer inte längre att kunna logga in och all historik försvinner.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="user-email" className="text-sm font-medium">
                Användarens e-postadress
              </Label>
              <Input
                id="user-email"
                type="email"
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                placeholder="användare@exempel.se"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="deletion-reason" className="text-sm font-medium">
                GDPR-anledning för radering
              </Label>
              <Textarea
                id="deletion-reason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Beskriv varför fullständig GDPR-radering krävs..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <Label htmlFor="confirmation" className="text-sm font-medium text-red-700">
                Bekräftelse - Skriv exakt: <strong>GDPR DELETE</strong>
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Skriv 'GDPR DELETE' här"
                className="mt-2 border-red-300 focus:border-red-500"
              />
            </div>

            <Button
              onClick={handleGDPRDeletion}
              disabled={isProcessing || !selectedUserEmail || !deletionReason || confirmationText !== 'GDPR DELETE'}
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
                  Genomför fullständig GDPR-radering
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending GDPR Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Väntande GDPR-förfrågningar
            </CardTitle>
            <CardDescription>
              Förfrågningar som inväntar godkännande för fullständig radering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{request.user_email}</p>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Begärd: {new Date(request.requested_at).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      variant={
                        request.status === 'pending' ? 'secondary' :
                        request.status === 'approved' ? 'default' : 'outline'
                      }
                    >
                      {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {request.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {request.status === 'completed' && <UserX className="h-3 w-3 mr-1" />}
                      {request.status === 'pending' ? 'Väntande' :
                       request.status === 'approved' ? 'Godkänd' : 'Genomförd'}
                    </Badge>
                    {request.status === 'pending' && (
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Granska
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            GDPR-information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Fullständig radering innebär:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Radering från alla databastabeller</li>
              <li>Radering från autentiseringssystemet</li>
              <li>Alla meddelanden och interaktioner</li>
              <li>Alla assessments och data</li>
              <li>Coaching-sessioner och rekommendationer</li>
              <li>GDPR audit logs skapas</li>
            </ul>
          </div>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Denna modul är endast för superadmins och används när GDPR kräver fullständig dataradering.
              För vanlig användarhantering, använd soft delete-funktionen i användaradministrationen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};