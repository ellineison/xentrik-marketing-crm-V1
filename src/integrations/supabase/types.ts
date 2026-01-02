export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          attendance: boolean
          chatter_id: string
          created_at: string
          day_of_week: number
          id: string
          model_name: string
          submitted_at: string | null
          updated_at: string
          week_start_date: string
        }
        Insert: {
          attendance?: boolean
          chatter_id: string
          created_at?: string
          day_of_week: number
          id?: string
          model_name: string
          submitted_at?: string | null
          updated_at?: string
          week_start_date: string
        }
        Update: {
          attendance?: boolean
          chatter_id?: string
          created_at?: string
          day_of_week?: number
          id?: string
          model_name?: string
          submitted_at?: string | null
          updated_at?: string
          week_start_date?: string
        }
        Relationships: []
      }
      creator_invitations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          model_name: string | null
          model_type: string
          stage_name: string | null
          status: string
          submission_path: string | null
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          model_name?: string | null
          model_type?: string
          stage_name?: string | null
          status?: string
          submission_path?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          model_name?: string | null
          model_type?: string
          stage_name?: string | null
          status?: string
          submission_path?: string | null
          token?: string
        }
        Relationships: []
      }
      creator_social_links: {
        Row: {
          chaturbate: string | null
          creator_id: string
          instagram: string | null
          reddit: string | null
          tiktok: string | null
          twitter: string | null
          youtube: string | null
        }
        Insert: {
          chaturbate?: string | null
          creator_id: string
          instagram?: string | null
          reddit?: string | null
          tiktok?: string | null
          twitter?: string | null
          youtube?: string | null
        }
        Update: {
          chaturbate?: string | null
          creator_id?: string
          instagram?: string | null
          reddit?: string | null
          tiktok?: string | null
          twitter?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_social_links_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_tags: {
        Row: {
          creator_id: string
          tag: string
        }
        Insert: {
          creator_id: string
          tag: string
        }
        Update: {
          creator_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_tags_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_team_members: {
        Row: {
          creator_id: string
          team_member_id: string
        }
        Insert: {
          creator_id: string
          team_member_id: string
        }
        Update: {
          creator_id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_team_members_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_team_members_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_telegram_groups: {
        Row: {
          created_at: string | null
          creator_id: string | null
          id: string
          team_member_id: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          id?: string
          team_member_id?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          id?: string
          team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_telegram_groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_telegram_groups_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          active: boolean | null
          created_at: string | null
          creator_type: Database["public"]["Enums"]["creator_type"]
          email: string | null
          gender: Database["public"]["Enums"]["gender"]
          id: string
          marketing_strategy: string[] | null
          model_name: string | null
          model_profile: Json | null
          name: string
          needs_review: boolean | null
          notes: string | null
          profile_image: string | null
          sex: string | null
          team: Database["public"]["Enums"]["team"]
          telegram_username: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          creator_type: Database["public"]["Enums"]["creator_type"]
          email?: string | null
          gender: Database["public"]["Enums"]["gender"]
          id: string
          marketing_strategy?: string[] | null
          model_name?: string | null
          model_profile?: Json | null
          name: string
          needs_review?: boolean | null
          notes?: string | null
          profile_image?: string | null
          sex?: string | null
          team: Database["public"]["Enums"]["team"]
          telegram_username?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          creator_type?: Database["public"]["Enums"]["creator_type"]
          email?: string | null
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          marketing_strategy?: string[] | null
          model_name?: string | null
          model_profile?: Json | null
          name?: string
          needs_review?: boolean | null
          notes?: string | null
          profile_image?: string | null
          sex?: string | null
          team?: Database["public"]["Enums"]["team"]
          telegram_username?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      custom_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          chatter_name: string | null
          custom_id: string
          id: string
          new_status: string
          old_status: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          chatter_name?: string | null
          custom_id: string
          id?: string
          new_status: string
          old_status?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          chatter_name?: string | null
          custom_id?: string
          id?: string
          new_status?: string
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_status_history_custom_id_fkey"
            columns: ["custom_id"]
            isOneToOne: false
            referencedRelation: "customs"
            referencedColumns: ["id"]
          },
        ]
      }
      customs: {
        Row: {
          attachments: string[] | null
          created_at: string
          custom_type: string | null
          description: string
          downpayment: number
          due_date: string | null
          endorsed_by: string | null
          fan_display_name: string
          fan_username: string
          full_price: number
          id: string
          model_name: string
          sale_by: string
          sale_date: string
          sent_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          custom_type?: string | null
          description: string
          downpayment?: number
          due_date?: string | null
          endorsed_by?: string | null
          fan_display_name: string
          fan_username: string
          full_price: number
          id?: string
          model_name: string
          sale_by: string
          sale_date: string
          sent_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          custom_type?: string | null
          description?: string
          downpayment?: number
          due_date?: string | null
          endorsed_by?: string | null
          fan_display_name?: string
          fan_username?: string
          full_price?: number
          id?: string
          model_name?: string
          sale_by?: string
          sale_date?: string
          sent_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      file_categories: {
        Row: {
          category_id: string
          category_name: string
          created_at: string
          creator: string
        }
        Insert: {
          category_id?: string
          category_name: string
          created_at?: string
          creator: string
        }
        Update: {
          category_id?: string
          category_name?: string
          created_at?: string
          creator?: string
        }
        Relationships: []
      }
      file_folders: {
        Row: {
          category_id: string
          created_at: string
          creator_id: string
          folder_id: string
          folder_name: string
        }
        Insert: {
          category_id: string
          created_at?: string
          creator_id: string
          folder_id?: string
          folder_name: string
        }
        Update: {
          category_id?: string
          created_at?: string
          creator_id?: string
          folder_id?: string
          folder_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_folders_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "file_categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      file_tags: {
        Row: {
          created_at: string
          creator: string
          id: string
          tag_name: string
        }
        Insert: {
          created_at?: string
          creator: string
          id?: string
          tag_name: string
        }
        Update: {
          created_at?: string
          creator?: string
          id?: string
          tag_name?: string
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          bucket_key: string
          created_at: string
          creator_id: string
          file_size: number
          filename: string
          id: string
          mime: string
          status: string
        }
        Insert: {
          bucket_key: string
          created_at?: string
          creator_id: string
          file_size: number
          filename: string
          id?: string
          mime: string
          status?: string
        }
        Update: {
          bucket_key?: string
          created_at?: string
          creator_id?: string
          file_size?: number
          filename?: string
          id?: string
          mime?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_creator"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_voice_clones: {
        Row: {
          audio_url: string | null
          bucket_key: string
          created_at: string
          emotion: string
          generated_by: string
          generated_text: string
          id: string
          job_id: string | null
          model_name: string
          status: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          bucket_key: string
          created_at?: string
          emotion: string
          generated_by: string
          generated_text: string
          id?: string
          job_id?: string | null
          model_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          bucket_key?: string
          created_at?: string
          emotion?: string
          generated_by?: string
          generated_text?: string
          id?: string
          job_id?: string | null
          model_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_generated_voice_clones_generated_by"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_media: {
        Row: {
          bucket_key: string
          categories: string[] | null
          created_at: string
          creator_id: string
          description: string | null
          file_size: number
          filename: string
          folders: string[] | null
          id: string
          mime: string
          status: string
          tags: string[] | null
          thumbnail_url: string | null
        }
        Insert: {
          bucket_key: string
          categories?: string[] | null
          created_at?: string
          creator_id: string
          description?: string | null
          file_size: number
          filename: string
          folders?: string[] | null
          id?: string
          mime: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
        }
        Update: {
          bucket_key?: string
          categories?: string[] | null
          created_at?: string
          creator_id?: string
          description?: string | null
          file_size?: number
          filename?: string
          folders?: string[] | null
          id?: string
          mime?: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          bucket_key: string
          categories: string[] | null
          created_at: string
          creator_id: string
          description: string | null
          file_size: number
          filename: string
          folders: string[] | null
          id: string
          mime: string
          status: string
          tags: string[] | null
          thumbnail_url: string | null
        }
        Insert: {
          bucket_key: string
          categories?: string[] | null
          created_at?: string
          creator_id: string
          description?: string | null
          file_size: number
          filename: string
          folders?: string[] | null
          id?: string
          mime: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
        }
        Update: {
          bucket_key?: string
          categories?: string[] | null
          created_at?: string
          creator_id?: string
          description?: string | null
          file_size?: number
          filename?: string
          folders?: string[] | null
          id?: string
          mime?: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      model_announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          creator_id: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          creator_id: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          creator_id?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_model_announcements_creator"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_submissions: {
        Row: {
          data: Json
          email: string
          id: string
          name: string
          status: string
          submitted_at: string
          token: string
        }
        Insert: {
          data: Json
          email: string
          id?: string
          name: string
          status?: string
          submitted_at?: string
          token: string
        }
        Update: {
          data?: Json
          email?: string
          id?: string
          name?: string
          status?: string
          submitted_at?: string
          token?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          geographic_restrictions: string[] | null
          hourly_rate: number | null
          id: string
          last_login: string | null
          name: string
          pending_telegram: boolean | null
          phone_number: string | null
          profile_image: string | null
          role: string
          roles: string[] | null
          sales_tracker_link: string | null
          status: string
          telegram: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          geographic_restrictions?: string[] | null
          hourly_rate?: number | null
          id: string
          last_login?: string | null
          name: string
          pending_telegram?: boolean | null
          phone_number?: string | null
          profile_image?: string | null
          role: string
          roles?: string[] | null
          sales_tracker_link?: string | null
          status?: string
          telegram?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          geographic_restrictions?: string[] | null
          hourly_rate?: number | null
          id?: string
          last_login?: string | null
          name?: string
          pending_telegram?: boolean | null
          phone_number?: string | null
          profile_image?: string | null
          role?: string
          roles?: string[] | null
          sales_tracker_link?: string | null
          status?: string
          telegram?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          delete: boolean
          download: boolean
          edit: boolean
          preview: boolean
          rolename: string
          upload: boolean
        }
        Insert: {
          delete?: boolean
          download?: boolean
          edit?: boolean
          preview?: boolean
          rolename: string
          upload?: boolean
        }
        Update: {
          delete?: boolean
          download?: boolean
          edit?: boolean
          preview?: boolean
          rolename?: string
          upload?: boolean
        }
        Relationships: []
      }
      sales_tracker: {
        Row: {
          admin_confirmed: boolean
          attendance: boolean | null
          chatter_id: string | null
          confirmed_commission_rate: number | null
          confirmed_hours_worked: number | null
          created_at: string
          day_of_week: number
          deduction_amount: number | null
          deduction_notes: string | null
          earnings: number
          id: string
          model_name: string
          overtime_notes: string | null
          overtime_pay: number | null
          sales_locked: boolean
          updated_at: string
          week_start_date: string
          working_day: boolean
        }
        Insert: {
          admin_confirmed?: boolean
          attendance?: boolean | null
          chatter_id?: string | null
          confirmed_commission_rate?: number | null
          confirmed_hours_worked?: number | null
          created_at?: string
          day_of_week: number
          deduction_amount?: number | null
          deduction_notes?: string | null
          earnings?: number
          id?: string
          model_name: string
          overtime_notes?: string | null
          overtime_pay?: number | null
          sales_locked?: boolean
          updated_at?: string
          week_start_date: string
          working_day?: boolean
        }
        Update: {
          admin_confirmed?: boolean
          attendance?: boolean | null
          chatter_id?: string | null
          confirmed_commission_rate?: number | null
          confirmed_hours_worked?: number | null
          created_at?: string
          day_of_week?: number
          deduction_amount?: number | null
          deduction_notes?: string | null
          earnings?: number
          id?: string
          model_name?: string
          overtime_notes?: string | null
          overtime_pay?: number | null
          sales_locked?: boolean
          updated_at?: string
          week_start_date?: string
          working_day?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sales_tracker_chatter_id_fkey"
            columns: ["chatter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      secure_area_passwords: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          password_hash: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          password_hash: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          password_hash?: string
        }
        Relationships: []
      }
      social_media_logins: {
        Row: {
          created_at: string
          creator_email: string
          id: string
          is_predefined: boolean
          notes: string | null
          password: string | null
          platform: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          creator_email: string
          id?: string
          is_predefined?: boolean
          notes?: string | null
          password?: string | null
          platform: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          creator_email?: string
          id?: string
          is_predefined?: boolean
          notes?: string | null
          password?: string | null
          platform?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      team_assignments: {
        Row: {
          created_at: string | null
          profile_id: string
          team_id: string
        }
        Insert: {
          created_at?: string | null
          profile_id: string
          team_id: string
        }
        Update: {
          created_at?: string | null
          profile_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_roles: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string | null
          role: Database["public"]["Enums"]["team_member_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          role: Database["public"]["Enums"]["team_member_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          role?: Database["public"]["Enums"]["team_member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "team_member_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          team_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          team_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          team_name?: string
        }
        Relationships: []
      }
      voice_sources: {
        Row: {
          bucket_key: string
          created_at: string
          emotion: string
          id: string
          model_name: string
          updated_at: string
        }
        Insert: {
          bucket_key: string
          created_at?: string
          emotion: string
          id?: string
          model_name: string
          updated_at?: string
        }
        Update: {
          bucket_key?: string
          created_at?: string
          emotion?: string
          id?: string
          model_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_roles: {
        Args: {
          new_additional_roles: string[]
          new_primary_role: string
          user_id: string
        }
        Returns: boolean
      }
      create_team_member: {
        Args: {
          additional_roles?: string[]
          email: string
          name: string
          password: string
          primary_role?: string
        }
        Returns: string
      }
      get_user_role_and_roles: {
        Args: { user_id: string }
        Returns: {
          user_role: string
          user_roles: string[]
        }[]
      }
    }
    Enums: {
      creator_type: "Real" | "AI"
      gender: "Male" | "Female" | "Trans" | "AI"
      team: "A Team" | "B Team" | "C Team"
      team_member_role:
        | "Chatters"
        | "Creative Director"
        | "Manager"
        | "Developer"
        | "Editor"
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
      creator_type: ["Real", "AI"],
      gender: ["Male", "Female", "Trans", "AI"],
      team: ["A Team", "B Team", "C Team"],
      team_member_role: [
        "Chatters",
        "Creative Director",
        "Manager",
        "Developer",
        "Editor",
      ],
    },
  },
} as const
