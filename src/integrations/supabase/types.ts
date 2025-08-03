export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_coaching_analytics: {
        Row: {
          created_at: string
          id: string
          metric_data: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_data?: Json | null
          metric_type: string
          metric_value: number
          recorded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_data?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_coaching_plans: {
        Row: {
          adaptation_triggers: Json
          created_at: string
          duration: number
          expires_at: string | null
          focus_areas: Json
          generated_at: string
          id: string
          milestones: Json
          status: string
          updated_at: string
          user_id: string
          weekly_goals: Json
        }
        Insert: {
          adaptation_triggers: Json
          created_at?: string
          duration?: number
          expires_at?: string | null
          focus_areas: Json
          generated_at?: string
          id?: string
          milestones: Json
          status?: string
          updated_at?: string
          user_id: string
          weekly_goals: Json
        }
        Update: {
          adaptation_triggers?: Json
          created_at?: string
          duration?: number
          expires_at?: string | null
          focus_areas?: Json
          generated_at?: string
          id?: string
          milestones?: Json
          status?: string
          updated_at?: string
          user_id?: string
          weekly_goals?: Json
        }
        Relationships: []
      }
      ai_coaching_recommendations: {
        Row: {
          ai_adaptation_notes: string | null
          category: string
          completion_rate: number | null
          created_at: string
          dependencies: Json | null
          description: string
          difficulty: string
          due_date: string | null
          estimated_time_minutes: number
          expected_outcome: string
          id: string
          implementation_date: string | null
          priority: string
          reasoning: string
          recommendation_type: string
          resources: Json | null
          session_id: string | null
          status: string
          success_metrics: Json | null
          superseded_by: string | null
          title: string
          updated_at: string
          user_id: string
          user_notes: string | null
          user_rating: number | null
          version: number
        }
        Insert: {
          ai_adaptation_notes?: string | null
          category: string
          completion_rate?: number | null
          created_at?: string
          dependencies?: Json | null
          description: string
          difficulty: string
          due_date?: string | null
          estimated_time_minutes?: number
          expected_outcome: string
          id?: string
          implementation_date?: string | null
          priority: string
          reasoning: string
          recommendation_type: string
          resources?: Json | null
          session_id?: string | null
          status?: string
          success_metrics?: Json | null
          superseded_by?: string | null
          title: string
          updated_at?: string
          user_id: string
          user_notes?: string | null
          user_rating?: number | null
          version?: number
        }
        Update: {
          ai_adaptation_notes?: string | null
          category?: string
          completion_rate?: number | null
          created_at?: string
          dependencies?: Json | null
          description?: string
          difficulty?: string
          due_date?: string | null
          estimated_time_minutes?: number
          expected_outcome?: string
          id?: string
          implementation_date?: string | null
          priority?: string
          reasoning?: string
          recommendation_type?: string
          resources?: Json | null
          session_id?: string | null
          status?: string
          success_metrics?: Json | null
          superseded_by?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          user_notes?: string | null
          user_rating?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_coaching_recommendations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_coaching_recommendations_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "ai_coaching_recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_coaching_sessions: {
        Row: {
          context: Json | null
          created_at: string
          end_time: string | null
          follow_up: Json | null
          id: string
          recommendations: Json | null
          session_type: string
          start_time: string
          updated_at: string
          user_feedback: Json | null
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          end_time?: string | null
          follow_up?: Json | null
          id?: string
          recommendations?: Json | null
          session_type: string
          start_time?: string
          updated_at?: string
          user_feedback?: Json | null
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          end_time?: string | null
          follow_up?: Json | null
          id?: string
          recommendations?: Json | null
          session_type?: string
          start_time?: string
          updated_at?: string
          user_feedback?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          category: string
          created_at: string
          dependencies: Json | null
          description: string
          difficulty: string
          due_date: string | null
          estimated_time: number
          expected_outcome: string
          id: string
          implemented_at: string | null
          metrics: Json | null
          priority: string
          reasoning: string
          resources: Json | null
          session_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          dependencies?: Json | null
          description: string
          difficulty: string
          due_date?: string | null
          estimated_time?: number
          expected_outcome: string
          id?: string
          implemented_at?: string | null
          metrics?: Json | null
          priority: string
          reasoning: string
          resources?: Json | null
          session_id?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          dependencies?: Json | null
          description?: string
          difficulty?: string
          due_date?: string | null
          estimated_time?: number
          expected_outcome?: string
          id?: string
          implemented_at?: string | null
          metrics?: Json | null
          priority?: string
          reasoning?: string
          resources?: Json | null
          session_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_coaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_aggregations: {
        Row: {
          avg_value: number | null
          created_at: string
          date: string
          event_count: number | null
          event_type: string
          id: string
          properties: Json | null
          updated_at: string
          user_count: number | null
        }
        Insert: {
          avg_value?: number | null
          created_at?: string
          date: string
          event_count?: number | null
          event_type: string
          id?: string
          properties?: Json | null
          updated_at?: string
          user_count?: number | null
        }
        Update: {
          avg_value?: number | null
          created_at?: string
          date?: string
          event_count?: number | null
          event_type?: string
          id?: string
          properties?: Json | null
          updated_at?: string
          user_count?: number | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          page_url: string | null
          properties: Json | null
          session_id: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          page_url?: string | null
          properties?: Json | null
          session_id: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          page_url?: string | null
          properties?: Json | null
          session_id?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      assessment_events: {
        Row: {
          assessment_state_id: string | null
          event_data: Json
          event_type: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          assessment_state_id?: string | null
          event_data?: Json
          event_type: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          assessment_state_id?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_events_assessment_state_id_fkey"
            columns: ["assessment_state_id"]
            isOneToOne: false
            referencedRelation: "assessment_states"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_form_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          due_date: string | null
          form_definition_id: string
          id: string
          is_active: boolean
          reminder_sent: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          due_date?: string | null
          form_definition_id: string
          id?: string
          is_active?: boolean
          reminder_sent?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          due_date?: string | null
          form_definition_id?: string
          id?: string
          is_active?: boolean
          reminder_sent?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_form_assignments_form_definition_id_fkey"
            columns: ["form_definition_id"]
            isOneToOne: false
            referencedRelation: "assessment_form_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_form_definitions: {
        Row: {
          ai_prompt_template: string
          assessment_type: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          ai_prompt_template: string
          assessment_type: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          ai_prompt_template?: string
          assessment_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessment_questions: {
        Row: {
          created_at: string
          form_definition_id: string
          id: string
          is_required: boolean
          max_value: number | null
          min_value: number | null
          options: Json | null
          question_key: string
          question_text: string
          question_type: string
          sort_order: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          form_definition_id: string
          id?: string
          is_required?: boolean
          max_value?: number | null
          min_value?: number | null
          options?: Json | null
          question_key: string
          question_text: string
          question_type: string
          sort_order?: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          form_definition_id?: string
          id?: string
          is_required?: boolean
          max_value?: number | null
          min_value?: number | null
          options?: Json | null
          question_key?: string
          question_text?: string
          question_type?: string
          sort_order?: number
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_form_definition_id_fkey"
            columns: ["form_definition_id"]
            isOneToOne: false
            referencedRelation: "assessment_form_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_rounds: {
        Row: {
          ai_analysis: string | null
          answers: Json
          comments: string | null
          created_at: string
          created_by: string
          form_definition_id: string | null
          id: string
          pillar_type: string
          scores: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_analysis?: string | null
          answers?: Json
          comments?: string | null
          created_at?: string
          created_by: string
          form_definition_id?: string | null
          id?: string
          pillar_type: string
          scores?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_analysis?: string | null
          answers?: Json
          comments?: string | null
          created_at?: string
          created_by?: string
          form_definition_id?: string | null
          id?: string
          pillar_type?: string
          scores?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_rounds_form_definition_id_fkey"
            columns: ["form_definition_id"]
            isOneToOne: false
            referencedRelation: "assessment_form_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_states: {
        Row: {
          abandoned_at: string | null
          assessment_key: string | null
          assessment_type: string
          auto_save_count: number
          completed_at: string | null
          created_at: string
          current_step: string
          form_data: Json
          id: string
          is_draft: boolean
          last_saved_at: string
          metadata: Json
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abandoned_at?: string | null
          assessment_key?: string | null
          assessment_type: string
          auto_save_count?: number
          completed_at?: string | null
          created_at?: string
          current_step: string
          form_data?: Json
          id?: string
          is_draft?: boolean
          last_saved_at?: string
          metadata?: Json
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          abandoned_at?: string | null
          assessment_key?: string | null
          assessment_type?: string
          auto_save_count?: number
          completed_at?: string | null
          created_at?: string
          current_step?: string
          form_data?: Json
          id?: string
          is_draft?: boolean
          last_saved_at?: string
          metadata?: Json
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      autonomous_triggers: {
        Row: {
          action_taken: string | null
          ai_intervention: Json | null
          condition_met_at: string
          created_at: string
          id: string
          resolution_status: string
          resolved_at: string | null
          trigger_data: Json
          trigger_type: string
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          ai_intervention?: Json | null
          condition_met_at?: string
          created_at?: string
          id?: string
          resolution_status?: string
          resolved_at?: string | null
          trigger_data?: Json
          trigger_type: string
          user_id: string
        }
        Update: {
          action_taken?: string | null
          ai_intervention?: Json | null
          condition_met_at?: string
          created_at?: string
          id?: string
          resolution_status?: string
          resolved_at?: string | null
          trigger_data?: Json
          trigger_type?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          category: string
          created_at: string
          created_by: string
          created_by_role: string
          description: string | null
          event_date: string
          id: string
          title: string
          updated_at: string
          user_id: string | null
          visible_to_client: boolean
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          created_by_role: string
          description?: string | null
          event_date: string
          id?: string
          title: string
          updated_at?: string
          user_id?: string | null
          visible_to_client?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          created_by_role?: string
          description?: string | null
          event_date?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          visible_to_client?: boolean
        }
        Relationships: []
      }
      client_data_cache: {
        Row: {
          author: string | null
          client_id: string | null
          competitive_insights: Json | null
          created_at: string
          data: Json
          data_quality_score: number | null
          data_type: string
          expires_at: string | null
          id: string
          image: string | null
          last_sentiment_analysis: Json | null
          metadata: Json | null
          platform: string | null
          snippet: string | null
          source: string
          title: string | null
          url: string | null
        }
        Insert: {
          author?: string | null
          client_id?: string | null
          competitive_insights?: Json | null
          created_at?: string
          data: Json
          data_quality_score?: number | null
          data_type: string
          expires_at?: string | null
          id?: string
          image?: string | null
          last_sentiment_analysis?: Json | null
          metadata?: Json | null
          platform?: string | null
          snippet?: string | null
          source: string
          title?: string | null
          url?: string | null
        }
        Update: {
          author?: string | null
          client_id?: string | null
          competitive_insights?: Json | null
          created_at?: string
          data?: Json
          data_quality_score?: number | null
          data_type?: string
          expires_at?: string | null
          id?: string
          image?: string | null
          last_sentiment_analysis?: Json | null
          metadata?: Json | null
          platform?: string | null
          snippet?: string | null
          source?: string
          title?: string | null
          url?: string | null
        }
        Relationships: []
      }
      client_data_containers: {
        Row: {
          container_type: string
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          updated_at: string
          user_id: string | null
          version: number
          xml_content: unknown
        }
        Insert: {
          container_type: string
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string | null
          version?: number
          xml_content: unknown
        }
        Update: {
          container_type?: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string | null
          version?: number
          xml_content?: unknown
        }
        Relationships: []
      }
      client_pillar_activations: {
        Row: {
          activated_at: string
          activated_by: string
          client_id: string | null
          deactivated_at: string | null
          id: string
          is_active: boolean
          pillar_key: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string
          activated_by: string
          client_id?: string | null
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          pillar_key: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string
          activated_by?: string
          client_id?: string | null
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          pillar_key?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      client_pillar_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          client_id: string
          id: string
          is_active: boolean
          pillar_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          client_id: string
          id?: string
          is_active?: boolean
          pillar_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          client_id?: string
          id?: string
          is_active?: boolean
          pillar_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      coach_client_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          client_id: string
          coach_id: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      coach_insights: {
        Row: {
          acknowledged_at: string | null
          action_points: Json
          ai_generated: boolean
          client_id: string
          coach_id: string
          created_at: string
          data_sources: Json
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          action_points?: Json
          ai_generated?: boolean
          client_id: string
          coach_id: string
          created_at?: string
          data_sources?: Json
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          action_points?: Json
          ai_generated?: boolean
          client_id?: string
          coach_id?: string
          created_at?: string
          data_sources?: Json
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      coaching_analytics: {
        Row: {
          created_at: string
          id: string
          metric_data: Json | null
          metric_type: string
          metric_value: number | null
          recommendation_id: string | null
          recorded_at: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_data?: Json | null
          metric_type: string
          metric_value?: number | null
          recommendation_id?: string | null
          recorded_at?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_data?: Json | null
          metric_type?: string
          metric_value?: number | null
          recommendation_id?: string | null
          recorded_at?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_analytics_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "ai_coaching_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_milestones: {
        Row: {
          ai_assessment: string | null
          completion_date: string | null
          created_at: string
          description: string
          id: string
          milestone_date: string
          plan_id: string | null
          status: string
          success_criteria: Json
          title: string
          updated_at: string
          user_reflection: string | null
        }
        Insert: {
          ai_assessment?: string | null
          completion_date?: string | null
          created_at?: string
          description: string
          id?: string
          milestone_date: string
          plan_id?: string | null
          status?: string
          success_criteria?: Json
          title: string
          updated_at?: string
          user_reflection?: string | null
        }
        Update: {
          ai_assessment?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string
          id?: string
          milestone_date?: string
          plan_id?: string | null
          status?: string
          success_criteria?: Json
          title?: string
          updated_at?: string
          user_reflection?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_milestones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "coaching_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_plans: {
        Row: {
          adaptation_count: number | null
          ai_generation_context: Json | null
          completion_rate: number | null
          created_at: string
          description: string | null
          duration_days: number
          effectiveness_score: number | null
          focus_areas: Json
          generated_at: string
          id: string
          last_reviewed_at: string | null
          parent_plan_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          adaptation_count?: number | null
          ai_generation_context?: Json | null
          completion_rate?: number | null
          created_at?: string
          description?: string | null
          duration_days?: number
          effectiveness_score?: number | null
          focus_areas?: Json
          generated_at?: string
          id?: string
          last_reviewed_at?: string | null
          parent_plan_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          adaptation_count?: number | null
          ai_generation_context?: Json | null
          completion_rate?: number | null
          created_at?: string
          description?: string | null
          duration_days?: number
          effectiveness_score?: number | null
          focus_areas?: Json
          generated_at?: string
          id?: string
          last_reviewed_at?: string | null
          parent_plan_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "coaching_plans_parent_plan_id_fkey"
            columns: ["parent_plan_id"]
            isOneToOne: false
            referencedRelation: "coaching_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_progress_entries: {
        Row: {
          created_at: string
          description: string | null
          entry_type: string
          id: string
          impact_score: number | null
          metadata: Json | null
          plan_id: string | null
          recommendation_id: string | null
          session_id: string | null
          title: string
          user_id: string
          visible_to_user: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_type: string
          id?: string
          impact_score?: number | null
          metadata?: Json | null
          plan_id?: string | null
          recommendation_id?: string | null
          session_id?: string | null
          title: string
          user_id: string
          visible_to_user?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_type?: string
          id?: string
          impact_score?: number | null
          metadata?: Json | null
          plan_id?: string | null
          recommendation_id?: string | null
          session_id?: string | null
          title?: string
          user_id?: string
          visible_to_user?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "coaching_progress_entries_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "coaching_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_progress_entries_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "ai_coaching_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_progress_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_sessions: {
        Row: {
          ai_analysis: string | null
          context_data: Json
          created_at: string
          duration_minutes: number | null
          effectiveness_score: number | null
          end_time: string | null
          id: string
          implementation_rate: number | null
          session_type: string
          start_time: string
          status: string
          updated_at: string
          user_feedback: Json | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          context_data?: Json
          created_at?: string
          duration_minutes?: number | null
          effectiveness_score?: number | null
          end_time?: string | null
          id?: string
          implementation_rate?: number | null
          session_type: string
          start_time?: string
          status?: string
          updated_at?: string
          user_feedback?: Json | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          context_data?: Json
          created_at?: string
          duration_minutes?: number | null
          effectiveness_score?: number | null
          end_time?: string | null
          id?: string
          implementation_rate?: number | null
          session_type?: string
          start_time?: string
          status?: string
          updated_at?: string
          user_feedback?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      data_deletion_requests: {
        Row: {
          admin_notes: string | null
          approved_by: string | null
          approved_date: string | null
          completed_date: string | null
          created_at: string | null
          id: string
          reason: string | null
          request_date: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_by?: string | null
          approved_date?: string | null
          completed_date?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          request_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_by?: string | null
          approved_date?: string | null
          completed_date?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          request_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      data_export_requests: {
        Row: {
          completed_date: string | null
          created_at: string | null
          download_url: string | null
          error_message: string | null
          expires_at: string | null
          file_size_bytes: number | null
          id: string
          request_date: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          download_url?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          request_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          download_url?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          request_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: string | null
          created_at: string
          error_id: string
          id: string
          message: string
          metadata: Json | null
          resolved_at: string | null
          severity: string | null
          stack_trace: string | null
          tags: string[] | null
          timestamp: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          error_id: string
          id?: string
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string | null
          stack_trace?: string | null
          tags?: string[] | null
          timestamp?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          error_id?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string | null
          stack_trace?: string | null
          tags?: string[] | null
          timestamp?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gdpr_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          invited_role: string
          metadata: Json | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          invited_role?: string
          metadata?: Json | null
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_role?: string
          metadata?: Json | null
          status?: string
          token?: string
        }
        Relationships: []
      }
      message_preferences: {
        Row: {
          auto_ai_assistance: boolean
          created_at: string
          email_notifications: boolean
          id: string
          internal_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_ai_assistance?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          internal_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_ai_assistance?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          internal_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_ai_assisted: boolean
          is_read: boolean
          parent_message_id: string | null
          receiver_id: string
          sender_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_ai_assisted?: boolean
          is_read?: boolean
          parent_message_id?: string | null
          receiver_id: string
          sender_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_ai_assisted?: boolean
          is_read?: boolean
          parent_message_id?: string | null
          receiver_id?: string
          sender_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      path_entries: {
        Row: {
          ai_generated: boolean
          content: string | null
          created_at: string
          created_by: string
          created_by_role: string | null
          details: string | null
          id: string
          linked_task_id: string | null
          metadata: Json | null
          status: string
          timestamp: string
          title: string
          type: string
          updated_at: string
          user_id: string | null
          visible_to_client: boolean
        }
        Insert: {
          ai_generated?: boolean
          content?: string | null
          created_at?: string
          created_by: string
          created_by_role?: string | null
          details?: string | null
          id?: string
          linked_task_id?: string | null
          metadata?: Json | null
          status?: string
          timestamp?: string
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
          visible_to_client?: boolean
        }
        Update: {
          ai_generated?: boolean
          content?: string | null
          created_at?: string
          created_by?: string
          created_by_role?: string | null
          details?: string | null
          id?: string
          linked_task_id?: string | null
          metadata?: Json | null
          status?: string
          timestamp?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
          visible_to_client?: boolean
        }
        Relationships: []
      }
      pillar_assessments: {
        Row: {
          ai_analysis: string | null
          assessment_data: Json
          calculated_score: number | null
          created_at: string
          created_by: string
          id: string
          insights: Json | null
          pillar_key: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_analysis?: string | null
          assessment_data?: Json
          calculated_score?: number | null
          created_at?: string
          created_by: string
          id?: string
          insights?: Json | null
          pillar_key: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_analysis?: string | null
          assessment_data?: Json
          calculated_score?: number | null
          created_at?: string
          created_by?: string
          id?: string
          insights?: Json | null
          pillar_key?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pillar_definitions: {
        Row: {
          ai_prompt_template: string
          color_code: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          pillar_key: string
          scoring_weights: Json | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          ai_prompt_template: string
          color_code?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          pillar_key: string
          scoring_weights?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          ai_prompt_template?: string
          color_code?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pillar_key?: string
          scoring_weights?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pillar_visualization_data: {
        Row: {
          created_at: string
          data_points: Json
          data_type: string
          id: string
          metadata: Json | null
          pillar_key: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_points?: Json
          data_type: string
          id?: string
          metadata?: Json | null
          pillar_key: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_points?: Json
          data_type?: string
          id?: string
          metadata?: Json | null
          pillar_key?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prd_architecture_edges: {
        Row: {
          created_at: string
          edge_data: Json | null
          edge_id: string
          edge_label: string | null
          edge_type: string | null
          id: string
          prd_document_id: string | null
          source_node_id: string
          style_config: Json | null
          target_node_id: string
        }
        Insert: {
          created_at?: string
          edge_data?: Json | null
          edge_id: string
          edge_label?: string | null
          edge_type?: string | null
          id?: string
          prd_document_id?: string | null
          source_node_id: string
          style_config?: Json | null
          target_node_id: string
        }
        Update: {
          created_at?: string
          edge_data?: Json | null
          edge_id?: string
          edge_label?: string | null
          edge_type?: string | null
          id?: string
          prd_document_id?: string | null
          source_node_id?: string
          style_config?: Json | null
          target_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prd_architecture_edges_prd_document_id_fkey"
            columns: ["prd_document_id"]
            isOneToOne: false
            referencedRelation: "prd_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      prd_architecture_nodes: {
        Row: {
          created_at: string
          id: string
          node_category: string | null
          node_data: Json | null
          node_id: string
          node_label: string
          node_type: string
          position_x: number
          position_y: number
          prd_document_id: string | null
          style_config: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          node_category?: string | null
          node_data?: Json | null
          node_id: string
          node_label: string
          node_type: string
          position_x?: number
          position_y?: number
          prd_document_id?: string | null
          style_config?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          node_category?: string | null
          node_data?: Json | null
          node_id?: string
          node_label?: string
          node_type?: string
          position_x?: number
          position_y?: number
          prd_document_id?: string | null
          style_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prd_architecture_nodes_prd_document_id_fkey"
            columns: ["prd_document_id"]
            isOneToOne: false
            referencedRelation: "prd_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      prd_components: {
        Row: {
          complexity_score: number | null
          component_name: string
          component_type: string
          created_at: string
          dependencies: Json | null
          description: string | null
          file_path: string | null
          functionality: Json | null
          id: string
          last_modified: string | null
          maintenance_notes: string | null
          prd_document_id: string | null
          props_interface: Json | null
          usage_count: number | null
        }
        Insert: {
          complexity_score?: number | null
          component_name: string
          component_type: string
          created_at?: string
          dependencies?: Json | null
          description?: string | null
          file_path?: string | null
          functionality?: Json | null
          id?: string
          last_modified?: string | null
          maintenance_notes?: string | null
          prd_document_id?: string | null
          props_interface?: Json | null
          usage_count?: number | null
        }
        Update: {
          complexity_score?: number | null
          component_name?: string
          component_type?: string
          created_at?: string
          dependencies?: Json | null
          description?: string | null
          file_path?: string | null
          functionality?: Json | null
          id?: string
          last_modified?: string | null
          maintenance_notes?: string | null
          prd_document_id?: string | null
          props_interface?: Json | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prd_components_prd_document_id_fkey"
            columns: ["prd_document_id"]
            isOneToOne: false
            referencedRelation: "prd_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      prd_documents: {
        Row: {
          api_documentation: Json
          architecture_data: Json
          assessment_structure: Json
          component_inventory: Json
          created_at: string
          database_schema: Json
          deployment_info: Json
          description: string | null
          feature_matrix: Json
          generated_at: string
          generated_by: string | null
          id: string
          is_current: boolean
          performance_metrics: Json
          pillar_system_data: Json
          security_audit: Json
          system_overview: Json
          title: string
          updated_at: string
          user_flow_data: Json
          version: string
        }
        Insert: {
          api_documentation?: Json
          architecture_data?: Json
          assessment_structure?: Json
          component_inventory?: Json
          created_at?: string
          database_schema?: Json
          deployment_info?: Json
          description?: string | null
          feature_matrix?: Json
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_current?: boolean
          performance_metrics?: Json
          pillar_system_data?: Json
          security_audit?: Json
          system_overview?: Json
          title?: string
          updated_at?: string
          user_flow_data?: Json
          version: string
        }
        Update: {
          api_documentation?: Json
          architecture_data?: Json
          assessment_structure?: Json
          component_inventory?: Json
          created_at?: string
          database_schema?: Json
          deployment_info?: Json
          description?: string | null
          feature_matrix?: Json
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_current?: boolean
          performance_metrics?: Json
          pillar_system_data?: Json
          security_audit?: Json
          system_overview?: Json
          title?: string
          updated_at?: string
          user_flow_data?: Json
          version?: string
        }
        Relationships: []
      }
      prd_features: {
        Row: {
          api_endpoints: Json | null
          business_value: string | null
          created_at: string
          database_tables: Json | null
          feature_category: string
          feature_description: string | null
          feature_name: string
          id: string
          implementation_status: string
          last_updated: string | null
          prd_document_id: string | null
          related_components: Json | null
          technical_complexity: number | null
          user_roles: Json | null
        }
        Insert: {
          api_endpoints?: Json | null
          business_value?: string | null
          created_at?: string
          database_tables?: Json | null
          feature_category: string
          feature_description?: string | null
          feature_name: string
          id?: string
          implementation_status?: string
          last_updated?: string | null
          prd_document_id?: string | null
          related_components?: Json | null
          technical_complexity?: number | null
          user_roles?: Json | null
        }
        Update: {
          api_endpoints?: Json | null
          business_value?: string | null
          created_at?: string
          database_tables?: Json | null
          feature_category?: string
          feature_description?: string | null
          feature_name?: string
          id?: string
          implementation_status?: string
          last_updated?: string | null
          prd_document_id?: string | null
          related_components?: Json | null
          technical_complexity?: number | null
          user_roles?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prd_features_prd_document_id_fkey"
            columns: ["prd_document_id"]
            isOneToOne: false
            referencedRelation: "prd_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: Json | null
          age: number | null
          avatar_url: string | null
          bio: string | null
          challenges: string | null
          client_category: string | null
          client_status: string | null
          consent_timestamp: string | null
          created_at: string | null
          creative_strengths: string | null
          custom_fields: Json | null
          data_retention_until: string | null
          date_of_birth: string | null
          deletion_requested_at: string | null
          department: string | null
          email: string | null
          facebook_handle: string | null
          first_name: string | null
          follower_counts: Json | null
          gender: string | null
          has_children: string | null
          height: string | null
          id: string
          instagram_handle: string | null
          job_title: string | null
          last_login_at: string | null
          last_name: string | null
          living_with: string | null
          location: string | null
          logic_state: Json | null
          manager_email: string | null
          manager_name: string | null
          neurodiversity: string | null
          niche: string | null
          notes: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          ongoing_changes: string | null
          organization: string | null
          past_crises: string | null
          phone: string | null
          physical_limitations: string | null
          platforms: Json | null
          preferences: Json | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_role: string | null
          profile_extended: Json | null
          profile_metadata: Json | null
          secondary_role: string | null
          snapchat_handle: string | null
          social_links: Json | null
          status: string | null
          tags: string[] | null
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string | null
          velocity_score: number | null
          weight: string | null
          youtube_handle: string | null
        }
        Insert: {
          address?: Json | null
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          challenges?: string | null
          client_category?: string | null
          client_status?: string | null
          consent_timestamp?: string | null
          created_at?: string | null
          creative_strengths?: string | null
          custom_fields?: Json | null
          data_retention_until?: string | null
          date_of_birth?: string | null
          deletion_requested_at?: string | null
          department?: string | null
          email?: string | null
          facebook_handle?: string | null
          first_name?: string | null
          follower_counts?: Json | null
          gender?: string | null
          has_children?: string | null
          height?: string | null
          id: string
          instagram_handle?: string | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          living_with?: string | null
          location?: string | null
          logic_state?: Json | null
          manager_email?: string | null
          manager_name?: string | null
          neurodiversity?: string | null
          niche?: string | null
          notes?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          ongoing_changes?: string | null
          organization?: string | null
          past_crises?: string | null
          phone?: string | null
          physical_limitations?: string | null
          platforms?: Json | null
          preferences?: Json | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_role?: string | null
          profile_extended?: Json | null
          profile_metadata?: Json | null
          secondary_role?: string | null
          snapchat_handle?: string | null
          social_links?: Json | null
          status?: string | null
          tags?: string[] | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          velocity_score?: number | null
          weight?: string | null
          youtube_handle?: string | null
        }
        Update: {
          address?: Json | null
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          challenges?: string | null
          client_category?: string | null
          client_status?: string | null
          consent_timestamp?: string | null
          created_at?: string | null
          creative_strengths?: string | null
          custom_fields?: Json | null
          data_retention_until?: string | null
          date_of_birth?: string | null
          deletion_requested_at?: string | null
          department?: string | null
          email?: string | null
          facebook_handle?: string | null
          first_name?: string | null
          follower_counts?: Json | null
          gender?: string | null
          has_children?: string | null
          height?: string | null
          id?: string
          instagram_handle?: string | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          living_with?: string | null
          location?: string | null
          logic_state?: Json | null
          manager_email?: string | null
          manager_name?: string | null
          neurodiversity?: string | null
          niche?: string | null
          notes?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          ongoing_changes?: string | null
          organization?: string | null
          past_crises?: string | null
          phone?: string | null
          physical_limitations?: string | null
          platforms?: Json | null
          preferences?: Json | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_role?: string | null
          profile_extended?: Json | null
          profile_metadata?: Json | null
          secondary_role?: string | null
          snapchat_handle?: string | null
          social_links?: Json | null
          status?: string | null
          tags?: string[] | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          velocity_score?: number | null
          weight?: string | null
          youtube_handle?: string | null
        }
        Relationships: []
      }
      stefan_interactions: {
        Row: {
          ai_analysis: string | null
          context_data: Json | null
          created_at: string
          id: string
          interaction_type: string
          message_content: string | null
          stefan_persona: string
          user_id: string
          user_response: string | null
        }
        Insert: {
          ai_analysis?: string | null
          context_data?: Json | null
          created_at?: string
          id?: string
          interaction_type: string
          message_content?: string | null
          stefan_persona?: string
          user_id: string
          user_response?: string | null
        }
        Update: {
          ai_analysis?: string | null
          context_data?: Json | null
          created_at?: string
          id?: string
          interaction_type?: string
          message_content?: string | null
          stefan_persona?: string
          user_id?: string
          user_response?: string | null
        }
        Relationships: []
      }
      stefan_memory: {
        Row: {
          category: string
          content: string
          created_at: string
          embedding: string | null
          id: string
          source: string
          tags: string[] | null
          updated_at: string
          version: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          source: string
          tags?: string[] | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          source?: string
          tags?: string[] | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          ai_generated: boolean
          completed_at: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          priority: string
          source_path_entry_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_generated?: boolean
          completed_at?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          source_path_entry_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_generated?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          source_path_entry_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_source_path_entry_id_fkey"
            columns: ["source_path_entry_id"]
            isOneToOne: false
            referencedRelation: "path_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      training_data_stefan: {
        Row: {
          client_name: string | null
          content: string
          content_type: string
          created_at: string
          date_created: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          metadata: Json | null
          original_filename: string | null
          subject: string | null
          tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name?: string | null
          content: string
          content_type: string
          created_at?: string
          date_created?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          original_filename?: string | null
          subject?: string | null
          tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string | null
          content?: string
          content_type?: string
          created_at?: string
          date_created?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          original_filename?: string | null
          subject?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_coaching_preferences: {
        Row: {
          avoid_topics: Json | null
          coaching_frequency: string
          communication_style: string
          created_at: string
          focus_priorities: Json | null
          id: string
          learning_style: string
          motivation_style: string
          notification_preferences: Json
          preferred_session_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avoid_topics?: Json | null
          coaching_frequency?: string
          communication_style?: string
          created_at?: string
          focus_priorities?: Json | null
          id?: string
          learning_style?: string
          motivation_style?: string
          notification_preferences?: Json
          preferred_session_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avoid_topics?: Json | null
          coaching_frequency?: string
          communication_style?: string
          created_at?: string
          focus_priorities?: Json | null
          id?: string
          learning_style?: string
          motivation_style?: string
          notification_preferences?: Json
          preferred_session_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_consent_records: {
        Row: {
          consent_given: boolean
          consent_source: string
          consent_timestamp: string | null
          consent_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_given: boolean
          consent_source: string
          consent_timestamp?: string | null
          consent_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_given?: boolean
          consent_source?: string
          consent_timestamp?: string | null
          consent_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_journey_states: {
        Row: {
          completed_assessments: Json | null
          created_at: string
          current_phase: string
          id: string
          journey_progress: number | null
          last_activity_at: string | null
          metadata: Json | null
          next_recommended_assessment: string | null
          stefan_interventions_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_assessments?: Json | null
          created_at?: string
          current_phase?: string
          id?: string
          journey_progress?: number | null
          last_activity_at?: string | null
          metadata?: Json | null
          next_recommended_assessment?: string | null
          stefan_interventions_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_assessments?: Json | null
          created_at?: string
          current_phase?: string
          id?: string
          journey_progress?: number | null
          last_activity_at?: string | null
          metadata?: Json | null
          next_recommended_assessment?: string | null
          stefan_interventions_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_journey_tracking: {
        Row: {
          ai_summary: string | null
          coach_notes: string | null
          created_at: string
          current_assessment_state_id: string | null
          id: string
          intervention_flags: Json
          journey_phase: string
          last_activity_at: string
          overall_progress: number
          risk_indicators: Json
          updated_at: string
          user_id: string
          wellness_score: number | null
        }
        Insert: {
          ai_summary?: string | null
          coach_notes?: string | null
          created_at?: string
          current_assessment_state_id?: string | null
          id?: string
          intervention_flags?: Json
          journey_phase?: string
          last_activity_at?: string
          overall_progress?: number
          risk_indicators?: Json
          updated_at?: string
          user_id: string
          wellness_score?: number | null
        }
        Update: {
          ai_summary?: string | null
          coach_notes?: string | null
          created_at?: string
          current_assessment_state_id?: string | null
          id?: string
          intervention_flags?: Json
          journey_phase?: string
          last_activity_at?: string
          overall_progress?: number
          risk_indicators?: Json
          updated_at?: string
          user_id?: string
          wellness_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_journey_tracking_current_assessment_state_id_fkey"
            columns: ["current_assessment_state_id"]
            isOneToOne: false
            referencedRelation: "assessment_states"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          expires_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_email_logs: {
        Row: {
          client_email: string
          client_id: string | null
          created_at: string | null
          email_id: string | null
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          client_email: string
          client_id?: string | null
          created_at?: string | null
          email_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          client_email?: string
          client_id?: string | null
          created_at?: string | null
          email_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: []
      }
      welcome_assessments: {
        Row: {
          adaptive_questions: Json
          ai_analysis: string | null
          created_at: string
          created_by: string
          free_text_responses: Json
          id: string
          overall_score: number | null
          quick_wins: Json
          recommendations: Json | null
          updated_at: string
          user_id: string
          wheel_of_life_scores: Json
        }
        Insert: {
          adaptive_questions?: Json
          ai_analysis?: string | null
          created_at?: string
          created_by: string
          free_text_responses?: Json
          id?: string
          overall_score?: number | null
          quick_wins?: Json
          recommendations?: Json | null
          updated_at?: string
          user_id: string
          wheel_of_life_scores?: Json
        }
        Update: {
          adaptive_questions?: Json
          ai_analysis?: string | null
          created_at?: string
          created_by?: string
          free_text_responses?: Json
          id?: string
          overall_score?: number | null
          quick_wins?: Json
          recommendations?: Json | null
          updated_at?: string
          user_id?: string
          wheel_of_life_scores?: Json
        }
        Relationships: []
      }
    }
    Views: {
      error_statistics: {
        Row: {
          affected_users: number | null
          context: string | null
          error_count: number | null
          error_date: string | null
          severity: string | null
          unique_errors: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      aggregate_analytics_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      cleanup_old_error_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_user_references: {
        Args: { target_email: string }
        Returns: string
      }
      delete_user_completely: {
        Args: { user_uuid: string }
        Returns: string
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_client_id_from_user_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_id_from_client_id: {
        Args: { client_uuid: string }
        Returns: string
      }
      get_user_organization_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      insert_analytics_events: {
        Args: { events_data: Json }
        Returns: undefined
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { _user_id: string; _organization_id: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      reset_user_welcome_assessment: {
        Args: { _user_id: string }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      superadmin_god_mode: {
        Args: { _user_id: string }
        Returns: boolean
      }
      user_has_any_role: {
        Args: { _user_id: string }
        Returns: boolean
      }
      validate_invitation_token: {
        Args: { invitation_token: string }
        Returns: {
          invitation_id: string
          email: string
          invited_role: string
          expires_at: string
          is_valid: boolean
        }[]
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role:
        | "superadmin"
        | "admin"
        | "manager"
        | "editor"
        | "organization"
        | "client"
        | "user"
        | "coach"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "superadmin",
        "admin",
        "manager",
        "editor",
        "organization",
        "client",
        "user",
        "coach",
      ],
    },
  },
} as const
