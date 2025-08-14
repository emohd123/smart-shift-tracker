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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_stamp_configs: {
        Row: {
          company_email: string | null
          company_name: string
          company_phone: string | null
          company_website: string | null
          created_at: string
          enable_digital_signature: boolean
          id: string
          logo_url: string | null
          signature_position: string
          stamp_message: string
          stamp_opacity: number
          updated_at: string
        }
        Insert: {
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          company_website?: string | null
          created_at?: string
          enable_digital_signature?: boolean
          id?: string
          logo_url?: string | null
          signature_position?: string
          stamp_message?: string
          stamp_opacity?: number
          updated_at?: string
        }
        Update: {
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          company_website?: string | null
          created_at?: string
          enable_digital_signature?: boolean
          id?: string
          logo_url?: string | null
          signature_position?: string
          stamp_message?: string
          stamp_opacity?: number
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          expiration_date: string | null
          id: string
          issue_date: string | null
          issued_by: string | null
          issued_date: string | null
          manager_contact: string
          pdf_url: string | null
          performance_rating: number | null
          position_title: string
          promotion_names: string[]
          reference_number: string
          skills_gained: string[]
          status: string | null
          time_period: string
          total_hours: number
          user_id: string
          verification_logs: Json | null
          verified: boolean | null
        }
        Insert: {
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          issued_date?: string | null
          manager_contact?: string
          pdf_url?: string | null
          performance_rating?: number | null
          position_title?: string
          promotion_names: string[]
          reference_number: string
          skills_gained?: string[]
          status?: string | null
          time_period: string
          total_hours: number
          user_id: string
          verification_logs?: Json | null
          verified?: boolean | null
        }
        Update: {
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          issued_date?: string | null
          manager_contact?: string
          pdf_url?: string | null
          performance_rating?: number | null
          position_title?: string
          promotion_names?: string[]
          reference_number?: string
          skills_gained?: string[]
          status?: string | null
          time_period?: string
          total_hours?: number
          user_id?: string
          verification_logs?: Json | null
          verified?: boolean | null
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          address: string
          created_at: string
          logo_url: string | null
          name: string
          registration_id: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address: string
          created_at?: string
          logo_url?: string | null
          name: string
          registration_id: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          logo_url?: string | null
          name?: string
          registration_id?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          document_type: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          notes: string | null
          promoter_id: string
          uploaded_at: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          document_type: string
          file_name: string
          file_type: string
          file_url: string
          id?: string
          notes?: string | null
          promoter_id: string
          uploaded_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          document_type?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          promoter_id?: string
          uploaded_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          id: string
          method: string
          notes: string | null
          payment_date: string
          promoter_id: string
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          id?: string
          method: string
          notes?: string | null
          payment_date?: string
          promoter_id: string
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          id?: string
          method?: string
          notes?: string | null
          payment_date?: string
          promoter_id?: string
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string
          age: number
          bank_details: string | null
          created_at: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          height: number
          id: string
          id_card_url: string | null
          is_student: boolean
          nationality: string
          phone_number: string | null
          profile_photo_url: string | null
          role: string
          unique_code: string
          updated_at: string
          verification_status: string
          weight: number
        }
        Insert: {
          address: string
          age: number
          bank_details?: string | null
          created_at?: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          height: number
          id: string
          id_card_url?: string | null
          is_student: boolean
          nationality: string
          phone_number?: string | null
          profile_photo_url?: string | null
          role?: string
          unique_code?: string
          updated_at?: string
          verification_status?: string
          weight: number
        }
        Update: {
          address?: string
          age?: number
          bank_details?: string | null
          created_at?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          height?: number
          id?: string
          id_card_url?: string | null
          is_student?: boolean
          nationality?: string
          phone_number?: string | null
          profile_photo_url?: string | null
          role?: string
          unique_code?: string
          updated_at?: string
          verification_status?: string
          weight?: number
        }
        Relationships: []
      }
      shift_applications: {
        Row: {
          admin_notes: string | null
          application_date: string
          cover_letter: string | null
          created_at: string
          id: string
          promoter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          shift_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          application_date?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          promoter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          application_date?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          promoter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_applications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_applications_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_applications_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          created_at: string
          id: string
          promoter_id: string
          shift_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          promoter_id: string
          shift_id: string
        }
        Update: {
          created_at?: string
          id?: string
          promoter_id?: string
          shift_id?: string
        }
        Relationships: []
      }
      shift_locations: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          radius: number
          shift_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          radius?: number
          shift_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          radius?: number
          shift_id?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          application_deadline: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          date: string
          description: string | null
          employer_id: string | null
          end_date: string | null
          end_time: string
          id: string
          is_paid: boolean | null
          is_urgent: boolean | null
          location: string
          max_promoters: number | null
          pay_rate: number | null
          pay_rate_type: string | null
          requirements: string[] | null
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          date: string
          description?: string | null
          employer_id?: string | null
          end_date?: string | null
          end_time: string
          id?: string
          is_paid?: boolean | null
          is_urgent?: boolean | null
          location: string
          max_promoters?: number | null
          pay_rate?: number | null
          pay_rate_type?: string | null
          requirements?: string[] | null
          start_time: string
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          date?: string
          description?: string | null
          employer_id?: string | null
          end_date?: string | null
          end_time?: string
          id?: string
          is_paid?: boolean | null
          is_urgent?: boolean | null
          location?: string
          max_promoters?: number | null
          pay_rate?: number | null
          pay_rate_type?: string | null
          requirements?: string[] | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          certificate_downloads_count: number | null
          certificate_downloads_limit: number | null
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          certificate_downloads_count?: number | null
          certificate_downloads_limit?: number | null
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          certificate_downloads_count?: number | null
          certificate_downloads_limit?: number | null
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      time_logs: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          created_at: string
          earnings: number | null
          id: string
          shift_id: string
          total_hours: number | null
          user_id: string
        }
        Insert: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          earnings?: number | null
          id?: string
          shift_id: string
          total_hours?: number | null
          user_id: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          earnings?: number | null
          id?: string
          shift_id?: string
          total_hours?: number | null
          user_id?: string
        }
        Relationships: []
      }
      training_modules: {
        Row: {
          category: string
          completion_certificate: boolean | null
          content_type: string
          created_at: string
          description: string
          difficulty_level: string
          estimated_duration: number
          full_content: string | null
          id: string
          is_active: boolean | null
          preview_content: string | null
          price_credits: number
          skills_covered: string[] | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          completion_certificate?: boolean | null
          content_type: string
          created_at?: string
          description: string
          difficulty_level: string
          estimated_duration: number
          full_content?: string | null
          id?: string
          is_active?: boolean | null
          preview_content?: string | null
          price_credits?: number
          skills_covered?: string[] | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          completion_certificate?: boolean | null
          content_type?: string
          created_at?: string
          description?: string
          difficulty_level?: string
          estimated_duration?: number
          full_content?: string | null
          id?: string
          is_active?: boolean | null
          preview_content?: string | null
          price_credits?: number
          skills_covered?: string[] | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits_balance: number
          id: string
          total_purchased: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_balance?: number
          id?: string
          total_purchased?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_balance?: number
          id?: string
          total_purchased?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_module_progress: {
        Row: {
          certificate_issued: boolean | null
          completed_at: string | null
          id: string
          last_accessed: string
          module_id: string
          progress_percentage: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          certificate_issued?: boolean | null
          completed_at?: string | null
          id?: string
          last_accessed?: string
          module_id: string
          progress_percentage?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          certificate_issued?: boolean | null
          completed_at?: string | null
          id?: string
          last_accessed?: string
          module_id?: string
          progress_percentage?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      shifts_with_stats: {
        Row: {
          application_deadline: string | null
          approved_applications: number | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          date: string | null
          description: string | null
          end_date: string | null
          end_time: string | null
          id: string | null
          is_full: boolean | null
          is_paid: boolean | null
          is_urgent: boolean | null
          location: string | null
          max_promoters: number | null
          pay_rate: number | null
          pay_rate_type: string | null
          pending_applications: number | null
          requirements: string[] | null
          start_time: string | null
          status: string | null
          title: string | null
          total_applications: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      deduct_user_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      delete_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user_time_logs: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      ensure_profile_for_current_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_unique_profile_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_certificate_valid: {
        Args: { ref_number: string }
        Returns: boolean
      }
      is_company: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_shift_owner: {
        Args: { _shift_id: string }
        Returns: boolean
      }
      log_certificate_verification: {
        Args: { ip_address: string; ref_number: string; user_agent: string }
        Returns: undefined
      }
      user_has_purchased_module: {
        Args: { module_id: string }
        Returns: boolean
      }
    }
    Enums: {
      gender_type: "Male" | "Female" | "Other"
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
      gender_type: ["Male", "Female", "Other"],
    },
  },
} as const
