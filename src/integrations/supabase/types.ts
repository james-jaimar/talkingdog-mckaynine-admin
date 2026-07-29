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
      academic_years: {
        Row: {
          created_at: string | null
          current: boolean | null
          id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          current?: boolean | null
          id?: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          current?: boolean | null
          id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      admin_payments: {
        Row: {
          amount_paid: number
          branch_id: string
          created_at: string
          id: string
          month: number
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string
          total_admin_fees: number
          updated_at: string
          year: number
        }
        Insert: {
          amount_paid?: number
          branch_id: string
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          total_admin_fees?: number
          updated_at?: string
          year: number
        }
        Update: {
          amount_paid?: number
          branch_id?: string
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          total_admin_fees?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_payments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_availability: {
        Row: {
          assistant_id: string
          created_at: string
          id: string
          marked_by: string | null
          notes: string | null
          status: string | null
          training_session_slot_id: string
          updated_at: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string | null
          training_session_slot_id: string
          updated_at?: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string | null
          training_session_slot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_availability_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_availability_training_session_slot_id_fkey"
            columns: ["training_session_slot_id"]
            isOneToOne: false
            referencedRelation: "training_session_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      assistants: {
        Row: {
          branch_id: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string | null
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistants_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          additional_notes: string | null
          assigned_dates: string[] | null
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
          status: string
          updated_at: string
          vaccination_verified: boolean | null
        }
        Insert: {
          additional_notes?: string | null
          assigned_dates?: string[] | null
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
          status?: string
          updated_at?: string
          vaccination_verified?: boolean | null
        }
        Update: {
          additional_notes?: string | null
          assigned_dates?: string[] | null
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
          status?: string
          updated_at?: string
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
      branch_branding: {
        Row: {
          accent_color: string
          app_name: string
          branch_id: string
          created_at: string
          id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          app_name?: string
          branch_id: string
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          app_name?: string
          branch_id?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_branding_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_class_types: {
        Row: {
          branch_id: string
          class_type_id: string
          created_at: string
          id: string
          is_active: boolean
        }
        Insert: {
          branch_id: string
          class_type_id: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Update: {
          branch_id?: string
          class_type_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "branch_class_types_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_class_types_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_email_signatures: {
        Row: {
          branch_id: string
          company: string | null
          created_at: string
          email: string
          id: string
          is_default: boolean
          name: string
          phone: string
          title: string
          updated_at: string
          website: string
        }
        Insert: {
          branch_id: string
          company?: string | null
          created_at?: string
          email: string
          id?: string
          is_default?: boolean
          name: string
          phone?: string
          title: string
          updated_at?: string
          website?: string
        }
        Update: {
          branch_id?: string
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          is_default?: boolean
          name?: string
          phone?: string
          title?: string
          updated_at?: string
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_email_signatures_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_email_templates: {
        Row: {
          branch_id: string
          class_type: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string | null
          subject: string
          type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          branch_id: string
          class_type?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          subject: string
          type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          branch_id?: string
          class_type?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          subject?: string
          type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_email_templates_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_notifications: {
        Row: {
          branch_id: string
          created_at: string
          email_footer: string | null
          from_email: string | null
          id: string
          reply_to_email: string | null
          send_class_reminders: boolean | null
          send_invoice_email: boolean | null
          send_payment_reminders: boolean | null
          send_welcome_email: boolean | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          email_footer?: string | null
          from_email?: string | null
          id?: string
          reply_to_email?: string | null
          send_class_reminders?: boolean | null
          send_invoice_email?: boolean | null
          send_payment_reminders?: boolean | null
          send_welcome_email?: boolean | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          email_footer?: string | null
          from_email?: string | null
          id?: string
          reply_to_email?: string | null
          send_class_reminders?: boolean | null
          send_invoice_email?: boolean | null
          send_payment_reminders?: boolean | null
          send_welcome_email?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_notifications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_time_slots: {
        Row: {
          branch_id: string
          created_at: string
          display_name: string
          id: string
          is_default: boolean | null
          sort_order: number | null
          time_slot: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          display_name: string
          id?: string
          is_default?: boolean | null
          sort_order?: number | null
          time_slot: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          display_name?: string
          id?: string
          is_default?: boolean | null
          sort_order?: number | null
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_time_slots_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
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
          description: string | null
          domain: string | null
          email: string | null
          id: string
          is_active: boolean | null
          max_users: number | null
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
          description?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          max_users?: number | null
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
          description?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          max_users?: number | null
          name?: string
          phone?: string | null
          postal_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_transaction_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      business_transactions: {
        Row: {
          amount: number
          branch_id: string
          category: string
          created_at: string
          created_by: string | null
          date: string
          description: string
          id: string
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          reference: string | null
          type: string
          updated_at: string
          vendor_or_source: string | null
        }
        Insert: {
          amount: number
          branch_id: string
          category: string
          created_at?: string
          created_by?: string | null
          date: string
          description: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reference?: string | null
          type: string
          updated_at?: string
          vendor_or_source?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string
          category?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reference?: string | null
          type?: string
          updated_at?: string
          vendor_or_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_transactions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
          performance_grade: string | null
          updated_at: string
        }
        Insert: {
          attendance_status?: string
          booking_id: string
          class_date: string
          class_schedule_id: string
          created_at?: string
          id?: string
          performance_grade?: string | null
          updated_at?: string
        }
        Update: {
          attendance_status?: string
          booking_id?: string
          class_date?: string
          class_schedule_id?: string
          created_at?: string
          id?: string
          performance_grade?: string | null
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
      class_date_substitutes: {
        Row: {
          class_date: string
          class_schedule_id: string
          created_at: string
          id: string
          notes: string | null
          original_trainer_id: string
          substitute_trainer_id: string
        }
        Insert: {
          class_date: string
          class_schedule_id: string
          created_at?: string
          id?: string
          notes?: string | null
          original_trainer_id: string
          substitute_trainer_id: string
        }
        Update: {
          class_date?: string
          class_schedule_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          original_trainer_id?: string
          substitute_trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_date_substitutes_class_schedule_id_fkey"
            columns: ["class_schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_date_substitutes_original_trainer_id_fkey"
            columns: ["original_trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_date_substitutes_substitute_trainer_id_fkey"
            columns: ["substitute_trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          a_test_class: string | null
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
          a_test_class?: string | null
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
          a_test_class?: string | null
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
      class_group_memberships: {
        Row: {
          added_at: string
          group_id: string
          handler_id: string
          id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          handler_id: string
          id?: string
        }
        Update: {
          added_at?: string
          group_id?: string
          handler_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_group_memberships_handler_id_fkey"
            columns: ["handler_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      class_groups: {
        Row: {
          class_id: string
          created_at: string
          group_name: string
          id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          group_name: string
          id?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          group_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_groups_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_invitations: {
        Row: {
          accepted_at: string | null
          booking_id: string | null
          class_schedule_id: string
          completed_class_type: string | null
          created_at: string
          dog_id: string
          expires_at: string
          handler_id: string
          id: string
          notes: string | null
          status: string
          task_id: string | null
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          booking_id?: string | null
          class_schedule_id: string
          completed_class_type?: string | null
          created_at?: string
          dog_id: string
          expires_at: string
          handler_id: string
          id?: string
          notes?: string | null
          status?: string
          task_id?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          booking_id?: string | null
          class_schedule_id?: string
          completed_class_type?: string | null
          created_at?: string
          dog_id?: string
          expires_at?: string
          handler_id?: string
          id?: string
          notes?: string | null
          status?: string
          task_id?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_invitations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_invitations_class_schedule_id_fkey"
            columns: ["class_schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_invitations_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_invitations_handler_id_fkey"
            columns: ["handler_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_invitations_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "handler_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          academic_year: number | null
          class_id: string
          created_at: string
          end_time: string
          id: string
          multi_term_relation_id: string | null
          recurrence_pattern: string | null
          recurring: boolean | null
          selected_dates: string[] | null
          spans_multiple_terms: boolean | null
          start_time: string
          term_id: string | null
          term_number: Database["public"]["Enums"]["term_number"] | null
          trainer_id: string
          updated_at: string
        }
        Insert: {
          academic_year?: number | null
          class_id: string
          created_at?: string
          end_time: string
          id?: string
          multi_term_relation_id?: string | null
          recurrence_pattern?: string | null
          recurring?: boolean | null
          selected_dates?: string[] | null
          spans_multiple_terms?: boolean | null
          start_time: string
          term_id?: string | null
          term_number?: Database["public"]["Enums"]["term_number"] | null
          trainer_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: number | null
          class_id?: string
          created_at?: string
          end_time?: string
          id?: string
          multi_term_relation_id?: string | null
          recurrence_pattern?: string | null
          recurring?: boolean | null
          selected_dates?: string[] | null
          spans_multiple_terms?: boolean | null
          start_time?: string
          term_id?: string | null
          term_number?: Database["public"]["Enums"]["term_number"] | null
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
            foreignKeyName: "class_schedules_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
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
      class_types: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          next_class_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          next_class_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          next_class_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          admin_fee_type: string
          admin_fee_value: number
          branch_id: string
          capacity: number
          class_type: string
          course_fee: number
          created_at: string
          description: string
          duration: number
          enrollment_fee: number
          id: string
          io_inventory_code: string | null
          mckaynine_commission_type: string
          mckaynine_commission_value: number
          name: string
          report_month_override: string | null
          status: string
          trainer_fee_type: string
          trainer_fee_value: number
          updated_at: string
        }
        Insert: {
          admin_fee_type?: string
          admin_fee_value?: number
          branch_id: string
          capacity?: number
          class_type: string
          course_fee?: number
          created_at?: string
          description: string
          duration: number
          enrollment_fee?: number
          id?: string
          io_inventory_code?: string | null
          mckaynine_commission_type?: string
          mckaynine_commission_value?: number
          name: string
          report_month_override?: string | null
          status?: string
          trainer_fee_type?: string
          trainer_fee_value?: number
          updated_at?: string
        }
        Update: {
          admin_fee_type?: string
          admin_fee_value?: number
          branch_id?: string
          capacity?: number
          class_type?: string
          course_fee?: number
          created_at?: string
          description?: string
          duration?: number
          enrollment_fee?: number
          id?: string
          io_inventory_code?: string | null
          mckaynine_commission_type?: string
          mckaynine_commission_value?: number
          name?: string
          report_month_override?: string | null
          status?: string
          trainer_fee_type?: string
          trainer_fee_value?: number
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
      client_branches: {
        Row: {
          branch_id: string
          client_id: string
          created_at: string
          id: string
        }
        Insert: {
          branch_id: string
          client_id: string
          created_at?: string
          id?: string
        }
        Update: {
          branch_id?: string
          client_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_branches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          client_id: string
          content: string
          created_at: string
          id: string
          is_from_client: boolean
          is_read: boolean | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          client_id: string
          content: string
          created_at?: string
          id?: string
          is_from_client?: boolean
          is_read?: boolean | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          is_from_client?: boolean
          is_read?: boolean | null
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
          account_holder_name: string | null
          address: string | null
          auth_user_id: string | null
          branch_id: string | null
          city: string | null
          created_at: string
          email: string
          enrollment_verified: boolean | null
          first_name: string
          id: string
          io_client_id_delta: number | null
          io_client_id_randburg: number | null
          last_name: string
          notes: string | null
          occupation: string | null
          onboarding_status: string
          phone: string | null
          postal_code: string | null
          secondary_email: string | null
          secondary_first_name: string | null
          secondary_last_name: string | null
          secondary_phone: string | null
          social_media_consent_status: string
          updated_at: string
          uses_whatsapp_status: string
          vaccination_verified: boolean | null
          vet_name: string | null
        }
        Insert: {
          account_holder_name?: string | null
          address?: string | null
          auth_user_id?: string | null
          branch_id?: string | null
          city?: string | null
          created_at?: string
          email: string
          enrollment_verified?: boolean | null
          first_name: string
          id?: string
          io_client_id_delta?: number | null
          io_client_id_randburg?: number | null
          last_name: string
          notes?: string | null
          occupation?: string | null
          onboarding_status?: string
          phone?: string | null
          postal_code?: string | null
          secondary_email?: string | null
          secondary_first_name?: string | null
          secondary_last_name?: string | null
          secondary_phone?: string | null
          social_media_consent_status?: string
          updated_at?: string
          uses_whatsapp_status?: string
          vaccination_verified?: boolean | null
          vet_name?: string | null
        }
        Update: {
          account_holder_name?: string | null
          address?: string | null
          auth_user_id?: string | null
          branch_id?: string | null
          city?: string | null
          created_at?: string
          email?: string
          enrollment_verified?: boolean | null
          first_name?: string
          id?: string
          io_client_id_delta?: number | null
          io_client_id_randburg?: number | null
          last_name?: string
          notes?: string | null
          occupation?: string | null
          onboarding_status?: string
          phone?: string | null
          postal_code?: string | null
          secondary_email?: string | null
          secondary_first_name?: string | null
          secondary_last_name?: string | null
          secondary_phone?: string | null
          social_media_consent_status?: string
          updated_at?: string
          uses_whatsapp_status?: string
          vaccination_verified?: boolean | null
          vet_name?: string | null
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
          acquired_from: string | null
          acquired_from_other: string | null
          age: number | null
          age_at_acquisition: string | null
          avatar_url: string | null
          behavior_notes: string | null
          behavior_problems_details: string | null
          breed: string
          children_at_home: string | null
          client_id: string
          created_at: string
          date_of_birth: string | null
          gender: string | null
          has_behavior_problems: boolean | null
          has_health_problems: boolean | null
          health_problems_details: string | null
          id: string
          medical_notes: string | null
          name: string
          notes: string | null
          other_pets: Json | null
          social_behavior: Json | null
          social_behavior_details: string | null
          spay_neuter_status: string | null
          training_goal: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          acquired_from?: string | null
          acquired_from_other?: string | null
          age?: number | null
          age_at_acquisition?: string | null
          avatar_url?: string | null
          behavior_notes?: string | null
          behavior_problems_details?: string | null
          breed: string
          children_at_home?: string | null
          client_id: string
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          has_behavior_problems?: boolean | null
          has_health_problems?: boolean | null
          health_problems_details?: string | null
          id?: string
          medical_notes?: string | null
          name: string
          notes?: string | null
          other_pets?: Json | null
          social_behavior?: Json | null
          social_behavior_details?: string | null
          spay_neuter_status?: string | null
          training_goal?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          acquired_from?: string | null
          acquired_from_other?: string | null
          age?: number | null
          age_at_acquisition?: string | null
          avatar_url?: string | null
          behavior_notes?: string | null
          behavior_problems_details?: string | null
          breed?: string
          children_at_home?: string | null
          client_id?: string
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          has_behavior_problems?: boolean | null
          has_health_problems?: boolean | null
          health_problems_details?: string | null
          id?: string
          medical_notes?: string | null
          name?: string
          notes?: string | null
          other_pets?: Json | null
          social_behavior?: Json | null
          social_behavior_details?: string | null
          spay_neuter_status?: string | null
          training_goal?: string | null
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
      email_attachments: {
        Row: {
          branch_id: string
          class_type: string | null
          created_at: string
          file_path: string
          file_type: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          class_type?: string | null
          created_at?: string
          file_path: string
          file_type?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          class_type?: string | null
          created_at?: string
          file_path?: string
          file_type?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          attachments: Json | null
          branch_id: string | null
          error_message: string | null
          from_email: string | null
          from_name: string | null
          handler_id: string | null
          html_content: string | null
          id: string
          recipient_email: string
          sent_at: string
          sent_by: string | null
          status: string | null
          subject: string | null
          task_id: string | null
          template_id: string | null
        }
        Insert: {
          attachments?: Json | null
          branch_id?: string | null
          error_message?: string | null
          from_email?: string | null
          from_name?: string | null
          handler_id?: string | null
          html_content?: string | null
          id?: string
          recipient_email: string
          sent_at?: string
          sent_by?: string | null
          status?: string | null
          subject?: string | null
          task_id?: string | null
          template_id?: string | null
        }
        Update: {
          attachments?: Json | null
          branch_id?: string | null
          error_message?: string | null
          from_email?: string | null
          from_name?: string | null
          handler_id?: string | null
          html_content?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string
          sent_by?: string | null
          status?: string | null
          subject?: string | null
          task_id?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_log_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_handler_id_fkey"
            columns: ["handler_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "handler_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "branch_email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          attachments: Json | null
          branch_id: string
          created_at: string
          created_by: string | null
          error_message: string | null
          from_email: string | null
          from_name: string | null
          handler_id: string | null
          html_content: string
          id: string
          max_retries: number
          retry_count: number
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          to_email: string
        }
        Insert: {
          attachments?: Json | null
          branch_id: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          from_email?: string | null
          from_name?: string | null
          handler_id?: string | null
          html_content: string
          id?: string
          max_retries?: number
          retry_count?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          to_email: string
        }
        Update: {
          attachments?: Json | null
          branch_id?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          from_email?: string | null
          from_name?: string | null
          handler_id?: string | null
          html_content?: string
          id?: string
          max_retries?: number
          retry_count?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_handler_id_fkey"
            columns: ["handler_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "branch_email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_registrations: {
        Row: {
          branch_id: string
          class_schedule_id: string | null
          class_type: string
          class_type_other: string | null
          client_id: string
          created_at: string
          dog_id: string
          equipment_supervision_acknowledged: boolean | null
          heard_from: Json | null
          id: string
          onlead_socializing_acknowledged: boolean | null
          photo_permission: string | null
          privacy_policy_agreed: boolean | null
          signature_data: string | null
          signature_date: string | null
          signature_name: string | null
          status: string | null
          submitted_at: string | null
          terms_agreed: boolean | null
          training_equipment_acknowledged: boolean | null
          treats_acknowledged: boolean | null
          updated_at: string
          vet_clearance_url: string | null
          waste_disposal_acknowledged: boolean | null
          whatsapp_permission: string | null
        }
        Insert: {
          branch_id: string
          class_schedule_id?: string | null
          class_type: string
          class_type_other?: string | null
          client_id: string
          created_at?: string
          dog_id: string
          equipment_supervision_acknowledged?: boolean | null
          heard_from?: Json | null
          id?: string
          onlead_socializing_acknowledged?: boolean | null
          photo_permission?: string | null
          privacy_policy_agreed?: boolean | null
          signature_data?: string | null
          signature_date?: string | null
          signature_name?: string | null
          status?: string | null
          submitted_at?: string | null
          terms_agreed?: boolean | null
          training_equipment_acknowledged?: boolean | null
          treats_acknowledged?: boolean | null
          updated_at?: string
          vet_clearance_url?: string | null
          waste_disposal_acknowledged?: boolean | null
          whatsapp_permission?: string | null
        }
        Update: {
          branch_id?: string
          class_schedule_id?: string | null
          class_type?: string
          class_type_other?: string | null
          client_id?: string
          created_at?: string
          dog_id?: string
          equipment_supervision_acknowledged?: boolean | null
          heard_from?: Json | null
          id?: string
          onlead_socializing_acknowledged?: boolean | null
          photo_permission?: string | null
          privacy_policy_agreed?: boolean | null
          signature_data?: string | null
          signature_date?: string | null
          signature_name?: string | null
          status?: string | null
          submitted_at?: string | null
          terms_agreed?: boolean | null
          training_equipment_acknowledged?: boolean | null
          treats_acknowledged?: boolean | null
          updated_at?: string
          vet_clearance_url?: string | null
          waste_disposal_acknowledged?: boolean | null
          whatsapp_permission?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_registrations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_registrations_class_schedule_id_fkey"
            columns: ["class_schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_registrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_registrations_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
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
      franchise_payments: {
        Row: {
          amount_paid: number
          branch_id: string
          created_at: string
          id: string
          month: number
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string
          total_course_fees: number
          total_due: number
          total_enrollment_fees: number
          total_franchise_fees: number
          updated_at: string
          year: number
        }
        Insert: {
          amount_paid?: number
          branch_id: string
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          total_course_fees?: number
          total_due?: number
          total_enrollment_fees?: number
          total_franchise_fees?: number
          updated_at?: string
          year: number
        }
        Update: {
          amount_paid?: number
          branch_id?: string
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          total_course_fees?: number
          total_due?: number
          total_enrollment_fees?: number
          total_franchise_fees?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "franchise_payments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      google_form_submissions: {
        Row: {
          branch_id: string | null
          client_id: string | null
          created_at: string
          dog_ids: string[] | null
          email: string | null
          enrollment_ids: string[] | null
          error_message: string | null
          id: string
          raw_payload: Json
          received_at: string
          source: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          client_id?: string | null
          created_at?: string
          dog_ids?: string[] | null
          email?: string | null
          enrollment_ids?: string[] | null
          error_message?: string | null
          id?: string
          raw_payload: Json
          received_at?: string
          source: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          client_id?: string | null
          created_at?: string
          dog_ids?: string[] | null
          email?: string | null
          enrollment_ids?: string[] | null
          error_message?: string | null
          id?: string
          raw_payload?: Json
          received_at?: string
          source?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      handler_class_status: {
        Row: {
          action_completed: boolean | null
          action_completed_at: string | null
          action_notes: string | null
          booking_id: string | null
          class_id: string | null
          class_type: string | null
          completed: boolean | null
          completed_at: string | null
          completion_method: string | null
          created_at: string | null
          current_time_slot: string | null
          dog_id: string | null
          handler_id: string | null
          id: string
          is_currently_enrolled: boolean | null
          next_action: string | null
          next_class_type: string | null
          next_term_number: string | null
          next_term_year: number | null
          pass_percentage: number | null
          period: string | null
          result_notes: string | null
          result_status: string | null
        }
        Insert: {
          action_completed?: boolean | null
          action_completed_at?: string | null
          action_notes?: string | null
          booking_id?: string | null
          class_id?: string | null
          class_type?: string | null
          completed?: boolean | null
          completed_at?: string | null
          completion_method?: string | null
          created_at?: string | null
          current_time_slot?: string | null
          dog_id?: string | null
          handler_id?: string | null
          id?: string
          is_currently_enrolled?: boolean | null
          next_action?: string | null
          next_class_type?: string | null
          next_term_number?: string | null
          next_term_year?: number | null
          pass_percentage?: number | null
          period?: string | null
          result_notes?: string | null
          result_status?: string | null
        }
        Update: {
          action_completed?: boolean | null
          action_completed_at?: string | null
          action_notes?: string | null
          booking_id?: string | null
          class_id?: string | null
          class_type?: string | null
          completed?: boolean | null
          completed_at?: string | null
          completion_method?: string | null
          created_at?: string | null
          current_time_slot?: string | null
          dog_id?: string | null
          handler_id?: string | null
          id?: string
          is_currently_enrolled?: boolean | null
          next_action?: string | null
          next_class_type?: string | null
          next_term_number?: string | null
          next_term_year?: number | null
          pass_percentage?: number | null
          period?: string | null
          result_notes?: string | null
          result_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handler_class_status_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handler_class_status_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handler_class_status_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      handler_households: {
        Row: {
          created_at: string
          created_by: string | null
          handler_id: string
          id: string
          linked_handler_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          handler_id: string
          id?: string
          linked_handler_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          handler_id?: string
          id?: string
          linked_handler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handler_households_handler_id_fkey"
            columns: ["handler_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handler_households_linked_handler_id_fkey"
            columns: ["linked_handler_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      handler_onboarding: {
        Row: {
          client_id: string | null
          created_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handler_onboarding_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      handler_tasks: {
        Row: {
          assigned_to: string | null
          branch_id: string | null
          class_status_id: string | null
          class_type: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by_trainer_id: string | null
          description: string | null
          dog_id: string | null
          dog_name: string | null
          due_date: string | null
          handler_id: string | null
          id: string
          status: string | null
          target_month: string | null
          target_term_id: string | null
          target_trainer_id: string | null
          task_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          branch_id?: string | null
          class_status_id?: string | null
          class_type?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by_trainer_id?: string | null
          description?: string | null
          dog_id?: string | null
          dog_name?: string | null
          due_date?: string | null
          handler_id?: string | null
          id?: string
          status?: string | null
          target_month?: string | null
          target_term_id?: string | null
          target_trainer_id?: string | null
          task_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          branch_id?: string | null
          class_status_id?: string | null
          class_type?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by_trainer_id?: string | null
          description?: string | null
          dog_id?: string | null
          dog_name?: string | null
          due_date?: string | null
          handler_id?: string | null
          id?: string
          status?: string | null
          target_month?: string | null
          target_term_id?: string | null
          target_trainer_id?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handler_tasks_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handler_tasks_class_status_id_fkey"
            columns: ["class_status_id"]
            isOneToOne: false
            referencedRelation: "handler_class_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handler_tasks_created_by_trainer_id_fkey"
            columns: ["created_by_trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handler_tasks_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handler_tasks_handler_id_fkey"
            columns: ["handler_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handler_tasks_target_term_id_fkey"
            columns: ["target_term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handler_tasks_target_trainer_id_fkey"
            columns: ["target_trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_additional_recipients: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          invoice_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          invoice_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_additional_recipients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_additional_recipients_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_additional_recipients_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "problematic_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          adjustment_reason: string | null
          amount: number
          booking_id: string | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          io_inventory_code: string | null
          item_type: string | null
          original_amount: number | null
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          adjustment_reason?: string | null
          amount: number
          booking_id?: string | null
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          io_inventory_code?: string | null
          item_type?: string | null
          original_amount?: number | null
          quantity?: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          adjustment_reason?: string | null
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          io_inventory_code?: string | null
          item_type?: string | null
          original_amount?: number | null
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "problematic_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          branch_id: string | null
          client_id: string
          created_at: string
          discount_amount: number
          discount_reason: string | null
          discount_type: string
          due_date: string
          email_sent: boolean | null
          franchise_report_month: string | null
          id: string
          invoice_number: string
          io_client_id: number | null
          io_credit_note_id: string | null
          io_credit_note_number: string | null
          io_credit_note_url: string | null
          io_document_id: string | null
          io_invoice_number: string | null
          io_invoice_url: string | null
          io_payment_url: string | null
          io_sync_error: string | null
          io_sync_status: string | null
          io_synced_at: string | null
          issued_date: string
          monetary_discount: number | null
          notes: string | null
          original_discount_amount: number | null
          original_discount_type: string | null
          payment_date: string | null
          payment_received: boolean | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          term_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          client_id: string
          created_at?: string
          discount_amount?: number
          discount_reason?: string | null
          discount_type?: string
          due_date: string
          email_sent?: boolean | null
          franchise_report_month?: string | null
          id?: string
          invoice_number: string
          io_client_id?: number | null
          io_credit_note_id?: string | null
          io_credit_note_number?: string | null
          io_credit_note_url?: string | null
          io_document_id?: string | null
          io_invoice_number?: string | null
          io_invoice_url?: string | null
          io_payment_url?: string | null
          io_sync_error?: string | null
          io_sync_status?: string | null
          io_synced_at?: string | null
          issued_date?: string
          monetary_discount?: number | null
          notes?: string | null
          original_discount_amount?: number | null
          original_discount_type?: string | null
          payment_date?: string | null
          payment_received?: boolean | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          term_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          client_id?: string
          created_at?: string
          discount_amount?: number
          discount_reason?: string | null
          discount_type?: string
          due_date?: string
          email_sent?: boolean | null
          franchise_report_month?: string | null
          id?: string
          invoice_number?: string
          io_client_id?: number | null
          io_credit_note_id?: string | null
          io_credit_note_number?: string | null
          io_credit_note_url?: string | null
          io_document_id?: string | null
          io_invoice_number?: string | null
          io_invoice_url?: string | null
          io_payment_url?: string | null
          io_sync_error?: string | null
          io_sync_status?: string | null
          io_synced_at?: string | null
          issued_date?: string
          monetary_discount?: number | null
          notes?: string | null
          original_discount_amount?: number | null
          original_discount_type?: string | null
          payment_date?: string | null
          payment_received?: boolean | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          term_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_email_templates: {
        Row: {
          class_type: string | null
          code: string
          configurable_fields: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          class_type?: string | null
          code: string
          configurable_fields?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          class_type?: string | null
          code?: string
          configurable_fields?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_id: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          app_id?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          app_id?: string | null
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
      scan_processing_jobs: {
        Row: {
          created_at: string | null
          created_dog_ids: string[] | null
          enrollment_ids: string[] | null
          error_message: string | null
          extracted_data: Json | null
          field_confidence: Json | null
          file_url: string
          filename: string
          id: string
          matched_client_id: string | null
          notes_for_review: string[] | null
          page_count: number | null
          status: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_dog_ids?: string[] | null
          enrollment_ids?: string[] | null
          error_message?: string | null
          extracted_data?: Json | null
          field_confidence?: Json | null
          file_url: string
          filename: string
          id?: string
          matched_client_id?: string | null
          notes_for_review?: string[] | null
          page_count?: number | null
          status?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_dog_ids?: string[] | null
          enrollment_ids?: string[] | null
          error_message?: string | null
          extracted_data?: Json | null
          field_confidence?: Json | null
          file_url?: string
          filename?: string
          id?: string
          matched_client_id?: string | null
          notes_for_review?: string[] | null
          page_count?: number | null
          status?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_processing_jobs_matched_client_id_fkey"
            columns: ["matched_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      starter_kit_allocations: {
        Row: {
          allocated_at: string
          branch_id: string | null
          dog_name: string | null
          handler_id: string | null
          id: string
          inventory_batch_id: string
          invoice_item_id: string | null
        }
        Insert: {
          allocated_at?: string
          branch_id?: string | null
          dog_name?: string | null
          handler_id?: string | null
          id?: string
          inventory_batch_id: string
          invoice_item_id?: string | null
        }
        Update: {
          allocated_at?: string
          branch_id?: string | null
          dog_name?: string | null
          handler_id?: string | null
          id?: string
          inventory_batch_id?: string
          invoice_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "starter_kit_allocations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starter_kit_allocations_handler_id_fkey"
            columns: ["handler_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starter_kit_allocations_inventory_batch_id_fkey"
            columns: ["inventory_batch_id"]
            isOneToOne: false
            referencedRelation: "starter_kit_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starter_kit_allocations_invoice_item_id_fkey"
            columns: ["invoice_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_items"
            referencedColumns: ["id"]
          },
        ]
      }
      starter_kit_inventory: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          purchase_date: string
          quantity_added: number
          quantity_remaining: number
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string
          quantity_added: number
          quantity_remaining?: number
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string
          quantity_added?: number
          quantity_remaining?: number
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      template_configurations: {
        Row: {
          branch_id: string
          class_type: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_code: string
          updated_at: string
          variables: Json
        }
        Insert: {
          branch_id: string
          class_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_code: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          branch_id?: string
          class_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_code?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "template_configurations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          academic_year_id: string
          created_at: string | null
          current: boolean | null
          end_date: string
          id: string
          start_date: string
          term_number: Database["public"]["Enums"]["term_number"]
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          created_at?: string | null
          current?: boolean | null
          end_date: string
          id?: string
          start_date: string
          term_number: Database["public"]["Enums"]["term_number"]
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          created_at?: string | null
          current?: boolean | null
          end_date?: string
          id?: string
          start_date?: string
          term_number?: Database["public"]["Enums"]["term_number"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terms_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_branches: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          trainer_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          trainer_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_branches_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_payments: {
        Row: {
          amount: number
          booking_id: string | null
          class_schedule_id: string
          created_at: string
          document_name: string | null
          document_url: string | null
          id: string
          invoice_item_id: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          status: string
          trainer_id: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          class_schedule_id: string
          created_at?: string
          document_name?: string | null
          document_url?: string | null
          id?: string
          invoice_item_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          trainer_id: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          class_schedule_id?: string
          created_at?: string
          document_name?: string | null
          document_url?: string | null
          id?: string
          invoice_item_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          trainer_id?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_payments_class_schedule_id_fkey"
            columns: ["class_schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_payments_invoice_item_id_fkey"
            columns: ["invoice_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_payments_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
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
      training_session_slots: {
        Row: {
          created_at: string
          display_name: string
          id: string
          sort_order: number | null
          time_slot: string
          training_session_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          sort_order?: number | null
          time_slot: string
          training_session_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          sort_order?: number | null
          time_slot?: string
          training_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_session_slots_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          notes: string | null
          session_date: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          notes?: string | null
          session_date: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      problematic_invoices: {
        Row: {
          bookings_count: number | null
          client_id: string | null
          created_at: string | null
          id: string | null
          invoice_number: string | null
          items_count: number | null
          status: string | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      allocate_starter_kit: {
        Args: {
          p_branch_id: string
          p_dog_name: string
          p_handler_id: string
          p_invoice_item_id: string
        }
        Returns: {
          message: string
          remaining_total: number
          success: boolean
        }[]
      }
      apply_fair_share_to_invoice: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      calculate_trainer_payment: {
        Args: { p_booking_id: string }
        Returns: number
      }
      calculate_trainer_payment_for_schedule: {
        Args: { p_class_schedule_id: string; p_trainer_id: string }
        Returns: number
      }
      check_user_role: { Args: { required_role: string }; Returns: boolean }
      count_invoices_with_prefix: { Args: { prefix: string }; Returns: number }
      delete_invoice_cascade: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      determine_term_from_date: {
        Args: { date_to_check: string }
        Returns: {
          academic_year: number
          term_number: Database["public"]["Enums"]["term_number"]
        }[]
      }
      get_assistant_branch_id: { Args: { user_uuid: string }; Returns: string }
      get_current_term: {
        Args: never
        Returns: {
          end_date: string
          start_date: string
          term_id: string
          term_number: Database["public"]["Enums"]["term_number"]
          year: number
        }[]
      }
      get_default_branch_name: { Args: never; Returns: string }
      get_invoice_items_with_details: {
        Args: { p_invoice_id: string }
        Returns: {
          amount: number
          booking_details: Json
          booking_id: string
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
          updated_at: string
        }[]
      }
      get_invoices_with_items: {
        Args: { p_branch_id: string }
        Returns: {
          client: Json
          invoice: Json
          invoice_id: string
          items: Json
        }[]
      }
      get_starter_kit_stock: { Args: never; Returns: number }
      get_term_id_for_month: { Args: { month_str: string }; Returns: string }
      get_unread_message_count: {
        Args: { p_client_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_trainer: { Args: { user_id: string }; Returns: boolean }
      make_bucket_public: { Args: { bucket_id: string }; Returns: boolean }
      mark_messages_as_read: {
        Args: { p_client_id: string; p_message_ids: string[] }
        Returns: undefined
      }
      return_starter_kit: {
        Args: { p_allocation_id: string }
        Returns: {
          message: string
          remaining_total: number
          success: boolean
        }[]
      }
    }
    Enums: {
      app_role:
        | "platform_admin"
        | "admin"
        | "trainer"
        | "handler"
        | "user"
        | "assistant"
      term_number: "1" | "2" | "3" | "4"
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
        "platform_admin",
        "admin",
        "trainer",
        "handler",
        "user",
        "assistant",
      ],
      term_number: ["1", "2", "3", "4"],
    },
  },
} as const
