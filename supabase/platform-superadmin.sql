-- ============================================================
-- Platform Super-Admin Schema Update
-- Adds support for multi-agency platform management
-- ============================================================

-- 1. Update users role to include 'superadmin'
-- Note: We'll use ALTER TYPE if possible, or recreate the constraint

-- Add platform_admin column to agencies to track if it's a platform owner agency
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS platform_admin BOOLEAN NOT NULL DEFAULT false;

-- Create platform_settings table for global config
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  superadmin_agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  platform_name TEXT DEFAULT 'Mirinate Care Platform',
  platform_logo_url TEXT,
  platform_brand_color TEXT DEFAULT '#2563eb',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view platform settings" ON platform_settings;
CREATE POLICY "Public can view platform settings"
  ON platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manages platform settings" ON platform_settings;
CREATE POLICY "Service role manages platform settings"
  ON platform_settings FOR ALL USING (auth.role() = 'service_role');

-- 2. Update RLS policies to handle superadmins viewing all agencies
DROP POLICY IF EXISTS "Users can view members of their own agency" ON users;
CREATE POLICY "Users can view members of their own agency"
  ON users FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 3. Update caregivers policy to allow superadmins
DROP POLICY IF EXISTS "Agency members can view caregivers" ON caregivers;
CREATE POLICY "Agency members can view caregivers"
  ON caregivers FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 4. Update clients policy to allow superadmins
DROP POLICY IF EXISTS "Agency members can view clients" ON clients;
CREATE POLICY "Agency members can view clients"
  ON clients FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 5. Update family_members policy to allow superadmins
DROP POLICY IF EXISTS "Agency members can view family members" ON family_members;
CREATE POLICY "Agency members can view family members"
  ON family_members FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 6. Add superadmin access to agencies table
DROP POLICY IF EXISTS "Superadmins can view all agencies" ON agencies;
CREATE POLICY "Superadmins can view all agencies"
  ON agencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 7. Create a helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- 8. Create a helper function to get user agency_id
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
  SELECT agency_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- 9. Create shifts table policies update for superadmin (if shifts exists)
DROP POLICY IF EXISTS "Agency members can view shifts" ON shifts;
CREATE POLICY "Agency members can view shifts"
  ON shifts FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 10. Allow agencies table to be viewable by their own members
DROP POLICY IF EXISTS "Agencies can view their own record" ON agencies;
CREATE POLICY "Agencies can view their own record"
  ON agencies FOR SELECT
  USING (
    id = (SELECT agency_id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 11. Create audit log table for agency creation/modifications
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  superadmin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages audit logs" ON audit_logs;
CREATE POLICY "Service role manages audit logs"
  ON audit_logs FOR ALL USING (auth.role() = 'service_role');

-- 12. Index for better query performance
CREATE INDEX IF NOT EXISTS idx_agencies_platform_admin ON agencies(platform_admin);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
