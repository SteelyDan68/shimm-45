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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_analysis_sessions: {
        Row: {
          ai_insights: Json
          analysis_type: string
          approved_by_coach: boolean | null
          client_id: string | null
          executed_at: string
          feedback: string | null
          id: string
          input_data: Json
          recommendations: Json | null
        }
        Insert: {
          ai_insights: Json
          analysis_type: string
          approved_by_coach?: boolean | null
          client_id?: string | null
          executed_at?: string
          feedback?: string | null
          id?: string
          input_data: Json
          recommendations?: Json | null
        }
        Update: {
          ai_insights?: Json
          analysis_type?: string
          approved_by_coach?: boolean | null
          client_id?: string | null
          executed_at?: string
          feedback?: string | null
          id?: string
          input_data?: Json
          recommendations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          client_id: string
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          client_id: string
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          client_id?: string
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          backstory: string | null
          biography: string | null
          brand_positioning: string | null
          brand_values: string[] | null
          career_goals: string | null
          communication_style: string | null
          content_style: string | null
          created_at: string
          current_projects: string[] | null
          growth_areas: string[] | null
          id: string
          last_scraped_at: string | null
          media_experience: string | null
          name: string
          notability_score: number | null
          personal_traits: Json | null
          preferences: Json | null
          risk_tolerance: string | null
          search_keywords: string[] | null
          stage_name: string | null
          status: string | null
          strengths: string[] | null
          target_audience: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          backstory?: string | null
          biography?: string | null
          brand_positioning?: string | null
          brand_values?: string[] | null
          career_goals?: string | null
          communication_style?: string | null
          content_style?: string | null
          created_at?: string
          current_projects?: string[] | null
          growth_areas?: string[] | null
          id?: string
          last_scraped_at?: string | null
          media_experience?: string | null
          name: string
          notability_score?: number | null
          personal_traits?: Json | null
          preferences?: Json | null
          risk_tolerance?: string | null
          search_keywords?: string[] | null
          stage_name?: string | null
          status?: string | null
          strengths?: string[] | null
          target_audience?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          backstory?: string | null
          biography?: string | null
          brand_positioning?: string | null
          brand_values?: string[] | null
          career_goals?: string | null
          communication_style?: string | null
          content_style?: string | null
          created_at?: string
          current_projects?: string[] | null
          growth_areas?: string[] | null
          id?: string
          last_scraped_at?: string | null
          media_experience?: string | null
          name?: string
          notability_score?: number | null
          personal_traits?: Json | null
          preferences?: Json | null
          risk_tolerance?: string | null
          search_keywords?: string[] | null
          stage_name?: string | null
          status?: string | null
          strengths?: string[] | null
          target_audience?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      coaching_methodology: {
        Row: {
          case_studies: Json | null
          created_at: string
          decision_tree: Json | null
          description: string
          framework_name: string
          id: string
          personality_mappings: Json | null
          principles: Json
          updated_at: string
        }
        Insert: {
          case_studies?: Json | null
          created_at?: string
          decision_tree?: Json | null
          description: string
          framework_name: string
          id?: string
          personality_mappings?: Json | null
          principles: Json
          updated_at?: string
        }
        Update: {
          case_studies?: Json | null
          created_at?: string
          decision_tree?: Json | null
          description?: string
          framework_name?: string
          id?: string
          personality_mappings?: Json | null
          principles?: Json
          updated_at?: string
        }
        Relationships: []
      }
      management_insights: {
        Row: {
          action_needed: boolean | null
          ai_generated: boolean | null
          client_id: string | null
          coaching_framework: string | null
          confidence_score: number | null
          created_at: string
          description: string
          expected_impact: string | null
          id: string
          implementation_timeline: string | null
          insight_type: string | null
          priority: string | null
          related_news_id: string | null
          status: string | null
          strategy_type: string | null
          success_metrics: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          action_needed?: boolean | null
          ai_generated?: boolean | null
          client_id?: string | null
          coaching_framework?: string | null
          confidence_score?: number | null
          created_at?: string
          description: string
          expected_impact?: string | null
          id?: string
          implementation_timeline?: string | null
          insight_type?: string | null
          priority?: string | null
          related_news_id?: string | null
          status?: string | null
          strategy_type?: string | null
          success_metrics?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          action_needed?: boolean | null
          ai_generated?: boolean | null
          client_id?: string | null
          coaching_framework?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string
          expected_impact?: string | null
          id?: string
          implementation_timeline?: string | null
          insight_type?: string | null
          priority?: string | null
          related_news_id?: string | null
          status?: string | null
          strategy_type?: string | null
          success_metrics?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_insights_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_insights_related_news_id_fkey"
            columns: ["related_news_id"]
            isOneToOne: false
            referencedRelation: "news_mentions"
            referencedColumns: ["id"]
          },
        ]
      }
      news_mentions: {
        Row: {
          client_id: string | null
          created_at: string
          headline: string
          id: string
          impact_level: string | null
          keywords: string[] | null
          mention_type: string | null
          published_at: string | null
          sentiment_score: number | null
          source: string
          summary: string | null
          url: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          headline: string
          id?: string
          impact_level?: string | null
          keywords?: string[] | null
          mention_type?: string | null
          published_at?: string | null
          sentiment_score?: number | null
          source: string
          summary?: string | null
          url?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          headline?: string
          id?: string
          impact_level?: string | null
          keywords?: string[] | null
          mention_type?: string | null
          published_at?: string | null
          sentiment_score?: number | null
          source?: string
          summary?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_mentions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_trends: {
        Row: {
          client_id: string | null
          current_intensity: number | null
          first_seen: string
          id: string
          last_updated: string
          mention_count: number | null
          peak_intensity: number | null
          topic: string
          trend_direction: string | null
        }
        Insert: {
          client_id?: string | null
          current_intensity?: number | null
          first_seen?: string
          id?: string
          last_updated?: string
          mention_count?: number | null
          peak_intensity?: number | null
          topic: string
          trend_direction?: string | null
        }
        Update: {
          client_id?: string | null
          current_intensity?: number | null
          first_seen?: string
          id?: string
          last_updated?: string
          mention_count?: number | null
          peak_intensity?: number | null
          topic?: string
          trend_direction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_trends_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_signals: {
        Row: {
          client_id: string
          confidence_score: number | null
          created_at: string
          description: string | null
          id: string
          signal_date: string
          signal_type: string
          source_platform: string | null
          source_url: string | null
        }
        Insert: {
          client_id: string
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          signal_date: string
          signal_type: string
          source_platform?: string | null
          source_url?: string | null
        }
        Update: {
          client_id?: string
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          signal_date?: string
          signal_type?: string
          source_platform?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      social_media_profiles: {
        Row: {
          avg_comments: number | null
          avg_likes: number | null
          avg_shares: number | null
          avg_views: number | null
          bio: string | null
          client_id: string
          created_at: string | null
          engagement_rate: number | null
          follower_count: number | null
          following_count: number | null
          id: string
          last_updated: string | null
          platform: string
          post_count: number | null
          profile_picture_url: string | null
          profile_url: string | null
          updated_at: string | null
          username: string | null
          verification_status: boolean | null
        }
        Insert: {
          avg_comments?: number | null
          avg_likes?: number | null
          avg_shares?: number | null
          avg_views?: number | null
          bio?: string | null
          client_id: string
          created_at?: string | null
          engagement_rate?: number | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          last_updated?: string | null
          platform: string
          post_count?: number | null
          profile_picture_url?: string | null
          profile_url?: string | null
          updated_at?: string | null
          username?: string | null
          verification_status?: boolean | null
        }
        Update: {
          avg_comments?: number | null
          avg_likes?: number | null
          avg_shares?: number | null
          avg_views?: number | null
          bio?: string | null
          client_id?: string
          created_at?: string | null
          engagement_rate?: number | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          last_updated?: string | null
          platform?: string
          post_count?: number | null
          profile_picture_url?: string | null
          profile_url?: string | null
          updated_at?: string | null
          username?: string | null
          verification_status?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_weekly_stats: {
        Row: {
          client_id: string
          created_at: string
          engagement_rate: number | null
          follower_count: number | null
          id: string
          platform: string
          posts_count: number | null
          total_comments: number | null
          total_likes: number | null
          total_shares: number | null
          total_views: number | null
          updated_at: string
          week_start: string
        }
        Insert: {
          client_id: string
          created_at?: string
          engagement_rate?: number | null
          follower_count?: number | null
          id?: string
          platform: string
          posts_count?: number | null
          total_comments?: number | null
          total_likes?: number | null
          total_shares?: number | null
          total_views?: number | null
          updated_at?: string
          week_start: string
        }
        Update: {
          client_id?: string
          created_at?: string
          engagement_rate?: number | null
          follower_count?: number | null
          id?: string
          platform?: string
          posts_count?: number | null
          total_comments?: number | null
          total_likes?: number | null
          total_shares?: number | null
          total_views?: number | null
          updated_at?: string
          week_start?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["user_role"]
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          certifications: string[] | null
          coach_credentials: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          invited_by: string | null
          is_active: boolean | null
          phone: string | null
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          coach_credentials?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          invited_by?: string | null
          is_active?: boolean | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          coach_credentials?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      velocity_metrics: {
        Row: {
          calculation_week: string
          client_id: string
          content_innovation_score: number | null
          created_at: string
          engagement_trend_score: number | null
          id: string
          new_projects_score: number | null
          overall_velocity_score: number | null
          posting_frequency_score: number | null
          updated_at: string
          velocity_grade: string | null
        }
        Insert: {
          calculation_week: string
          client_id: string
          content_innovation_score?: number | null
          created_at?: string
          engagement_trend_score?: number | null
          id?: string
          new_projects_score?: number | null
          overall_velocity_score?: number | null
          posting_frequency_score?: number | null
          updated_at?: string
          velocity_grade?: string | null
        }
        Update: {
          calculation_week?: string
          client_id?: string
          content_innovation_score?: number | null
          created_at?: string
          engagement_trend_score?: number | null
          id?: string
          new_projects_score?: number | null
          overall_velocity_score?: number | null
          posting_frequency_score?: number | null
          updated_at?: string
          velocity_grade?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_client: {
        Args: { user_id: string; client_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          user_id: string
          required_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "coach" | "viewer" | "client"
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
      user_role: ["admin", "coach", "viewer", "client"],
    },
  },
} as const
