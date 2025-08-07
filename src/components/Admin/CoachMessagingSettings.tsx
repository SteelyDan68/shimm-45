import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCoachMessagingPermissions } from '@/hooks/useCoachMessagingPermissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Users,
  Search,
  Settings,
  User,
  Mail,
  CheckCircle,
  XCircle
} from 'lucide-react';

/**
 * 🎯 COACH MESSAGING SETTINGS - Admin interface för human coach messaging
 */

interface ClientCoachAssignment {
  id: string;
  coach_id: string;
  client_id: string;
  is_active: boolean;
  coach_profile: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  client_profile: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  messaging_enabled?: boolean;
}

export const CoachMessagingSettings: React.FC = () => {
  const [assignments, setAssignments] = useState<ClientCoachAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toggleCoachMessaging } = useCoachMessagingPermissions();
  const { toast } = useToast();

  // Hämta alla coach-client assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const { data: assignmentsData, error } = await supabase
        .from('coach_client_assignments')
        .select(`
          *,
          coach_profile:profiles!coach_client_assignments_coach_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          client_profile:profiles!coach_client_assignments_client_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Hämta messaging permissions för alla assignments
      const { data: messagingPerms, error: permsError } = await supabase
        .from('coach_messaging_permissions')
        .select('*');

      if (permsError) throw permsError;

      // Kombinera data
      const enrichedAssignments = (assignmentsData || []).map(assignment => ({
        ...assignment,
        messaging_enabled: messagingPerms?.some(perm => 
          perm.client_id === assignment.client_id && 
          perm.coach_id === assignment.coach_id && 
          perm.is_enabled
        ) || false
      }));

      setAssignments(enrichedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta coach-tilldelningar",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Filtrera assignments baserat på sökning
  const filteredAssignments = assignments.filter(assignment => {
    const searchLower = searchTerm.toLowerCase();
    const coachName = `${assignment.coach_profile.first_name || ''} ${assignment.coach_profile.last_name || ''}`.toLowerCase();
    const clientName = `${assignment.client_profile.first_name || ''} ${assignment.client_profile.last_name || ''}`.toLowerCase();
    const coachEmail = assignment.coach_profile.email?.toLowerCase() || '';
    const clientEmail = assignment.client_profile.email?.toLowerCase() || '';

    return coachName.includes(searchLower) || 
           clientName.includes(searchLower) || 
           coachEmail.includes(searchLower) || 
           clientEmail.includes(searchLower);
  });

  // Toggle messaging för en assignment
  const handleToggleMessaging = async (assignment: ClientCoachAssignment) => {
    const success = await toggleCoachMessaging(
      assignment.client_id,
      assignment.coach_id,
      !assignment.messaging_enabled
    );

    if (success) {
      // Uppdatera lokal state
      setAssignments(prev => prev.map(a => 
        a.id === assignment.id 
          ? { ...a, messaging_enabled: !a.messaging_enabled }
          : a
      ));
    }
  };

  const enabledCount = assignments.filter(a => a.messaging_enabled).length;
  const totalCount = assignments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Human Coach Messaging</h2>
          <p className="text-muted-foreground">
            Hantera vilka klienter som kan skicka meddelanden till sina tilldelade coaches
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{enabledCount}/{totalCount}</div>
          <div className="text-sm text-muted-foreground">Aktiverade</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalCount}</div>
            <div className="text-sm text-muted-foreground">Totala tilldelningar</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{enabledCount}</div>
            <div className="text-sm text-muted-foreground">Messaging aktiverat</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Settings className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalCount - enabledCount}</div>
            <div className="text-sm text-muted-foreground">Endast Stefan AI</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök efter coach eller klient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Coach-Klient Tilldelningar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laddar tilldelningar...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga tilldelningar hittades</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Prova att justera din sökning.' : 'Skapa coach-klient tilldelningar först.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  {/* Coach Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {assignment.coach_profile.first_name && assignment.coach_profile.last_name
                          ? `${assignment.coach_profile.first_name} ${assignment.coach_profile.last_name}`
                          : assignment.coach_profile.email
                        }
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {assignment.coach_profile.email}
                      </div>
                      <Badge variant="secondary" className="text-xs">Coach</Badge>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-muted-foreground">→</div>

                  {/* Client Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {assignment.client_profile.first_name && assignment.client_profile.last_name
                          ? `${assignment.client_profile.first_name} ${assignment.client_profile.last_name}`
                          : assignment.client_profile.email
                        }
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {assignment.client_profile.email}
                      </div>
                      <Badge variant="outline" className="text-xs">Klient</Badge>
                    </div>
                  </div>

                  {/* Status & Toggle */}
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      {assignment.messaging_enabled ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                      )}
                      <div className="text-xs text-muted-foreground">
                        {assignment.messaging_enabled ? 'Aktiverat' : 'Deaktiverat'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label 
                        htmlFor={`messaging-${assignment.id}`}
                        className="text-sm cursor-pointer"
                      >
                        Messaging
                      </Label>
                      <Switch
                        id={`messaging-${assignment.id}`}
                        checked={assignment.messaging_enabled}
                        onCheckedChange={() => handleToggleMessaging(assignment)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Hur fungerar Human Coach Messaging?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Stefan AI:</strong> Alltid tillgängligt för alla klienter</li>
                <li>• <strong>Human Coach:</strong> Aktiveras endast när du slår på switchen ovan</li>
                <li>• <strong>Affärsmodell:</strong> Human coach messaging kan vara en premium-funktion</li>
                <li>• <strong>Flexibilitet:</strong> Du kan aktivera/deaktivera för enskilda klient-coach par</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};