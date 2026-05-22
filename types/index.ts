export type UserRole = 'admin' | 'caregiver' | 'client' | 'family' | 'superadmin'
export type ShiftStatus = 'scheduled' | 'checked_in' | 'completed' | 'no_show'
export type ShiftRepeat = 'none' | 'daily' | 'weekdays' | 'weekly'
export type DocumentType = 'license' | 'bg_check' | 'tb_test' | 'i9'
export type DocumentStatus = 'pending' | 'approved' | 'expired'
export type ApplicationStatus = 'new' | 'interview' | 'bg_check' | 'hired' | 'rejected'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AgencyPlan = 'trial' | 'active' | 'past_due' | 'canceled'

export interface Agency {
  id: string
  name: string
  logo_url: string | null
  brand_color: string
  subdomain: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan: AgencyPlan
  trial_ends_at: string | null
  created_at: string
}

export interface User {
  id: string
  agency_id: string
  email: string
  role: UserRole
  full_name: string
  phone: string | null
  avatar_url: string | null
  created_at: string
}

export interface Caregiver {
  id: string
  agency_id: string
  user_id: string
  certification: 'CNA' | 'HHA' | null
  hire_date: string | null
  status: 'active' | 'inactive'
  no_show_count: number
  rating: number | null
  user?: User
}

export interface Client {
  id: string
  agency_id: string
  full_name: string
  dob: string | null
  address: string | null
  care_type: string | null
  notes: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  created_at: string
}

export interface FamilyMember {
  id: string
  agency_id: string
  user_id: string
  client_id: string
  relationship: string | null
  user?: User
  client?: Client
}

export interface Shift {
  id: string
  agency_id: string
  caregiver_id: string
  client_id: string
  start_time: string
  end_time: string
  status: ShiftStatus
  repeat: ShiftRepeat
  caregiver?: Caregiver
  client?: Client
}

export interface CheckIn {
  id: string
  agency_id: string
  shift_id: string
  caregiver_id: string
  checkin_time: string | null
  checkout_time: string | null
  checkin_lat: number | null
  checkin_lng: number | null
  checkout_lat: number | null
  checkout_lng: number | null
  evv_verified: boolean
  shift?: Shift
  caregiver?: Caregiver
}

export interface JobPosting {
  id: string
  agency_id: string
  title: string
  certification_required: string | null
  pay_rate: number | null
  employment_type: string | null
  description: string | null
  status: 'open' | 'closed'
  created_at: string
}

export interface Application {
  id: string
  agency_id: string
  job_id: string
  full_name: string
  email: string
  phone: string | null
  certification: string | null
  experience_years: number | null
  status: ApplicationStatus
  created_at: string
  job?: JobPosting
}

export interface TrainingModule {
  id: string
  agency_id: string
  title: string
  description: string | null
  required: boolean
  due_date: string | null
  created_at: string
}

export interface TrainingProgress {
  id: string
  agency_id: string
  module_id: string
  caregiver_id: string
  completed: boolean
  completed_at: string | null
  module?: TrainingModule
  caregiver?: Caregiver
}

export interface Document {
  id: string
  agency_id: string
  user_id: string
  type: DocumentType
  file_url: string
  expiry_date: string | null
  status: DocumentStatus
  created_at: string
  user?: User
}

export interface Message {
  id: string
  agency_id: string
  sender_id: string
  recipient_id: string
  client_id: string | null
  body: string
  read: boolean
  created_at: string
  sender?: User
  recipient?: User
}

export interface VisitNote {
  id: string
  agency_id: string
  shift_id: string
  caregiver_id: string
  client_id: string
  notes: string | null
  vitals: string | null
  medications_given: string | null
  created_at: string
  caregiver?: Caregiver
  client?: Client
}

export interface Alert {
  id: string
  agency_id: string
  type: string
  message: string
  severity: AlertSeverity
  resolved: boolean
  created_at: string
}
