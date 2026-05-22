-- ============================================================
-- Fix recursive RLS on the users table
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Step 1: Create a SECURITY DEFINER function that bypasses RLS
-- to safely look up the current user's agency_id
CREATE OR REPLACE FUNCTION get_my_agency_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT agency_id FROM users WHERE id = auth.uid()
$$;

-- Step 2: Fix the users table policy (was recursive)
DROP POLICY IF EXISTS "Users can view members of their own agency" ON users;
CREATE POLICY "Users can view members of their own agency"
  ON users FOR SELECT
  USING (id = auth.uid() OR agency_id = get_my_agency_id());

-- Step 3: Fix all other tables that also query users inside their policy
-- (they all had the same recursion problem)

DROP POLICY IF EXISTS "Agency members can view caregivers" ON caregivers;
CREATE POLICY "Agency members can view caregivers"
  ON caregivers FOR SELECT
  USING (agency_id = get_my_agency_id());

DROP POLICY IF EXISTS "Admins can manage caregivers" ON caregivers;
CREATE POLICY "Admins can manage caregivers"
  ON caregivers FOR ALL
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Agency members can view clients" ON clients;
CREATE POLICY "Agency members can view clients"
  ON clients FOR SELECT
  USING (agency_id = get_my_agency_id());

DROP POLICY IF EXISTS "Admins can manage clients" ON clients;
CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Agency members can view family members" ON family_members;
CREATE POLICY "Agency members can view family members"
  ON family_members FOR SELECT
  USING (agency_id = get_my_agency_id());

DROP POLICY IF EXISTS "Admins can manage family members" ON family_members;
CREATE POLICY "Admins can manage family members"
  ON family_members FOR ALL
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Agency members can view shifts" ON shifts;
CREATE POLICY "Agency members can view shifts"
  ON shifts FOR SELECT
  USING (agency_id = get_my_agency_id());

DROP POLICY IF EXISTS "Admins can manage shifts" ON shifts;
CREATE POLICY "Admins can manage shifts"
  ON shifts FOR ALL
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Agency members can view checkins" ON checkins;
CREATE POLICY "Agency members can view checkins"
  ON checkins FOR SELECT
  USING (agency_id = get_my_agency_id());

DROP POLICY IF EXISTS "Agency members can view job postings" ON job_postings;
CREATE POLICY "Agency members can view job postings"
  ON job_postings FOR SELECT
  USING (agency_id = get_my_agency_id());

DROP POLICY IF EXISTS "Admins can manage job postings" ON job_postings;
CREATE POLICY "Admins can manage job postings"
  ON job_postings FOR ALL
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can view applications" ON applications;
CREATE POLICY "Admins can view applications"
  ON applications FOR SELECT
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can manage applications" ON applications;
CREATE POLICY "Admins can manage applications"
  ON applications FOR ALL
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Agency members can view training modules" ON training_modules;
CREATE POLICY "Agency members can view training modules"
  ON training_modules FOR SELECT
  USING (agency_id = get_my_agency_id());

DROP POLICY IF EXISTS "Admins can manage training modules" ON training_modules;
CREATE POLICY "Admins can manage training modules"
  ON training_modules FOR ALL
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Agency members can view training progress" ON training_progress;
CREATE POLICY "Agency members can view training progress"
  ON training_progress FOR SELECT
  USING (agency_id = get_my_agency_id());

DROP POLICY IF EXISTS "Admins can manage training progress" ON training_progress;
CREATE POLICY "Admins can manage training progress"
  ON training_progress FOR ALL
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can view all agency documents" ON documents;
CREATE POLICY "Admins can view all agency documents"
  ON documents FOR SELECT
  USING (user_id = auth.uid() OR (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )));

DROP POLICY IF EXISTS "Admins can manage documents" ON documents;
CREATE POLICY "Admins can manage documents"
  ON documents FOR ALL
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can view all agency messages" ON messages;
CREATE POLICY "Admins can view all agency messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR (
    agency_id = get_my_agency_id() AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  ));

DROP POLICY IF EXISTS "Agency members can view visit notes" ON visit_notes;
CREATE POLICY "Agency members can view visit notes"
  ON visit_notes FOR SELECT
  USING (agency_id = get_my_agency_id());

DROP POLICY IF EXISTS "Admins can view their agency alerts" ON alerts;
CREATE POLICY "Admins can view their agency alerts"
  ON alerts FOR SELECT
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can update alerts" ON alerts;
CREATE POLICY "Admins can update alerts"
  ON alerts FOR UPDATE
  USING (agency_id = get_my_agency_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));
