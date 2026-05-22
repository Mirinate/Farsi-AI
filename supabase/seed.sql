-- ============================================================
-- Mirinate Care — Demo Seed Data
-- Agency: Harmony Home Aides (65a06d04-e885-4532-8165-6e528841a690)
-- Run AFTER schema.sql and fix-rls.sql
-- ============================================================

DO $$
DECLARE
  agency_id UUID := '65a06d04-e885-4532-8165-6e528841a690';

  -- Caregiver user IDs
  cg1_user_id UUID := 'a0000001-0000-0000-0000-000000000001';
  cg2_user_id UUID := 'a0000001-0000-0000-0000-000000000002';

  -- Caregiver record IDs
  cg1_id UUID := 'b0000001-0000-0000-0000-000000000001';
  cg2_id UUID := 'b0000001-0000-0000-0000-000000000002';

  -- Client IDs
  cl1_id UUID := 'c0000001-0000-0000-0000-000000000001';
  cl2_id UUID := 'c0000001-0000-0000-0000-000000000002';

  -- Family member user ID
  fam1_user_id UUID := 'd0000001-0000-0000-0000-000000000001';

  -- Admin user ID (Hamid)
  admin_user_id UUID := '109a9fb8-a259-4379-ac41-01c385f83b32';

  -- Shift IDs
  sh1_id UUID := 'e0000001-0000-0000-0000-000000000001';
  sh2_id UUID := 'e0000001-0000-0000-0000-000000000002';
  sh3_id UUID := 'e0000001-0000-0000-0000-000000000003';
  sh4_id UUID := 'e0000001-0000-0000-0000-000000000004';

  -- Training module IDs
  tm1_id UUID := 'f0000001-0000-0000-0000-000000000001';
  tm2_id UUID := 'f0000001-0000-0000-0000-000000000002';

  -- Job posting IDs
  job1_id UUID := '10000001-0000-0000-0000-000000000001';

BEGIN

