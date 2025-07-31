import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Users, 
  Tag, 
  Filter,
  Edit3,
  Trash2,
  Search
} from "lucide-react";

interface ClientGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  client_ids: string[];
  criteria: any;
  created_at: string;
  created_by: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  category: string;
  status: string;
}

const groupColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

export function ClientGroupManager() {
  const { canManageUsers } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<ClientGroup[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ClientGroup | null>(null);

  // Form state
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    color: groupColors[0],
    client_ids: [] as string[],
    criteria: {}
  });

  useEffect(() => {
    if (canManageUsers) {
      fetchGroups();
      fetchClients();
    }
  }, [canManageUsers]);

  const fetchGroups = async () => {
    try {
      // För nu använder vi client tags som grupper, senare kan vi skapa en riktig groups tabell
      const { data: clients, error } = await supabase
        .from('clients')
        .select('tags')
        .not('tags', 'is', null);

      if (error) throw error;

      // Samla alla unika tags
      const allTags = new Set<string>();
      clients?.forEach(client => {
        if (client.tags && Array.isArray(client.tags)) {
          client.tags.forEach(tag => allTags.add(tag));
        }
      });

      // Konvertera till grupper
      const tagGroups = Array.from(allTags).map((tag, index) => ({
        id: `tag-${tag}`,
        name: tag,
        description: `Automatisk grupp baserad på tagg: ${tag}`,
        color: groupColors[index % groupColors.length],
        client_ids: [],
        criteria: { tag },
        created_at: new Date().toISOString(),
        created_by: 'system'
      }));

      setGroups(tagGroups);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta grupper",
        variant: "destructive"
      });
    }
  };

  const fetchClients = async () => {
    try {
      // Use unified client fetching
      const { fetchUnifiedClients } = await import('@/utils/clientDataConsolidation');
      const unifiedClients = await fetchUnifiedClients();
      
      // Map to Client interface format
      const mappedClients: Client[] = unifiedClients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email || '',
        category: client.category || 'general',
        status: client.status
      }));
      
      setClients(mappedClients);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta klienter",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientsInGroup = async (group: ClientGroup) => {
    if (group.criteria?.tag) {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .contains('tags', [group.criteria.tag]);

      if (error) {
        console.error('Error fetching group clients:', error);
        return [];
      }
      return data || [];
    }
    return [];
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      toast({
        title: "Fel",
        description: "Gruppnamn krävs",
        variant: "destructive"
      });
      return;
    }

    try {
      // För demonstration - vi skapar en "virtuell" grupp baserad på taggar
      // I en riktig implementation skulle vi skapa en groups tabell
      
      // Lägg till taggen till valda klienter
      if (selectedClients.length > 0) {
        for (const clientId of selectedClients) {
          const { data: client, error: fetchError } = await supabase
            .from('clients')
            .select('tags')
            .eq('id', clientId)
            .single();

          if (fetchError) throw fetchError;

          const currentTags = client.tags || [];
          const updatedTags = [...new Set([...currentTags, groupForm.name])];

          const { error: updateError } = await supabase
            .from('clients')
            .update({ tags: updatedTags })
            .eq('id', clientId);

          if (updateError) throw updateError;
        }
      }

      toast({
        title: "Grupp skapad",
        description: `Gruppen "${groupForm.name}" har skapats med ${selectedClients.length} klienter.`
      });

      setGroupForm({
        name: "",
        description: "",
        color: groupColors[0],
        client_ids: [],
        criteria: {}
      });
      setSelectedClients([]);
      setShowCreateDialog(false);
      fetchGroups();
      fetchClients();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa grupp: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteGroup = async (group: ClientGroup) => {
    if (!group.criteria?.tag) return;

    try {
      // Ta bort taggen från alla klienter
      const { data: clientsWithTag, error: fetchError } = await supabase
        .from('clients')
        .select('id, tags')
        .contains('tags', [group.criteria.tag]);

      if (fetchError) throw fetchError;

      for (const client of clientsWithTag || []) {
        const updatedTags = (client.tags || []).filter(tag => tag !== group.criteria.tag);
        
        const { error: updateError } = await supabase
          .from('clients')
          .update({ tags: updatedTags })
          .eq('id', client.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Grupp borttagen",
        description: `Gruppen "${group.name}" har tagits bort.`
      });

      fetchGroups();
      fetchClients();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort grupp: " + error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setGroupForm({
      name: "",
      description: "",
      color: groupColors[0],
      client_ids: [],
      criteria: {}
    });
    setSelectedClients([]);
    setEditingGroup(null);
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Ingen behörighet</h3>
            <p className="text-muted-foreground">Du har inte behörighet att hantera klientgrupper.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div>Laddar grupper...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Klientgrupper</h2>
          <p className="text-muted-foreground">Organisera klienter i grupper för enklare hantering</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Ny grupp
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Skapa ny klientgrupp</DialogTitle>
              <DialogDescription>
                Skapa en grupp och välj vilka klienter som ska ingå
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="groupName">Gruppnamn</Label>
                  <Input
                    id="groupName"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="T.ex. Premium klienter"
                  />
                </div>
                <div>
                  <Label htmlFor="groupColor">Färg</Label>
                  <Select 
                    value={groupForm.color} 
                    onValueChange={(value) => setGroupForm(prev => ({ ...prev, color: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groupColors.map(color => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {color}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="groupDescription">Beskrivning (valfritt)</Label>
                <Textarea
                  id="groupDescription"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beskrivning av gruppen..."
                />
              </div>

              <div>
                <Label>Välj klienter</Label>
                <div className="mt-2">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Sök klienter..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                    {filteredClients.map(client => (
                      <div key={client.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                        <Checkbox
                          id={client.id}
                          checked={selectedClients.includes(client.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedClients(prev => [...prev, client.id]);
                            } else {
                              setSelectedClients(prev => prev.filter(id => id !== client.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.email}</div>
                        </div>
                        <Badge variant="outline">{client.category}</Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-2 text-sm text-muted-foreground">
                    {selectedClients.length} klienter valda
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreateGroup}>
                  Skapa grupp
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => (
          <GroupCard 
            key={group.id} 
            group={group} 
            onDelete={handleDeleteGroup}
            getClientsInGroup={getClientsInGroup}
          />
        ))}
        
        {groups.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-10">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inga grupper skapade</h3>
                <p className="text-muted-foreground mb-4">
                  Skapa din första klientgrupp för att organisera dina klienter
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa första gruppen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface GroupCardProps {
  group: ClientGroup;
  onDelete: (group: ClientGroup) => void;
  getClientsInGroup: (group: ClientGroup) => Promise<any[]>;
}

function GroupCard({ group, onDelete, getClientsInGroup }: GroupCardProps) {
  const [clientCount, setClientCount] = useState(0);
  const [showClients, setShowClients] = useState(false);
  const [groupClients, setGroupClients] = useState<any[]>([]);

  useEffect(() => {
    const fetchCount = async () => {
      const clients = await getClientsInGroup(group);
      setClientCount(clients.length);
      setGroupClients(clients);
    };
    fetchCount();
  }, [group]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            <div>
              <CardTitle className="text-lg">{group.name}</CardTitle>
              {group.description && (
                <CardDescription className="mt-1">{group.description}</CardDescription>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(group)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {clientCount} klienter
            </span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowClients(!showClients)}
          >
            {showClients ? "Dölj" : "Visa"}
          </Button>
        </div>
        
        {showClients && (
          <div className="mt-4 space-y-2">
            {groupClients.map(client => (
              <div key={client.id} className="text-sm p-2 bg-muted/50 rounded">
                <div className="font-medium">{client.name}</div>
                <div className="text-muted-foreground">{client.email}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}