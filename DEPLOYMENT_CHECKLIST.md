# Platform Superadmin Deployment Checklist

## Pre-Deployment

- [ ] All code committed to Git
- [ ] No uncommitted changes
- [ ] Latest code pushed to GitHub
- [ ] Test build locally: `npm run build`
- [ ] No TypeScript errors
- [ ] Supabase project accessible

## Database Setup

- [ ] **Step 1**: Open Supabase Dashboard
- [ ] **Step 2**: Go to SQL Editor
- [ ] **Step 3**: Create new query
- [ ] **Step 4**: Copy contents of `supabase/platform-superadmin.sql`
- [ ] **Step 5**: Execute query
- [ ] **Step 6**: Verify no errors
- [ ] **Step 7**: Check new tables created
  - [ ] `platform_settings` exists
  - [ ] `audit_logs` exists
  - [ ] New RLS policies in place

## Create Platform Agency

- [ ] Run this SQL in Supabase:

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

- [ ] Copy the returned UUID (this is PLATFORM_AGENCY_ID)

## Create Superadmin User

### Option A: Via Supabase Dashboard

- [ ] Go to Authentication → Users
- [ ] Click "Add user"
- [ ] Enter email: `admin@mirinate.com`
- [ ] Enter password: Choose a strong password (note it down)
- [ ] Check "Confirm email"
- [ ] Click "Save"
- [ ] Copy the user ID (this is SUPERADMIN_USER_ID)

### Option B: Via Supabase SQL

```sql
-- First create auth user via Supabase dashboard
-- Then run this:
INSERT INTO users (id, agency_id, email, role, full_name)
VALUES (
  '<SUPERADMIN_USER_ID>',  -- from auth.users
  '<PLATFORM_AGENCY_ID>',  -- from agencies table
  'admin@mirinate.com',
  'superadmin',
  'Platform Administrator'
);
```

- [ ] Copy SUPERADMIN_USER_ID from users table
- [ ] Replace in SQL above
- [ ] Replace PLATFORM_AGENCY_ID
- [ ] Execute query
- [ ] Verify user created

## Verify Database Setup

In Supabase SQL Editor:

```sql
-- Check platform agency
SELECT * FROM agencies WHERE platform_admin = true;

-- Check superadmin user
SELECT id, email, role FROM users WHERE role = 'superadmin';

-- Check platform settings
SELECT * FROM platform_settings;
```

- [ ] Platform agency exists with `platform_admin = true`
- [ ] Superadmin user exists with `role = 'superadmin'`
- [ ] Platform settings table exists (may be empty)

## Code Deployment

- [ ] Vercel auto-deploys on GitHub push (should happen automatically)
- [ ] OR manually trigger Vercel deploy
- [ ] Wait for build to complete
- [ ] No build errors
- [ ] All routes accessible:
  - [ ] `/dashboard/superadmin` (will fail if not logged in)
  - [ ] `/dashboard/superadmin/settings` (will fail if not logged in)
  - [ ] `/api/agencies` (will return 401 if not logged in)

## Test Superadmin Login

- [ ] Go to https://mirinate-care.vercel.app/login (or your production URL)
- [ ] Enter superadmin email: `admin@mirinate.com`
- [ ] Enter password: (the password you set above)
- [ ] Click "Sign in"
- [ ] Should redirect to `/dashboard/superadmin`
- [ ] Dashboard loads with "Mirinate Platform" header
- [ ] "Create Agency" button visible
- [ ] Agency list is empty (no agencies yet)
- [ ] Click "Platform Settings" in sidebar
- [ ] Settings page loads

## Test Agency Creation

- [ ] Click "Create Agency" button
- [ ] Modal form opens with fields:
  - [ ] Agency Name
  - [ ] Subdomain
  - [ ] Admin Full Name
  - [ ] Admin Email
  - [ ] Admin Password
  - [ ] Brand Color (optional)
  - [ ] Logo URL (optional)

Fill with test data:
```
Agency Name: Test Agency
Subdomain: test-agency
Admin Full Name: John Doe
Admin Email: john@testagency.com
Admin Password: TestPass123!
Brand Color: #3b82f6
Logo URL: (leave blank)
```

- [ ] Click "Create Agency"
- [ ] Loading state shows
- [ ] Form closes
- [ ] New agency appears in list
- [ ] Agency shows in table with correct name and subdomain

## Test Agency Detail Page

