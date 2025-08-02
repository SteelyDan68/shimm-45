import { useState, useEffect, useCallback } from 'react';
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
  eventType: string;
  eventTitle: string;
  eventDescription?: string;
  occurredAt: string;
  journeyId: string;
  pillarName?: string;
  eventData?: any;
}

// Huvudpolicy från Product Manager: Robust state management
export const usePillarJourney = (userId: string) => {
  const [activeJourneys, setActiveJourneys] = useState<PillarJourney[]>([]);
  const [completedJourneys, setCompletedJourneys] = useState<PillarJourney[]>([]);
  const [pausedJourneys, setPausedJourneys] = useState<PillarJourney[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Huvudpolicy från AI/Coaching Psykolog: Adaptiv vägledning
  const initializeJourney = useCallback(async (pillarKey: string, mode: 'guided' | 'flexible' | 'intensive') => {
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
      estimatedCompletion.setTime(estimatedCompletion.getTime() + (estimatedWeeks * 7 * 24 * 60 * 60 * 1000));

      const newJourney: PillarJourney = {
        id: `journey_${Date.now()}`,
        userId,
        pillarKey,
        pillarName: getPillarName(pillarKey),
        mode,
        status: 'active',
        progress: 0,
        startedAt: new Date().toISOString(),
        estimatedCompletion: estimatedCompletion.toISOString(),
        milestones,
        tasks: [],
        reflections: [],
        metadata: {
          mode_details: getModeDetails(mode),
          initial_assessment_score: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setActiveJourneys(prev => [...prev, newJourney]);

      // Lägg till i timeline
      await addTimelineEvent({
        eventType: 'journey_start',
        eventTitle: `Startade utvecklingsresa: ${getPillarName(pillarKey)}`,
        eventDescription: `Påbörjade ${mode} utvecklingsresa för ${getPillarName(pillarKey)}`,
        journeyId: newJourney.id,
        pillarName: newJourney.pillarName,
        eventData: { mode, journey_id: newJourney.id }
      });

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
  }, [activeJourneys, toast]);

  // Huvudpolicy från UX Expert: Graceful state transitions
  const pauseJourney = useCallback(async (journeyId: string) => {
    try {
      const journey = activeJourneys.find(j => j.id === journeyId);
      if (!journey) return;

      const updatedJourney = {
        ...journey,
        status: 'paused' as const,
        pausedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setActiveJourneys(prev => prev.filter(j => j.id !== journeyId));
      setPausedJourneys(prev => [...prev, updatedJourney]);

      await addTimelineEvent({
        eventType: 'journey_paused',
        eventTitle: `Pausade utvecklingsresa: ${journey.pillarName}`,
        eventDescription: `Utvecklingsresan för ${journey.pillarName} har pausats`,
        journeyId,
        pillarName: journey.pillarName,
        eventData: { journey_id: journeyId, progress: journey.progress }
      });

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
  }, [activeJourneys, toast]);

  const resumeJourney = useCallback(async (journeyId: string) => {
    try {
      const journey = pausedJourneys.find(j => j.id === journeyId);
      if (!journey) return;

      const updatedJourney = {
        ...journey,
        status: 'active' as const,
        pausedAt: undefined,
        updatedAt: new Date().toISOString()
      };

      setPausedJourneys(prev => prev.filter(j => j.id !== journeyId));
      setActiveJourneys(prev => [...prev, updatedJourney]);

      await addTimelineEvent({
        eventType: 'journey_resumed',
        eventTitle: `Återupptog utvecklingsresa: ${journey.pillarName}`,
        eventDescription: `Utvecklingsresan för ${journey.pillarName} har återupptagits`,
        journeyId,
        pillarName: journey.pillarName,
        eventData: { journey_id: journeyId, progress: journey.progress }
      });

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
  }, [pausedJourneys, toast]);

  const abandonJourney = useCallback(async (journeyId: string) => {
    try {
      const journey = activeJourneys.find(j => j.id === journeyId) || pausedJourneys.find(j => j.id === journeyId);
      if (!journey) return;

      setActiveJourneys(prev => prev.filter(j => j.id !== journeyId));
      setPausedJourneys(prev => prev.filter(j => j.id !== journeyId));

      await addTimelineEvent({
        eventType: 'journey_abandoned',
        eventTitle: `Avbröt utvecklingsresa: ${journey.pillarName}`,
        eventDescription: `Utvecklingsresan för ${journey.pillarName} har avbrutits`,
        journeyId,
        pillarName: journey.pillarName,
        eventData: { journey_id: journeyId, progress: journey.progress }
      });

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
  }, [activeJourneys, pausedJourneys, toast]);

  const completeJourney = useCallback(async (journeyId: string) => {
    try {
      const journey = activeJourneys.find(j => j.id === journeyId);
      if (!journey) return;

      const completedJourney = {
        ...journey,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        progress: 100,
        updatedAt: new Date().toISOString()
      };

      setActiveJourneys(prev => prev.filter(j => j.id !== journeyId));
      setCompletedJourneys(prev => [...prev, completedJourney]);

      await addTimelineEvent({
        eventType: 'journey_completed',
        eventTitle: `Slutförde utvecklingsresa: ${journey.pillarName}`,
        eventDescription: `Grattis! Du har slutfört din utvecklingsresa för ${journey.pillarName}`,
        journeyId,
        pillarName: journey.pillarName,
        eventData: { journey_id: journeyId, mode: journey.mode }
      });

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
  }, [activeJourneys, toast]);

  // Hjälpfunktioner
  const addTimelineEvent = async (event: Omit<TimelineEvent, 'id' | 'occurredAt'>) => {
    try {
      const newEvent: TimelineEvent = {
        id: `event_${Date.now()}`,
        occurredAt: new Date().toISOString(),
        ...event
      };

      setTimeline(prev => [newEvent, ...prev]);
    } catch (error) {
      console.error('Error adding timeline event:', error);
    }
  };

  const generateMilestones = (pillarKey: string, mode: string): PillarMilestone[] => {
    // Huvudpolicy från AI/Coaching Psykolog: Adaptiva milstolpar
    const baseMilestones: PillarMilestone[] = [
      {
        id: `milestone-1-${pillarKey}`,
        title: 'Initial bedömning',
        description: 'Genomför en fördjupad bedömning av ditt nuvarande läge',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0,
        type: 'assessment'
      },
      {
        id: `milestone-2-${pillarKey}`,
        title: 'Första utvecklingsaktivitet',
        description: 'Påbörja din första utvecklingsaktivitet inom detta område',
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0,
        type: 'practice'
      }
    ];

    if (mode === 'guided') {
      baseMilestones.push({
        id: `milestone-3-${pillarKey}`,
        title: 'Veckoreflektion',
        description: 'Reflektion över första veckans framsteg och lärdomar',
        targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0,
        type: 'reflection'
      });
    }

    return baseMilestones;
  };

  const getPillarName = (pillarKey: string): string => {
    const pillarNames: { [key: string]: string } = {
      self_care: 'Egenvård',
      stress_management: 'Stresshantering',
      emotional_regulation: 'Känsloreglering',
      communication: 'Kommunikation',
      time_management: 'Tidsplanering',
      goal_setting: 'Målsättning'
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

  const getJourneyTimeline = useCallback(() => timeline, [timeline]);

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