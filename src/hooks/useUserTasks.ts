import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Task, CreateTaskData, TaskFilters } from '@/types/tasks';

export const useUserTasks = (userId: string, filters?: TaskFilters) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!userId) return;

    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters?.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }
      if (filters?.ai_generated !== undefined) {
        query = query.eq('ai_generated', filters.ai_generated);
      }
      if (filters?.overdue) {
        query = query.lt('deadline', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data as Task[] || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userId, filters]);

  const createTask = async (taskData: Omit<CreateTaskData, 'user_id'>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: userId,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Success",
        description: "Task created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const completeTask = async (taskId: string) => {
    await updateTask(taskId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  };

  const getTaskCounts = () => {
    return {
      total: tasks.length,
      planned: tasks.filter(t => t.status === 'planned').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => 
        t.deadline && 
        new Date(t.deadline) < new Date() && 
        t.status !== 'completed'
      ).length,
    };
  };

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    getTaskCounts,
    refetch: fetchTasks,
  };
};