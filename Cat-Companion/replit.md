# Loafing

A warm, cozy cat care tracking web app with a cream/amber aesthetic. Tracks feedings, vet appointments, weight, medications, health records, milestones, and more. Supports user accounts (Clerk) and a subscription model (Free / Premium).

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (API server)
- **Frontend**: React + Vite + TailwindCSS v4 + shadcn/ui + Nunito font
- **State/Data**: TanStack React Query
- **Auth**: Clerk (`@clerk/express` server, `@clerk/react` + `@clerk/themes` client)

## Subscription Model

### Loafing Free (£0/forever)
- 1 cat profile
- Store vet details
- Basic medication reminders
- Food tracker
- Weight tracker — 30-day history only (enforced server-side)
- 5 milestones per cat (enforced server-side)
- 20 photo memories per cat (enforced server-side)
- Access to basic care guides

### Loafing Plus (£25/year)
- Everything in Free, plus:
- Unlimited cats
- Unlimited food logs, milestones, photo memories
- Full weight history & charts
- Recurring medication schedules
- Vaccine, flea & worm reminders
- Memory timeline
- Export cat baby book as PDF
- Shared family access
- Premium care guides
- Backup & sync

### Plan enforcement
- Server enforces limits at: `POST /cats` (1 cat), `POST /cats/:id/milestones` (5), `POST /cats/:id/album` (20)
- `GET /cats/:id/weight-logs` filters to 30 days for free users
- `subscriptionTier` in DB: `'free'` or `'plus'` (also accepts legacy `'premium'`)
- `getUserPlan()` helper in `artifacts/api-server/src/middlewares/planCheck.ts`

### Upgrade flow
- Soft upgrade modal (`UpgradeModal` component) triggered when users hit limits
- Locked Plus cards shown on cats dashboard for free users
- Upgrade button in sidebar for free users
- Pricing page at `/pricing` — fully built and styled

### Stripe Integration
Stripe has been dismissed via the Replit integration popup. When ready to enable payments:
1. Connect Stripe via the Integrations tab (plug icon in sidebar) — easiest route
2. Or provide `sk_test_...` (STRIPE_SECRET_KEY) and `pk_test_...` (STRIPE_PUBLISHABLE_KEY) as secrets
The `/api/checkout` endpoint and webhook need wiring once Stripe credentials are available.

## Features

- Cat profiles with breed, birthdate, weight, photo, notes
- Feeding log per cat
- Vet appointment management
- Weight history tracking per cat
- Baby Book (milestones, photo album, star sign, personality traits, silly awards)
- Medications tracker
- Health records & vaccinations
- Vet Visit Summary (printable)
- Vets Hub & contacts
- Care Guides (with .txt download)
- User accounts (Clerk auth) — sign in / sign up with Google or email
- Free/Premium subscription tiers with feature gating
- Pricing page at `/pricing`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild lib packages (run after lib/db schema changes)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only, uses drizzle-kit push)

## Artifacts

- `artifacts/cats-app` — React + Vite frontend (preview path: `/`)
- `artifacts/api-server` — Express 5 backend (preview path: `/api`)

## DB Schema (lib/db/src/schema/cats.ts)

- `usersTable` — user accounts (Clerk userId as PK, subscriptionTier, stripeCustomerId, stripeSubscriptionId)
- `catsTable` — cat profiles (userId FK to link cats to owners)
- `feedingsTable` — feeding logs
- `vetAppointmentsTable` — vet appointments
- `weightLogsTable` — weight history
- `milestonesTable` — baby book milestones
- `photoAlbumTable` — baby book photos
- `medicationsTable` — medications
- `healthRecordsTable` — health records
- `vetContactsTable` — vet contacts

## Auth Notes

- Clerk keys provisioned: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
- Proxy middleware at `/api/__clerk` (clerkProxyMiddleware.ts) — only active in production
- All `/api/cats` endpoints require auth (filter by userId)
- `requireAuth` middleware in `artifacts/api-server/src/middlewares/requireAuth.ts`
- `useSubscription` hook in `artifacts/cats-app/src/hooks/use-subscription.ts`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
