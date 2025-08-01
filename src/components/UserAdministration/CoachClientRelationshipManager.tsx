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
import { Users, UserPlus, UserMinus, ArrowRight, Crown, User, RefreshCw } from 'lucide-react';

export function CoachClientRelationshipManager() {
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
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

      {/* Existing Relationships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Aktiva Coach-Klient Relationer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {coaches.map((coach) => {
                const coachRelationships = getClientsByCoach(coach.id);
                
                if (coachRelationships.length === 0) return null;

                return (
                  <div key={coach.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="font-medium">{coach.name}</span>
                      <Badge variant="secondary">{coachRelationships.length} klienter</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {coachRelationships.map((relationship) => (
                        <div key={relationship.id} className="flex items-center justify-between bg-muted/50 rounded p-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{relationship.client_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {relationship.client_email}
                            </Badge>
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveRelationship(relationship.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {relationships.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Inga aktiva relationer finns ännu.</p>
                  <p className="text-sm">Skapa en relation för att komma igång.</p>
                </div>
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
                <div key={client.id} className="flex items-center gap-2 p-2 border rounded">
                  <User className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">{client.name}</span>
                  {client.client_category && (
                    <Badge variant="outline" className="text-xs">
                      {client.client_category}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
