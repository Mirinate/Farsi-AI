# Platform-Level Superadmin Features

## What Was Built

Complete platform-level administration system for managing multiple agencies with white-label support.

## Architecture

```
Platform (Superadmin)
├── Create & Manage Multiple Agencies
├── View Platform-Wide Analytics
├── Configure Global Branding
├── Monitor Audit Logs
└── Manage Platform Settings

    ↓
    
Each Agency (Agency Admin)
├── Add/Manage Caregivers
├── Add/Manage Clients
├── Add/Manage Family Members
├── Schedule Shifts
├── Track GPS/EVV
└── Generate Reports
```

## Files Created

### Database Migrations
- `supabase/platform-superadmin.sql` - Schema updates for multi-tenancy and superadmin support
- `supabase/seed-superadmin.sql` - Initial seed data

### API Routes
- `app/api/agencies/route.ts` - Create agencies & get all agencies (superadmin only)
- `app/api/platform/settings/route.ts` - Update platform settings (superadmin only)

### Pages
- `app/dashboard/superadmin/page.tsx` - Main superadmin dashboard with agency list
- `app/dashboard/superadmin/agencies/[id]/page.tsx` - Agency detail page
- `app/dashboard/superadmin/settings/page.tsx` - Platform settings page

### Components
- `components/superadmin/CreateAgencyButton.tsx` - Modal form to create new agency
- `components/superadmin/UpdatePlatformSettingsButton.tsx` - Modal to update platform settings

### Updates
- `components/shared/Sidebar.tsx` - Added superadmin navigation
- `types/index.ts` - Added 'superadmin' to UserRole type
- `middleware.ts` - Already configured for new routes

### Documentation
- `PLATFORM_SETUP.md` - Complete setup guide
- `SUPERADMIN_FEATURES.md` - This file

## Key Features

### 1. Multi-Agency Management

**Superadmin Dashboard** shows:
- Total agencies count
- Active subscriptions
- Total users across all agencies
- Trial vs. active plans

**Agency List** displays:
- Agency name with logo
- Custom subdomain
- Current plan status
- User count
- Creation date
- Quick action link to manage

### 2. Agency Creation

**Create Agency Form** collects:
- Agency name (e.g., "Harmony Home Aides")
- Unique subdomain (e.g., "harmony-home")
- Admin full name
- Admin email
- Admin password
- Brand color (optional)
- Logo URL (optional)

**On Submit**:
1. Validates subdomain uniqueness
2. Creates agency record
3. Creates Supabase auth user
4. Creates user profile with admin role
5. Logs action in audit_logs
6. Returns agency details

### 3. Agency Detail View

Shows per-agency:
- Plan status (trial/active/expired) with visual indicators
- Admin account info (name, email)
- Branding (logo, brand color)
- Statistics:
  - Total users
  - Admin count
  - Caregiver count
  - Client count
- Action buttons:
  - View Dashboard (link to agency admin view)
  - Edit Settings
  - Suspend Agency

### 4. Platform Settings

Superadmin can configure:
- Platform name (shown in branding)
- Platform brand color (UI theme)
- Platform logo URL
- Security settings (future: 2FA)
- Audit logs access
- API key management (future)

### 5. RLS Security

Updated policies to allow superadmins:
- View all agencies
- View all users across agencies
- View all caregivers
- View all clients
- View all family members
- Access audit logs

While maintaining agency isolation:
- Agency members still see only their agency data
- Non-superadmins cannot access other agencies

### 6. Database Changes

**New Tables**:
- `platform_settings` - Global configuration
- `audit_logs` - Activity tracking

**Updated Tables**:
- `agencies` - Added `platform_admin` column
- `users` - Role now includes 'superadmin'

**New Functions**:
- `get_user_role()` - Get current user's role
- `get_user_agency_id()` - Get current user's agency

**New Indexes**:
- `idx_agencies_platform_admin`
- `idx_users_role`
- `idx_audit_logs_created_at`

## User Flow

### For Superadmin

```
1. Login with superadmin credentials
   ↓
2. Redirected to /dashboard/superadmin
   ↓
3. View all agencies
   ├─ Click "Create Agency" → Form modal
   │   ├─ Fill details
   │   ├─ Submit
   │   └─ See new agency in list
   │
   ├─ Click "Manage" on agency → Detail page
   │   ├─ View agency stats
   │   ├─ See admin account
   │   ├─ Edit settings (button)
   │   └─ View dashboard (button)
   │
   └─ Go to Settings → Platform settings page
       ├─ View current branding
       ├─ Edit brand color & name
       └─ Update logo
```

