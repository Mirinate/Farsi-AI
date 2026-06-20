export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed'

export type PlanTier = 'free' | 'creator' | 'pro'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          plan: PlanTier
          minutes_used: number
          minutes_limit: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          title: string
          status: JobStatus
          source_type: 'upload' | 'youtube'
          source_url: string | null
          source_file_path: string | null
          output_video_url: string | null
          output_srt_url: string | null
          duration_seconds: number | null
          error_message: string | null
          segments: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      job_status: JobStatus
      plan_tier: PlanTier
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type TranscriptSegment = {
  id: number
  start: number
  end: number
  english: string
  farsi: string
}
