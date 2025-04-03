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
      bookings: {
        Row: {
          additional_notes: string | null
          class_schedule_id: string
          client_id: string
          created_at: string
          dog_id: string
          id: string
          info_eo: string | null
          info_pg: string | null
          is_enrolled: boolean | null
          notes: string | null
          payment_status: string
          proof_of_payment: string | null
          social_media_consent: boolean | null
          status: string
          updated_at: string
          uses_whatsapp: boolean | null
          vaccination_verified: boolean | null
        }
        Insert: {
          additional_notes?: string | null
          class_schedule_id: string
          client_id: string
          created_at?: string
          dog_id: string
          id?: string
          info_eo?: string | null
          info_pg?: string | null
          is_enrolled?: boolean | null
          notes?: string | null
          payment_status?: string
          proof_of_payment?: string | null
          social_media_consent?: boolean | null
          status?: string
          updated_at?: string
          uses_whatsapp?: boolean | null
          vaccination_verified?: boolean | null
        }
        Update: {
          additional_notes?: string | null
          class_schedule_id?: string
          client_id?: string
          created_at?: string
          dog_id?: string
          id?: string
          info_eo?: string | null
          info_pg?: string | null
          is_enrolled?: boolean | null
          notes?: string | null
          payment_status?: string
          proof_of_payment?: string | null
          social_media_consent?: boolean | null
          status?: string
          updated_at?: string
          uses_whatsapp?: boolean | null
          vaccination_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_schedule_id_fkey"
            columns: ["class_schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          admin_id: string | null
          capacity: number | null
          city: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string
          updated_at: string
        }
        Insert: {
          address: string
          admin_id?: string | null
          capacity?: number | null
          city: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          postal_code: string
          updated_at?: string
        }
        Update: {
          address?: string
          admin_id?: string | null
          capacity?: number | null
          city?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      cars: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          description: string
          engine_number: string
          fuel_type: string
          id: string
          image_urls: string[]
          make: string
          mileage: number
          model: string
          price: number
          purchase_date: string | null
          purchase_price: number
          register_number: string
          registration_number: string
          sale_client: string | null
          sale_invoice_number: string | null
          sale_mileage: number | null
          sale_price: number | null
          sale_so_number: string | null
          sold: boolean | null
          sold_date: string | null
          transmission: string
          updated_at: string
          vin_number: string
          year: number
        }
        Insert: {
          color: string
          created_at?: string
          created_by?: string | null
          description: string
          engine_number: string
          fuel_type: string
          id?: string
          image_urls?: string[]
          make: string
          mileage: number
          model: string
          price: number
          purchase_date?: string | null
          purchase_price: number
          register_number: string
          registration_number: string
          sale_client?: string | null
          sale_invoice_number?: string | null
          sale_mileage?: number | null
          sale_price?: number | null
          sale_so_number?: string | null
          sold?: boolean | null
          sold_date?: string | null
          transmission: string
          updated_at?: string
          vin_number: string
          year: number
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          engine_number?: string
          fuel_type?: string
          id?: string
          image_urls?: string[]
          make?: string
          mileage?: number
          model?: string
          price?: number
          purchase_date?: string | null
          purchase_price?: number
          register_number?: string
          registration_number?: string
          sale_client?: string | null
          sale_invoice_number?: string | null
          sale_mileage?: number | null
          sale_price?: number | null
          sale_so_number?: string | null
          sold?: boolean | null
          sold_date?: string | null
          transmission?: string
          updated_at?: string
          vin_number?: string
          year?: number
        }
        Relationships: []
      }
      class_attendance: {
        Row: {
          attendance_status: string
          booking_id: string
          class_date: string
          class_schedule_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          attendance_status?: string
          booking_id: string
          class_date: string
          class_schedule_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          attendance_status?: string
          booking_id?: string
          class_date?: string
          class_schedule_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_attendance_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_attendance_class_schedule_id_fkey"
            columns: ["class_schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          beginner_novice_class: string | null
          bronze_cgc_class: string | null
          created_at: string
          dog_id: string
          eo_class: string | null
          id: string
          puppy_class: string | null
          silver_cgc_class: string | null
          updated_at: string
          wt_class: string | null
          yoga_class: string | null
        }
        Insert: {
          beginner_novice_class?: string | null
          bronze_cgc_class?: string | null
          created_at?: string
          dog_id: string
          eo_class?: string | null
          id?: string
          puppy_class?: string | null
          silver_cgc_class?: string | null
          updated_at?: string
          wt_class?: string | null
          yoga_class?: string | null
        }
        Update: {
          beginner_novice_class?: string | null
          bronze_cgc_class?: string | null
          created_at?: string
          dog_id?: string
          eo_class?: string | null
          id?: string
          puppy_class?: string | null
          silver_cgc_class?: string | null
          updated_at?: string
          wt_class?: string | null
          yoga_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string
          created_at: string
          end_time: string
          id: string
          recurrence_pattern: string | null
          recurring: boolean | null
          selected_dates: string[] | null
          start_time: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          end_time: string
          id?: string
          recurrence_pattern?: string | null
          recurring?: boolean | null
          selected_dates?: string[] | null
          start_time: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          end_time?: string
          id?: string
          recurrence_pattern?: string | null
          recurring?: boolean | null
          selected_dates?: string[] | null
          start_time?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      class_tab_order: {
        Row: {
          branch_id: string | null
          class_ids: string[]
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          class_ids?: string[]
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          class_ids?: string[]
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_tab_order_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          branch_id: string
          capacity: number
          created_at: string
          description: string
          duration: number
          id: string
          level: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          capacity?: number
          created_at?: string
          description: string
          duration: number
          id?: string
          level: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          capacity?: number
          created_at?: string
          description?: string
          duration?: number
          id?: string
          level?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          is_from_client: boolean
          sender_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          is_from_client?: boolean
          sender_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          is_from_client?: boolean
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          branch_id: string | null
          city: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          city?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      dogs: {
        Row: {
          age: number | null
          avatar_url: string | null
          behavior_notes: string | null
          breed: string
          client_id: string
          created_at: string
          date_of_birth: string | null
          id: string
          medical_notes: string | null
          name: string
          notes: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          behavior_notes?: string | null
          breed: string
          client_id: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          medical_notes?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          behavior_notes?: string | null
          breed?: string
          client_id?: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          medical_notes?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dogs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          car_id: string
          created_at: string
          created_by: string | null
          date: string
          description: string
          id: string
          receipt_url: string | null
          type: string | null
        }
        Insert: {
          amount: number
          car_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          description: string
          id?: string
          receipt_url?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          car_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          receipt_url?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      trainers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          branch_id: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          specialties: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          branch_id?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          branch_id?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: {
        Args: {
          required_role: string
        }
        Returns: boolean
      }
      is_trainer: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
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
