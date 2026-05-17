-- ============================================================
-- Mirinate Care — Full Database Schema with RLS
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- AGENCIES
-- ============================================================
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  brand_color TEXT NOT NULL DEFAULT '#2563eb',
  subdomain TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'active', 'past_due', 'canceled')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Public can read agency branding (needed for white-label pages)
CREATE POLICY "Public can view agency branding"
  ON agencies FOR SELECT
  USING (true);

-- Only service role can insert/update agencies
CREATE POLICY "Service role manages agencies"
  ON agencies FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- USERS (mirrors auth.users with role info)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'caregiver', 'client', 'family')),
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their own agency"
  ON users FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Service role full access to users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- CAREGIVERS
-- ============================================================
CREATE TABLE IF NOT EXISTS caregivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certification TEXT CHECK (certification IN ('CNA', 'HHA')),
  hire_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  no_show_count INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view caregivers"
  ON caregivers FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage caregivers"
  ON caregivers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = caregivers.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access to caregivers"
  ON caregivers FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  dob DATE,
  address TEXT,
  care_type TEXT,
  notes TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view clients"
  ON clients FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = clients.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access to clients"
  ON clients FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- FAMILY MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view family members"
  ON family_members FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage family members"
  ON family_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = family_members.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access to family_members"
  ON family_members FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- SHIFTS
-- ============================================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked_in', 'completed', 'no_show')),
  repeat TEXT NOT NULL DEFAULT 'none' CHECK (repeat IN ('none', 'daily', 'weekdays', 'weekly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view shifts"
  ON shifts FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage shifts"
  ON shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = shifts.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Caregivers can update their own shifts"
  ON shifts FOR UPDATE
  USING (
    caregiver_id IN (
      SELECT id FROM caregivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to shifts"
  ON shifts FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- CHECKINS (EVV)
-- ============================================================
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
  checkin_time TIMESTAMPTZ,
  checkout_time TIMESTAMPTZ,
  checkin_lat NUMERIC(10, 7),
  checkin_lng NUMERIC(10, 7),
  checkout_lat NUMERIC(10, 7),
  checkout_lng NUMERIC(10, 7),
  evv_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view checkins"
  ON checkins FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Caregivers can insert their own checkins"
  ON checkins FOR INSERT
  WITH CHECK (
    caregiver_id IN (
      SELECT id FROM caregivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can update their own checkins"
  ON checkins FOR UPDATE
  USING (
    caregiver_id IN (
      SELECT id FROM caregivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to checkins"
  ON checkins FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- JOB POSTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  certification_required TEXT,
  pay_rate NUMERIC(8, 2),
  employment_type TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view job postings"
  ON job_postings FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage job postings"
  ON job_postings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = job_postings.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access to job_postings"
  ON job_postings FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  certification TEXT,
  experience_years INTEGER,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'interview', 'bg_check', 'hired', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = applications.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage applications"
  ON applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = applications.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access to applications"
  ON applications FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- TRAINING MODULES
-- ============================================================
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view training modules"
  ON training_modules FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage training modules"
  ON training_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = training_modules.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access to training_modules"
  ON training_modules FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- TRAINING PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(module_id, caregiver_id)
);

ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view training progress"
  ON training_progress FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Caregivers can update their own training progress"
  ON training_progress FOR ALL
  USING (
    caregiver_id IN (
      SELECT id FROM caregivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage training progress"
  ON training_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = training_progress.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access to training_progress"
  ON training_progress FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('license', 'bg_check', 'tb_test', 'i9')),
  file_url TEXT NOT NULL,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all agency documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = documents.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Users can upload their own documents"
  ON documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage documents"
  ON documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = documents.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access to documents"
  ON documents FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "Admins can view all agency messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = messages.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Recipients can mark messages read"
  ON messages FOR UPDATE
  USING (recipient_id = auth.uid());

CREATE POLICY "Service role full access to messages"
  ON messages FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- VISIT NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS visit_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  notes TEXT,
  vitals TEXT,
  medications_given TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE visit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view visit notes"
  ON visit_notes FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Caregivers can insert their own visit notes"
  ON visit_notes FOR INSERT
  WITH CHECK (
    caregiver_id IN (
      SELECT id FROM caregivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to visit_notes"
  ON visit_notes FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their agency alerts"
  ON alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = alerts.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update alerts"
  ON alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND agency_id = alerts.agency_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access to alerts"
  ON alerts FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase dashboard or via API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('agency-logos', 'agency-logos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- ============================================================
-- HELPFUL INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_agency_id ON users(agency_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_agency_id ON caregivers(agency_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_user_id ON caregivers(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_shifts_agency_id ON shifts(agency_id);
CREATE INDEX IF NOT EXISTS idx_shifts_caregiver_id ON shifts(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_checkins_shift_id ON checkins(shift_id);
CREATE INDEX IF NOT EXISTS idx_checkins_caregiver_id ON checkins(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_agency_id ON alerts(agency_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON documents(expiry_date);
