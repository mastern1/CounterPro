// Hand-written to mirror the shape `supabase gen types typescript` produces,
// so it's a drop-in replacement once you generate real types from the live
// project (`supabase gen types typescript --project-id hawqnpjwtpegahgehndo`).
// Columns are sourced from the INSERT/UPDATE statements in
// supabase_functions.sql — the .sql files in the repo root are not
// guaranteed to match the live database, so re-generating from the CLI is
// the more trustworthy source once you're set up to run it.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          device_id: string
          worker_name: string
          last_seen_at: string
        }
        Insert: {
          device_id: string
          worker_name?: string
          last_seen_at?: string
        }
        Update: {
          device_id?: string
          worker_name?: string
          last_seen_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          device_id: string
          name: string
          updated_at: string
        }
        Insert: {
          id: string
          device_id: string
          name: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      counters: {
        Row: {
          id: string
          group_id: string
          device_id: string
          name: string
          count: number
          target: number | null
          updated_at: string
        }
        Insert: {
          id: string
          group_id: string
          device_id: string
          name: string
          count?: number
          target?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          device_id?: string
          name?: string
          count?: number
          target?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          device_id: string
          group_id: string
          worker_name: string
          items: Json | null
          status: string
          duration_seconds: number | null
          started_at: string
          ended_at: string | null
          last_update_at: string
          created_at: string
          client_session_id: string | null
        }
        Insert: {
          id?: string
          device_id: string
          group_id: string
          worker_name: string
          items?: Json | null
          status?: string
          duration_seconds?: number | null
          started_at?: string
          ended_at?: string | null
          last_update_at?: string
          created_at?: string
          client_session_id?: string | null
        }
        Update: {
          id?: string
          device_id?: string
          group_id?: string
          worker_name?: string
          items?: Json | null
          status?: string
          duration_seconds?: number | null
          started_at?: string
          ended_at?: string | null
          last_update_at?: string
          created_at?: string
          client_session_id?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
