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
