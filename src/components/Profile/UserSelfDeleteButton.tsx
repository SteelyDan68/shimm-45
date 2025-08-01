import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useGDPR } from '@/hooks/useGDPR';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserSelfDeleteButtonProps {
  className?: string;
}

export const UserSelfDeleteButton = ({ className }: UserSelfDeleteButtonProps) => {
  const { user } = useAuth();
  const { requestDataDeletion } = useGDPR();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeleteRequest = async () => {
    if (!reason.trim()) {
      toast({
        title: "Anledning krävs",
        description: "Du måste ange en anledning för att radera ditt konto",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await requestDataDeletion(reason);
      setIsDialogOpen(false);
      setReason('');
      
      toast({
        title: "Raderingsförfrågan skickad",
        description: "Din förfrågan om att radera ditt konto har skickats till administratörerna för granskning.",
      });
    } catch (error) {
      console.error('Error requesting deletion:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsDialogOpen(true)}
        className={className}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Begär kontoborttagning
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Radera ditt konto
            </DialogTitle>
            <DialogDescription>
              Denna åtgärd kommer att begära permanent radering av ditt konto och all din data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-destructive/10 p-4 rounded-lg">
              <p className="text-sm text-destructive font-medium mb-2">
                ⚠️ Varning: Detta kan inte ångras
              </p>
              <p className="text-sm text-muted-foreground">
                När din data raderas kan du inte återfå åtkomst till ditt konto eller data. 
                All historik, meddelanden och inställningar kommer att försvinna permanent.
              </p>
            </div>

            <div>
              <Label htmlFor="deletion-reason">Anledning till radering *</Label>
              <Textarea
                id="deletion-reason"
                placeholder="Beskriv varför du vill radera ditt konto..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Din förfrågan kommer att granskas av en administratör innan den genomförs.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={loading}
              >
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRequest}
                disabled={loading || !reason.trim()}
              >
                {loading ? 'Skickar...' : 'Skicka förfrågan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};