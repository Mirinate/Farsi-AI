-- ============================================================
-- Fix Recursive RLS Policies for Superadmin
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create a SECURITY DEFINER function to safely get user role
-- (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- 2. Fix users table policy (remove recursive superadmin check)
DROP POLICY IF EXISTS "Users can view members of their own agency" ON users;
CREATE POLICY "Users can view members of their own agency"
  ON users FOR SELECT
  USING (
    agency_id = get_my_agency_id()
    OR get_my_role() = 'superadmin'
  );

-- 3. Fix caregivers table policy
DROP POLICY IF EXISTS "Agency members can view caregivers" ON caregivers;
CREATE POLICY "Agency members can view caregivers"
  ON caregivers FOR SELECT
  USING (
    agency_id = get_my_agency_id()
    OR get_my_role() = 'superadmin'
  );

-- 4. Fix clients table policy
DROP POLICY IF EXISTS "Agency members can view clients" ON clients;
CREATE POLICY "Agency members can view clients"
  ON clients FOR SELECT
  USING (
    agency_id = get_my_agency_id()
    OR get_my_role() = 'superadmin'
  );

-- 5. Fix family_members table policy
DROP POLICY IF EXISTS "Agency members can view family members" ON family_members;
CREATE POLICY "Agency members can view family members"
  ON family_members FOR SELECT
  USING (
    agency_id = get_my_agency_id()
    OR get_my_role() = 'superadmin'
  );

-- 6. Fix agencies table policies
DROP POLICY IF EXISTS "Superadmins can view all agencies" ON agencies;
DROP POLICY IF EXISTS "Agencies can view their own record" ON agencies;

-- Single clean policy for agencies
CREATE POLICY "Users can view their own agency or superadmin sees all"
  ON agencies FOR SELECT
  USING (
    id = get_my_agency_id()
    OR get_my_role() = 'superadmin'
    OR true  -- keep public branding readable
  );

-- 7. Fix shifts table if it exists
DROP POLICY IF EXISTS "Agency members can view shifts" ON shifts;
CREATE POLICY "Agency members can view shifts"
  ON shifts FOR SELECT
  USING (
    agency_id = get_my_agency_id()
    OR get_my_role() = 'superadmin'
  );

-- 8. Verify the functions exist
SELECT get_my_agency_id();
SELECT get_my_role();
