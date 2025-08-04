import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Eye, Calendar, CheckSquare, Brain, Star, Target,
  Filter, Search, RefreshCw, AlertTriangle, TrendingUp,
  MessageCircle, FileText, Clock, Activity, MapPin
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

interface ClientVisibilityData {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  
  // Journey tracking
  current_phase: string;
  overall_progress: number;
  last_activity_at: string;
  
  // Assignments
  assigned_coaches: {
    coach_id: string;
    coach_name: string;
    coach_email: string;
    assigned_at: string;
    is_active: boolean;
  }[];
  
  // Real-time data
  active_assessments: number;
  pending_tasks: number;
  completed_tasks_week: number;
  upcoming_events: number;
  
  // Six Pillars
  active_pillars: string[];
  pillar_progress: Record<string, number>;
  
  // Issues and alerts
  critical_issues: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    created_at: string;
  }[];
  
  // Communication
  unread_messages: number;
  last_coach_interaction: string;
  
  // Calendar integration
  calendar_sync_status: 'synced' | 'partial' | 'none';
  next_scheduled_event?: {
    title: string;
    date: string;
  };
}

interface FilterState {
  searchTerm: string;
  assignmentStatus: 'all' | 'assigned' | 'unassigned';
  activityLevel: 'all' | 'active' | 'inactive' | 'critical';
  phase: 'all' | 'welcome' | 'assessment' | 'active' | 'maintenance';
}

