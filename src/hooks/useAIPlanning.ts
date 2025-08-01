import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAIPlanning = (clientId?: string) => {
  const [lastRecommendation, setLastRecommendation] = useState<any>(null);
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [autonomousTasks, setAutonomousTasks] = useState<any[]>([]);
  const [taskProgress, setTaskProgress] = useState<Record<string, any>>({});
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const { toast } = useToast();

  // Listen for new recommendations and autonomous tasks
  useEffect(() => {
    if (!clientId) return;

    const checkForNewRecommendations = async () => {
      try {
        const { data, error } = await supabase
          .from('path_entries')
          .select('*')
          .eq('user_id', clientId)
          .eq('type', 'recommendation')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error checking recommendations:', error);
          return;
        }

        if (data && data.length > 0) {
          const recommendation = data[0];
          
          // Check if this is a new recommendation (created in last 10 seconds)
          const createdAt = new Date(recommendation.created_at);
          const now = new Date();
          const timeDiff = now.getTime() - createdAt.getTime();
          
          if (timeDiff < 10000) { // 10 seconds
            setLastRecommendation(recommendation);
            
            // Show planning dialog after a short delay
            setTimeout(() => {
              setShowPlanningDialog(true);
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error in checkForNewRecommendations:', error);
      }
    };

    const loadAutonomousTasks = async () => {
      try {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', clientId)
          .eq('ai_generated', true)
          .order('created_at', { ascending: false });

        if (tasksError) {
          console.error('Error loading autonomous tasks:', tasksError);
          return;
        }

        setAutonomousTasks(tasks || []);

        // Load task progress
        const progressMap: Record<string, any> = {};
        tasks?.forEach(task => {
          progressMap[task.id] = {
            completed: task.status === 'completed',
            completedAt: task.completed_at,
            deadline: task.deadline
          };
        });
        setTaskProgress(progressMap);

      } catch (error) {
        console.error('Error loading autonomous tasks:', error);
      }
    };

    // Load initial data
    checkForNewRecommendations();
    loadAutonomousTasks();

    // Set up real-time subscription for new recommendations and tasks
    const subscription = supabase
      .channel('ai-planning')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'path_entries',
          filter: `user_id=eq.${clientId}`
        },
        (payload) => {
          if (payload.new.type === 'recommendation') {
            console.log('New recommendation received:', payload.new);
            setLastRecommendation(payload.new);
            
            setTimeout(() => {
              setShowPlanningDialog(true);
            }, 2000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${clientId}`
        },
        () => {
          loadAutonomousTasks(); // Reload tasks when new ones are added
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${clientId}`
        },
        () => {
          loadAutonomousTasks(); // Reload tasks when they're updated
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clientId]);

  // Generate autonomous plan based on current assessment results
  const generateAutonomousPlan = async (recommendationText: string, weeks: number = 3) => {
    if (!clientId) return;

    setIsGeneratingPlan(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-planning', {
        body: {
          client_id: clientId,
          recommendation_text: recommendationText,
          weeks: weeks
        }
      });

      if (error) {
        console.error('Error generating autonomous plan:', error);
        toast({
          title: "Planering misslyckades",
          description: "Kunde inte generera utvecklingsplan.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Utvecklingsplan skapad!",
        description: `${data.events_created} aktiviteter och ${data.tasks_created} uppgifter har lagts till.`,
      });

      // Reload autonomous tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', clientId)
        .eq('ai_generated', true)
        .order('created_at', { ascending: false });

      setAutonomousTasks(tasks || []);

    } catch (error) {
      console.error('Error in generateAutonomousPlan:', error);
      toast({
        title: "Fel vid planering",
        description: "Ett fel inträffade vid skapandet av utvecklingsplanen.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const dismissPlanningDialog = () => {
    setShowPlanningDialog(false);
    setLastRecommendation(null);
  };

  const handlePlanCreated = () => {
    toast({
      title: "AI-plan skapad",
      description: "En strukturerad utvecklingsplan har lagts till i kalendern.",
    });
    
    // Refresh calendar or emit event for other components to update
    window.dispatchEvent(new CustomEvent('calendar-updated'));
  };

  // Mark task as completed and trigger feedback loop
  const completeTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', clientId);

      if (error) throw error;

      // Update local state
      setTaskProgress(prev => ({
        ...prev,
        [taskId]: { 
          ...prev[taskId], 
          completed: true, 
          completedAt: new Date().toISOString() 
        }
      }));

      // Trigger autonomous feedback - create path entry for completion
      await supabase
        .from('path_entries')
        .insert({
          user_id: clientId,
          created_by: clientId!,
          type: 'task_completion',
          title: 'Uppgift slutförd',
          details: 'Användaren slutförde en AI-genererad uppgift',
          ai_generated: true,
          linked_task_id: taskId,
          metadata: { autonomous_completion: true }
        });

      toast({
        title: "Uppgift slutförd!",
        description: "Bra jobbat! Stefan analyserar dina framsteg.",
      });

    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Fel",
        description: "Kunde inte markera uppgiften som slutförd.",
        variant: "destructive"
      });
    }
  };

  // Get autonomy metrics for dashboard
  const getAutonomyMetrics = () => {
    const totalTasks = autonomousTasks.length;
    const completedTasks = autonomousTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate streak
    const completedTasksSorted = autonomousTasks
      .filter(task => task.status === 'completed')
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

    let currentStreak = 0;
    const today = new Date();
    for (const task of completedTasksSorted) {
      const completedDate = new Date(task.completed_at);
      const daysDiff = Math.floor((today.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= currentStreak + 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      currentStreak
    };
  };

  return {
    lastRecommendation,
    showPlanningDialog,
    autonomousTasks,
    taskProgress,
    isGeneratingPlan,
    dismissPlanningDialog,
    handlePlanCreated,
    generateAutonomousPlan,
    completeTask,
    getAutonomyMetrics
  };
};