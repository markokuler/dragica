export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          slug: string
          name: string
          email: string
          phone: string
          subdomain: string
          logo_url: string | null
          accent_color: string | null
          description: string | null
          is_active: boolean
          banner_url: string | null
          background_color: string | null
          text_color: string | null
          button_style: string | null
          theme: string | null
          welcome_message: string | null
          admin_notes: string | null
          subscription_status: string | null
          subscription_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          email: string
          phone: string
          subdomain: string
          logo_url?: string | null
          accent_color?: string | null
          description?: string | null
          is_active?: boolean
          banner_url?: string | null
          background_color?: string | null
          text_color?: string | null
          button_style?: string | null
          theme?: string | null
          welcome_message?: string | null
          admin_notes?: string | null
          subscription_status?: string | null
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          email?: string
          phone?: string
          subdomain?: string
          logo_url?: string | null
          accent_color?: string | null
          description?: string | null
          is_active?: boolean
          banner_url?: string | null
          background_color?: string | null
          text_color?: string | null
          button_style?: string | null
          theme?: string | null
          welcome_message?: string | null
          admin_notes?: string | null
          subscription_status?: string | null
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'client'
          tenant_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'admin' | 'client'
          tenant_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'client'
          tenant_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          tenant_id: string
          name: string
          duration_minutes: number
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          duration_minutes: number
          price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          duration_minutes?: number
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      working_hours: {
        Row: {
          id: string
          tenant_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
        }
        Insert: {
          id?: string
          tenant_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active?: boolean
        }
        Update: {
          id?: string
          tenant_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_active?: boolean
        }
      }
      blocked_slots: {
        Row: {
          id: string
          tenant_id: string
          start_datetime: string
          end_datetime: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          start_datetime: string
          end_datetime: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          start_datetime?: string
          end_datetime?: string
          reason?: string | null
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          phone: string
          name: string | null
          notification_channel: 'whatsapp' | 'viber' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          phone: string
          name?: string | null
          notification_channel?: 'whatsapp' | 'viber' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          phone?: string
          name?: string | null
          notification_channel?: 'whatsapp' | 'viber' | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          service_id: string
          start_datetime: string
          end_datetime: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'noshow'
          otp_code: string | null
          otp_verified_at: string | null
          manage_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          service_id: string
          start_datetime: string
          end_datetime: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'noshow'
          otp_code?: string | null
          otp_verified_at?: string | null
          manage_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          service_id?: string
          start_datetime?: string
          end_datetime?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'noshow'
          otp_code?: string | null
          otp_verified_at?: string | null
          manage_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      financial_entries: {
        Row: {
          id: string
          tenant_id: string
          type: 'income' | 'expense'
          category: string
          amount: number
          description: string | null
          entry_date: string
          booking_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          type: 'income' | 'expense'
          category: string
          amount: number
          description?: string | null
          entry_date: string
          booking_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          type?: 'income' | 'expense'
          category?: string
          amount?: number
          description?: string | null
          entry_date?: string
          booking_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          duration_days: number
          price: number
          is_trial: boolean
          features: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          duration_days: number
          price?: number
          is_trial?: boolean
          features?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          duration_days?: number
          price?: number
          is_trial?: boolean
          features?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tenant_subscriptions: {
        Row: {
          id: string
          tenant_id: string
          plan_id: string
          started_at: string
          expires_at: string
          status: 'active' | 'expired' | 'payment_pending' | 'cancelled'
          trial_days: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          plan_id: string
          started_at?: string
          expires_at: string
          status?: 'active' | 'expired' | 'payment_pending' | 'cancelled'
          trial_days?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          plan_id?: string
          started_at?: string
          expires_at?: string
          status?: 'active' | 'expired' | 'payment_pending' | 'cancelled'
          trial_days?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          subscription_id: string | null
          plan_id: string | null
          amount: number
          payment_date: string
          recorded_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          subscription_id?: string | null
          plan_id?: string | null
          amount: number
          payment_date: string
          recorded_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          subscription_id?: string | null
          plan_id?: string | null
          amount?: number
          payment_date?: string
          recorded_by?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_type: string
          discount_value: number
          max_uses: number | null
          valid_from: string
          valid_until: string | null
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_type: string
          discount_value: number
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_type?: string
          discount_value?: number
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      salon_tags: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      tenant_tags: {
        Row: {
          id: string
          tenant_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      salon_contact_history: {
        Row: {
          id: string
          tenant_id: string
          contact_type: string
          description: string
          contact_date: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          contact_type: string
          description: string
          contact_date?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          contact_type?: string
          description?: string
          contact_date?: string
          created_by?: string | null
          created_at?: string
        }
      }
      admin_reminders: {
        Row: {
          id: string
          tenant_id: string | null
          title: string
          description: string | null
          reminder_date: string
          is_completed: boolean
          completed_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          title: string
          description?: string | null
          reminder_date: string
          is_completed?: boolean
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          title?: string
          description?: string | null
          reminder_date?: string
          is_completed?: boolean
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      admin_financial_entries: {
        Row: {
          id: string
          type: 'income' | 'expense'
          category: string
          amount: number
          description: string | null
          entry_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'income' | 'expense'
          category: string
          amount: number
          description?: string | null
          entry_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'income' | 'expense'
          category?: string
          amount?: number
          description?: string | null
          entry_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          entity_name: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          entity_name?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          entity_name?: string | null
          details?: Json | null
          created_at?: string
        }
      }
      app_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value?: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
      }
    }
  }
}
