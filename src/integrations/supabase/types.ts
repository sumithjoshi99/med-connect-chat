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
      audit_log: {
        Row: {
          id: string
          staff_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          preferred_channel: string
          status: string
          created_at: string
          updated_at: string
          date_of_birth: string | null
          address: string | null
          emergency_contact: string | null
          allergies: string[] | null
          medications: string[] | null
          medical_conditions: string[] | null
          insurance_provider: string | null
          last_visit: string | null
          next_appointment: string | null
          notes: string | null
          pharmacy_id: string | null
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          preferred_channel?: string
          status?: string
          created_at?: string
          updated_at?: string
          date_of_birth?: string | null
          address?: string | null
          emergency_contact?: string | null
          allergies?: string[] | null
          medications?: string[] | null
          medical_conditions?: string[] | null
          insurance_provider?: string | null
          last_visit?: string | null
          next_appointment?: string | null
          notes?: string | null
          pharmacy_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          preferred_channel?: string
          status?: string
          created_at?: string
          updated_at?: string
          date_of_birth?: string | null
          address?: string | null
          emergency_contact?: string | null
          allergies?: string[] | null
          medications?: string[] | null
          medical_conditions?: string[] | null
          insurance_provider?: string | null
          last_visit?: string | null
          next_appointment?: string | null
          notes?: string | null
          pharmacy_id?: string | null
        }
      }
      pharmacies: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          license_number: string | null
          is_active: boolean | null
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          license_number?: string | null
          is_active?: boolean | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          license_number?: string | null
          is_active?: boolean | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      staff_accounts: {
        Row: {
          id: string
          user_id: string | null
          pharmacy_id: string
          email: string
          first_name: string
          last_name: string
          role: string
          permissions: Json | null
          is_active: boolean | null
          phone: string | null
          hire_date: string | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          pharmacy_id: string
          email: string
          first_name: string
          last_name: string
          role: string
          permissions?: Json | null
          is_active?: boolean | null
          phone?: string | null
          hire_date?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          pharmacy_id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: string
          permissions?: Json | null
          is_active?: boolean | null
          phone?: string | null
          hire_date?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      staff_sessions: {
        Row: {
          id: string
          staff_id: string | null
          login_time: string | null
          logout_time: string | null
          ip_address: string | null
          user_agent: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          staff_id?: string | null
          login_time?: string | null
          logout_time?: string | null
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          staff_id?: string | null
          login_time?: string | null
          logout_time?: string | null
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean | null
        }
      }
      messages: {
        Row: {
          id: string
          patient_id: string | null
          channel: string
          direction: string
          content: string
          status: string
          sender_name: string | null
          external_id: string | null
          created_at: string
          updated_at: string
          pharmacy_id: string | null
        }
        Insert: {
          id?: string
          patient_id?: string | null
          channel?: string
          direction: string
          content: string
          status?: string
          sender_name?: string | null
          external_id?: string | null
          created_at?: string
          updated_at?: string
          pharmacy_id?: string | null
        }
        Update: {
          id?: string
          patient_id?: string | null
          channel?: string
          direction?: string
          content?: string
          status?: string
          sender_name?: string | null
          external_id?: string | null
          created_at?: string
          updated_at?: string
          pharmacy_id?: string | null
        }
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
