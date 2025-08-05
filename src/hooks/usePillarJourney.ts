import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PillarKey } from '@/types/sixPillarsModular';

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

  // CRITICAL FIX: Load real data from path_entries
  const loadJourneysFromDatabase = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Get all pillar assessments and activations
      const { data: assessments, error: assessmentError } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'assessment')
        .order('created_at', { ascending: false });

      if (assessmentError) throw assessmentError;

      const { data: activations, error: activationError } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'action')
        .ilike('title', '%pelare:%')
        .order('created_at', { ascending: false });

      if (activationError) throw activationError;

      // Process data into journey format
      const pillars: PillarKey[] = ['self_care', 'skills', 'talent', 'brand', 'economy', 'open_track'];
      const completed: PillarJourney[] = [];
      const active: PillarJourney[] = [];

      pillars.forEach(pillarKey => {
        const pillarAssessments = (assessments || []).filter(a => 
          (a.metadata as any)?.pillar_key === pillarKey
        );
        const pillarActivations = (activations || []).filter(a => 
          (a.metadata as any)?.pillar_key === pillarKey && (a.metadata as any)?.action === 'activate'
        );

        const latestAssessment = pillarAssessments[0];
        const hasValidScore = latestAssessment && (latestAssessment.metadata as any)?.assessment_score != null;

        if (hasValidScore) {
          // Completed journey
          completed.push({
            id: `journey-${pillarKey}`,
            userId,
            pillarKey,
            pillarName: getPillarName(pillarKey),
            mode: 'guided',
            status: 'completed',
            progress: 100,
            startedAt: pillarActivations[0]?.created_at || latestAssessment.created_at,
            completedAt: latestAssessment.created_at,
            estimatedCompletion: latestAssessment.created_at,
            milestones: [],
            tasks: [],
            reflections: [],
            metadata: latestAssessment.metadata,
            createdAt: latestAssessment.created_at,
            updatedAt: latestAssessment.updated_at
          });
        } else if (pillarActivations.length > 0) {
          // Active journey
          active.push({
            id: `journey-${pillarKey}`,
            userId,
            pillarKey,
            pillarName: getPillarName(pillarKey),
            mode: 'guided',
            status: 'active',
            progress: 25, // Started but not completed
            startedAt: pillarActivations[0].created_at,
            estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            milestones: generateMilestones(pillarKey, 'guided'),
            tasks: [],
            reflections: [],
            metadata: {},
            createdAt: pillarActivations[0].created_at,
            updatedAt: pillarActivations[0].updated_at
          });
        }
      });

      setCompletedJourneys(completed);
      setActiveJourneys(active);

    } catch (error) {
      console.error('Error loading journeys:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda utvecklingsresor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Load data on mount
  useEffect(() => {
    loadJourneysFromDatabase();
  }, [loadJourneysFromDatabase]);

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

      // KRITISK FIX: Navigera till assessment-formuläret istället för bara skapa lokal resa
      
      
      // Skapa URL för att starta assessment
      const assessmentUrl = `/six-pillars?pillar=${pillarKey}&startAssessment=true`;
      
      toast({
        title: "Startar assessment...",
        description: `Tar dig till ${getPillarName(pillarKey)}-bedömningen`,
        variant: "default"
      });

      // Navigera till assessment (måste göras från komponenten, inte hooken)
      // Vi returnerar URL:en så komponenten kan hantera navigationen
      return { shouldNavigate: true, url: assessmentUrl, pillarKey, mode };

    } catch (error: any) {
      console.error('Error initializing journey:', error);
      toast({
        title: "Fel",
        description: "Kunde inte starta utvecklingsresa",
        variant: "destructive"
      });
      return { shouldNavigate: false };
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
    addTimelineEvent,
    refreshJourneys: loadJourneysFromDatabase // For external refresh
  };
};