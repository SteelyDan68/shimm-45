export interface AssessmentFormDefinition {
  id: string;
  name: string;
  description?: string;
  assessment_type: string;
  ai_prompt_template: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentQuestion {
  id: string;
  form_definition_id: string;
  question_text: string;
  question_type: 'scale' | 'boolean' | 'multiple_choice' | 'text' | 'textarea';
  question_key: string;
  options?: any;
  min_value?: number;
  max_value?: number;
  is_required: boolean;
  weight: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentFormAssignment {
  id: string;
  client_id: string;
  form_definition_id: string;
  is_active: boolean;
  assigned_by: string;
  assigned_at: string;
  due_date?: string;
  reminder_sent: boolean;
  updated_at: string;
}

export interface AssessmentRoundNew {
  id: string;
  client_id: string;
  form_definition_id?: string;
  pillar_type?: string;
  scores: Record<string, number>;
  answers: Record<string, any>;
  comments?: string;
  ai_analysis?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}