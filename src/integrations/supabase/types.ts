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
          status: string
          updated_at: string
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
          status?: string
          updated_at?: string
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
      classes: {
        Row: {
          admin_fee_type: string
          admin_fee_value: number
          branch_id: string
          capacity: number
          class_type: Database["public"]["Enums"]["class_type"]
          course_fee: number
          created_at: string
          description: string
          duration: number
          enrollment_fee: number
          id: string
          mckaynine_commission_type: string
          mckaynine_commission_value: number
          name: string
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
          class_type: Database["public"]["Enums"]["class_type"]
          course_fee?: number
          created_at?: string
          description: string
          duration: number
          enrollment_fee?: number
          id?: string
          mckaynine_commission_type?: string
          mckaynine_commission_value?: number
          name: string
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
          class_type?: Database["public"]["Enums"]["class_type"]
          course_fee?: number
          created_at?: string
          description?: string
          duration?: number
          enrollment_fee?: number
          id?: string
          mckaynine_commission_type?: string
          mckaynine_commission_value?: number
          name?: string
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
          last_name: string
          notes: string | null
          occupation: string | null
          onboarding_status: string
          phone: string | null
          postal_code: string | null
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
          last_name: string
          notes?: string | null
          occupation?: string | null
          onboarding_status?: string
          phone?: string | null
          postal_code?: string | null
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
          last_name?: string
          notes?: string | null
          occupation?: string | null
          onboarding_status?: string
          phone?: string | null
          postal_code?: string | null
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
          class_status_id: string | null
          class_type: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          handler_id: string | null
          id: string
          status: string | null
          task_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          class_status_id?: string | null
          class_type?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          handler_id?: string | null
          id?: string
          status?: string | null
          task_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          class_status_id?: string | null
          class_type?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          handler_id?: string | null
          id?: string
          status?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handler_tasks_class_status_id_fkey"
            columns: ["class_status_id"]
            isOneToOne: false
            referencedRelation: "handler_class_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handler_tasks_handler_id_fkey"
            columns: ["handler_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          item_type: string | null
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          item_type?: string | null
          quantity?: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          item_type?: string | null
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
          total: number
          updated_at: string
        }
        Insert: {
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
          total?: number
          updated_at?: string
        }
        Update: {
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
          total?: number
          updated_at?: string
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
      calculate_trainer_payment: {
        Args: { p_booking_id: string }
        Returns: number
      }
      check_user_role: { Args: { required_role: string }; Returns: boolean }
      count_invoices_with_prefix: { Args: { prefix: string }; Returns: number }
      determine_term_from_date: {
        Args: { date_to_check: string }
        Returns: {
          academic_year: number
          term_number: Database["public"]["Enums"]["term_number"]
        }[]
      }
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
    }
    Enums: {
      app_role: "platform_admin" | "admin" | "trainer" | "handler" | "user"
      class_type:
        | "Puppy"
        | "EO"
        | "CGC Bronze"
        | "CGC Silver"
        | "Beginner"
        | "Novice"
        | "WT"
        | "A-Test"
        | "Yoga"
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
      app_role: ["platform_admin", "admin", "trainer", "handler", "user"],
      class_type: [
        "Puppy",
        "EO",
        "CGC Bronze",
        "CGC Silver",
        "Beginner",
        "Novice",
        "WT",
        "A-Test",
        "Yoga",
      ],
      term_number: ["1", "2", "3", "4"],
    },
  },
} as const