### For Agency Admin

```
1. Login with agency admin credentials
   ↓
2. Redirected to /dashboard/admin
   ↓
3. Manage their agency
   ├─ Add Caregivers (via AddCaregiverButton)
   ├─ Add Clients (via AddClientButton)
   ├─ Add Family Members (via AddFamilyMemberButton)
   ├─ Schedule shifts
   ├─ Track GPS/EVV
   └─ View analytics
```

## Integration Points

### With Existing System

The superadmin system integrates seamlessly:

1. **Auth**: Uses existing Supabase auth
2. **Dashboard Layout**: Reuses Sidebar component
3. **API Pattern**: Follows existing POST/GET routes
4. **UI Components**: Uses existing buttons, modals, tables
5. **Types**: Added to existing TypeRole union
6. **Middleware**: Works with existing role-based redirect

### Database Integration

Respects existing:
- Agency isolation via RLS
- User profile structure
- Role-based access control
- Data validation and constraints

## API Documentation

### POST /api/agencies

Create a new agency (superadmin only)

```javascript
const res = await fetch('/api/agencies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agencyName: 'Harmony Home Aides',
    adminFullName: 'Sarah Thompson',
    adminEmail: 'sarah@harmony.com',
    adminPassword: 'SecurePass123!',
    subdomain: 'harmony-home-aides',
    brandColor: '#2563eb',
    logoUrl: 'https://example.com/logo.png'
  })
})
```

### GET /api/agencies

Get all agencies (superadmin only)

```javascript
const res = await fetch('/api/agencies')
const { agencies } = await res.json()
```

### POST /api/platform/settings

Update platform settings (superadmin only)

```javascript
const res = await fetch('/api/platform/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platformName: 'Mirinate Care Platform',
    platformBrandColor: '#6366f1',
    platformLogoUrl: 'https://example.com/platform-logo.png'
  })
})
```

## Deployment

All files are ready for deployment:

1. Push code changes to GitHub
2. Database migrations must be applied in Supabase (run platform-superadmin.sql)
3. Create superadmin account manually (see setup guide)
4. Vercel auto-deploys on push
5. System is ready to create agencies

## Security Considerations

✅ **Implemented**:
- Superadmin role check on all endpoints
- RLS policies prevent unauthorized access
- Audit logging of platform actions
- Password validation (8+ chars)
- Email validation
- Subdomain uniqueness check
- Service role auth for sensitive operations

⏳ **Future Enhancements**:
- Rate limiting on agency creation
- Two-factor authentication for superadmin
- IP whitelist for superadmin access
- PII encryption
- More granular audit logs
- Signature verification for webhooks

## Scaling Considerations

### For 100+ Agencies

- Add pagination to agency list
- Implement agency search/filter
- Add bulk operations
- Cache agency data
- Add background jobs for setup

### For Custom Domains

- Add domain validation
- Support DNS verification
- Configure reverse proxy routing
- Add SSL certificate management

### For Billing Integration

- Link Stripe customer to agency
- Track subscription per agency
- Handle trial expiration
- Implement upgrade flow

## Testing

### Test Superadmin Creation

1. Run `supabase/platform-superadmin.sql`
2. Run `supabase/seed-superadmin.sql`
3. Create superadmin auth user
4. Create superadmin profile
5. Login and verify dashboard loads

### Test Agency Creation

1. Login as superadmin
2. Click "Create Agency"
3. Fill form with unique subdomain
4. Submit
5. Verify agency appears in list
6. Click "Manage"
7. Verify agency details page loads

### Test Isolation

1. Login as superadmin
2. See all agencies
3. Logout
4. Login as agency admin
5. See only their agency
6. Cannot access other agencies

## Next Steps

1. Run migration SQL in Supabase
2. Create superadmin user account
3. Test creating first agency
4. Test agency admin login
5. Deploy to production
6. Add billing per agency (future)
7. Add custom domain support (future)
8. Add advanced analytics (future)

## Support

For issues with:

- **Setup**: See PLATFORM_SETUP.md
- **Errors**: Check Supabase logs and Vercel logs
- **Questions**: Review code comments and API docs
- **Features**: See implementation in respective files

---

**Status**: ✅ Complete and ready for deployment
**Last Updated**: May 21, 2026
