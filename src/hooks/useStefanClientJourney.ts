import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useCentralizedData } from '@/hooks/useCentralizedData';
import { useStefanInterventions } from '@/hooks/useStefanInterventions';
import { useAssessmentEngine } from '@/hooks/useAssessmentEngine';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * 🌟 STEFAN CLIENT JOURNEY HOOK
 * Spårar och analyserar klientens resa genom systemet
 * Integrerar pillar data, assessments, todos och aktiviteter
 */

export interface ClientJourneyStage {
  stage: 'discovery' | 'activation' | 'development' | 'mastery' | 'maintenance';
  description: string;
  progress: number;
  completedMilestones: string[];
  nextMilestones: string[];
  estimatedTimeToNext: string;
}

export interface ClientJourneyInsight {
  type: 'progress' | 'concern' | 'opportunity' | 'celebration';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions?: string[];
}

export interface ClientTodo {
  id: string;
  title: string;
  description: string;
  pillarType: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  createdBy: 'stefan' | 'coach' | 'self';
}

export interface JournalEntry {
  id: string;
  content: string;
  mood?: 'positive' | 'neutral' | 'negative';
  pillarsReflected: string[];
  insights: string[];
  createdAt: string;
  isPrivate: boolean;
}

export const useStefanClientJourney = (targetUserId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = targetUserId || user?.id;
  
  const centralizedData = useCentralizedData(userId);
  const stefanInterventions = useStefanInterventions();
  const assessmentEngine = useAssessmentEngine(userId);
  
  // Journey state
  const [currentStage, setCurrentStage] = useState<ClientJourneyStage | null>(null);
  const [journeyInsights, setJourneyInsights] = useState<ClientJourneyInsight[]>([]);
  const [todos, setTodos] = useState<ClientTodo[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load client journey data
  const loadJourneyData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Load todos from ai_coaching_recommendations table 
      const { data: tasksData } = await supabase
        .from('ai_coaching_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const mappedTodos: ClientTodo[] = (tasksData || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        pillarType: task.category || 'general',
        priority: (task.priority as 'high' | 'medium' | 'low') || 'medium',
        status: task.status === 'completed' ? 'completed' : 'pending',
        dueDate: task.due_date,
        createdAt: task.created_at,
        completedAt: task.implementation_date,
        createdBy: 'stefan'
      }));

      // Load journal entries from coaching_progress_entries
      const { data: journalData } = await supabase
        .from('coaching_progress_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_type', 'reflection')
        .order('created_at', { ascending: false })
        .limit(20);

      const mappedJournalEntries: JournalEntry[] = (journalData || []).map(entry => ({
        id: entry.id,
        content: entry.description || '',
        mood: (typeof entry.metadata === 'object' && entry.metadata ? (entry.metadata as any).mood : 'neutral') || 'neutral',
        pillarsReflected: (typeof entry.metadata === 'object' && entry.metadata ? (entry.metadata as any).pillars_reflected : []) || [],
        insights: (typeof entry.metadata === 'object' && entry.metadata ? (entry.metadata as any).insights : []) || [],
        createdAt: entry.created_at,
        isPrivate: (typeof entry.metadata === 'object' && entry.metadata ? (entry.metadata as any).is_private : false) || false
      }));

      setTodos(mappedTodos);
      setJournalEntries(mappedJournalEntries);
      
      // Compute journey stage and insights
      await computeJourneyStage();
      await generateJourneyInsights();
      
    } catch (error) {
      console.error('Error loading journey data:', error);
      toast({
        title: "Fel vid datahämtning",
        description: "Kunde inte ladda klientresa data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Compute current journey stage
  const computeJourneyStage = useCallback(async () => {
    if (!centralizedData.metrics) return;

    const { metrics } = centralizedData;
    const totalProgress = metrics.overall_completion;
    const activePillars = metrics.active_pillars;
    const totalEntries = metrics.total_path_entries;

    let stage: ClientJourneyStage;

    if (totalProgress < 10 && totalEntries < 5) {
      stage = {
        stage: 'discovery',
        description: 'Upptäcker systemet och identifierar utvecklingsområden',
        progress: Math.min(totalProgress * 10, 100),
        completedMilestones: ['Skapat profil', 'Första inloggning'],
        nextMilestones: ['Genomföra första assessment', 'Sätta första mål'],
        estimatedTimeToNext: '1-2 veckor'
      };
    } else if (totalProgress < 30 && activePillars < 3) {
      stage = {
        stage: 'activation',
        description: 'Aktiverar pillars och sätter igång utvecklingsprocessen',
        progress: (totalProgress / 30) * 100,
        completedMilestones: ['Första assessment', 'Aktiverat pillars'],
        nextMilestones: ['Konsekvent aktivitet', 'Utveckla rutiner'],
        estimatedTimeToNext: '2-4 veckor'
      };
    } else if (totalProgress < 70) {
      stage = {
        stage: 'development',
        description: 'Aktivt utvecklingsarbete med regelbunden progress',
        progress: ((totalProgress - 30) / 40) * 100,
        completedMilestones: ['Etablerat rutiner', 'Kontinuerlig aktivitet'],
        nextMilestones: ['Fördjupa kunskap', 'Uppnå delmål'],
        estimatedTimeToNext: '1-3 månader'
      };
    } else if (totalProgress < 90) {
      stage = {
        stage: 'mastery',
        description: 'Förfinar färdigheter och uppnår avancerade mål',
        progress: ((totalProgress - 70) / 20) * 100,
        completedMilestones: ['Höga scores', 'Avancerade mål'],
        nextMilestones: ['Expertis inom områden', 'Mentorskap'],
        estimatedTimeToNext: '3-6 månader'
      };
    } else {
      stage = {
        stage: 'maintenance',
        description: 'Bibehåller excellens och delar kunskap',
        progress: 100,
        completedMilestones: ['Expertis uppnådd', 'Stabila resultat'],
        nextMilestones: ['Kontinuerlig förbättring', 'Nya utmaningar'],
        estimatedTimeToNext: 'Kontinuerligt'
      };
    }

    setCurrentStage(stage);
  }, [centralizedData.metrics]);

  // Generate journey insights
  const generateJourneyInsights = useCallback(async () => {
    const insights: ClientJourneyInsight[] = [];
    
    if (!centralizedData.metrics) return;

    const { metrics } = centralizedData;
    const interventionStats = stefanInterventions.getInterventionStats();

    // Progress insight
    if (metrics.this_week_entries > 5) {
      insights.push({
        type: 'celebration',
        title: 'Fantastisk veckoaktivitet!',
        description: `Du har ${metrics.this_week_entries} aktiviteter denna vecka. Fortsätt så här!`,
        priority: 'medium',
        actionable: false
      });
    } else if (metrics.this_week_entries < 2) {
      insights.push({
        type: 'concern',
        title: 'Låg aktivitet denna vecka',
        description: 'Du har haft få aktiviteter. Överväg att sätta små, uppnåeliga mål.',
        priority: 'high',
        actionable: true,
        suggestedActions: ['Sätt ett litet mål för idag', 'Påminnelse från Stefan', 'Kontakta coach']
      });
    }

    // Assessment insight
    const hasRecentAssessment = assessmentEngine.assessmentRounds.some(round => {
      const assessmentDate = new Date(round.created_at);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return assessmentDate >= oneWeekAgo;
    });

    if (!hasRecentAssessment && assessmentEngine.assessmentRounds.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Dags för ny assessment',
        description: 'Det har gått ett tag sedan din senaste assessment. En ny kan ge värdefulla insights.',
        priority: 'medium',
        actionable: true,
        suggestedActions: ['Genomför self-assessment', 'Be coach om bedömning']
      });
    }

    // Pillar balance insight
    const pillarScores = Object.values(metrics.assessment_scores).filter(score => score !== null);
    if (pillarScores.length > 1) {
      const maxScore = Math.max(...pillarScores);
      const minScore = Math.min(...pillarScores);
      
      if (maxScore - minScore > 30) {
        insights.push({
          type: 'opportunity',
          title: 'Obalans mellan utvecklingsområden',
          description: 'Vissa pillars utvecklas snabbare än andra. Överväg att fokusera på de lägre.',
          priority: 'medium',
          actionable: true,
          suggestedActions: ['Fokusera på lägst presterande pillar', 'Balansera aktiviteter']
        });
      }
    }

    // Stefan interaction insight
    if (interventionStats.responseRate < 50) {
      insights.push({
        type: 'concern',
        title: 'Låg interaktion med Stefan',
        description: 'Du svarar sällan på Stefans meddelanden. Mer interaktion kan förbättra din upplevelse.',
        priority: 'medium',
        actionable: true,
        suggestedActions: ['Svara på Stefans meddelanden', 'Ställ frågor till Stefan']
      });
    }

    setJourneyInsights(insights);
  }, [centralizedData.metrics, stefanInterventions, assessmentEngine]);

  // Create todo
  const createTodo = useCallback(async (todo: Omit<ClientTodo, 'id' | 'createdAt' | 'status'>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('ai_coaching_recommendations')
        .insert({
          user_id: userId,
          title: todo.title,
          description: todo.description,
          category: todo.pillarType,
          priority: todo.priority,
          due_date: todo.dueDate,
          status: 'pending',
          recommendation_type: 'task',
          reasoning: 'User-created task',
          expected_outcome: todo.description,
          difficulty: 'medium'
        })
        .select()
        .single();

      if (error) throw error;

      const newTodo: ClientTodo = {
        id: data.id,
        ...todo,
        status: 'pending',
        createdAt: data.created_at,
        createdBy: 'self'
      };

      setTodos(prev => [newTodo, ...prev]);
      
      toast({
        title: "Todo skapad",
        description: `"${todo.title}" har lagts till i din lista`
      });

      return newTodo;
    } catch (error) {
      console.error('Error creating todo:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa todo",
        variant: "destructive"
      });
    }
  }, [userId, toast]);

  // Complete todo
  const completeTodo = useCallback(async (todoId: string) => {
    try {
      const { error } = await supabase
        .from('ai_coaching_recommendations')
        .update({ 
          status: 'completed',
          implementation_date: new Date().toISOString() 
        })
        .eq('id', todoId);

      if (error) throw error;

      setTodos(prev => prev.map(todo => 
        todo.id === todoId 
          ? { ...todo, status: 'completed', completedAt: new Date().toISOString() }
          : todo
      ));

      toast({
        title: "Todo slutförd!",
        description: "Bra jobbat! Din framsteg har registrerats."
      });
    } catch (error) {
      console.error('Error completing todo:', error);
      toast({
        title: "Fel",
        description: "Kunde inte slutföra todo",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Create journal entry
  const createJournalEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('coaching_progress_entries')
        .insert({
          user_id: userId,
          entry_type: 'reflection',
          title: 'Journal Entry',
          description: entry.content,
          metadata: {
            mood: entry.mood,
            pillars_reflected: entry.pillarsReflected,
            insights: entry.insights,
            is_private: entry.isPrivate
          },
          visible_to_user: true
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry: JournalEntry = {
        id: data.id,
        ...entry,
        createdAt: data.created_at
      };

      setJournalEntries(prev => [newEntry, ...prev]);
      
      toast({
        title: "Journalanteckning sparad",
        description: "Din reflektion har registrerats"
      });

      return newEntry;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara journalanteckning",
        variant: "destructive"
      });
    }
  }, [userId, toast]);

  // Initialize
  useEffect(() => {
    loadJourneyData();
  }, [loadJourneyData]);

  // Computed values
  const todosStats = {
    total: todos.length,
    completed: todos.filter(t => t.status === 'completed').length,
    pending: todos.filter(t => t.status === 'pending').length,
    overdue: todos.filter(t => 
      t.status === 'pending' && 
      t.dueDate && 
      new Date(t.dueDate) < new Date()
    ).length
  };

  const journalStats = {
    total: journalEntries.length,
    thisWeek: journalEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return entryDate >= oneWeekAgo;
    }).length,
    averageMood: calculateAverageMood(journalEntries)
  };

  return {
    // Journey state
    currentStage,
    journeyInsights,
    
    // Todos
    todos,
    todosStats,
    createTodo,
    completeTodo,
    
    // Journal
    journalEntries,
    journalStats,
    createJournalEntry,
    
    // Data state
    loading,
    
    // Actions
    loadJourneyData,
    refreshJourney: loadJourneyData,
    
    // Raw data access
    centralizedData
  };
};

// Helper function
function calculateAverageMood(entries: JournalEntry[]): 'positive' | 'neutral' | 'negative' {
  if (entries.length === 0) return 'neutral';
  
  const moodScores = entries
    .filter(entry => entry.mood)
    .map(entry => {
      switch (entry.mood) {
        case 'positive': return 1;
        case 'neutral': return 0;
        case 'negative': return -1;
        default: return 0;
      }
    });
  
  if (moodScores.length === 0) return 'neutral';
  
  const average = moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length;
  
  if (average > 0.2) return 'positive';
  if (average < -0.2) return 'negative';
  return 'neutral';
}