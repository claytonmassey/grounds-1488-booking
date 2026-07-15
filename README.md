# Grounds Collective Booking

Hourly booking app for **The Grounds** ($60/hr, photography & events) and **The Glass House** ($125/hr, photography only). Built with Next.js, Prisma, PostgreSQL, and Stripe Checkout. Designed to deploy on Vercel.

## Features

- Choose a space, date, and consecutive hours (single hour, multi-hour, or longest available day)
- Live availability calendar with capacity rules:
  - **Grounds**: overlapping bookings allowed until total party size reaches **2**
  - **Glass House**: exclusive — capacity **1**
- Stripe Checkout payment flow + webhook confirmation
- Pending holds expire after 30 minutes if payment is not completed
- Customer **register / log in** to track purchases on `/account`
- **Admin CMS** at `/admin` to edit home copy, space marketing, rates, and hours

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

You need:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `DATABASE_URL_UNPOOLED` | Unpooled URL for migrations |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional publishable key |
| `NEXT_PUBLIC_APP_URL` | App origin (local or production URL) |
| `AUTH_SECRET` | Random secret for session cookies |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin login |

### 3. Database

```bash
npx prisma migrate dev
npm run db:seed
```

Default admin (override via env): `admin@groundscollective.com` / `changeme-admin`.
### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the printed `whsec_...` as `STRIPE_WEBHOOK_SECRET`.

## Deploy on Vercel

1. Push this repo and import the project in Vercel.
2. Add env vars from `.env.example` (use your production Postgres + Stripe keys).
3. Add a Stripe webhook endpoint: `https://YOUR_DOMAIN/api/webhooks/stripe` for events:
   - `checkout.session.completed`
   - `checkout.session.expired`
4. After the first deploy, seed spaces once:

```bash
vercel env pull .env.local
npx prisma db seed
```

Or run `npm run db:seed` against your production `DATABASE_URL`.

Suggested Postgres hosts that work well with Vercel: Neon, Supabase, or Vercel Postgres.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js |
| `npm run build` | Production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed Grounds + Glass House |
| `npm run db:studio` | Open Prisma Studio |

## Booking rules (implemented)

| Space | Rate | Uses | Capacity |
|---|---|---|---|
| The Grounds | $60/hr | Photography, Events | Shared party total of 2 |
| The Glass House | $125/hr | Photography | Exclusive (1) |

Hours: **8:00 AM – 8:00 PM** by default (configurable per space in the database).
