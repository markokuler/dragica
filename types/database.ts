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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          phone: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          phone?: string
          name?: string | null
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
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          otp_code: string | null
          otp_verified_at: string | null
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
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          otp_code?: string | null
          otp_verified_at?: string | null
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
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          otp_code?: string | null
          otp_verified_at?: string | null
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
    }
  }
}
