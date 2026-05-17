# Mirinate Care

Multi-tenant homecare agency management SaaS platform.

## Tech Stack

- **Next.js 14** — App Router, Server Components, API Routes
- **Supabase** — PostgreSQL, Auth, Storage, Row-Level Security
- **Tailwind CSS** — Styling
- **Stripe** — Subscriptions ($149/month, 14-day trial)
- **Resend** — Transactional emails
- **date-fns** — Date utilities

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.local` and fill in your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://yourapp.com
CRON_SECRET=your-random-secret
```

### 3. Set Up Supabase Database
1. Create a new Supabase project
2. Go to SQL Editor → run `supabase/schema.sql`
3. Run `supabase/functions.sql`
4. Create storage buckets: `agency-logos` (public), `documents` (private), `avatars` (public)
5. Run `supabase/storage.sql` for storage RLS

### 4. Set Up Stripe
1. Create a Stripe product/price for $149/month
2. Set up webhook pointing to `/api/stripe/webhook`
3. Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`

### 5. Run Development Server
```bash
npm run dev
```

## User Roles

| Role | Dashboard Route | Description |
|------|----------------|-------------|
| Admin | `/dashboard/admin` | Full agency management |
| Caregiver | `/dashboard/caregiver` | Schedule, GPS check-in, clients, training |
| Client | `/dashboard/client` | Care plan, visit history, messages |
| Family | `/dashboard/family` | Live caregiver status, visit summaries |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/signup` | POST | Create agency + admin user |
| `/api/invite` | POST | Invite caregiver/client/family member |
| `/api/stripe/create-checkout` | GET | Start Stripe checkout |
| `/api/stripe/portal` | GET | Open Stripe billing portal |
| `/api/stripe/webhook` | POST | Handle Stripe events |
| `/api/alerts/no-show` | POST | Detect no-shows (cron) |
| `/api/alerts/expiring-docs` | POST | Check expiring documents (cron) |
| `/api/alerts/visit-summary` | POST | Send visit summary emails (cron/trigger) |
| `/api/evv/export` | POST | Export EVV report as CSV |

## Automated Alerts (Cron Jobs)

Set up cron jobs to call these endpoints with `Authorization: Bearer <CRON_SECRET>`:

- **No-show check**: `POST /api/alerts/no-show` — every 10 minutes
- **Expiring docs**: `POST /api/alerts/expiring-docs` — daily
- **Visit summaries**: `POST /api/alerts/visit-summary` — every hour

Use Vercel Cron, Railway Cron, or a third-party service like EasyCron.

## White-Label

Each agency can set:
- **Agency name** — shown in sidebar, emails, dashboards
- **Logo** — uploaded to Supabase storage
- **Brand color** — applied via CSS variable `--brand-color` across the entire UI

## EVV Compliance (California Medi-Cal)

GPS coordinates are recorded at check-in and check-out. The `evv_verified` flag is set to `true` when location data is present. Export EVV reports as CSV from Admin → GPS/EVV.

## Database Schema

See `supabase/schema.sql` for all 15 tables with RLS policies:
- agencies, users, caregivers, clients, family_members
- shifts, checkins, job_postings, applications
- training_modules, training_progress, documents
- messages, visit_notes, alerts
