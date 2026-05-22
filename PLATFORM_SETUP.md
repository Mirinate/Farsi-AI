# Mirinate Care Platform - Superadmin Setup Guide

This document explains how to set up and use the platform-level superadmin features for managing multiple agencies.

## Overview

The platform now supports two levels of administration:

1. **Superadmin (Platform Level)**: Manages all agencies, creates new agencies, views platform-wide metrics
2. **Agency Admin**: Manages their own agency's staff, clients, and operations

## Setup Steps

### Step 1: Run Platform Schema Migration

First, run the platform superadmin migration in Supabase:

1. Go to Supabase Dashboard → Your Project → SQL Editor
2. Create a new query and paste the contents of `supabase/platform-superadmin.sql`
3. Execute the query

This creates:
- `platform_settings` table for global configuration
- New RLS policies to allow superadmins to view all agencies
- Helper functions `get_user_role()` and `get_user_agency_id()`
- `audit_logs` table to track platform activity
- Indexes for performance optimization

### Step 2: Create the Platform Agency

The superadmin account needs to belong to a special "Platform Admin" agency. Create this in Supabase:

1. In SQL Editor, run this query:

```sql
INSERT INTO agencies (name, subdomain, brand_color, platform_admin, plan)
VALUES (
  'Mirinate Platform',
  'platform',
  '#6366f1',
  true,
  'active'
);
```

2. Note the returned UUID - you'll need it for the next step

### Step 3: Create the Superadmin User

#### Option A: Via Supabase Dashboard

1. Go to **Authentication** → **Users** in Supabase
2. Click **Add user**
3. Enter email and password
4. Click **Save**
5. Note the user UUID

Then add the user to the users table:

1. Go to **SQL Editor**
2. Run this query (replace `<SUPERADMIN_USER_ID>` and `<PLATFORM_AGENCY_ID>`):

```sql
INSERT INTO users (id, agency_id, email, role, full_name)
VALUES (
  '<SUPERADMIN_USER_ID>',
  '<PLATFORM_AGENCY_ID>',
  'admin@mirinate.com',
  'superadmin',
  'Platform Administrator'
);
```

#### Option B: Via API (Recommended)

If you want to create the superadmin programmatically after setup:

```bash
curl -X POST https://yourdomain.com/api/superadmin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mirinate.com",
    "password": "SecurePassword123!",
    "fullName": "Platform Administrator"
  }'
```

### Step 4: Log In as Superadmin

1. Go to https://mirinate-care.vercel.app/login
2. Enter superadmin email and password
3. You'll be redirected to `/dashboard/superadmin`

## Features

### 1. Agency Management Dashboard

**URL**: `/dashboard/superadmin`

View all agencies with:
- Agency count and stats
- Active vs. trial plans
- User counts per agency
- Creation dates
- Quick action links to manage each agency

### 2. Agency Details Page

**URL**: `/dashboard/superadmin/agencies/[id]`

For each agency, view:
- Current plan status (trial, active, expired)
- Admin account details
- Agency branding (logo, color)
- User statistics
- Quick actions (view dashboard, edit settings, suspend)

### 3. Create New Agency

Click **Create Agency** button on superadmin dashboard to:
- Enter agency name
- Set custom subdomain (e.g., `harmony-home-aides.mirinate.com`)
- Create initial admin account
- Set branding (color, logo URL)

The system will:
1. Create the agency record
2. Create auth user for the admin
3. Create user profile with admin role
4. Log the action in audit logs

### 4. Platform Settings

**URL**: `/dashboard/superadmin/settings`

Configure:
- Platform name
- Platform brand color
- Platform logo URL
- Security settings
- API keys (future)
- Audit logs access

## API Endpoints

### Create Agency

```
POST /api/agencies

Body:
{
  "agencyName": "Harmony Home Aides",
  "adminFullName": "Sarah Thompson",
  "adminEmail": "sarah@harmony.com",
  "adminPassword": "SecurePass123!",
  "subdomain": "harmony-home-aides",
  "brandColor": "#2563eb",
  "logoUrl": "https://example.com/logo.png"
}

Response:
{
  "success": true,
  "agency": {
    "id": "uuid",
    "name": "Harmony Home Aides",
    "subdomain": "harmony-home-aides",
    "adminEmail": "sarah@harmony.com"
  }
}
```

