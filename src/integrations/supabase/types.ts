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
        Args: {
          user_id_param: string
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
    : never = never,
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
    : never = never,
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
    : never = never,
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
