import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, User, Mail, Phone, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { ClientLogicCard } from './ClientLogicCard';


interface Client {
  id: string;
  name: string;
  category: string;
  email?: string;
  phone?: string;
  status: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  youtube_channel?: string;
  notes?: string;
  created_at: string;
}

interface ClientListProps {
  refreshTrigger: number;
}

export const ClientList = ({ refreshTrigger }: ClientListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const fetchClients = async () => {
    if (!user) return;

    try {
      // Use unified client fetching - for now get all clients since coach assignment isn't implemented
      const { fetchUnifiedClients } = await import('@/utils/clientDataConsolidation');
      const unifiedClients = await fetchUnifiedClients();
      
      // Map to expected Client format
      const mappedClients = unifiedClients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email || '',
        category: client.category || 'general',
        status: client.status,
        user_id: client.user_id || user.id, // Temporary: assign to current user
        created_at: client.created_at,
        updated_at: client.created_at
      }));
      
      console.log('Clients loaded (ClientList):', mappedClients.length, mappedClients.map(c => c.name));
      setClients(mappedClients);
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte hämta klienter: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user, refreshTrigger]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'influencer': return 'bg-blue-100 text-blue-800';
      case 'creator': return 'bg-green-100 text-green-800';
      case 'brand': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Laddar klienter...</div>;
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Inga klienter än</h3>
          <p className="text-muted-foreground">Lägg till din första klient för att komma igång.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
                    title="AI-analys"
                  >
                    <Brain className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/client/${client.id}`)}
                    title="Öppna klientprofil"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className={getCategoryColor(client.category)}>
                  {client.category}
                </Badge>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </div>
              )}
              {(client.instagram_handle || client.tiktok_handle || client.youtube_channel) && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Sociala kanaler:</p>
                  <div className="flex flex-wrap gap-1">
                    {client.instagram_handle && (
                      <Badge variant="outline" className="text-xs">IG: @{client.instagram_handle}</Badge>
                    )}
                    {client.tiktok_handle && (
                      <Badge variant="outline" className="text-xs">TT: @{client.tiktok_handle}</Badge>
                    )}
                    {client.youtube_channel && (
                      <Badge variant="outline" className="text-xs">YT: {client.youtube_channel}</Badge>
                    )}
                  </div>
                </div>
              )}
              {client.notes && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">{client.notes}</p>
                </div>
              )}
              <div className="pt-2 text-xs text-muted-foreground">
                Skapad: {new Date(client.created_at).toLocaleDateString('sv-SE')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Logic Analysis Card */}
      {selectedClient && (
        <div className="mt-6">
          <ClientLogicCard 
            clientId={selectedClient} 
            clientName={clients.find(c => c.id === selectedClient)?.name || 'Okänd klient'}
          />
        </div>
      )}
    </div>
  );
};