-- ============================================================
-- AUTH USERS (caregivers & family)
-- Password for all demo users: Demo1234!
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
)
VALUES
  (
    cg1_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'maria.garcia@demo.com',
    crypt('Demo1234!', gen_salt('bf')),
    NOW(),
    '{"full_name":"Maria Garcia"}'::jsonb,
    NOW(), NOW()
  ),
  (
    cg2_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'james.wilson@demo.com',
    crypt('Demo1234!', gen_salt('bf')),
    NOW(),
    '{"full_name":"James Wilson"}'::jsonb,
    NOW(), NOW()
  ),
  (
    fam1_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'sarah.thompson@demo.com',
    crypt('Demo1234!', gen_salt('bf')),
    NOW(),
    '{"full_name":"Sarah Thompson"}'::jsonb,
    NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PUBLIC USERS
-- ============================================================
INSERT INTO users (id, agency_id, email, role, full_name, phone)
VALUES
  (cg1_user_id, agency_id, 'maria.garcia@demo.com', 'caregiver', 'Maria Garcia', '(310) 555-0101'),
  (cg2_user_id, agency_id, 'james.wilson@demo.com', 'caregiver', 'James Wilson', '(310) 555-0102'),
  (fam1_user_id, agency_id, 'sarah.thompson@demo.com', 'family', 'Sarah Thompson', '(310) 555-0201')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CAREGIVERS
-- ============================================================
INSERT INTO caregivers (id, agency_id, user_id, certification, hire_date, status, no_show_count, rating)
VALUES
  (cg1_id, agency_id, cg1_user_id, 'CNA', '2024-03-15', 'active', 0, 4.8),
  (cg2_id, agency_id, cg2_user_id, 'HHA', '2024-06-01', 'active', 1, 4.2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CLIENTS
-- ============================================================
INSERT INTO clients (id, agency_id, full_name, dob, address, care_type, notes, emergency_contact_name, emergency_contact_phone)
VALUES
  (
    cl1_id, agency_id,
    'Robert Thompson', '1942-08-22',
    '4521 Maple Ave, Los Angeles, CA 90012',
    'Personal Care & Companionship',
    'Requires assistance with bathing, dressing, and meal prep. Enjoys watching baseball.',
    'Sarah Thompson (Daughter)', '(310) 555-0201'
  ),
  (
    cl2_id, agency_id,
    'Dorothy Lee', '1938-04-10',
    '780 Oak Street, Pasadena, CA 91101',
    'Skilled Nursing & Medication Management',
    'Diabetic — monitor blood sugar twice daily. Mild dementia. Loves gardening.',
    'Kevin Lee (Son)', '(626) 555-0301'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FAMILY MEMBERS
-- ============================================================
INSERT INTO family_members (agency_id, user_id, client_id, relationship)
VALUES
  (agency_id, fam1_user_id, cl1_id, 'Daughter')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SHIFTS (mix of past completed, today, and upcoming)
-- ============================================================
INSERT INTO shifts (id, agency_id, caregiver_id, client_id, start_time, end_time, status, repeat)
VALUES
  -- Yesterday completed
  (sh1_id, agency_id, cg1_id, cl1_id,
   NOW() - INTERVAL '1 day' + TIME '08:00', NOW() - INTERVAL '1 day' + TIME '12:00',
   'completed', 'weekdays'),
  -- Today in progress
  (sh2_id, agency_id, cg1_id, cl1_id,
   NOW() - INTERVAL '1 hour', NOW() + INTERVAL '3 hours',
   'checked_in', 'weekdays'),
  -- Today upcoming
  (sh3_id, agency_id, cg2_id, cl2_id,
   NOW() + INTERVAL '2 hours', NOW() + INTERVAL '6 hours',
   'scheduled', 'daily'),
  -- Tomorrow
  (sh4_id, agency_id, cg2_id, cl1_id,
   NOW() + INTERVAL '1 day' + TIME '09:00', NOW() + INTERVAL '1 day' + TIME '13:00',
   'scheduled', 'none')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CHECKINS (EVV)
-- ============================================================
INSERT INTO checkins (agency_id, shift_id, caregiver_id, checkin_time, checkout_time, checkin_lat, checkin_lng, checkout_lat, checkout_lng, evv_verified)
VALUES
  -- Yesterday: completed with GPS
  (agency_id, sh1_id, cg1_id,
   NOW() - INTERVAL '1 day' + TIME '08:02', NOW() - INTERVAL '1 day' + TIME '12:05',
   34.0522, -118.2437, 34.0522, -118.2437, true),
  -- Today: checked in, not yet out
  (agency_id, sh2_id, cg1_id,
   NOW() - INTERVAL '55 minutes', NULL,
   34.0525, -118.2440, NULL, NULL, false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TRAINING MODULES
-- ============================================================
INSERT INTO training_modules (id, agency_id, title, description, required, due_date)
VALUES
  (tm1_id, agency_id,
   'Infection Control & Handwashing',
   'Proper handwashing technique, PPE usage, and preventing the spread of infection in home care settings.',
   true, CURRENT_DATE + INTERVAL '30 days'),
  (tm2_id, agency_id,
   'Client Rights & Dignity',
   'Understanding client rights, maintaining dignity, respecting privacy, and reporting abuse.',
   true, CURRENT_DATE + INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TRAINING PROGRESS
-- ============================================================
INSERT INTO training_progress (agency_id, module_id, caregiver_id, completed, completed_at)
VALUES
  (agency_id, tm1_id, cg1_id, true, NOW() - INTERVAL '5 days'),
  (agency_id, tm1_id, cg2_id, false, NULL),
  (agency_id, tm2_id, cg1_id, false, NULL),
  (agency_id, tm2_id, cg2_id, false, NULL)
ON CONFLICT (module_id, caregiver_id) DO NOTHING;

-- ============================================================
-- DOCUMENTS
-- ============================================================
INSERT INTO documents (agency_id, user_id, type, file_url, expiry_date, status)
VALUES
  (agency_id, cg1_user_id, 'license', 'https://placeholder.com/license-maria.pdf', CURRENT_DATE + INTERVAL '8 months', 'approved'),
  (agency_id, cg1_user_id, 'bg_check', 'https://placeholder.com/bg-maria.pdf', CURRENT_DATE + INTERVAL '1 year', 'approved'),
  (agency_id, cg2_user_id, 'license', 'https://placeholder.com/license-james.pdf', CURRENT_DATE + INTERVAL '25 days', 'approved'),
  (agency_id, cg2_user_id, 'tb_test', 'https://placeholder.com/tb-james.pdf', CURRENT_DATE - INTERVAL '10 days', 'expired')
ON CONFLICT DO NOTHING;

-- ============================================================
-- MESSAGES
-- ============================================================
INSERT INTO messages (agency_id, sender_id, recipient_id, client_id, body, read, created_at)
VALUES
  (agency_id, admin_user_id, cg1_user_id, cl1_id,
   'Hi Maria, please remember Mr. Thompson has a doctor appointment tomorrow at 2pm. Please note this in your visit log.',
   true, NOW() - INTERVAL '2 hours'),
  (agency_id, cg1_user_id, admin_user_id, cl1_id,
   'Got it! I''ll make sure to help him get ready early. Should I arrange transport or is his daughter handling that?',
   false, NOW() - INTERVAL '1 hour 30 minutes'),
  (agency_id, admin_user_id, cg2_user_id, cl2_id,
   'James, please make sure to check Mrs. Lee''s blood sugar before and after her lunch today.',
   false, NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ALERTS
-- ============================================================
INSERT INTO alerts (agency_id, type, message, severity, resolved, created_at)
VALUES
  (agency_id, 'expiring_document',
   'James Wilson''s CNA License expires in 25 days. Please collect a renewed copy.',
   'warning', false, NOW() - INTERVAL '1 day'),
  (agency_id, 'expired_document',
   'James Wilson''s TB Test expired 10 days ago. Action required.',
   'critical', false, NOW() - INTERVAL '10 days'),
  (agency_id, 'no_show',
   'Caregiver James Wilson was 35 minutes late for shift with Dorothy Lee on May 18.',
   'warning', true, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- JOB POSTINGS
-- ============================================================
INSERT INTO job_postings (id, agency_id, title, certification_required, pay_rate, employment_type, description, status)
VALUES
  (job1_id, agency_id,
   'Certified Nursing Assistant (CNA)',
   'CNA', 22.50, 'Full-time',
   'We are looking for a compassionate CNA to join our team. Must have active California CNA certification. Experience with elderly clients preferred.',
   'open')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- APPLICATIONS
-- ============================================================
INSERT INTO applications (agency_id, job_id, full_name, email, phone, certification, experience_years, status)
VALUES
  (agency_id, job1_id, 'Linda Park', 'linda.park@email.com', '(818) 555-0401', 'CNA', 4, 'interview'),
  (agency_id, job1_id, 'Carlos Rivera', 'carlos.r@email.com', '(213) 555-0402', 'CNA', 2, 'new')
ON CONFLICT DO NOTHING;

-- ============================================================
-- VISIT NOTES
-- ============================================================
INSERT INTO visit_notes (agency_id, shift_id, caregiver_id, client_id, notes, vitals, medications_given)
VALUES
  (agency_id, sh1_id, cg1_id, cl1_id,
   'Client was in good spirits today. Assisted with morning routine, prepared oatmeal breakfast, and watched the game together. No complaints of pain.',
   'BP: 128/82, HR: 74, Temp: 98.4°F',
   'Lisinopril 10mg (morning dose)')
ON CONFLICT DO NOTHING;

END $$;
