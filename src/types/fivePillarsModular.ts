export type PillarKey = 'self_care' | 'skills' | 'talent' | 'brand' | 'economy';

export interface PillarDefinition {
  id: string;
  pillar_key: PillarKey;
  name: string;
  description?: string;
  icon?: string;
  color_code: string;
  ai_prompt_template: string;
  scoring_weights: Record<string, number>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ClientPillarActivation {
  id: string;
  client_id: string;
  pillar_key: PillarKey;
  is_active: boolean;
  activated_by: string;
  activated_at: string;
  deactivated_at?: string;
  updated_at: string;
}

export interface PillarAssessment {
  id: string;
  client_id: string;
  pillar_key: PillarKey;
  assessment_data: Record<string, any>;
  calculated_score?: number; // 1-10 score
  ai_analysis?: string;
  insights: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PillarVisualizationData {
  id: string;
  client_id: string;
  pillar_key: PillarKey;
  data_type: 'trend' | 'breakdown' | 'comparison' | 'progress';
  data_points: any[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface PillarHeatmapData {
  pillar_key: PillarKey;
  name: string;
  icon: string;
  color_code: string;
  score: number; // 1-10
  trend: 'up' | 'down' | 'stable';
  last_assessment: string;
  is_active: boolean;
}

export interface PillarModuleConfig {
  key: PillarKey;
  name: string;
  description: string;
  icon: string;
  color: string;
  questions: PillarQuestion[];
  scoreCalculation: (answers: Record<string, any>) => number;
  insightGeneration: (answers: Record<string, any>, score: number) => Record<string, any>;
}

export interface PillarQuestion {
  key: string;
  text: string;
  type: 'scale' | 'slider' | 'boolean' | 'multiple_choice' | 'text';
  options?: string[];
  min?: number;
  max?: number;
  weight?: number;
}