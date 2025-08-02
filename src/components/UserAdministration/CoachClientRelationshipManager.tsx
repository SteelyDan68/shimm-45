import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useCoachClientRelationships } from '@/hooks/useCoachClientRelationships';
import { useUnifiedUsers } from '@/hooks/useUnifiedUsers';
import { Users, UserPlus, UserMinus, ArrowRight, Crown, User, RefreshCw, Link, Filter, Search, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

export function CoachClientRelationshipManager() {
  const navigate = useNavigate();
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCoach, setFilterCoach] = useState<string>('all');
  const { toast } = useToast();

  const {
    relationships,
    stats,
    loading,
    createRelationship,
    removeRelationship,
    getClientsByCoach,
    refetch
  } = useCoachClientRelationships();

  const {
    getCoaches,
    getClients
  } = useUnifiedUsers();

  const coaches = getCoaches();
  const clients = getClients();
  const assignedClientIds = new Set(relationships.map(rel => rel.client_id));
  const unassignedClients = clients.filter(client => !assignedClientIds.has(client.id));

  // Filter relationships based on search and coach filter
  const filteredRelationships = relationships.filter(rel => {
    const coach = coaches.find(c => c.id === rel.coach_id);
    const client = clients.find(c => c.id === rel.client_id);
    
    const matchesSearch = searchTerm === '' || 
      coach?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCoachFilter = filterCoach === 'all' || rel.coach_id === filterCoach;
    
    return matchesSearch && matchesCoachFilter;
  });

  const handleAssignClient = async () => {
    if (!selectedCoach || !selectedClient) {
      toast({
        title: "Välj både coach och klient",
        description: "Du måste välja både en coach och en klient för att skapa en relation.",
        variant: "destructive",
      });
      return;
    }

    const success = await createRelationship(selectedCoach, selectedClient);
    if (success) {
      setSelectedCoach('');
      setSelectedClient('');
      setIsAssignDialogOpen(false);
    }
  };

  const handleRemoveRelationship = async (relationshipId: string) => {
    if (window.confirm('Är du säker på att du vill ta bort denna relation?')) {
      await removeRelationship(relationshipId);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Coach-Klient Relationer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Coach-Klient Relationer</h2>
          <p className="text-muted-foreground">Hantera kopplingar mellan coaches och klienter</p>
        </div>
        <Button variant="outline" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Aktiva Coaches</p>
                <p className="text-2xl font-bold">{stats.total_coaches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Tilldelade Klienter</p>
                <p className="text-2xl font-bold">{stats.assigned_clients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Otilldelade Klienter</p>
                <p className="text-2xl font-bold">{stats.unassigned_clients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Aktiva Relationer</p>
                <p className="text-2xl font-bold">{stats.active_relationships}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assign New Relationship */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Tilldela Klient till Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Skapa Ny Relation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tilldela Klient till Coach</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Välj Coach</label>
                  <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj en coach..." />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches.map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            {coach.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Välj Klient</label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj en klient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {client.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleAssignClient} className="w-full">
                  Skapa Relation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrera och Sök
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök coach eller klient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCoach} onValueChange={setFilterCoach}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrera på coach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla coaches</SelectItem>
                {coaches.map((coach) => (
                  <SelectItem key={coach.id} value={coach.id}>
                    {coach.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Existing Relationships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Aktiva Coach-Klient Relationer ({filteredRelationships.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {filteredRelationships.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{searchTerm || filterCoach !== 'all' ? 'Inga relationer matchar filtret.' : 'Inga aktiva relationer finns ännu.'}</p>
                  <p className="text-sm">{searchTerm || filterCoach !== 'all' ? 'Prova att ändra sökterm eller filter.' : 'Skapa en relation för att komma igång.'}</p>
                </div>
              ) : (
                filteredRelationships.map((relationship) => {
                  const coach = coaches.find(c => c.id === relationship.coach_id);
                  const client = clients.find(c => c.id === relationship.client_id);
                  
                  return (
                    <div key={relationship.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-primary" />
                            <span className="font-medium">{coach?.name || 'Okänd coach'}</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-green-500" />
                            <span className="font-medium">{client?.name || 'Okänd klient'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/user-profile/${relationship.client_id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visa profil
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveRelationship(relationship.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-muted-foreground">
                        Relation skapad: {new Date(relationship.assigned_at).toLocaleDateString('sv-SE')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Unassigned Clients */}
      {unassignedClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-orange-500" />
              Otilldelade Klienter ({unassignedClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {unassignedClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{client.name}</span>
                    {client.client_category && (
                      <Badge variant="outline" className="text-xs">
                        {client.client_category}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/user-profile/${client.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
