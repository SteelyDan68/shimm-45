/**
 * COACH ASSIGNMENT MANAGER - Manage coach-client relationships
 * 
 * Hantera coach-klient tilldelningar
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, UserX, Plus, Trash2, Users } from 'lucide-react';

interface CoachAssignmentManagerProps {
  user: any;
  onUpdate: () => void;
  canManageAssignments: boolean;
}

interface Assignment {
  id: string;
  coach_id: string;
  client_id: string;
  assigned_at: string;
  assigned_by: string;
  is_active: boolean;
  coach_name?: string;
  client_name?: string;
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export const CoachAssignmentManager: React.FC<CoachAssignmentManagerProps> = ({ 
  user, 
  onUpdate, 
  canManageAssignments 
}) => {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableCoaches, setAvailableCoaches] = useState<AvailableUser[]>([]);
  const [availableClients, setAvailableClients] = useState<AvailableUser[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const { toast } = useToast();

  const isUserCoach = user.roles?.includes('coach');
  const isUserClient = user.roles?.includes('client');

  useEffect(() => {
    loadAssignments();
    loadAvailableUsers();
  }, [user.id]);

  const loadAssignments = async () => {
    try {
      let query = supabase
        .from('coach_client_assignments')
        .select(`
          *,
          coach_profiles:profiles!coach_id(first_name, last_name, email),
          client_profiles:profiles!client_id(first_name, last_name, email)
        `)
        .eq('is_active', true);

      // Filter based on user's role
      if (isUserCoach) {
        query = query.eq('coach_id', user.id);
      } else if (isUserClient) {
        query = query.eq('client_id', user.id);
      } else {
        // Admin view - show assignments involving this user
        query = query.or(`coach_id.eq.${user.id},client_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedAssignments = data?.map(assignment => ({
        ...assignment,
        coach_name: 'Coach',
        client_name: 'Klient'
      })) || [];

      setAssignments(formattedAssignments);

    } catch (error: any) {
      console.error('Error loading assignments:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda tilldelningar",
        variant: "destructive"
      });
    }
  };

  const loadAvailableUsers = async () => {
    if (!canManageAssignments) return;

    try {
      // Simplified - just set empty arrays for now
      setAvailableCoaches([]);
      setAvailableClients([]);

      

    } catch (error: any) {
      console.error('Error loading available users:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda tillgängliga användare",
        variant: "destructive"
      });
    }
  };

  const handleCreateAssignment = async () => {
    if (!canManageAssignments || !selectedCoachId || !selectedClientId) return;

    setLoading(true);
    try {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('coach_client_assignments')
        .select('id')
        .eq('coach_id', selectedCoachId)
        .eq('client_id', selectedClientId)
        .eq('is_active', true);

      if (existing && existing.length > 0) {
        toast({
          title: "Tilldelning finns redan",
          description: "Denna coach-klient relation finns redan",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('coach_client_assignments')
        .insert({
          coach_id: selectedCoachId,
          client_id: selectedClientId,
          assigned_by: user.id,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Tilldelning skapad",
        description: "Coach-klient relation har skapats framgångsrikt",
      });

      setSelectedCoachId('');
      setSelectedClientId('');
      loadAssignments();
      onUpdate();

    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa tilldelningen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!canManageAssignments) return;

    if (!confirm('Är du säker på att du vill ta bort denna tilldelning?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('coach_client_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Tilldelning borttagen",
        description: "Coach-klient relation har tagits bort",
      });

      loadAssignments();
      onUpdate();

    } catch (error: any) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort tilldelningen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Coach-Klient Tilldelningar
        </h2>
      </div>

      {/* Create New Assignment */}
      {canManageAssignments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Skapa Ny Tilldelning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Välj Coach</label>
                <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj en coach..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCoaches.map((coach) => (
                      <SelectItem key={coach.id} value={coach.id}>
                        {coach.name} ({coach.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Välj Klient</label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj en klient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleCreateAssignment}
              disabled={loading || !selectedCoachId || !selectedClientId}
              className="w-full"
            >
              {loading ? 'Skapar...' : 'Skapa Tilldelning'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isUserCoach ? 'Mina Klienter' : isUserClient ? 'Mina Coaches' : 'Aktiva Tilldelningar'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isUserCoach && 'Inga klienter tilldelade än'}
              {isUserClient && 'Ingen coach tilldelad än'}
              {!isUserCoach && !isUserClient && 'Inga aktiva tilldelningar'}
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div 
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">
                          {isUserCoach && (
                            <>
                              <span className="text-muted-foreground">Klient:</span> {assignment.client_name}
                            </>
                          )}
                          {isUserClient && (
                            <>
                              <span className="text-muted-foreground">Coach:</span> {assignment.coach_name}
                            </>
                          )}
                          {!isUserCoach && !isUserClient && (
                            <>
                              {assignment.coach_name} → {assignment.client_name}
                            </>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tilldelad: {formatDate(assignment.assigned_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Aktiv
                    </Badge>
                    {canManageAssignments && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coach-funktioner</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>• Tillgång till tilldelade klienters data</p>
            <p>• Skapa och hantera coaching-planer</p>
            <p>• Se progress och analytics</p>
            <p>• Kommunicera med klienter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Klient-funktioner</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>• Få coaching och vägledning</p>
            <p>• Tillgång till personliga planer</p>
            <p>• Rapportera progress</p>
            <p>• Kommunicera med coach</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};