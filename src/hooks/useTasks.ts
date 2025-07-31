import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Task, CreateTaskData, TaskFilters, TaskStatus } from '@/types/tasks';

export const useTasks = (clientId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>({});
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('client_id', clientId)
        .order('deadline', { ascending: true, nullsFirst: false });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }
      if (filters.ai_generated !== undefined) {
        query = query.eq('ai_generated', filters.ai_generated);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredTasks = (data || []) as Task[];

      // Apply overdue filter client-side
      if (filters.overdue) {
        const now = new Date();
        filteredTasks = filteredTasks.filter(task => 
          task.deadline && 
          new Date(task.deadline) < now && 
          task.status !== 'completed'
        );
      }

      setTasks(filteredTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta uppgifter",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: CreateTaskData): Promise<Task | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ingen autentiserad användare');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          created_by: user.id,
          priority: taskData.priority || 'medium',
          ai_generated: taskData.ai_generated || false
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Uppgift skapad",
        description: "Ny uppgift har lagts till"
      });

      fetchTasks(); // Refresh the list
      return data as Task;
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa uppgift",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Uppgift uppdaterad",
        description: "Uppgiften har uppdaterats"
      });

      fetchTasks(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera uppgift",
        variant: "destructive"
      });
      return false;
    }
  };

  const completeTask = async (taskId: string): Promise<boolean> => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Uppgift hittades inte');

      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed' as TaskStatus,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Create path_entry for check-in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ingen autentiserad användare');

      const { error: pathError } = await supabase
        .from('path_entries')
        .insert([{
          client_id: task.client_id,
          created_by: user.id,
          type: 'check-in',
          title: `Uppgift genomförd: ${task.title}`,
          details: task.description,
          status: 'completed',
          ai_generated: false
        }]);

      if (pathError) {
        console.error('Path entry error:', pathError);
        // Don't throw here - task completion is more important
      }

      // Update velocity score
      const { data: client, error: clientError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', task.client_id)
        .single();

      if (!clientError && client) {
        const currentScore = (client.preferences as any)?.velocity_score || 50;
        const priorityBonus = task.priority === 'high' ? 15 : task.priority === 'medium' ? 10 : 5;
        const aiBonus = task.ai_generated ? 5 : 0;
        const newScore = Math.min(100, currentScore + priorityBonus + aiBonus);

        // Update velocity score in preferences
        const updatedPreferences = { 
          ...(client.preferences as any), 
          velocity_score: newScore 
        };

        await supabase
          .from('profiles')
          .update({ preferences: updatedPreferences })
          .eq('id', task.client_id);
      }

      toast({
        title: "Uppgift genomförd! 🎉",
        description: "Din velocity-poäng har ökat"
      });

      fetchTasks(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({
        title: "Fel",
        description: "Kunde inte markera uppgift som genomförd",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Uppgift raderad",
        description: "Uppgiften har tagits bort"
      });

      fetchTasks(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Fel",
        description: "Kunde inte radera uppgift",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [clientId, filters]);

  return {
    tasks,
    loading,
    filters,
    setFilters,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    refreshTasks: fetchTasks
  };
};