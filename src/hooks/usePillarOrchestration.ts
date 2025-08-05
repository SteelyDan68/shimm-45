import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PillarKey } from '@/types/sixPillarsModular';

export interface PillarProgress {
  pillarKey: PillarKey;
  isCompleted: boolean;
  isActive: boolean;
  lastAssessmentDate?: string;
  completionPercentage: number;
  nextRecommendedAction?: string;
}

export interface DevelopmentPlan {
  id: string;
  pillarKey: PillarKey;
  totalActivities: number;
  completedActivities: number;
  estimatedCompletionDate: string;
  currentWeek: number;
  totalWeeks: number;
  lastActivityDate?: string;
}

export const usePillarOrchestration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pillarProgress, setPillarProgress] = useState<PillarProgress[]>([]);
  const [activeDevelopmentPlans, setActiveDevelopmentPlans] = useState<DevelopmentPlan[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const loadPillarProgress = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch latest assessments from attribute system
      const { data: assessmentData, error: assessmentsError } = await supabase.functions.invoke('get-user-attribute', {
        body: {
          user_id: user.id,
          attribute_key: 'pillar_assessments'
        }
      });

      const assessments = Array.isArray(assessmentData?.data) ? assessmentData.data : [];

      if (assessmentsError) throw assessmentsError;

      // Fetch task progress for development plans  
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Process data to create pillar progress
      const allPillars: PillarKey[] = ['self_care', 'skills', 'talent', 'brand', 'economy', 'open_track'];
      
      const progressData: PillarProgress[] = allPillars.map(pillarKey => {
        const latestAssessment = assessments?.find(a => a.pillar_key === pillarKey);
        const pillarTasks = tasks?.filter(t => detectPillarFromTask(t) === pillarKey) || [];
        
        const completedTasks = pillarTasks.filter(t => t.status === 'completed').length;
        const totalTasks = pillarTasks.length;
        
        return {
          pillarKey,
          isCompleted: !!latestAssessment && latestAssessment.calculated_score !== null,
          isActive: !!latestAssessment,
          lastAssessmentDate: latestAssessment?.created_at,
          completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          nextRecommendedAction: getNextRecommendedAction(
            pillarKey, 
            !!latestAssessment, 
            !!latestAssessment && latestAssessment.calculated_score !== null, 
            pillarTasks
          )
        };
      });

      setPillarProgress(progressData);

      // Calculate overall progress
      const completedPillars = progressData.filter(p => p.isCompleted).length;
      setOverallProgress((completedPillars / allPillars.length) * 100);

      // Process development plans
      const plans = await processDevelopmentPlans(tasks || []);
      setActiveDevelopmentPlans(plans);

    } catch (error) {
      console.error('Error loading pillar progress:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda pillar-progress. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const getNextRecommendedAction = (
    pillarKey: PillarKey, 
    isActive: boolean, 
    isCompleted: boolean, 
    tasks: any[]
  ): string => {
    if (!isActive && !isCompleted) {
      return "Starta pillar-assessment";
    }
    
    if (isActive && !isCompleted) {
      return "Genomför assessment";
    }
    
    if (isCompleted) {
      const pendingTasks = tasks.filter(t => t.status === 'pending');
      if (pendingTasks.length > 0) {
        return `Genomför ${pendingTasks.length} aktiviteter`;
      }
      return "Pillar klar - bra jobbat!";
    }
    
    return "Okänt status";
  };

  const processDevelopmentPlans = async (tasks: any[]): Promise<DevelopmentPlan[]> => {
    const pillarGroups = tasks.reduce((acc, task) => {
      if (!task.title) return acc;
      
      // Simple pillar detection based on task title or metadata
      const pillarKey = detectPillarFromTask(task);
      if (!pillarKey) return acc;
      
      if (!acc[pillarKey]) {
        acc[pillarKey] = [];
      }
      acc[pillarKey].push(task);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(pillarGroups).map(([pillarKey, pillarTasks]: [string, any[]]) => {
      const completedTasks = pillarTasks.filter((t: any) => t.status === 'completed');
      const oldestTask = [...pillarTasks].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
      const newestTask = [...pillarTasks].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      // Estimate plan duration based on task spread
      const startDate = new Date(oldestTask?.created_at || Date.now());
      const endDate = new Date(newestTask?.deadline || Date.now());
      const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const currentWeek = Math.ceil((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      return {
        id: `plan_${pillarKey}`,
        pillarKey: pillarKey as PillarKey,
        totalActivities: pillarTasks.length,
        completedActivities: completedTasks.length,
        estimatedCompletionDate: endDate.toISOString(),
        currentWeek: Math.max(1, Math.min(currentWeek, totalWeeks)),
        totalWeeks,
        lastActivityDate: completedTasks[0]?.updated_at
      };
    });
  };

  const detectPillarFromTask = (task: any): PillarKey | null => {
    // Check the pillar field first (from new schema)
    if (task.pillar) {
      return task.pillar as PillarKey;
    }
    
    // Fallback to title analysis
    const title = task.title?.toLowerCase() || '';
    
    if (title.includes('self_care') || title.includes('hälsa') || title.includes('välmående')) return 'self_care';
    if (title.includes('skills') || title.includes('färdigheter') || title.includes('kompetens')) return 'skills';
    if (title.includes('talent') || title.includes('talang') || title.includes('begåvning')) return 'talent';
    if (title.includes('brand') || title.includes('varumärke') || title.includes('profil')) return 'brand';
    if (title.includes('economy') || title.includes('ekonomi') || title.includes('finans')) return 'economy';
    if (title.includes('open_track') || title.includes('öppet spår') || title.includes('annat')) return 'open_track';
    
    return null;
  };

  const activatePillar = async (pillarKey: PillarKey) => {
    if (!user?.id) return false;

    try {
      // Use attribute system for activation
      const currentAssessments = await supabase.functions.invoke('get-user-attribute', {
        body: {
          user_id: user.id,
          attribute_key: 'pillar_assessments'
        }
      });

      const assessments = currentAssessments.data?.attribute_value || [];
      assessments.push({
        id: crypto.randomUUID(),
        user_id: user.id,
        pillar_key: pillarKey,
        assessment_data: { activated: true, activation_date: new Date().toISOString() },
        insights: {},
        created_by: user.id,
        created_at: new Date().toISOString()
      });

      const { error: assessmentError } = await supabase.functions.invoke('update-user-attribute', {
        body: {
          user_id: user.id,
          attribute_key: 'pillar_assessments',
          attribute_value: assessments
        }
      });

      if (assessmentError) throw assessmentError;

      await loadPillarProgress();
      
      toast({
        title: "Pillar aktiverad",
        description: `${pillarKey} är nu aktiv för dig!`,
      });

      return true;
    } catch (error) {
      console.error('Error activating pillar:', error);
      toast({
        title: "Fel vid aktivering",
        description: "Kunde inte aktivera pillar. Försök igen.",
        variant: "destructive",
      });
      return false;
    }
  };

  const completePillarAssessment = async (pillarKey: PillarKey, assessmentData: Record<string, any>) => {
    if (!user?.id) return false;

    try {
      // Use attribute system for assessment completion
      const currentAssessments = await supabase.functions.invoke('get-user-attribute', {
        body: {
          user_id: user.id,
          attribute_key: 'pillar_assessments'
        }
      });

      const assessments = currentAssessments.data?.attribute_value || [];
      assessments.push({
        id: crypto.randomUUID(),
        user_id: user.id,
        pillar_key: pillarKey,
        assessment_data: assessmentData,
        insights: {},
        created_by: user.id,
        created_at: new Date().toISOString()
      });

      const { error: assessmentError } = await supabase.functions.invoke('update-user-attribute', {
        body: {
          user_id: user.id,
          attribute_key: 'pillar_assessments',
          attribute_value: assessments
        }
      });

      if (assessmentError) throw assessmentError;

      // Trigger AI analysis
      const { error: analysisError } = await supabase.functions.invoke('analyze-pillar-assessment', {
        body: {
          userId: user.id,
          pillarKey,
          assessmentData
        }
      });

      if (analysisError) {
        console.warn('AI analysis failed but assessment saved:', analysisError);
      }

      await loadPillarProgress();
      
      toast({
        title: "Assessment sparat",
        description: `Din ${pillarKey} assessment är genomförd!`,
      });

      return true;
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast({
        title: "Fel vid sparande",
        description: "Kunde inte spara assessment. Försök igen.",
        variant: "destructive",
      });
      return false;
    }
  };

  const markTaskCompleted = async (taskId: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadPillarProgress();
      
      toast({
        title: "Aktivitet klar! 🎉",
        description: "Bra jobbat! Din framsteg uppdateras.",
      });

      return true;
    } catch (error) {
      console.error('Error marking task completed:', error);
      toast({
        title: "Fel vid uppdatering",
        description: "Kunde inte markera som klar. Försök igen.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getPillarStatus = (pillarKey: PillarKey) => {
    const progress = pillarProgress.find(p => p.pillarKey === pillarKey);
    if (!progress) return 'not_started';
    
    if (progress.isCompleted && progress.completionPercentage >= 80) {
      return 'completed';
    } else if (progress.isActive || progress.isCompleted) {
      return 'in_progress';
    } else {
      return 'not_started';
    }
  };

  const getNextUnlockedPillar = (): PillarKey | null => {
    const pillarOrder: PillarKey[] = ['self_care', 'skills', 'talent', 'brand', 'economy', 'open_track'];
    
    for (const pillar of pillarOrder) {
      const status = getPillarStatus(pillar);
      if (status === 'not_started') {
        return pillar;
      }
    }
    
    return null; // All pillars completed
  };

  const getCompletedPillars = (): PillarKey[] => {
    return pillarProgress
      .filter(progress => progress.isCompleted)
      .map(progress => progress.pillarKey);
  };

  const hasCompletedAssessment = (pillarKey: PillarKey): boolean => {
    return pillarProgress.some(progress => 
      progress.pillarKey === pillarKey && progress.isCompleted
    );
  };

  const canAccessPillar = (pillarKey: PillarKey): boolean => {
    const pillarOrder: PillarKey[] = ['self_care', 'skills', 'talent', 'brand', 'economy', 'open_track'];
    const currentIndex = pillarOrder.indexOf(pillarKey);
    
    if (currentIndex === 0) return true; // First pillar always accessible
    
    const previousPillar = pillarOrder[currentIndex - 1];
    const previousStatus = getPillarStatus(previousPillar);
    
    return previousStatus === 'completed' || previousStatus === 'in_progress';
  };

  useEffect(() => {
    loadPillarProgress();
  }, [loadPillarProgress]);

  return {
    loading,
    pillarProgress,
    activeDevelopmentPlans,
    overallProgress,
    activatePillar,
    completePillarAssessment,
    markTaskCompleted,
    getPillarStatus,
    getNextUnlockedPillar,
    canAccessPillar,
    getCompletedPillars,
    hasCompletedAssessment,
    refreshProgress: loadPillarProgress
  };
};