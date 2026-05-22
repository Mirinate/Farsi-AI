# Mirinate Care Platform - Multi-Tenant White-Label Solution

## Overview

Mirinate Care is now a complete **platform for selling homecare software to multiple agencies** with:

1. ✅ **Platform-Level Administration** - Superadmin dashboard to manage all agencies
2. ✅ **Multi-Agency Support** - Each agency is completely isolated with their own data
3. ✅ **White-Label Features** - Each agency has custom branding (colors, logos, names)
4. ✅ **Agency Self-Management** - Each agency admin manages their own staff, clients, and operations

## Two-Level Admin System

### Level 1: Platform Superadmin
**You (Platform Owner)**
- Manages all agencies
- Creates new agencies
- Views platform-wide analytics
- Sets platform branding
- Monitors audit logs

**Access**: `/dashboard/superadmin`

### Level 2: Agency Admin
**Each Agency Owner**
- Manages their own caregivers
- Manages their own clients
- Schedules shifts
- Tracks GPS/EVV
- Views agency analytics

**Access**: `/dashboard/admin`

## Quick Start

### 1. Deploy Platform Infrastructure (One-Time Setup)

```bash
# A. Run database migration
# - Open Supabase Dashboard
# - Go to SQL Editor
# - Copy contents of supabase/platform-superadmin.sql
# - Execute the query

# B. Create platform agency
# In SQL Editor, run:
INSERT INTO agencies (name, subdomain, brand_color, platform_admin, plan)
VALUES ('Mirinate Platform', 'platform', '#6366f1', true, 'active');

# C. Create superadmin user
# - In Supabase: Authentication → Users → Add user
# - Email: admin@mirinate.com
# - Password: Choose strong password
# - Copy the user UUID

# D. Link superadmin to platform
# In SQL Editor, run:
INSERT INTO users (id, agency_id, email, role, full_name)
VALUES (
  '<USER_UUID>',
  '<PLATFORM_AGENCY_UUID>',
  'admin@mirinate.com',
  'superadmin',
  'Platform Administrator'
);

# E. Deploy code
git push origin main
# Vercel auto-deploys
```

### 2. Login as Superadmin

```
URL: https://mirinate-care.vercel.app/login
Email: admin@mirinate.com
Password: (your chosen password)
```

### 3. Create Your First Agency

1. Click "Create Agency"
2. Fill form:
   - Agency Name: e.g., "Harmony Home Aides"
   - Subdomain: e.g., "harmony-home"
   - Admin Name: e.g., "Sarah Thompson"
   - Admin Email: e.g., "sarah@harmony.com"
   - Admin Password: e.g., "SecurePass123!"
   - Brand Color: e.g., "#2563eb"
3. Click "Create Agency"
4. Agency appears in your list

### 4. Give Agency Credentials to Client

```
Email: sarah@harmony.com
Password: SecurePass123! (they'll change it on first login)
URL: https://mirinate-care.vercel.app/login
```

### 5. Agency Admin Logs In

They're immediately taken to their agency's dashboard where they can:
- Add caregivers
- Add clients
- Schedule shifts
- Track GPS/EVV
- View analytics

## Features by Role

### Superadmin (/dashboard/superadmin)

| Feature | Description |
|---------|-------------|
| **View All Agencies** | List of all agencies with stats |
| **Create Agency** | One-click agency setup |
| **Agency Details** | View agency branding, admin, stats |
| **Platform Settings** | Configure platform branding |
| **Audit Logs** | Track all platform activity |

### Agency Admin (/dashboard/admin)

| Feature | Description |
|---------|-------------|
| **Overview** | Agency stats and metrics |
| **Caregivers** | Add, edit, manage care staff |
| **Clients** | Add, edit, manage clients |
| **Family Members** | Connect family to clients |
| **Scheduling** | Create and manage shifts |
| **GPS/EVV** | Track check-in/out locations |
| **Training** | Assign and track certifications |
| **Documents** | Manage licenses and compliance |
| **Messages** | Internal communication |
| **Alerts** | No-shows, expirations, compliance |
| **Settings** | Agency configuration |

### Caregiver (/dashboard/caregiver)

| Feature | Description |
|---------|-------------|
| **My Schedule** | View assigned shifts |
| **Check In/Out** | GPS-verified time tracking |
| **My Clients** | Assigned client information |
| **Training** | Complete required modules |
| **Documents** | View required documents |
| **Messages** | Communicate with agency |

### Family Member (/dashboard/family)

| Feature | Description |
|---------|-------------|
| **Status** | Real-time care status |
| **Schedule** | View care schedule |
| **Visit Summaries** | Read caregiver notes |
| **Messages** | Communicate with caregivers |

### Client (/dashboard/client)

| Feature | Description |
|---------|-------------|
| **Care Plan** | View care details |
| **Visits** | Historical visit records |
| **Documents** | Access care documents |
| **Messages** | Communicate |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│         Mirinate Platform (Superadmin)              │
│  - Platform Management Dashboard                    │
│  - Agency Creation & Management                     │
│  - Global Settings                                  │
└─────────────────────────────────────────────────────┘
            │
            ├─ Isolated by RLS
            ├─ One database, multiple agencies
            ├─ Separate auth users per agency
            └─ No cross-agency data access
            │
   ┌────────┴─────────┬─────────────────┬──────────────┐
   │                  │                 │              │
   v                  v                 v              v
┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐
│ Agency 1 │  │ Agency 2     │  │ Agency 3     │  │ Agency N │
│ Harmony  │  │ Golden Hands │  │ Care Plus    │  │ ...      │
│ Home     │  │              │  │              │  │          │
└──────────┘  └──────────────┘  └──────────────┘  └──────────┘
    │              │                  │
    ├─ Own admins  ├─ Own admins     ├─ Own admins
    ├─ Own data    ├─ Own data       ├─ Own data
    ├─ Own brand   ├─ Own brand      ├─ Own brand
    └─ Own staff   └─ Own staff      └─ Own staff
```

## Database

### New Tables
- `platform_settings` - Global platform configuration
- `audit_logs` - Platform activity tracking

### Updated Tables
- `agencies` - Added `platform_admin` flag
- `users` - Added `superadmin` role
- All tables - Updated RLS policies for superadmin access

### Key Concept: agency_id Isolation
Every record in the database is tied to an agency via `agency_id`. RLS policies ensure:
- Users can only see data from their agency
- Superadmins can see all data
- No agency can access another agency's data

## Deployment

### Prerequisites
- Supabase project
- Vercel account
- GitHub repository

### Steps
1. **Database**: Run `platform-superadmin.sql` in Supabase
2. **Seed**: Create platform agency and superadmin user
3. **Code**: Push to GitHub (Vercel auto-deploys)
4. **Test**: Follow DEPLOYMENT_CHECKLIST.md

See `PLATFORM_SETUP.md` for detailed instructions.

## White-Label Features

Each agency can customize:
- **Brand Color**: Custom hex color (#2563eb)
- **Logo**: Custom logo image
- **Agency Name**: Custom company name
- **Subdomain**: Custom URL (harmony-home.mirinate.com)
- **Settings**: Agency-specific configuration

## Security

✅ **Implemented**
- Row-level security (RLS) for data isolation
- Superadmin role verification
- Audit logging of all platform actions
- Password validation (8+ characters)
- Service role authentication for sensitive ops
- HTTPS/TLS encryption

🔒 **Best Practices**
- Superadmin password is strong and stored securely
- Credentials not shared via insecure channels
- Regular backups enabled
- Access logs monitored

## Scaling

This system is designed to scale to:
- ✅ 10-100 agencies (current)
- 🟡 100-1000 agencies (add pagination, caching)
- 🟡 1000+ agencies (add search, advanced filtering)

See `SUPERADMIN_FEATURES.md` for scaling roadmap.

## Documentation

| Document | Purpose |
|----------|---------|
| `PLATFORM_SETUP.md` | Complete setup guide with step-by-step instructions |
| `SUPERADMIN_FEATURES.md` | Detailed feature documentation |
| `DEPLOYMENT_CHECKLIST.md` | Pre/post-deployment verification checklist |
| `README_PLATFORM.md` | This file - overview and quick start |

## API Endpoints (Superadmin Only)

### Create Agency
```bash
POST /api/agencies
{
  "agencyName": "Harmony Home Aides",
  "adminFullName": "Sarah Thompson",
  "adminEmail": "sarah@harmony.com",
  "adminPassword": "SecurePass123!",
  "subdomain": "harmony-home-aides",
  "brandColor": "#2563eb",
  "logoUrl": "https://example.com/logo.png"
}
```

### Get All Agencies
```bash
GET /api/agencies
```

### Update Platform Settings
```bash
POST /api/platform/settings
{
  "platformName": "Mirinate Care Platform",
  "platformBrandColor": "#6366f1",
  "platformLogoUrl": "https://example.com/logo.png"
}
```

## Typical Agency Workflow

1. **Superadmin creates agency** via `/dashboard/superadmin`
2. **Agency credentials sent** to agency owner
3. **Agency admin logs in** and changes password
4. **Agency admin adds caregivers** via AddCaregiverButton
5. **Agency admin adds clients** via AddClientButton
6. **Caregivers log in** and start scheduling
7. **Family members added** to view care status
8. **GPS/EVV tracking** begins
9. **Reports generated** and shared

## Pricing Model Options

With this platform, you can:

### Option 1: Per-Agency Monthly Fee
- $99/month per agency
- Unlimited users per agency
- Scale to 100+ agencies

### Option 2: Freemium
- Free tier: 1 caregiver, 3 clients
- Pro tier: $49/month unlimited
- Enterprise: Custom pricing

### Option 3: Per-User Pricing
- $10/month per caregiver
- $5/month per admin
- Scale based on usage

### Option 4: Hybrid
- Base fee + usage-based
- Flexibility for different customer sizes

*Note: Billing integration coming soon*

## Support & Maintenance

### Monitoring
- Check Supabase logs daily
- Review audit logs weekly
- Monitor database performance
- Track uptime with UptimeRobot

### Updates
- Security patches: ASAP
- Feature updates: Monthly
- Database migrations: With testing
- Rollback plan: Always prepared

### Troubleshooting
See `PLATFORM_SETUP.md` troubleshooting section

## Next Steps

1. ✅ Deploy platform infrastructure
2. ✅ Create superadmin user
3. ✅ Test agency creation
4. ✅ Onboard first agency
5. ⏳ Add billing per agency
6. ⏳ Add custom domain support
7. ⏳ Add advanced analytics
8. ⏳ Build agency marketplace

## Technology Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Hosting**: Vercel
- **Email**: Resend
- **UI Components**: Lucide React, shadcn/ui

## Contributing

This is a commercial SaaS product. For bugs:
1. Document the issue
2. Create test case
3. File issue on GitHub
4. Submit PR with fix

## License

Proprietary - Mirinate Care Platform

---

**Version**: 1.0.0  
**Release Date**: May 21, 2026  
**Status**: Production Ready  

For questions, refer to the documentation files or contact your technical team.
