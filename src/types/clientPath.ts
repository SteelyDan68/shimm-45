export type PathEntryType = 'assessment' | 'recommendation' | 'action' | 'note' | 'check-in';
export type PathEntryStatus = 'planned' | 'in_progress' | 'completed';

export interface PathEntry {
  id: string;
  client_id: string;
  created_by: string;
  timestamp: string;
  type: PathEntryType;
  title: string;
  details?: string;
  status: PathEntryStatus;
  linked_task_id?: string;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface PathFilters {
  type?: PathEntryType[];
  status?: PathEntryStatus[];
  startDate?: Date;
  endDate?: Date;
  aiGenerated?: boolean;
}

export interface CreatePathEntryData {
  client_id: string;
  timestamp?: string;
  type: PathEntryType;
  title: string;
  details?: string;
  status?: PathEntryStatus;
  linked_task_id?: string;
  ai_generated?: boolean;
}