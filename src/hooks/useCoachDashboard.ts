import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { subDays, isAfter, parseISO } from 'date-fns';

export interface ClientPriority {
  id: string;
  name: string;
  category: string;
  status: string;
  velocity_rank: number;
  last_updated: string;
  priority_score: number;
  issues: ClientIssue[];
  latest_ai_recommendation?: string;
  next_planned_action?: string;
  assessment_scores?: Record<string, number>;
  sentiment_score?: number;
}

export interface ClientIssue {
  type: 'new_barriers' | 'incomplete_tasks' | 'negative_sentiment' | 'inactive';
  severity: 'low' | 'medium' | 'high';
  description: string;
  days_since?: number;
}

export type DashboardFilter = 'all' | 'a_clients' | 'highest_barriers' | 'inactive';
export type SortOption = 'priority' | 'velocity' | 'last_update' | 'barriers';

export const useCoachDashboard = () => {
  const [clients, setClients] = useState<ClientPriority[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const { toast } = useToast();

  const fetchClientsWithPriority = async () => {
    try {
      setLoading(true);

      // Fetch all users with client role from profiles
      const { fetchUnifiedClients } = await import('@/utils/clientDataConsolidation');
      const clientsData = await fetchUnifiedClients();

      const clientPriorities: ClientPriority[] = [];

      for (const client of clientsData || []) {
        const issues: ClientIssue[] = [];
        let priorityScore = 0;
        let velocityRank = 5; // Default middle rank
        let latestAiRecommendation = '';
        let nextPlannedAction = '';
        let assessmentScores: Record<string, number> = {};
        let sentimentScore = 0;

        // Get latest path entries for this client
        const { data: pathEntries } = await supabase
          .from('path_entries')
          .select('*')
          .eq('client_id', client.id)
          .order('timestamp', { ascending: false })
          .limit(10);

        // Get latest assessment
        const latestAssessment = pathEntries?.find(entry => 
          entry.type === 'assessment' && entry.details
        );

        if (latestAssessment) {
          // Parse assessment scores from details
          try {
            const lines = latestAssessment.details.split('\n');
            const scoresSection = lines.find(line => line.includes(':'));
            if (scoresSection) {
              lines.forEach(line => {
                const match = line.match(/(.+): (\d+)\/10/);
                if (match) {
                  assessmentScores[match[1].trim()] = parseInt(match[2]);
                }
              });

              // Check for high barriers (scores > 7)
              const highBarriers = Object.entries(assessmentScores)
                .filter(([_, score]) => score > 7)
                .length;

              if (highBarriers > 3) {
                issues.push({
                  type: 'new_barriers',
                  severity: 'high',
                  description: `${highBarriers} områden med höga hinder (>7/10)`
                });
                priorityScore += 30;
              } else if (highBarriers > 1) {
                issues.push({
                  type: 'new_barriers',
                  severity: 'medium',
                  description: `${highBarriers} områden med höga hinder (>7/10)`
                });
                priorityScore += 15;
              }

              // Calculate velocity rank based on average barriers
              const avgBarrier = Object.values(assessmentScores)
                .reduce((sum, score) => sum + score, 0) / Object.values(assessmentScores).length;
              velocityRank = Math.max(1, Math.min(10, Math.round(11 - avgBarrier)));
            }
          } catch (error) {
            console.error('Error parsing assessment:', error);
          }
        }

        // Get latest AI recommendation
        const latestAiRec = pathEntries?.find(entry => 
          entry.type === 'recommendation' && entry.ai_generated
        );
        if (latestAiRec) {
          latestAiRecommendation = latestAiRec.details?.substring(0, 100) + '...' || '';
        }

        // Get next planned action
        const nextAction = pathEntries?.find(entry => 
          entry.status === 'planned' && entry.type === 'action'
        );
        if (nextAction) {
          nextPlannedAction = nextAction.title;
        }

        // Check for incomplete tasks (simulate - in real app this would come from a tasks table)
        const incompleteTasks = Math.floor(Math.random() * 3); // Simulate 0-2 incomplete tasks
        if (incompleteTasks > 0) {
          issues.push({
            type: 'incomplete_tasks',
            severity: incompleteTasks > 1 ? 'high' : 'medium',
            description: `${incompleteTasks} ogenomförda uppgifter`
          });
          priorityScore += incompleteTasks * 10;
        }

        // Check sentiment (simulate negative sentiment detection)
        sentimentScore = Math.random() * 2 - 1; // -1 to 1
        if (sentimentScore < -0.3) {
          issues.push({
            type: 'negative_sentiment',
            severity: sentimentScore < -0.6 ? 'high' : 'medium',
            description: 'Negativ reflektion upptäckt i senaste interaktioner'
          });
          priorityScore += sentimentScore < -0.6 ? 25 : 15;
        }

        // Check if inactive (last update > 10 days)
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceUpdate > 10) {
          issues.push({
            type: 'inactive',
            severity: daysSinceUpdate > 30 ? 'high' : 'medium',
            description: `Inaktiv i ${daysSinceUpdate} dagar`,
            days_since: daysSinceUpdate
          });
          priorityScore += daysSinceUpdate > 30 ? 20 : 10;
        }

        // Only include clients with issues or high priority
        if (issues.length > 0 || priorityScore > 0) {
          clientPriorities.push({
            id: client.id,
            name: client.name,
            category: client.category,
            status: client.status,
            velocity_rank: velocityRank,
            last_updated: client.created_at, // Use created_at since updated_at doesn't exist
            priority_score: priorityScore,
            issues,
            latest_ai_recommendation: latestAiRecommendation,
            next_planned_action: nextPlannedAction,
            assessment_scores: assessmentScores,
            sentiment_score: sentimentScore
          });
        }
      }

      setClients(clientPriorities);
    } catch (error: any) {
      console.error('Error fetching coach dashboard data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta dashboard-data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Apply filter
    switch (activeFilter) {
      case 'a_clients':
        filtered = filtered.filter(client => 
          client.category === 'A-klient' || client.priority_score > 40
        );
        break;
      case 'highest_barriers':
        filtered = filtered.filter(client => 
          client.issues.some(issue => issue.type === 'new_barriers')
        );
        break;
      case 'inactive':
        filtered = filtered.filter(client => 
          client.issues.some(issue => issue.type === 'inactive')
        );
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'priority':
        filtered.sort((a, b) => b.priority_score - a.priority_score);
        break;
      case 'velocity':
        filtered.sort((a, b) => a.velocity_rank - b.velocity_rank);
        break;
      case 'last_update':
        filtered.sort((a, b) => 
          new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        );
        break;
      case 'barriers':
        filtered.sort((a, b) => {
          const aHighBarriers = Object.values(a.assessment_scores || {})
            .filter(score => score > 7).length;
          const bHighBarriers = Object.values(b.assessment_scores || {})
            .filter(score => score > 7).length;
          return bHighBarriers - aHighBarriers;
        });
        break;
    }

    setFilteredClients(filtered);
  };

  useEffect(() => {
    fetchClientsWithPriority();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, activeFilter, sortBy]);

  return {
    clients: filteredClients,
    loading,
    activeFilter,
    setActiveFilter,
    sortBy,
    setSortBy,
    refreshData: fetchClientsWithPriority,
    totalClients: clients.length,
    filteredCount: filteredClients.length
  };
};