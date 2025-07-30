export type PathEntryType = 'assessment' | 'recommendation' | 'task_completed' | 'check-in' | 'summary' | 'action' | 'note' | 'manual_note';
export type PathEntryStatus = 'planned' | 'in_progress' | 'completed';
export type PillarType = 'self_care' | 'skills' | 'talent' | 'brand' | 'economy';

export interface PathEntry {
  id: string;
  client_id: string;
  created_by: string;
  timestamp: string;
  type: PathEntryType;
  title: string;
  details?: string;
  content?: string;
  status: PathEntryStatus;
  linked_task_id?: string;
  ai_generated: boolean;
  visible_to_client?: boolean;
  created_by_role?: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    pillar_type?: PillarType;
    pillar_name?: string;
    assessment_score?: number;
    assessment_id?: string;
    [key: string]: any;
  };
}

export interface PathFilters {
  type?: PathEntryType[];
  status?: PathEntryStatus[];
  pillar?: PillarType[];
  startDate?: Date;
  endDate?: Date;
  aiGenerated?: boolean;
  daysPeriod?: number; // För senaste X dagar
}

export interface CreatePathEntryData {
  client_id: string;
  timestamp?: string;
  type: PathEntryType;
  title: string;
  details?: string;
  content?: string;
  status?: PathEntryStatus;
  linked_task_id?: string;
  ai_generated?: boolean;
  visible_to_client?: boolean;
  created_by_role?: string;
  metadata?: Record<string, any>;
}

export interface TimelineEntry extends PathEntry {
  pillarInfo?: {
    type: PillarType;
    name: string;
    color: string;
    icon: string;
  };
  shortExcerpt: string;
}