import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Settings, 
  Users, 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Search,
  XCircle,
  Target,
  Activity
} from 'lucide-react';
import { PILLAR_MODULES, PILLAR_PRIORITY_ORDER } from '@/config/pillarModules';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFivePillarsModular } from '@/hooks/useFivePillarsModular';
import { useUnifiedClients } from '@/hooks/useUnifiedClients';

interface Client {
  id: string;
  name: string;
  email: string;
  category: string;
  status: string;
}

interface PillarActivation {
  pillar_key: string;
  is_active: boolean;
  activated_at: string;
}

export const AdminPillarManagement = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activations, setActivations] = useState<PillarActivation[]>([]);

  const {
    pillarDefinitions,
    activatePillar,
    deactivatePillar,
    refreshData
  } = useFivePillarsModular(selectedClient?.id);

  const PILLAR_CONFIG = {
    self_care: { name: 'Self Care', icon: '🧘', description: 'Personlig hälsa och välmående' },
    skills: { name: 'Skills', icon: '🎯', description: 'Färdigheter och kunskapsutveckling' },
    talent: { name: 'Talent', icon: '⭐', description: 'Talang och unika styrkor' },
    brand: { name: 'Brand', icon: '🏆', description: 'Varumärke och profilering' },
    economy: { name: 'Economy', icon: '💰', description: 'Ekonomi och affärsutveckling' },
  };


  useEffect(() => {
    if (selectedClient) {
      loadClientActivations();
    }
  }, [selectedClient]);

  const { clients: unifiedClients, loading: clientsLoading } = useUnifiedClients();

  useEffect(() => {
    setLoading(clientsLoading);
    setClients(unifiedClients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      category: client.category || 'general',
      status: client.status
    })));
  }, [unifiedClients, clientsLoading]);

  const loadClientActivations = async () => {
    if (!selectedClient) return;

    try {
      const { data, error } = await supabase
        .from('client_pillar_activations')
        .select('pillar_key, is_active, activated_at')
        .eq('client_id', selectedClient.id);

      if (error) throw error;
      setActivations(data || []);
    } catch (error: any) {
      console.error('Error loading activations:', error);
    }
  };

  const handlePillarToggle = async (pillarKey: string, isActive: boolean) => {
    if (!selectedClient) return;

    try {
      if (isActive) {
        await activatePillar(pillarKey as any);
      } else {
        await deactivatePillar(pillarKey as any);
      }
      await loadClientActivations();
      refreshData();
    } catch (error) {
      console.error('Error toggling pillar:', error);
    }
  };

  const isPillarActive = (pillarKey: string) => {
    return activations.some(a => a.pillar_key === pillarKey && a.is_active);
  };

  const getActivationDate = (pillarKey: string) => {
    const activation = activations.find(a => a.pillar_key === pillarKey && a.is_active);
    return activation ? new Date(activation.activated_at).toLocaleDateString('sv-SE') : null;
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientStats = () => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const inactiveClients = totalClients - activeClients;
    
    return { totalClients, activeClients, inactiveClients };
  };

  const stats = getClientStats();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totalt klienter</p>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktiva</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inaktiva</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactiveClients}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Klientlista
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Sök klienter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">Laddar klienter...</div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Inga klienter hittades
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedClient?.id === client.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                          {client.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {client.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pillar Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Five Pillars Översikt
            </CardTitle>
            {selectedClient && (
              <p className="text-sm text-muted-foreground">
                Översikt för: <span className="font-medium">{selectedClient.name}</span>
              </p>
            )}
          </CardHeader>
          <CardContent>
            {!selectedClient ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Välj en klient från listan för att se deras pelare
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {PILLAR_PRIORITY_ORDER.map((pillarKey) => {
                  const config = PILLAR_MODULES[pillarKey];
                  const isActive = isPillarActive(pillarKey);
                  const activationDate = getActivationDate(pillarKey);
                  return (
                    <div key={pillarKey} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.icon}</span>
                        <div>
                          <h4 className="font-medium">{config.name}</h4>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                          {isActive && activationDate && (
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Aktiverad: {activationDate}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  );
                })}

                <Separator />
                
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activations.filter(a => a.is_active).length} av {Object.keys(PILLAR_CONFIG).length} pelare aktiverade för {selectedClient.name}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};