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
      assessment_form_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          client_id: string
          due_date: string | null
          form_definition_id: string
          id: string
          is_active: boolean
          reminder_sent: boolean
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          client_id: string
          due_date?: string | null
          form_definition_id: string
          id?: string
          is_active?: boolean
          reminder_sent?: boolean
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          client_id?: string
          due_date?: string | null
          form_definition_id?: string
          id?: string
          is_active?: boolean
          reminder_sent?: boolean
          updated_at?: string
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
          client_id: string
          comments: string | null
          created_at: string
          created_by: string
          form_definition_id: string | null
          id: string
          pillar_type: string
          scores: Json
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          answers?: Json
          client_id: string
          comments?: string | null
          created_at?: string
          created_by: string
          form_definition_id?: string | null
          id?: string
          pillar_type: string
          scores?: Json
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          answers?: Json
          client_id?: string
          comments?: string | null
          created_at?: string
          created_by?: string
          form_definition_id?: string | null
          id?: string
          pillar_type?: string
          scores?: Json
          updated_at?: string
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
      calendar_events: {
        Row: {
          category: string
          client_id: string
          created_at: string
          created_by: string
          created_by_role: string
          description: string | null
          event_date: string
          id: string
          title: string
          updated_at: string
          visible_to_client: boolean
        }
        Insert: {
          category: string
          client_id: string
          created_at?: string
          created_by: string
          created_by_role: string
          description?: string | null
          event_date: string
          id?: string
          title: string
          updated_at?: string
          visible_to_client?: boolean
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string
          created_by?: string
          created_by_role?: string
          description?: string | null
          event_date?: string
          id?: string
          title?: string
          updated_at?: string
          visible_to_client?: boolean
        }
        Relationships: []
      }
      client_data_cache: {
        Row: {
          author: string | null
          client_id: string
          created_at: string
          data: Json
          data_type: string
          expires_at: string | null
          id: string
          image: string | null
          metadata: Json | null
          platform: string | null
          snippet: string | null
          source: string
          title: string | null
          url: string | null
        }
        Insert: {
          author?: string | null
          client_id: string
          created_at?: string
          data: Json
          data_type: string
          expires_at?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          platform?: string | null
          snippet?: string | null
          source: string
          title?: string | null
          url?: string | null
        }
        Update: {
          author?: string | null
          client_id?: string
          created_at?: string
          data?: Json
          data_type?: string
          expires_at?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          platform?: string | null
          snippet?: string | null
          source?: string
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_data_cache_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_analytics_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_data_cache_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_data_containers: {
        Row: {
          client_id: string
          container_type: string
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          updated_at: string
          version: number
          xml_content: unknown
        }
        Insert: {
          client_id: string
          container_type: string
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          version?: number
          xml_content: unknown
        }
        Update: {
          client_id?: string
          container_type?: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          version?: number
          xml_content?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "fk_client_data_containers_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_analytics_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_client_data_containers_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_pillar_activations: {
        Row: {
          activated_at: string
          activated_by: string
          client_id: string
          deactivated_at: string | null
          id: string
          is_active: boolean
          pillar_key: string
          updated_at: string
        }
        Insert: {
          activated_at?: string
          activated_by: string
          client_id: string
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          pillar_key: string
          updated_at?: string
        }
        Update: {
          activated_at?: string
          activated_by?: string
          client_id?: string
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          pillar_key?: string
          updated_at?: string
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
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          client_id: string
          id?: string
          is_active?: boolean
          pillar_type: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          client_id?: string
          id?: string
          is_active?: boolean
          pillar_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          category: string
          created_at: string
          custom_fields: Json | null
          email: string | null
          facebook_page: string | null
          follower_counts: Json | null
          id: string
          instagram_handle: string | null
          logic_state: Json | null
          manager_email: string | null
          manager_name: string | null
          name: string
          notes: string | null
          phone: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          profile_metadata: Json | null
          status: string
          tags: string[] | null
          tiktok_handle: string | null
          updated_at: string
          user_id: string
          velocity_score: number | null
          youtube_channel: string | null
        }
        Insert: {
          category: string
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          facebook_page?: string | null
          follower_counts?: Json | null
          id?: string
          instagram_handle?: string | null
          logic_state?: Json | null
          manager_email?: string | null
          manager_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          profile_metadata?: Json | null
          status?: string
          tags?: string[] | null
          tiktok_handle?: string | null
          updated_at?: string
          user_id: string
          velocity_score?: number | null
          youtube_channel?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          facebook_page?: string | null
          follower_counts?: Json | null
          id?: string
          instagram_handle?: string | null
          logic_state?: Json | null
          manager_email?: string | null
          manager_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          profile_metadata?: Json | null
          status?: string
          tags?: string[] | null
          tiktok_handle?: string | null
          updated_at?: string
          user_id?: string
          velocity_score?: number | null
          youtube_channel?: string | null
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
          client_id: string
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
          visible_to_client: boolean
        }
        Insert: {
          ai_generated?: boolean
          client_id: string
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
          visible_to_client?: boolean
        }
        Update: {
          ai_generated?: boolean
          client_id?: string
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
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "path_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_analytics_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "path_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pillar_assessments: {
        Row: {
          ai_analysis: string | null
          assessment_data: Json
          calculated_score: number | null
          client_id: string
          created_at: string
          created_by: string
          id: string
          insights: Json | null
          pillar_key: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          assessment_data?: Json
          calculated_score?: number | null
          client_id: string
          created_at?: string
          created_by: string
          id?: string
          insights?: Json | null
          pillar_key: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          assessment_data?: Json
          calculated_score?: number | null
          client_id?: string
          created_at?: string
          created_by?: string
          id?: string
          insights?: Json | null
          pillar_key?: string
          updated_at?: string
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
          client_id: string
          created_at: string
          data_points: Json
          data_type: string
          id: string
          metadata: Json | null
          pillar_key: string
        }
        Insert: {
          client_id: string
          created_at?: string
          data_points?: Json
          data_type: string
          id?: string
          metadata?: Json | null
          pillar_key: string
        }
        Update: {
          client_id?: string
          created_at?: string
          data_points?: Json
          data_type?: string
          id?: string
          metadata?: Json | null
          pillar_key?: string
        }
        Relationships: []
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
      tasks: {
        Row: {
          ai_generated: boolean
          client_id: string
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
        }
        Insert: {
          ai_generated?: boolean
          client_id: string
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
        }
        Update: {
          ai_generated?: boolean
          client_id?: string
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
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_analytics_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      user_relationships: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          client_id: string | null
          coach_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          relationship_type: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          client_id?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          relationship_type?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          client_id?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          relationship_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_relationships_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relationships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relationships_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        Relationships: [
          {
            foreignKeyName: "weekly_email_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_analytics_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "weekly_email_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_analytics_summary: {
        Row: {
          client_id: string | null
          client_name: string | null
          instagram_data_count: number | null
          last_update: string | null
          news_count: number | null
          sentiment_count: number | null
          social_metrics_count: number | null
          tiktok_data_count: number | null
          youtube_data_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
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
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { _user_id: string; _organization_id: string }
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
      ],
    },
  },
} as const
