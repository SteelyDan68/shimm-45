export type ContainerType = 
  | 'assessment_record'
  | 'progress_timeline' 
  | 'intervention_plan'
  | 'coaching_session'
  | 'pillar_analysis'
  | 'habit_tracking'
  | 'milestone_record';

export interface ClientDataContainer {
  id: string;
  client_id: string;
  container_type: ContainerType;
  xml_content: string;
  metadata: Record<string, any>;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContainerData {
  client_id: string;
  container_type: ContainerType;
  xml_content: string;
  metadata?: Record<string, any>;
}

export interface ContainerMetadata {
  source_tables?: string[];
  aggregation_date?: string;
  data_version?: string;
  schema_version?: string;
  related_containers?: string[];
  tags?: string[];
}

export interface XMLSchemaDefinition {
  container_type: ContainerType;
  version: string;
  root_element: string;
  namespace?: string;
  description: string;
  elements: XMLElement[];
}

export interface XMLElement {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
  children?: XMLElement[];
  attributes?: XMLAttribute[];
}

export interface XMLAttribute {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  description?: string;
}