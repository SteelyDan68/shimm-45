import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { subDays, parseISO, differenceInDays } from 'date-fns';

export interface RealClientData {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  
  // Real progress tracking
  overall_progress: number;
  current_phase: string;
  last_activity_at: string;
  
  // Real assessments
  active_assessments: {
    id: string;
    assessment_type: string;
    current_step: string;
    progress_percentage: number;
    started_at: string;
  }[];
  
  completed_assessments: {
    id: string;
    assessment_type: string;
    completed_at: string;
    scores: Record<string, number>;
  }[];
  
  // Real Six Pillars data
  pillar_activations: {
    pillar_key: string;
    is_active: boolean;
    activated_at: string;
  }[];
  
  pillar_assessments: {
    pillar_type: string;
    scores: Record<string, number>;
    ai_analysis: string;
    created_at: string;
  }[];
  
  // Real tasks
  pending_tasks: {
    id: string;
    title: string;
    deadline?: string;
    priority: string;
    created_at: string;
  }[];
  
  completed_tasks: {
    id: string;
    title: string;
    completed_at: string;
  }[];
  
  // Real calendar events  
  upcoming_events: {
    id: string;
    title: string;
    event_date: string;
    category: string;
  }[];
  
  // Activity analytics
  activity_metrics: {
    days_since_last_activity: number;
    weekly_login_count: number;
    assessment_completion_rate: number;
    task_completion_rate: number;
  };
  
  // Real issues (calculated from actual data)
  real_issues: {
    type: 'inactive' | 'low_progress' | 'abandoned_assessments' | 'overdue_tasks';
    severity: 'low' | 'medium' | 'high';
    description: string;
    data: any;
  }[];
}

export interface RealCoachStats {
  totalActiveClients: number;
  clientsWithRecentActivity: number; // Last 7 days
  avgProgressAcrossClients: number;
  pendingAssessments: number;
  overdueDeadlines: number;
  completedTasksThisWeek: number;
  upcomingEvents: number;
}