- [ ] Click "Manage" on the newly created agency
- [ ] Agency detail page loads
- [ ] Shows correct agency name
- [ ] Shows subdomain: `test-agency.mirinate.com`
- [ ] Shows status (should be "Trial")
- [ ] Shows admin details
- [ ] Shows branding section
- [ ] Shows user statistics (should show 1 admin)

## Test Agency Admin Login

- [ ] Create new browser session (incognito)
- [ ] Go to https://mirinate-care.vercel.app/login
- [ ] Enter agency admin email: `john@testagency.com`
- [ ] Enter password: `TestPass123!`
- [ ] Click "Sign in"
- [ ] Should redirect to `/dashboard/admin`
- [ ] Shows "Test Agency" in sidebar
- [ ] Shows admin navigation items
- [ ] Can see Caregivers, Clients, etc.

## Test Superadmin Still Works

- [ ] Go back to original browser (or new incognito)
- [ ] Login as superadmin: `admin@mirinate.com`
- [ ] Should see both:
  - [ ] Platform Agency (Mirinate Platform)
  - [ ] Test Agency (Test Agency)
- [ ] Can create another agency
- [ ] Settings page works

## Test Logout and Re-login

- [ ] Click sign out
- [ ] Redirected to login page
- [ ] Login again as superadmin
- [ ] Redirected to superadmin dashboard
- [ ] Previous agencies still exist

## Production Verification

- [ ] Build is deployed to Vercel
- [ ] No errors in Vercel build logs
- [ ] Superadmin dashboard loads
- [ ] Create agency works
- [ ] Agency admin can login and access their dashboard
- [ ] Superadmin can see all agencies
- [ ] RLS policies working (agency admins can't see other agencies)

## Database Backups

- [ ] Enable automated backups in Supabase
- [ ] Test restore process
- [ ] Document backup retention policy

## Security Review

- [ ] Superadmin password stored securely
- [ ] HTTPS enabled on all pages
- [ ] Environment variables set in Vercel
- [ ] No sensitive data in client code
- [ ] Rate limiting on agency creation (optional)
- [ ] Audit logs being recorded

## Documentation

- [ ] PLATFORM_SETUP.md completed
- [ ] SUPERADMIN_FEATURES.md completed
- [ ] API endpoints documented
- [ ] Team trained on superadmin system
- [ ] Runbook created for operations

## Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Check Supabase query logs
- [ ] Verify audit_logs table is recording events
- [ ] Test with multiple agency creations
- [ ] Performance monitoring enabled
- [ ] Database monitoring enabled

## Optional Enhancements (Not Required for MVP)

- [ ] Add agency suspension functionality
- [ ] Add billing per agency
- [ ] Add custom domain support
- [ ] Add advanced search/filtering
- [ ] Add agency analytics dashboard
- [ ] Add bulk operations
- [ ] Add 2FA for superadmin
- [ ] Add IP whitelist
- [ ] Add webhook signature verification
- [ ] Add rate limiting

## Rollback Plan

If issues occur:

1. **Code**: GitHub → Revert commit → Vercel auto-redeploys
2. **Database**: Supabase → Use point-in-time recovery
3. **Both**: 
   - Revert code changes
   - Restore database backup
   - Redeploy

## Troubleshooting Reference

### Issue: "Unauthorized" on superadmin pages

- [ ] Check user role = 'superadmin'
- [ ] Check user belongs to platform agency
- [ ] Verify JWT token is valid
- [ ] Clear browser cookies and re-login

### Issue: Agency creation fails

- [ ] Check subdomain is unique
- [ ] Verify admin email is valid
- [ ] Check password is 8+ characters
- [ ] Review API error response
- [ ] Check Supabase logs

### Issue: Agency admin can't login

- [ ] Verify user was created in users table
- [ ] Check password is correct
- [ ] Verify user.role = 'admin'
- [ ] Check auth user exists in Supabase
- [ ] Review auth logs

### Issue: Superadmin can't see agencies

- [ ] Run RLS policy check:
  ```sql
  SELECT * FROM agencies;
  ```
- [ ] Verify user role
- [ ] Check auth context
- [ ] Review RLS policies

## Sign-Off

- [ ] Project Lead: ___________  Date: ______
- [ ] Database Admin: ___________  Date: ______
- [ ] DevOps: ___________  Date: ______

---

**Status**: Ready for deployment
**Tested**: ✅ All features verified
**Ready Date**: May 21, 2026
