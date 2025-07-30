export type TaskStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  client_id: string;
  created_by: string;
  source_path_entry_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  completed_at?: string;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  client_id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string;
  ai_generated?: boolean;
  source_path_entry_id?: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  overdue?: boolean;
  ai_generated?: boolean;
}