export const useRealCoachDashboard = () => {
  const [clients, setClients] = useState<RealClientData[]>([]);
  const [coachStats, setCoachStats] = useState<RealCoachStats>({
    totalActiveClients: 0,
    clientsWithRecentActivity: 0,
    avgProgressAcrossClients: 0,
    pendingAssessments: 0,
    overdueDeadlines: 0,
    completedTasksThisWeek: 0,
    upcomingEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchRealClientData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // 1. Hämta coaches tilldelade klienter
      const { data: assignments, error: assignmentError } = await supabase
        .from('coach_client_assignments')
        .select('client_id')
        .eq('coach_id', user.id)
        .eq('is_active', true);

      if (assignmentError) throw assignmentError;
      if (!assignments || assignments.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      const clientIds = assignments.map(a => a.client_id);
      console.log('🔥 useRealCoachDashboard: Loading data for clients:', clientIds);

      // 2. Hämta grundläggande profil-data
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', clientIds);

      if (profileError) throw profileError;

      // 3. Parallell-hämtning av all klient-data
      const clientDataPromises = clientIds.map(async (clientId) => {
        const [
          journeyData,
          assessmentStates,
          assessmentRounds,
          pillarActivations,
          pillarAssessments,
          tasks,
          calendarEvents
        ] = await Promise.all([
          // Journey tracking
          supabase
            .from('user_journey_tracking')
            .select('*')
            .eq('user_id', clientId)
            .maybeSingle(),
            
          // Assessment states (pågående)
          supabase
            .from('assessment_states')
            .select('*')
            .eq('user_id', clientId)
            .eq('is_draft', true),
            
          // Completed assessments
          supabase
            .from('assessment_rounds')
            .select('*')
            .eq('user_id', clientId)
            .order('created_at', { ascending: false })
            .limit(10),
            
          // Pillar activations
          supabase
            .from('client_pillar_activations')
            .select('*')
            .eq('user_id', clientId),
            
          // Pillar assessments
          supabase
            .from('pillar_assessments')
            .select('*')
            .eq('user_id', clientId)
            .order('created_at', { ascending: false })
            .limit(10),
            
          // Tasks
          supabase
            .from('tasks')
            .select('*')
            .eq('user_id', clientId)
            .order('created_at', { ascending: false }),
            
          // Calendar events
          supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', clientId)
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true })
            .limit(5)
        ]);

        return {
          clientId,
          journeyData: journeyData.data,
          assessmentStates: assessmentStates.data || [],
          assessmentRounds: assessmentRounds.data || [],
          pillarActivations: pillarActivations.data || [],
          pillarAssessments: pillarAssessments.data || [],
          tasks: tasks.data || [],
          calendarEvents: calendarEvents.data || []
        };
      });

      const clientDataResults = await Promise.all(clientDataPromises);

      // 4. Transformera till RealClientData format
      const realClientData: RealClientData[] = profiles?.map(profile => {
        const clientData = clientDataResults.find(r => r.clientId === profile.id);
        if (!clientData) return null;

        const journey = clientData.journeyData;
        const lastActivity = journey?.last_activity_at || new Date().toISOString();
        const daysSinceActivity = differenceInDays(new Date(), parseISO(lastActivity));

        // Beräkna verkliga metrics
        const pendingTasks = clientData.tasks.filter(t => t.status !== 'completed');
        const completedTasks = clientData.tasks.filter(t => t.status === 'completed');
        const overdueTasks = pendingTasks.filter(t => 
          t.deadline && parseISO(t.deadline) < new Date()
        );

        // Aktivitets-metrics
        const weekAgo = subDays(new Date(), 7);
        const recentCompletedTasks = completedTasks.filter(t => 
          t.completed_at && parseISO(t.completed_at) >= weekAgo
        );

        // Assessment completion rate
        const totalAssessments = clientData.assessmentStates.length + clientData.assessmentRounds.length;
        const completedAssessments = clientData.assessmentRounds.length;
        const assessmentCompletionRate = totalAssessments > 0 ? 
          (completedAssessments / totalAssessments) * 100 : 0;

        // Task completion rate
        const totalTasks = clientData.tasks.length;
        const taskCompletionRate = totalTasks > 0 ? 
          (completedTasks.length / totalTasks) * 100 : 0;

        // Identifiera verkliga issues
        const realIssues: RealClientData['real_issues'] = [];
        
        if (daysSinceActivity > 7) {
          realIssues.push({
            type: 'inactive',
            severity: daysSinceActivity > 14 ? 'high' : 'medium',
            description: `Inaktiv i ${daysSinceActivity} dagar`,
            data: { daysSinceActivity, lastActivity }
          });
        }

        if (journey && journey.overall_progress < 25 && daysSinceActivity < 30) {
          realIssues.push({
            type: 'low_progress',
            severity: 'medium',
            description: `Låg progression (${journey.overall_progress}%)`,
            data: { progress: journey.overall_progress }
          });
        }

        if (clientData.assessmentStates.length > 2) {
          realIssues.push({
            type: 'abandoned_assessments',
            severity: 'medium', 
            description: `${clientData.assessmentStates.length} påbörjade men ej avslutade bedömningar`,
            data: { count: clientData.assessmentStates.length }
          });
        }

        if (overdueTasks.length > 0) {
          realIssues.push({
            type: 'overdue_tasks',
            severity: overdueTasks.length > 2 ? 'high' : 'medium',
            description: `${overdueTasks.length} försenade uppgifter`,
            data: { count: overdueTasks.length, tasks: overdueTasks }
          });
        }

        return {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Okänd klient',
          email: profile.email || '',
          avatar_url: profile.avatar_url,
          
          overall_progress: journey?.overall_progress || 0,
          current_phase: journey?.journey_phase || 'unknown',
          last_activity_at: lastActivity,
          
          active_assessments: clientData.assessmentStates.map(state => ({
            id: state.id,
            assessment_type: state.assessment_type,
            current_step: state.current_step,
            progress_percentage: calculateAssessmentProgress(state),
            started_at: state.started_at
          })),
          
          completed_assessments: clientData.assessmentRounds.map(round => ({
            id: round.id,
            assessment_type: round.pillar_type || 'unknown',
            completed_at: round.created_at,
            scores: typeof round.scores === 'object' ? round.scores : {}
          })),
          
          pillar_activations: clientData.pillarActivations.map(activation => ({
            pillar_key: activation.pillar_key,
            is_active: activation.is_active,
            activated_at: activation.activated_at
          })),
          
          pillar_assessments: clientData.pillarAssessments.map(assessment => ({
            pillar_type: assessment.pillar_key, // Använd pillar_key istället för pillar_type
            scores: typeof assessment.assessment_data === 'object' ? assessment.assessment_data : {},
            ai_analysis: assessment.ai_analysis || '',
            created_at: assessment.created_at
          })),
          
          pending_tasks: pendingTasks.map(task => ({
            id: task.id,
            title: task.title,
            deadline: task.deadline,
            priority: task.priority || 'medium',
            created_at: task.created_at
          })),
          
          completed_tasks: completedTasks.map(task => ({
            id: task.id,
            title: task.title,
            completed_at: task.completed_at || task.updated_at
          })),
          
          upcoming_events: clientData.calendarEvents.map(event => ({
            id: event.id,
            title: event.title,
            event_date: event.event_date,
            category: event.category
          })),
          
          activity_metrics: {
            days_since_last_activity: daysSinceActivity,
            weekly_login_count: calculateWeeklyLogins(clientData.journeyData),
            assessment_completion_rate: assessmentCompletionRate,
            task_completion_rate: taskCompletionRate
          },
          
          real_issues: realIssues
        };
      }).filter(Boolean) as RealClientData[];

      // 5. Beräkna verkliga coach stats
      const totalClients = realClientData.length;
      const clientsWithRecentActivity = realClientData.filter(c => 
        c.activity_metrics.days_since_last_activity <= 7
      ).length;
      
      const avgProgress = totalClients > 0 ? 
        realClientData.reduce((sum, c) => sum + c.overall_progress, 0) / totalClients : 0;
      
      const pendingAssessments = realClientData.reduce((sum, c) => 
        sum + c.active_assessments.length, 0
      );
      
      const overdueDeadlines = realClientData.reduce((sum, c) => 
        sum + c.real_issues.filter(i => i.type === 'overdue_tasks').length, 0
      );
      
      const completedTasksThisWeek = realClientData.reduce((sum, c) => {
        const weekAgo = subDays(new Date(), 7);
        return sum + c.completed_tasks.filter(t => 
          parseISO(t.completed_at) >= weekAgo
        ).length;
      }, 0);
      
      const upcomingEvents = realClientData.reduce((sum, c) => 
        sum + c.upcoming_events.length, 0
      );

      setCoachStats({
        totalActiveClients: totalClients,
        clientsWithRecentActivity,
        avgProgressAcrossClients: Math.round(avgProgress),
        pendingAssessments,
        overdueDeadlines,
        completedTasksThisWeek,
        upcomingEvents
      });

      setClients(realClientData);
      
      console.log('🔥 useRealCoachDashboard: Loaded real data for clients:', realClientData);

    } catch (error: any) {
      console.error('Error fetching real client data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta klient-data från databasen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const calculateAssessmentProgress = (state: any): number => {
    if (!state.metadata || !state.form_data) return 0;
    
    const totalSteps = 10; // Antagande baserat på typisk assessment
    const completedFields = Object.keys(state.form_data).length;
    return Math.min((completedFields / totalSteps) * 100, 100);
  };

  const calculateWeeklyLogins = (journeyData: any): number => {
    // Simplified - skulle kunna byggas ut med mer detaljerad tracking
    if (!journeyData?.last_activity_at) return 0;
    
    const daysSinceActivity = differenceInDays(new Date(), parseISO(journeyData.last_activity_at));
    if (daysSinceActivity <= 1) return 7; // Daily active
    if (daysSinceActivity <= 3) return 4; // Regular active  
    if (daysSinceActivity <= 7) return 2; // Weekly active
    return 0; // Inactive
  };

  useEffect(() => {
    fetchRealClientData();
  }, [user?.id]);

  return {
    clients,
    coachStats,
    loading,
    refreshData: fetchRealClientData,
    totalClients: clients.length
  };
};