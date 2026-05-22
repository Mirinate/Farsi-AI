-- ============================================================
-- Superadmin Seed Data
-- Creates platform admin account and settings
-- ============================================================

-- 1. Create the platform admin agency (this serves as the superadmin's "agency")
INSERT INTO agencies (name, subdomain, brand_color, platform_admin, plan)
VALUES (
  'Mirinate Platform',
  'platform',
  '#6366f1',
  true,
  'active'
)
ON CONFLICT DO NOTHING;

-- 2. Get the platform agency ID (for reference in the next step)
-- NOTE: Replace PLATFORM_AGENCY_ID below with the actual UUID from the insert

-- 3. Initialize platform settings
INSERT INTO platform_settings (platform_name, platform_brand_color)
VALUES (
  'Mirinate Care Platform',
  '#6366f1'
)
ON CONFLICT DO NOTHING;

-- 4. You'll need to create the superadmin auth user first via the API or Supabase dashboard
-- Then create a users row with:
-- {
--   "id": "<auth-user-id>",
--   "agency_id": "<platform-agency-id>",
--   "email": "<email>",
--   "role": "superadmin",
--   "full_name": "<name>"
-- }

-- After the superadmin is created, you can promote them with:
-- UPDATE users SET role = 'superadmin' WHERE email = '<email>';
