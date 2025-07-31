// XML Container types for longitudinal client data storage

export interface ClientDataContainer {
  id: string;
  client_id: string;
  container_type: ContainerType;
  xml_content: string; // XML as string
  metadata: Record<string, any>;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export type ContainerType = 
  | 'assessment_bundle'
  | 'progress_timeline' 
  | 'intervention_record'
  | 'coaching_session'
  | 'habit_tracking'
  | 'pillar_analysis'
  | 'milestone_record';

// XML Schema definitions for different container types
export const XML_SCHEMAS = {
  assessment_bundle: `
    <client_assessment xmlns="http://coaching-platform.com/schemas/v1">
      <metadata>
        <assessment_id></assessment_id>
        <assessment_type></assessment_type>
        <date_conducted></date_conducted>
        <conducted_by></conducted_by>
      </metadata>
      <results>
        <pillar_scores></pillar_scores>
        <raw_responses></raw_responses>
        <ai_analysis></ai_analysis>
      </results>
      <recommendations>
        <immediate_actions></immediate_actions>
        <long_term_goals></long_term_goals>
      </recommendations>
    </client_assessment>
  `,
  
  progress_timeline: `
    <progress_timeline xmlns="http://coaching-platform.com/schemas/v1">
      <metadata>
        <period_start></period_start>
        <period_end></period_end>
        <milestone_type></milestone_type>
      </metadata>
      <entries>
        <entry>
          <timestamp></timestamp>
          <event_type></event_type>
          <description></description>
          <metrics></metrics>
          <notes></notes>
        </entry>
      </entries>
    </progress_timeline>
  `,
  
  intervention_record: `
    <intervention_record xmlns="http://coaching-platform.com/schemas/v1">
      <metadata>
        <intervention_id></intervention_id>
        <intervention_type></intervention_type>
        <date_initiated></date_initiated>
        <coach_id></coach_id>
      </metadata>
      <plan>
        <objectives></objectives>
        <methods></methods>
        <timeline></timeline>
      </plan>
      <outcomes>
        <progress_indicators></progress_indicators>
        <client_feedback></client_feedback>
        <effectiveness_score></effectiveness_score>
      </outcomes>
    </intervention_record>
  `,
  
  coaching_session: `
    <coaching_session xmlns="http://coaching-platform.com/schemas/v1">
      <metadata>
        <session_id></session_id>
        <date></date>
        <duration></duration>
        <format></format>
      </metadata>
      <content>
        <agenda></agenda>
        <discussion_points></discussion_points>
        <client_insights></client_insights>
        <action_items></action_items>
      </content>
      <follow_up>
        <next_session></next_session>
        <homework></homework>
        <check_in_schedule></check_in_schedule>
      </follow_up>
    </coaching_session>
  `
};

export interface ContainerMetadata {
  source_table?: string;
  source_ids?: string[];
  data_version?: string;
  aggregation_date?: string;
  related_containers?: string[];
  tags?: string[];
}