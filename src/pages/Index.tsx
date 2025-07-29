import { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { AuthForm } from '@/components/AuthForm';
import { ClientForm } from '@/components/ClientForm';
import { ClientList } from '@/components/ClientList';
import { Button } from '@/components/ui/button';
import { LogOut, Plus } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Influencer Management System</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Inloggad som: {user.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold">Mina Klienter</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Avbryt' : 'Lägg till klient'}
          </Button>
        </div>

        {showForm && (
          <div className="mb-8">
            <ClientForm onSuccess={handleSuccess} />
          </div>
        )}

        <ClientList refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
};

export default Index;
