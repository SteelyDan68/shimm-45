import { Outlet } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { Card } from '@/components/ui/card';

// Clean AdminHubLayout - removes redundant sidebar and floating elements
// Uses main AppSidebar navigation and TopNavigation for consistency

export function AdminHubLayout() {
  const { canManageUsers } = usePermissions();

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Åtkomst nekad</h2>
          <p className="text-muted-foreground">
            Du har inte behörighet att komma åt Admin Hub.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}