### Get All Agencies

```
GET /api/agencies

Response:
{
  "agencies": [
    {
      "id": "uuid",
      "name": "Harmony Home Aides",
      "subdomain": "harmony-home-aides",
      "plan": "trial",
      "users": [{count: 5}],
      "created_at": "2026-05-21T10:00:00Z"
    }
  ]
}
```

### Update Platform Settings

```
POST /api/platform/settings

Body:
{
  "platformName": "Mirinate Care Platform",
  "platformBrandColor": "#6366f1",
  "platformLogoUrl": "https://example.com/logo.png"
}

Response:
{
  "success": true,
  "message": "Platform settings updated"
}
```

## Database Schema

### agencies table

Added column: `platform_admin` (boolean)
- Identifies which agency is the platform's own agency
- Currently only one should have this set to true

### users table

- `role` now includes `'superadmin'` option
- Superadmins belong to the platform agency
- Superadmins can query all agencies via RLS

### platform_settings table (new)

```
- id: UUID
- platform_name: TEXT
- platform_logo_url: TEXT
- platform_brand_color: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### audit_logs table (new)

```
- id: UUID
- superadmin_user_id: UUID (FK to users)
- action: TEXT ('agency_created', 'agency_suspended', etc.)
- agency_id: UUID (FK to agencies)
- details: JSONB
- created_at: TIMESTAMPTZ
```

## Security Considerations

1. **Superadmin Password**: Set a strong password and store securely
2. **RLS Policies**: Updated to allow superadmins to see all data
3. **Audit Logging**: All platform actions are logged
4. **Rate Limiting**: Consider adding rate limits to agency creation
5. **Domain Validation**: Subdomains are validated for uniqueness

## Workflow: Creating a New Agency

1. **Superadmin logs in** → Goes to `/dashboard/superadmin`
2. **Clicks "Create Agency"** → Modal form opens
3. **Fills agency details** → Name, subdomain, admin credentials, branding
4. **Submits form** → Frontend calls `/api/agencies`
5. **API creates** → Agency, admin user, user profile
6. **Logged action** → Entry added to audit_logs
7. **Response shows** → Agency details and admin credentials
8. **Superadmin can** → Click "Manage" to view agency details

## Workflow: Agency Admin Uses System

1. **Superadmin creates agency** → Admin receives credentials
2. **Admin logs in** → Redirected to `/dashboard/admin`
3. **Admin creates staff** → Adds caregivers via AddCaregiverButton
4. **Admin creates clients** → Adds clients via AddClientButton
5. **Admin creates family** → Adds family members via AddFamilyMemberButton
6. **Staff uses system** → Caregivers check in/out, family views schedules, etc.

## Customization

### Adding More Superadmin Features

To add features like agency suspension, plan upgrades, or billing:

1. Add new action types to audit_logs
2. Create API endpoints for the actions
3. Add buttons/forms to superadmin pages
4. Update RLS policies if needed

### Custom Subdomains

To support custom domains instead of subdomains:

1. Update `subdomain` to `custom_domain`
2. Add domain verification via DNS
3. Configure reverse proxy routing
4. Update branding logic to detect domain

## Troubleshooting

### Superadmin Can't See Agencies

- Verify `role = 'superadmin'` in users table
- Check RLS policy on agencies table includes superadmin check
- Ensure user belongs to platform agency

### Agency Creation Fails

- Check subdomain is unique
- Verify admin email is valid
- Check password meets requirements (8+ chars)
- Review API response for specific error

### Missing Platform Settings

- Run seed-superadmin.sql to initialize
- Ensure platform_settings table exists
- Check RLS policies allow superadmin access

## Next Steps

1. ✅ Run platform-superadmin.sql migration
2. ✅ Create platform agency and superadmin user
3. ✅ Test creating a new agency
4. ✅ Test logging in as agency admin
5. ⏳ Add billing/subscription per agency
6. ⏳ Add agency suspension/deletion
7. ⏳ Add custom domain support
8. ⏳ Add advanced audit log filtering
