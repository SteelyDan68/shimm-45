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
      assessment_rounds: {
        Row: {
          ai_analysis: string | null
          client_id: string
          comments: string | null
          created_at: string
          created_by: string
          id: string
          pillar_type: string
          scores: Json
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          client_id: string
          comments?: string | null
          created_at?: string
          created_by: string
          id?: string
          pillar_type: string
          scores?: Json
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          client_id?: string
          comments?: string | null
          created_at?: string
          created_by?: string
          id?: string
          pillar_type?: string
          scores?: Json
          updated_at?: string
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
          created_at: string
          created_by: string
          details: string | null
          id: string
          linked_task_id: string | null
          status: string
          timestamp: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          client_id: string
          created_at?: string
          created_by: string
          details?: string | null
          id?: string
          linked_task_id?: string | null
          status?: string
          timestamp?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          client_id?: string
          created_at?: string
          created_by?: string
          details?: string | null
          id?: string
          linked_task_id?: string | null
          status?: string
          timestamp?: string
          title?: string
          type?: string
          updated_at?: string
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
      profiles: {
        Row: {
          address: Json | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          job_title: string | null
          last_login_at: string | null
          last_name: string | null
          organization: string | null
          phone: string | null
          preferences: Json | null
          social_links: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          organization?: string | null
          phone?: string | null
          preferences?: Json | null
          social_links?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          organization?: string | null
          phone?: string | null
          preferences?: Json | null
          social_links?: Json | null
          status?: string | null
          updated_at?: string | null
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
