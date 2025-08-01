import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AdvancedUserCreationForm } from './AdvancedUserCreationForm';
import { CentralUserManager } from './CentralUserManager';

export function EnhancedUserManagement() {
  const [isAdvancedFormOpen, setIsAdvancedFormOpen] = useState(false);

  const handleUserCreated = () => {
    setIsAdvancedFormOpen(false);
    // Trigger refresh of user list - this would need to be passed down
  };

  return (
    <div className="space-y-6">
      <CentralUserManager />
      
      <Dialog open={isAdvancedFormOpen} onOpenChange={setIsAdvancedFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AdvancedUserCreationForm
            onUserCreated={handleUserCreated}
            onCancel={() => setIsAdvancedFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}