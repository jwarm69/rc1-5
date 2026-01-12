export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      action_items: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          action_type: string
          category: string | null
          status: string
          minimum_viable: string | null
          stretch_goal: string | null
          milestone_connection: string | null
          minutes_estimate: number | null
          steps: string[]
          action_date: string
          priority: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          action_type?: string
          category?: string | null
          status?: string
          minimum_viable?: string | null
          stretch_goal?: string | null
          milestone_connection?: string | null
          minutes_estimate?: number | null
          steps?: string[]
          action_date?: string
          priority?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          action_type?: string
          category?: string | null
          status?: string
          minimum_viable?: string | null
          stretch_goal?: string | null
          milestone_connection?: string | null
          minutes_estimate?: number | null
          steps?: string[]
          action_date?: string
          priority?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      calibration_answers: {
        Row: {
          id: string
          user_id: string
          question_id: string
          question_type: string
          answer: string
          answered_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          question_type?: string
          answer: string
          answered_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          question_type?: string
          answer?: string
          answered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calibration_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          coaching_mode: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          coaching_mode?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          coaching_mode?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      coaching_sessions: {
        Row: {
          id: string
          user_id: string
          session_date: string
          mode: string
          move: string | null
          questions_asked: number
          policy_violations: string[]
          missed_day_detected: boolean
          missed_day_choice: string | null
          commitment: string | null
          commitment_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_date?: string
          mode: string
          move?: string | null
          questions_asked?: number
          policy_violations?: string[]
          missed_day_detected?: boolean
          missed_day_choice?: string | null
          commitment?: string | null
          commitment_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_date?: string
          mode?: string
          move?: string | null
          questions_asked?: number
          policy_violations?: string[]
          missed_day_detected?: boolean
          missed_day_choice?: string | null
          commitment?: string | null
          commitment_completed?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          phone: string | null
          email: string | null
          address: string | null
          lead_source: string | null
          tags: string[]
          deal_history: string | null
          pipeline_stage: number
          last_contacted: string | null
          notes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          lead_source?: string | null
          tags?: string[]
          deal_history?: string | null
          pipeline_stage?: number
          last_contacted?: string | null
          notes?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          lead_source?: string | null
          tags?: string[]
          deal_history?: string | null
          pipeline_stage?: number
          last_contacted?: string | null
          notes?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_checkins: {
        Row: {
          id: string
          user_id: string
          checkin_date: string
          raw_response: string | null
          completed_action_ids: string[]
          partial_progress: string | null
          momentum_signal: string | null
          friction_indicators: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          checkin_date?: string
          raw_response?: string | null
          completed_action_ids?: string[]
          partial_progress?: string | null
          momentum_signal?: string | null
          friction_indicators?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          checkin_date?: string
          raw_response?: string | null
          completed_action_ids?: string[]
          partial_progress?: string | null
          momentum_signal?: string | null
          friction_indicators?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      opportunities: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          contact_name: string
          stage: number
          deal_value: number | null
          expected_close_date: string | null
          deal_type: string | null
          source: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id?: string | null
          contact_name: string
          stage?: number
          deal_value?: number | null
          expected_close_date?: string | null
          deal_type?: string | null
          source?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string | null
          contact_name?: string
          stage?: number
          deal_value?: number | null
          expected_close_date?: string | null
          deal_type?: string | null
          source?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      user_business_plan: {
        Row: {
          id: string
          user_id: string
          revenue_target: string | null
          buyer_seller_split: string | null
          unit_target: number | null
          average_commission: number | null
          primary_lead_source: string | null
          secondary_lead_sources: string[]
          geographic_focus: string | null
          risk_tolerance: string | null
          weekly_hours_available: number | null
          status: string
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          revenue_target?: string | null
          buyer_seller_split?: string | null
          unit_target?: number | null
          average_commission?: number | null
          primary_lead_source?: string | null
          secondary_lead_sources?: string[]
          geographic_focus?: string | null
          risk_tolerance?: string | null
          weekly_hours_available?: number | null
          status?: string
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          revenue_target?: string | null
          buyer_seller_split?: string | null
          unit_target?: number | null
          average_commission?: number | null
          primary_lead_source?: string | null
          secondary_lead_sources?: string[]
          geographic_focus?: string | null
          risk_tolerance?: string | null
          weekly_hours_available?: number | null
          status?: string
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_business_plan_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_calibration: {
        Row: {
          id: string
          user_id: string
          state: string
          tone: string | null
          fast_lane_triggered: boolean
          current_question_index: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          state?: string
          tone?: string | null
          fast_lane_triggered?: boolean
          current_question_index?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          state?: string
          tone?: string | null
          fast_lane_triggered?: boolean
          current_question_index?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calibration_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_goals_actions: {
        Row: {
          id: string
          user_id: string
          annual_professional_goal: string | null
          annual_personal_goal: string | null
          current_reality: string | null
          monthly_milestone: string | null
          execution_style: string | null
          willingness_filter: string[]
          friction_boundaries: string[]
          status: string
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          annual_professional_goal?: string | null
          annual_personal_goal?: string | null
          current_reality?: string | null
          monthly_milestone?: string | null
          execution_style?: string | null
          willingness_filter?: string[]
          friction_boundaries?: string[]
          status?: string
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          annual_professional_goal?: string | null
          annual_personal_goal?: string | null
          current_reality?: string | null
          monthly_milestone?: string | null
          execution_style?: string | null
          willingness_filter?: string[]
          friction_boundaries?: string[]
          status?: string
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mailchimp_connections: {
        Row: {
          id: string
          user_id: string
          access_token: string
          server_prefix: string
          audience_id: string | null
          audience_name: string | null
          sync_status: string
          last_sync_at: string | null
          last_error: string | null
          connected_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          server_prefix: string
          audience_id?: string | null
          audience_name?: string | null
          sync_status?: string
          last_sync_at?: string | null
          last_error?: string | null
          connected_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string
          server_prefix?: string
          audience_id?: string | null
          audience_name?: string | null
          sync_status?: string
          last_sync_at?: string | null
          last_error?: string | null
          connected_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailchimp_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mailchimp_sync_queue: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          operation: string
          payload: Json | null
          attempts: number
          max_attempts: number
          last_error: string | null
          next_retry_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          operation: string
          payload?: Json | null
          attempts?: number
          max_attempts?: number
          last_error?: string | null
          next_retry_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          operation?: string
          payload?: Json | null
          attempts?: number
          max_attempts?: number
          last_error?: string | null
          next_retry_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailchimp_sync_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mailchimp_sync_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never
