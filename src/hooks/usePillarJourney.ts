import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Huvudpolicy från Systemarkitekt: Stark typning och datamodellering
export interface PillarJourney {
  id: string;
  userId: string;
  pillarKey: string;
  pillarName: string;
  mode: 'guided' | 'flexible' | 'intensive';
  status: 'planning' | 'active' | 'paused' | 'completed' | 'abandoned';
  progress: number;
  startedAt: string;
  completedAt?: string;
  pausedAt?: string;
  abandonedAt?: string;
  estimatedCompletion: string;
  milestones: PillarMilestone[];
  tasks: PillarTask[];
  reflections: PillarReflection[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export interface PillarMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completedAt?: string;
  progress: number;
  type: 'assessment' | 'practice' | 'reflection' | 'goal';
}

export interface PillarTask {
  id: string;
  title: string;
  description: string;
  type: 'manual' | 'ai_generated' | 'coach_assigned';
  priority: 'low' | 'medium' | 'high';
  status: 'planned' | 'active' | 'completed' | 'skipped';
  dueDate?: string;
  completedAt?: string;
  estimatedMinutes: number;
  dependencies: string[];
}

export interface PillarReflection {
  id: string;
  type: 'weekly' | 'milestone' | 'challenge' | 'insight';
  content: string;
  mood?: number;
  confidence?: number;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  type: 'journey_start' | 'milestone_completed' | 'task_completed' | 'journey_paused' | 'journey_resumed' | 'journey_completed' | 'reflection_added';
  title: string;
  description: string;
  pillarKey: string;
  timestamp: string;
  metadata: any;
}

// Huvudpolicy från Product Manager: Robust state management
export const usePillarJourney = (userId: string) => {
  const [activeJourneys, setActiveJourneys] = useState<PillarJourney[]>([]);
  const [completedJourneys, setCompletedJourneys] = useState<PillarJourney[]>([]);
  const [pausedJourneys, setPausedJourneys] = useState<PillarJourney[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Huvudpolicy från Frontend Dev: Progressive enhancement
  useEffect(() => {
    if (userId) {
      loadJourneys();
      loadTimeline();
    }
  }, [userId]);

  const loadJourneys = async () => {
    try {
      const { data, error } = await supabase
        .from('pillar_journeys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Huvudpolicy från Systemarkitekt: Data segregation
      const journeys = data || [];
      setActiveJourneys(journeys.filter(j => j.status === 'active' || j.status === 'planning'));
      setCompletedJourneys(journeys.filter(j => j.status === 'completed'));
      setPausedJourneys(journeys.filter(j => j.status === 'paused'));
      
    } catch (error: any) {
      console.error('Error loading journeys:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda utvecklingsresor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async () => {
    try {
      const { data, error } = await supabase
        .from('pillar_journey_timeline')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTimeline(data || []);
      
    } catch (error: any) {
      console.error('Error loading timeline:', error);
    }
  };

  // Huvudpolicy från AI/Coaching Psykolog: Adaptiv vägledning
  const initializeJourney = async (pillarKey: string, mode: 'guided' | 'flexible' | 'intensive') => {
    try {
      // Kontrollera om användaren redan har en aktiv resa för denna pillar
      const existingJourney = activeJourneys.find(j => j.pillarKey === pillarKey);
      if (existingJourney) {
        toast({
          title: "Information",
          description: "Du har redan en aktiv resa för denna pillar",
          variant: "default"
        });
        return;
      }

      // Skapa ny resa med intelligenta milstolpar baserat på läge
      const milestones = generateMilestones(pillarKey, mode);
      const estimatedWeeks = mode === 'guided' ? 8 : mode === 'flexible' ? 6 : 4;
      const estimatedCompletion = new Date();
      estimatedCompletion.setWeeks(estimatedCompletion.getWeeks() + estimatedWeeks);

      const journeyData = {
        user_id: userId,
        pillar_key: pillarKey,
        pillar_name: getPillarName(pillarKey),
        mode,
        status: 'planning',
        progress: 0,
        started_at: new Date().toISOString(),
        estimated_completion: estimatedCompletion.toISOString(),
        milestones,
        tasks: [],
        reflections: [],
        metadata: {
          mode_details: getModeDetails(mode),
          initial_assessment_score: await getLatestPillarScore(pillarKey)
        }
      };

      const { data, error } = await supabase
        .from('pillar_journeys')
        .insert(journeyData)
        .select()
        .single();

      if (error) throw error;

      // Lägg till i timeline
      await addTimelineEvent({
        type: 'journey_start',
        title: `Startade utvecklingsresa: ${getPillarName(pillarKey)}`,
        description: `Påbörjade ${mode} utvecklingsresa för ${getPillarName(pillarKey)}`,
        pillarKey,
        metadata: { mode, journey_id: data.id }
      });

      await loadJourneys();
      await loadTimeline();

      toast({
        title: "Utvecklingsresa startad!",
        description: `Din ${mode} resa för ${getPillarName(pillarKey)} har påbörjats`,
        variant: "default"
      });

    } catch (error: any) {
      console.error('Error initializing journey:', error);
      toast({
        title: "Fel",
        description: "Kunde inte starta utvecklingsresa",
        variant: "destructive"
      });
    }
  };

  // Huvudpolicy från UX Expert: Graceful state transitions
  const pauseJourney = async (journeyId: string) => {
    try {
      const { error } = await supabase
        .from('pillar_journeys')
        .update({ 
          status: 'paused', 
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', journeyId);

      if (error) throw error;

      const journey = activeJourneys.find(j => j.id === journeyId);
      if (journey) {
        await addTimelineEvent({
          type: 'journey_paused',
          title: `Pausade utvecklingsresa: ${journey.pillarName}`,
          description: `Utvecklingsresan för ${journey.pillarName} har pausats`,
          pillarKey: journey.pillarKey,
          metadata: { journey_id: journeyId, progress: journey.progress }
        });
      }

      await loadJourneys();
      await loadTimeline();

      toast({
        title: "Resa pausad",
        description: "Din utvecklingsresa har pausats och kan återupptas senare",
        variant: "default"
      });

    } catch (error: any) {
      console.error('Error pausing journey:', error);
      toast({
        title: "Fel",
        description: "Kunde inte pausa utvecklingsresa",
        variant: "destructive"
      });
    }
  };

  const resumeJourney = async (journeyId: string) => {
    try {
      const { error } = await supabase
        .from('pillar_journeys')
        .update({ 
          status: 'active', 
          paused_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', journeyId);

      if (error) throw error;

      const journey = pausedJourneys.find(j => j.id === journeyId);
      if (journey) {
        await addTimelineEvent({
          type: 'journey_resumed',
          title: `Återupptog utvecklingsresa: ${journey.pillarName}`,
          description: `Utvecklingsresan för ${journey.pillarName} har återupptagits`,
          pillarKey: journey.pillarKey,
          metadata: { journey_id: journeyId, progress: journey.progress }
        });
      }

      await loadJourneys();
      await loadTimeline();

      toast({
        title: "Resa återupptagen",
        description: "Din utvecklingsresa har återupptagits",
        variant: "default"
      });

    } catch (error: any) {
      console.error('Error resuming journey:', error);
      toast({
        title: "Fel",
        description: "Kunde inte återuppta utvecklingsresa",
        variant: "destructive"
      });
    }
  };

  const abandonJourney = async (journeyId: string) => {
    try {
      const { error } = await supabase
        .from('pillar_journeys')
        .update({ 
          status: 'abandoned', 
          abandoned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', journeyId);

      if (error) throw error;

      const journey = [...activeJourneys, ...pausedJourneys].find(j => j.id === journeyId);
      if (journey) {
        await addTimelineEvent({
          type: 'journey_abandoned',
          title: `Avbröt utvecklingsresa: ${journey.pillarName}`,
          description: `Utvecklingsresan för ${journey.pillarName} har avbrutits`,
          pillarKey: journey.pillarKey,
          metadata: { journey_id: journeyId, progress: journey.progress }
        });
      }

      await loadJourneys();
      await loadTimeline();

      toast({
        title: "Resa avbruten",
        description: "Utvecklingsresan har avbrutits",
        variant: "default"
      });

    } catch (error: any) {
      console.error('Error abandoning journey:', error);
      toast({
        title: "Fel",
        description: "Kunde inte avbryta utvecklingsresa",
        variant: "destructive"
      });
    }
  };

  const completeJourney = async (journeyId: string) => {
    try {
      const { error } = await supabase
        .from('pillar_journeys')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          progress: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', journeyId);

      if (error) throw error;

      const journey = activeJourneys.find(j => j.id === journeyId);
      if (journey) {
        await addTimelineEvent({
          type: 'journey_completed',
          title: `Slutförde utvecklingsresa: ${journey.pillarName}`,
          description: `Grattis! Du har slutfört din utvecklingsresa för ${journey.pillarName}`,
          pillarKey: journey.pillarKey,
          metadata: { journey_id: journeyId, mode: journey.mode }
        });
      }

      await loadJourneys();
      await loadTimeline();

      toast({
        title: "Grattis! 🎉",
        description: "Du har slutfört din utvecklingsresa!",
        variant: "default"
      });

    } catch (error: any) {
      console.error('Error completing journey:', error);
      toast({
        title: "Fel",
        description: "Kunde inte slutföra utvecklingsresa",
        variant: "destructive"
      });
    }
  };

  // Hjälpfunktioner
  const addTimelineEvent = async (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    try {
      await supabase
        .from('pillar_journey_timeline')
        .insert({
          user_id: userId,
          ...event,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error adding timeline event:', error);
    }
  };

  const generateMilestones = (pillarKey: string, mode: string): PillarMilestone[] => {
    // Huvudpolicy från AI/Coaching Psykolog: Adaptiva milstolpar
    const baseMilestones = [
      {
        id: `milestone-1-${pillarKey}`,
        title: 'Initial bedömning',
        description: 'Genomför en fördjupad bedömning av ditt nuvarande läge',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0,
        type: 'assessment' as const
      },
      {
        id: `milestone-2-${pillarKey}`,
        title: 'Första utvecklingsaktivitet',
        description: 'Påbörja din första utvecklingsaktivitet inom detta område',
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0,
        type: 'practice' as const
      }
    ];

    if (mode === 'guided') {
      baseMilestones.push({
        id: `milestone-3-${pillarKey}`,
        title: 'Veckoreflektion',
        description: 'Reflektion över första veckans framsteg och lärdomar',
        targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0,
        type: 'reflection' as const
      });
    }

    return baseMilestones;
  };

  const getPillarName = (pillarKey: string): string => {
    const pillarNames: { [key: string]: string } = {
      self_care: 'Self Care',
      skills: 'Skills',
      talent: 'Talent',
      brand: 'Brand',
      economy: 'Economy',
      network: 'Network'
    };
    return pillarNames[pillarKey] || pillarKey;
  };

  const getModeDetails = (mode: string) => {
    return {
      guided: { support_level: 'high', check_ins: 'weekly', ai_assistance: 'comprehensive' },
      flexible: { support_level: 'medium', check_ins: 'bi_weekly', ai_assistance: 'targeted' },
      intensive: { support_level: 'low', check_ins: 'monthly', ai_assistance: 'minimal' }
    }[mode];
  };

  const getLatestPillarScore = async (pillarKey: string): Promise<number> => {
    try {
      const { data } = await supabase
        .from('pillar_assessments')
        .select('calculated_score')
        .eq('user_id', userId)
        .eq('pillar_key', pillarKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return data?.calculated_score || 0;
    } catch {
      return 0;
    }
  };

  const getJourneyTimeline = () => timeline;

  return {
    activeJourneys,
    completedJourneys,
    pausedJourneys,
    timeline,
    loading,
    initializeJourney,
    pauseJourney,
    resumeJourney,
    abandonJourney,
    completeJourney,
    getJourneyTimeline,
    addTimelineEvent
  };
};

// Helper extension för Date
declare global {
  interface Date {
    setWeeks(weeks: number): void;
    getWeeks(): number;
  }
}

Date.prototype.setWeeks = function(weeks: number) {
  this.setTime(this.getTime() + (weeks * 7 * 24 * 60 * 60 * 1000));
};

Date.prototype.getWeeks = function() {
  return Math.floor(this.getTime() / (7 * 24 * 60 * 60 * 1000));
};