export function EnhancedClientVisibilityControl() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientVisibilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientVisibilityData | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    assignmentStatus: 'all',
    activityLevel: 'all',
    phase: 'all'
  });

  const fetchClientVisibilityData = async () => {
    try {
      setLoading(true);
      
      // 1. Hämta alla klienter med roller
      const { data: clientProfiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id, email, first_name, last_name, avatar_url,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'client');

      if (profileError) throw profileError;

      // 2. För varje klient, hämta fullständig data
      const clientDataPromises = clientProfiles.map(async (profile) => {
        const clientId = profile.id;
        
        const [
          journeyData,
          assignments,
          assessmentStates,
          tasks,
          calendarEvents,
          pillarActivations,
          messages
        ] = await Promise.all([
          // Journey tracking
          supabase
            .from('user_journey_tracking')
            .select('*')
            .eq('user_id', clientId)
            .maybeSingle(),
            
            // Coach assignments - använd manuell join
            supabase
              .from('coach_client_assignments')
              .select('coach_id, assigned_at, is_active')
              .eq('client_id', clientId),
            
          // Assessment states
          supabase
            .from('assessment_states')
            .select('id, assessment_type, is_draft')
            .eq('user_id', clientId),
            
          // Tasks
          supabase
            .from('tasks')
            .select('id, status, completed_at, created_at')
            .eq('user_id', clientId),
            
          // Calendar events
          supabase
            .from('calendar_events')
            .select('id, title, event_date')
            .eq('user_id', clientId)
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true })
            .limit(1),
            
            // Pillar activations - använd client_pillar_activations istället
            supabase
              .from('client_pillar_activations')
              .select('pillar_key, is_active')
              .eq('client_id', clientId),
            
          // Messages
          supabase
            .from('messages')
            .select('id, is_read, created_at, sender_id')
            .or(`sender_id.eq.${clientId},receiver_id.eq.${clientId}`)
            .order('created_at', { ascending: false })
            .limit(10)
        ]);

        // Hämta coach-profiler manuellt
        const coachProfiles = assignments.data?.length > 0 ? await Promise.all(
          assignments.data.map(async (assignment) => {
            const { data: coachProfile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .eq('id', assignment.coach_id)
              .single();
            return { ...assignment, coach_profile: coachProfile };
          })
        ) : [];

        // Bearbeta och sammanställ data
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email;
        
        // Beräkna metrics
        const activeTasks = tasks.data?.filter(t => t.status !== 'completed') || [];
        const completedThisWeek = tasks.data?.filter(t => 
          t.completed_at && 
          new Date(t.completed_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ) || [];
        
        const activeAssessments = assessmentStates.data?.filter(a => a.is_draft) || [];
        const activePillars = pillarActivations.data?.filter(p => p.is_active) || [];
        
        // Identifiera kritiska issues
        const criticalIssues = [];
        const lastActivity = journeyData.data?.last_activity_at;
        const daysSinceActivity = lastActivity ? 
          Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)) : 999;
          
        if (daysSinceActivity > 7) {
          criticalIssues.push({
            type: 'inactivity',
            severity: daysSinceActivity > 14 ? 'high' : 'medium' as const,
            description: `Inaktiv i ${daysSinceActivity} dagar`,
            created_at: new Date().toISOString()
          });
        }
        
        if (assignments.data?.filter(a => a.is_active).length === 0) {
          criticalIssues.push({
            type: 'no_coach',
            severity: 'high' as const,
            description: 'Ingen aktiv coach tilldelad',
            created_at: new Date().toISOString()
          });
        }
        
        if (activeAssessments.length > 2) {
          criticalIssues.push({
            type: 'abandoned_assessments', 
            severity: 'medium' as const,
            description: `${activeAssessments.length} påbörjade assessments`,
            created_at: new Date().toISOString()
          });
        }

        return {
          id: clientId,
          email: profile.email,
          name,
          avatar_url: profile.avatar_url,
          
          current_phase: journeyData.data?.journey_phase || 'unknown',
          overall_progress: journeyData.data?.overall_progress || 0,
          last_activity_at: lastActivity || new Date().toISOString(),
          
          assigned_coaches: coachProfiles.map(a => ({
            coach_id: a.coach_id,
            coach_name: `${a.coach_profile?.first_name || ''} ${a.coach_profile?.last_name || ''}`.trim(),
            coach_email: a.coach_profile?.email || '',
            assigned_at: a.assigned_at,
            is_active: a.is_active
          })),
          
          active_assessments: activeAssessments.length,
          pending_tasks: activeTasks.length,
          completed_tasks_week: completedThisWeek.length,
          upcoming_events: calendarEvents.data?.length || 0,
          
          active_pillars: activePillars.map(p => p.pillar_key),
          pillar_progress: activePillars.reduce((acc, p) => ({
            ...acc,
            [p.pillar_key]: 50 // Default progress since progress column doesn't exist
          }), {}),
          
          critical_issues: criticalIssues,
          
          unread_messages: messages.data?.filter(m => 
            !m.is_read && m.sender_id !== clientId
          ).length || 0,
          last_coach_interaction: messages.data?.[0]?.created_at || '',
          
          calendar_sync_status: calendarEvents.data?.length > 0 ? 'synced' : 'none' as const,
          next_scheduled_event: calendarEvents.data?.[0] ? {
            title: calendarEvents.data[0].title,
            date: calendarEvents.data[0].event_date
          } : undefined
        } as ClientVisibilityData;
      });

      const clientData = await Promise.all(clientDataPromises);
      setClients(clientData);
      
    } catch (error) {
      console.error('Error fetching client visibility data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta klientdata",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter clients based on current filters
  const filteredClients = clients.filter(client => {
    if (filters.searchTerm && !client.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) && 
        !client.email.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    if (filters.assignmentStatus === 'assigned' && client.assigned_coaches.filter(c => c.is_active).length === 0) {
      return false;
    }
    if (filters.assignmentStatus === 'unassigned' && client.assigned_coaches.filter(c => c.is_active).length > 0) {
      return false;
    }
    
    const daysSinceActivity = Math.floor((Date.now() - new Date(client.last_activity_at).getTime()) / (1000 * 60 * 60 * 24));
    if (filters.activityLevel === 'active' && daysSinceActivity > 7) return false;
    if (filters.activityLevel === 'inactive' && daysSinceActivity <= 7) return false;
    if (filters.activityLevel === 'critical' && client.critical_issues.filter(i => i.severity === 'high').length === 0) return false;
    
    if (filters.phase !== 'all' && client.current_phase !== filters.phase) return false;
    
    return true;
  });

  const assignCoach = async (clientId: string, coachId: string) => {
    try {
      const { error } = await supabase
        .from('coach_client_assignments')
        .insert({
          client_id: clientId,
          coach_id: coachId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          is_active: true
        });
        
      if (error) throw error;
      
      toast({
        title: "Coach tilldelad",
        description: "Coach har kopplats till klient framgångsrikt"
      });
      
      fetchClientVisibilityData();
    } catch (error) {
      console.error('Error assigning coach:', error);
      toast({
        title: "Fel",
        description: "Kunde inte tilldela coach",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (hasRole('admin') || hasRole('superadmin') || hasRole('coach')) {
      fetchClientVisibilityData();
    }
  }, [hasRole]);

  if (!hasRole('admin') && !hasRole('superadmin') && !hasRole('coach')) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Behörighet saknas</h3>
            <p className="text-muted-foreground">Du har inte behörighet att visa klientdata.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER & STATISTICS */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-6 w-6 text-blue-600" />
                Enhanced Client Visibility Control
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Coach & Admin Dashboard
                </Badge>
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Fullständig översikt och kontroll över alla klienter i systemet
              </p>
            </div>
            
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                <div className="text-xs text-muted-foreground">Totala klienter</div>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {clients.filter(c => c.assigned_coaches.some(coach => coach.is_active)).length}
                </div>
                <div className="text-xs text-muted-foreground">Tilldelade coaches</div>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-orange-600">
                  {clients.filter(c => c.critical_issues.some(i => i.severity === 'high')).length}
                </div>
                <div className="text-xs text-muted-foreground">Kräver uppmärksamhet</div>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(clients.reduce((sum, c) => sum + c.overall_progress, 0) / Math.max(clients.length, 1))}%
                </div>
                <div className="text-xs text-muted-foreground">Genomsnittlig framsteg</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* FILTERS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Sök
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sök klient</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Namn eller e-post..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Coach-tilldelning</label>
              <Select 
                value={filters.assignmentStatus} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, assignmentStatus: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla</SelectItem>
                  <SelectItem value="assigned">Tilldelade</SelectItem>
                  <SelectItem value="unassigned">Otilldelade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Aktivitetsnivå</label>
              <Select 
                value={filters.activityLevel} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, activityLevel: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla</SelectItem>
                  <SelectItem value="active">Aktiva (7 dagar)</SelectItem>
                  <SelectItem value="inactive">Inaktiva</SelectItem>
                  <SelectItem value="critical">Kritiska issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Fas</label>
              <Select 
                value={filters.phase} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, phase: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla</SelectItem>
                  <SelectItem value="welcome">Välkomst</SelectItem>
                  <SelectItem value="assessment">Bedömning</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="maintenance">Underhåll</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Visar {filteredClients.length} av {clients.length} klienter
            </p>
            <Button variant="outline" size="sm" onClick={fetchClientVisibilityData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Uppdatera
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CLIENT GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <Card 
              key={client.id} 
              className={`hover:shadow-lg transition-all cursor-pointer ${
                client.critical_issues.some(i => i.severity === 'high') ? 'border-red-200 bg-red-50/30' : ''
              }`}
              onClick={() => setSelectedClient(client)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client.avatar_url} />
                      <AvatarFallback>
                        {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {client.current_phase}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Status indicators */}
                  <div className="flex flex-col gap-1">
                    {client.critical_issues.some(i => i.severity === 'high') && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {client.critical_issues.filter(i => i.severity === 'high').length}
                      </Badge>
                    )}
                    {client.assigned_coaches.filter(c => c.is_active).length === 0 && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        Ingen coach
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Framsteg</span>
                    <span className="text-sm font-bold">{client.overall_progress}%</span>
                  </div>
                  <Progress value={client.overall_progress} className="h-2" />
                </div>
                
                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-bold text-blue-600">{client.active_assessments}</div>
                    <div className="text-muted-foreground">Assessments</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-bold text-green-600">{client.pending_tasks}</div>
                    <div className="text-muted-foreground">Uppgifter</div>
                  </div>
                </div>
                
                {/* Active pillars */}
                {client.active_pillars.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Aktiva pillars ({client.active_pillars.length})
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {client.active_pillars.slice(0, 3).map(pillar => (
                        <Badge key={pillar} variant="secondary" className="text-xs">
                          {pillar}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Assigned coaches */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Tilldelade coaches</h5>
                  {client.assigned_coaches.filter(c => c.is_active).length > 0 ? (
                    client.assigned_coaches.filter(c => c.is_active).map(coach => (
                      <div key={coach.coach_id} className="text-xs bg-blue-50 p-2 rounded">
                        <div className="font-medium">{coach.coach_name}</div>
                        <div className="text-muted-foreground">{coach.coach_email}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      Ingen aktiv coach tilldelad
                    </div>
                  )}
                </div>
                
                {/* Last activity */}
                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="text-muted-foreground">
                    Senaste aktivitet: {formatDistanceToNow(new Date(client.last_activity_at), { 
                      addSuffix: true, 
                      locale: sv 
                    })}
                  </span>
                  
                  {client.unread_messages > 0 && (
                    <Badge variant="default" className="text-xs">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {client.unread_messages}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {filteredClients.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inga klienter hittades</h3>
            <p className="text-muted-foreground">
              Justera dina filter eller sök efter andra kriterier.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}