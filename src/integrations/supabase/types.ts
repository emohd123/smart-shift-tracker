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
      certificates: {
        Row: {
          id: string
          issue_date: string | null
          manager_contact: string
          pdf_url: string | null
          performance_rating: number | null
          position_title: string
          promotion_names: string[]
          reference_number: string
          skills_gained: string[]
          time_period: string
          total_hours: number
          user_id: string
          verified: boolean | null
        }
        Insert: {
          id?: string
          issue_date?: string | null
          manager_contact?: string
          pdf_url?: string | null
          performance_rating?: number | null
          position_title?: string
          promotion_names: string[]
          reference_number: string
          skills_gained?: string[]
          time_period: string
          total_hours: number
          user_id: string
          verified?: boolean | null
        }
        Update: {
          id?: string
          issue_date?: string | null
          manager_contact?: string
          pdf_url?: string | null
          performance_rating?: number | null
          position_title?: string
          promotion_names?: string[]
          reference_number?: string
          skills_gained?: string[]
          time_period?: string
          total_hours?: number
          user_id?: string
          verified?: boolean | null
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
          phone_number: string
          profile_photo_url: string | null
          role: string
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
          phone_number: string
          profile_photo_url?: string | null
          role?: string
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
          phone_number?: string
          profile_photo_url?: string | null
          role?: string
          updated_at?: string
          verification_status?: string
          weight?: number
        }
        Relationships: []
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
          created_at: string
          date: string
          end_date: string | null
          end_time: string
          id: string
          is_paid: boolean | null
          location: string
          pay_rate: number | null
          pay_rate_type: string | null
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_date?: string | null
          end_time: string
          id?: string
          is_paid?: boolean | null
          location: string
          pay_rate?: number | null
          pay_rate_type?: string | null
          start_time: string
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_date?: string | null
          end_time?: string
          id?: string
          is_paid?: boolean | null
          location?: string
          pay_rate?: number | null
          pay_rate_type?: string | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user_time_logs: {
        Args: { user_id_param: string }
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
