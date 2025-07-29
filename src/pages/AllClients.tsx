import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ClientForm } from '@/components/ClientForm';
import { ClientList } from '@/components/ClientList';

export const AllClients = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alla Klienter</h1>
          <p className="text-muted-foreground">Hantera och övervaka alla dina klienter</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Avbryt' : 'Lägg till klient'}
        </Button>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Lägg till ny klient</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      )}

      {/* Client List */}
      <ClientList refreshTrigger={refreshTrigger} />
    </div>
  );
};