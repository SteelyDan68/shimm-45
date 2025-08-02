import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface CoachingContext {
  userId: string;
  pillarsData?: any;
  recentActivities?: any[];
  assessmentHistory?: any[];
  goals?: any[];
  challenges?: string[];
  preferences?: {
    communicationStyle: 'direct' | 'supportive' | 'analytical';
    motivationStyle: 'achievement' | 'progress' | 'social';
    learningStyle: 'visual' | 'auditory' | 'kinesthetic';
  };
}

export interface AICoachingRecommendation {
  id: string;
  type: 'action' | 'reflection' | 'learning' | 'habit' | 'goal';
  title: string;
  description: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  estimatedTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  dependencies?: string[];
  expectedOutcome: string;
  metrics?: string[];
  dueDate?: Date;
  resources?: {
    type: 'article' | 'video' | 'exercise' | 'tool';
    title: string;
    url?: string;
    content?: string;
  }[];
}

export interface CoachingSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  type: 'assessment' | 'planning' | 'review' | 'emergency';
  context: CoachingContext;
  recommendations: AICoachingRecommendation[];
  userFeedback?: {
    rating: number;
    comment?: string;
    implementedRecommendations: string[];
  };
  followUp?: {
    scheduledFor: Date;
    reminders: boolean;
  };
}

export interface PersonalizedCoachingPlan {
  userId: string;
  generatedAt: Date;
  duration: number; // days
  focusAreas: string[];
  weeklyGoals: {
    week: number;
    goals: string[];
    activities: AICoachingRecommendation[];
  }[];
  milestones: {
    date: Date;
    description: string;
    successCriteria: string[];
  }[];
  adaptationTriggers: {
    condition: string;
    action: string;
  }[];
}

