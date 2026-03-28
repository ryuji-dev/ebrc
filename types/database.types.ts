// Supabase Database Types
// Auto-generated from database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'user' | 'admin';
          cumulative_readthrough_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'user' | 'admin';
          cumulative_readthrough_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'user' | 'admin';
          cumulative_readthrough_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      devotion_plans: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          title: string;
          description: string | null;
          frequency: 'daily' | 'weekly' | 'monthly';
          target_count: number;
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          title: string;
          description?: string | null;
          frequency: 'daily' | 'weekly' | 'monthly';
          target_count: number;
          start_date: string;
          end_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          year?: number;
          title?: string;
          description?: string | null;
          frequency?: 'daily' | 'weekly' | 'monthly';
          target_count?: number;
          start_date?: string;
          end_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      devotion_checkins: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          parent_id: string | null;
          checkin_date: string;
          duration_minutes: number | null;
          memo: string | null;
          planned_start_time: string | null;
          start_time: string | null;
          end_time: string | null;
          planned_end_time: string | null;
          created_at: string;
          updated_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          parent_id?: string | null;
          checkin_date: string;
          duration_minutes?: number | null;
          memo?: string | null;
          planned_start_time?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          planned_end_time?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string | null;
          parent_id?: string | null;
          checkin_date?: string;
          duration_minutes?: number | null;
          memo?: string | null;
          planned_start_time?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          planned_end_time?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          updated_by?: string;
        };
      };
      reading_plan_templates: {
        Row: {
          id: string;
          year: number;
          title: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          title: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          year?: number;
          title?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      reading_plan_template_items: {
        Row: {
          id: string;
          template_id: string;
          date: string;
          day_number: number;
          passages: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          date: string;
          day_number: number;
          passages: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          date?: string;
          day_number?: number;
          passages?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      user_reading_plans: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          year: number;
          status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id: string;
          year: number;
          status?: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string;
          year?: number;
          status?: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_bible_progress: {
        Row: {
          id: string;
          user_id: string;
          book_id: number;
          chapter: number;
          year: number;
          completed_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: number;
          chapter: number;
          year: number;
          completed_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: number;
          chapter?: number;
          year?: number;
          completed_at?: string;
          deleted_at?: string | null;
        };
      };
      user_reading_completions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          date: string;
          completed_at: string;
          memo: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          date: string;
          completed_at?: string;
          memo?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          date?: string;
          completed_at?: string;
          memo?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      check_and_complete_reading_plan: {
        Args: { p_plan_id: string };
        Returns: {
          is_newly_completed: boolean;
          total_items: number;
          completed_items: number;
          completion_percentage: number;
        }[];
      };
    };
    Enums: {
      user_role: 'user' | 'admin';
      devotion_plan_frequency: 'daily' | 'weekly' | 'monthly';
      reading_plan_status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
    };
  };
}