export const useAdvancedAICoaching = () => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<CoachingSession | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<AICoachingRecommendation[]>([]);
  const [coachingPlan, setCoachingPlan] = useState<PersonalizedCoachingPlan | null>(null);
  const [sessionHistory, setSessionHistory] = useState<CoachingSession[]>([]);

  // Start a new coaching session
  const startCoachingSession = useCallback(async (
    type: CoachingSession['type'],
    context?: Partial<CoachingContext>
  ) => {
    if (!user) return null;

    setIsAnalyzing(true);
    
    try {
      // Gather user context
      const fullContext: CoachingContext = {
        userId: user.id,
        ...context,
        // Add real data gathering here
      };

      // Call AI analysis function
      const { data: analysisResult, error } = await supabase.functions.invoke('advanced-ai-coaching', {
        body: {
          action: 'analyze_and_recommend',
          context: fullContext,
          sessionType: type
        }
      });

      if (error) throw error;

      const session: CoachingSession = {
        id: `session_${Date.now()}`,
        userId: user.id,
        startTime: new Date(),
        type,
        context: fullContext,
        recommendations: analysisResult.recommendations || []
      };

      setCurrentSession(session);
      setRecommendations(analysisResult.recommendations || []);
      return session;

    } catch (error) {
      console.error('Error starting coaching session:', error);
      
      // Fallback with mock recommendations
      const mockRecommendations = generateMockRecommendations(type);
      const session: CoachingSession = {
        id: `session_${Date.now()}`,
        userId: user.id,
        startTime: new Date(),
        type,
        context: { userId: user.id, ...context },
        recommendations: mockRecommendations
      };

      setCurrentSession(session);
      setRecommendations(mockRecommendations);
      return session;

    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  // End current session with feedback
  const endCoachingSession = useCallback(async (feedback?: CoachingSession['userFeedback']) => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      endTime: new Date(),
      userFeedback: feedback
    };

    setSessionHistory(prev => [...prev, updatedSession]);
    setCurrentSession(null);

    // Store session in localStorage for now
    const storageKey = `coaching_history_${user?.id}`;
    const stored = localStorage.getItem(storageKey);
    const history = stored ? JSON.parse(stored) : [];
    history.push(updatedSession);
    localStorage.setItem(storageKey, JSON.stringify(history.slice(-20))); // Keep last 20 sessions

  }, [currentSession, user]);

  // Generate personalized coaching plan
  const generateCoachingPlan = useCallback(async (duration: number = 30) => {
    if (!user) return null;

    setIsAnalyzing(true);

    try {
      // Call AI planning function
      const { data: planResult, error } = await supabase.functions.invoke('advanced-ai-coaching', {
        body: {
          action: 'generate_plan',
          userId: user.id,
          duration
        }
      });

      if (error) throw error;

      const plan = planResult.plan;
      setCoachingPlan(plan);
      return plan;

    } catch (error) {
      console.error('Error generating coaching plan:', error);
      
      // Fallback with mock plan
      const mockPlan = generateMockCoachingPlan(duration);
      setCoachingPlan(mockPlan);
      return mockPlan;

    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  // Get adaptive recommendations based on progress
  const getAdaptiveRecommendations = useCallback(async () => {
    if (!user) return [];

    try {
      const { data: adaptiveResult, error } = await supabase.functions.invoke('advanced-ai-coaching', {
        body: {
          action: 'adaptive_recommendations',
          userId: user.id,
          sessionHistory: sessionHistory.slice(-5) // Last 5 sessions
        }
      });

      if (error) throw error;
      
      return adaptiveResult.recommendations || [];

    } catch (error) {
      console.error('Error getting adaptive recommendations:', error);
      return generateMockRecommendations('assessment');
    }
  }, [user, sessionHistory]);

  // Implement recommendation
  const implementRecommendation = useCallback(async (recommendationId: string) => {
    const recommendation = recommendations.find(r => r.id === recommendationId);
    if (!recommendation) return;

    // Track implementation
    if (currentSession) {
      // Update session with implemented recommendation
      const updatedSession = {
        ...currentSession,
        userFeedback: {
          ...currentSession.userFeedback,
          implementedRecommendations: [
            ...(currentSession.userFeedback?.implementedRecommendations || []),
            recommendationId
          ]
        }
      };
      setCurrentSession(updatedSession);
    }

    // Log implementation for future adaptive learning
    try {
      await supabase.functions.invoke('advanced-ai-coaching', {
        body: {
          action: 'log_implementation',
          userId: user?.id,
          recommendationId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging recommendation implementation:', error);
    }
  }, [recommendations, currentSession, user]);

  // Schedule follow-up
  const scheduleFollowUp = useCallback(async (date: Date, reminders: boolean = true) => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      followUp: {
        scheduledFor: date,
        reminders
      }
    };

    setCurrentSession(updatedSession);

    // Schedule notification (simplified)
    if (reminders) {
      console.log('Follow-up scheduled for:', date);
      // Here you would integrate with a notification system
    }
  }, [currentSession]);

  // Load session history on mount
  useEffect(() => {
    if (user) {
      const storageKey = `coaching_history_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const history = JSON.parse(stored);
        setSessionHistory(history);
      }
    }
  }, [user]);

  return {
    // State
    currentSession,
    isAnalyzing,
    recommendations,
    coachingPlan,
    sessionHistory,

    // Actions
    startCoachingSession,
    endCoachingSession,
    generateCoachingPlan,
    getAdaptiveRecommendations,
    implementRecommendation,
    scheduleFollowUp,

    // Computed
    hasActiveSession: !!currentSession,
    sessionDuration: currentSession ? Date.now() - currentSession.startTime.getTime() : 0,
    totalSessions: sessionHistory.length,
    averageSessionRating: sessionHistory.length > 0 
      ? sessionHistory.reduce((sum, s) => sum + (s.userFeedback?.rating || 0), 0) / sessionHistory.length 
      : 0
  };
};

// Mock data generators
function generateMockRecommendations(type: CoachingSession['type']): AICoachingRecommendation[] {
  const baseRecommendations = [
    {
      id: 'rec_1',
      type: 'action' as const,
      title: 'Implementera morgonrutin',
      description: 'Skapa en strukturerad morgonrutin för att öka produktivitet och välbefinnande.',
      reasoning: 'Baserat på din självvårdspoäng och rapporterade utmaningar med morgonenergi.',
      priority: 'high' as const,
      category: 'Självvård',
      estimatedTime: 30,
      difficulty: 'medium' as const,
      expectedOutcome: 'Förbättrad energi och fokus under dagen',
      metrics: ['Energinivå', 'Produktivitet', 'Humör'],
      resources: [
        {
          type: 'article' as const,
          title: 'Vetenskaplig guide till morgonrutiner',
          url: 'https://example.com/morning-routine'
        }
      ]
    },
    {
      id: 'rec_2',
      type: 'learning' as const,
      title: 'Fördjupa teknisk kompetens',
      description: 'Identifiera och utveckla en specifik teknisk färdighet inom ditt fokusområde.',
      reasoning: 'Din kompetensanalys visar potential för utveckling inom tekniska färdigheter.',
      priority: 'medium' as const,
      category: 'Kompetensutveckling',
      estimatedTime: 120,
      difficulty: 'hard' as const,
      expectedOutcome: 'Ökad teknisk expertis och marknadsvärde',
      metrics: ['Teknisk kompetens', 'Självförtroende', 'Karriärmöjligheter']
    },
    {
      id: 'rec_3',
      type: 'reflection' as const,
      title: 'Veckovis reflektion',
      description: 'Avsätt tid varje vecka för reflektion över framsteg och utmaningar.',
      reasoning: 'Regelbunden reflektion är nyckeln till kontinuerlig förbättring och självkännedom.',
      priority: 'medium' as const,
      category: 'Personlig utveckling',
      estimatedTime: 20,
      difficulty: 'easy' as const,
      expectedOutcome: 'Ökad självmedvetenhet och målklarhet',
      metrics: ['Självkännedom', 'Målklarhet', 'Personlig tillväxt']
    }
  ];

  return baseRecommendations;
}

function generateMockCoachingPlan(duration: number): PersonalizedCoachingPlan {
  const weeksCount = Math.ceil(duration / 7);
  
  return {
    userId: 'user_id',
    generatedAt: new Date(),
    duration,
    focusAreas: ['Självvård', 'Kompetensutveckling', 'Målsättning'],
    weeklyGoals: Array.from({ length: weeksCount }, (_, i) => ({
      week: i + 1,
      goals: [
        `Vecka ${i + 1}: Etablera nya rutiner`,
        `Utveckla ${['självvård', 'tekniska färdigheter', 'reflektion'][i % 3]}`
      ],
      activities: generateMockRecommendations('planning').slice(0, 2)
    })),
    milestones: [
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        description: 'Första veckans genomförande',
        successCriteria: ['Följt morgonrutin 5/7 dagar', 'Genomfört planerad reflektion']
      },
      {
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        description: 'Rutiner etablerade',
        successCriteria: ['Konsekvent morgonrutin', 'Påbörjad kompetensutveckling']
      }
    ],
    adaptationTriggers: [
      {
        condition: 'Låg genomförandegrad < 50%',
        action: 'Minska målens komplexitet och öka stöd'
      },
      {
        condition: 'Hög genomförandegrad > 90%',
        action: 'Öka utmaningsnivån och lägg till nya mål'
      }
    ]
  };
}