# Hearthbyte Meals

Hearthbyte Meals is an original meal-planning web app built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Auth.js credentials authentication, and Stripe-ready subscription scaffolding.

## Features implemented

- Original public landing page with hero, feature overview, sample plan preview, recipe previews, pricing, FAQ, newsletter CTA, and responsive warm visual design.
- Auth flows: sign-up, sign-in, sign-out button, password-reset request UI placeholder, protected routes, role-aware authorization middleware.
- Roles supported in data model/session: guest, user, paid subscriber, administrator.
- Onboarding/preferences capture + persistence shape for:
  - household size, meals/day, skill, preferred cooking time
  - dietary preferences, allergies, disliked ingredients, favorite cuisines
  - grocery stores and leftovers preference
- Recipe library and recipe detail pages with filtering/search, nutrition summaries, allergen/dietary labels, substitutions, picky-eater notes, and action controls.
- Weekly planner surface with weekday slots, dinners-only defaults, keyboard-accessible move controls, serving scaling preview, and personalized suggestion logic.
- Grocery list view scaffold with aisle categories, checklist/edit UI, custom-item form, and sharing-ready token field in data model.
- Meal decider UI with keyboard controls (skip/save) and planner-add CTA.
- Weekly prep guide checklist with completion tracking UI.
- Billing routes for Stripe checkout/customer portal + webhook verification, with safe local mock fallback when Stripe variables are missing.
- Admin dashboard MVP with protected metrics, recipe moderation/publish-archive controls, curated plan creation scaffold, and moderation model support.
- Prisma schema includes all required entities.
- Seed data includes:
  - 30 original recipes (5 breakfast, 10 lunch, 15 dinner)
  - dietary/allergy tags
  - local admin seed account
  - 4 sample weekly plans
- Validation/security foundations:
  - Zod validation
  - server-side auth checks and ownership checks on key endpoints
  - in-memory rate-limit-ready boundary helper
  - sanitization for admin recipe summary input

## Tech stack

- Next.js (App Router) + TypeScript
- React + Tailwind CSS
- PostgreSQL + Prisma ORM
- Auth.js (Credentials provider)
- Stripe server integrations + webhook verification
- Vitest unit/integration tests
- Playwright e2e scaffolding

## Routes

### Public
- `/` landing
- `/recipes`
- `/recipes/[id]`
- `/signin`
- `/signup`
- `/reset-password`

### Protected user
- `/dashboard`
- `/onboarding`
- `/preferences`
- `/planner`
- `/groceries`
- `/decider`
- `/prep-guide`
- `/billing`

### Admin
- `/admin`

### API
- `/api/auth/[...nextauth]`
- `/api/signup`
- `/api/preferences`
- `/api/recipes`
- `/api/meal-plans`
- `/api/newsletter`
- `/api/admin/recipes`
- `/api/stripe/checkout`
- `/api/stripe/portal`
- `/api/stripe/webhook`

## Environment variables

Copy `.env.example` to `.env.local` and set values:

- `DATABASE_URL` PostgreSQL connection URL
- `NEXTAUTH_SECRET` random secret for Auth.js
- `NEXTAUTH_URL` local app URL (normally `http://localhost:3000`)
- `NEXT_PUBLIC_APP_URL` external/public app URL
- `STRIPE_SECRET_KEY` Stripe secret key (optional in local mock mode)
- `STRIPE_WEBHOOK_SECRET` Stripe webhook signing secret (optional in local mock mode)
- `NEXT_PUBLIC_STRIPE_PRICE_ID` Stripe price ID for subscription checkout (optional in local mock mode)

## Setup

1. Install deps:
   ```bash
   npm install
   ```
2. Generate Prisma client:
   ```bash
   npm run db:generate
   ```
3. Run migrations:
   ```bash
   npm run db:migrate
   ```
4. Seed data:
   ```bash
   npm run db:seed
   ```
5. Start dev server:
   ```bash
   npm run dev
   ```

## Local seeded admin

For local development after seeding:

- Email: `admin@hearthbyte.local`
- Password: `ChangeMeLocal123!`

Change this immediately for non-local environments.

## Stripe local webhook setup

1. Install Stripe CLI.
2. Start forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Copy returned signing secret into `STRIPE_WEBHOOK_SECRET`.
4. If Stripe keys are absent, app remains usable via mock billing mode.

## Scripts

- `npm run dev` run Next dev server
- `npm run build` production build
- `npm run lint` lint code
- `npm run typecheck` TypeScript check
- `npm run test` run Vitest tests
- `npm run test:e2e` run Playwright tests
- `npm run db:migrate` run Prisma migration
- `npm run db:seed` seed database
- `npm run db:generate` generate Prisma client

## Testing

Unit/integration coverage includes:
- recommendation and allergen filtering
- grocery consolidation and scaling
- subscription gating logic

Playwright scaffolding includes key journey checks:
- landing CTA visibility
- signup page rendering
- protected planner redirect behavior

## Architecture notes

- App Router pages for UI and route-level protection.
- NextAuth credentials sessions with role claims in JWT/session.
- Prisma schema models core domain entities for planning, groceries, prep, billing, favorites, and moderation.
- Planner personalization logic is implemented in modular pure functions (`lib/planner.ts`) with unit tests.
- Stripe uses verified webhook signatures and mock fallback for local/no-key execution.

## Deployment checklist

- [ ] Configure managed PostgreSQL and `DATABASE_URL`
- [ ] Run `prisma migrate deploy`
- [ ] Set secure `NEXTAUTH_SECRET`
- [ ] Configure production `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`
- [ ] Configure Stripe keys, price ID, and webhook secret
- [ ] Ensure HTTPS and secure cookies
- [ ] Run `npm run lint && npm run typecheck && npm run test`
- [ ] Run e2e against deployed preview

## Known limitations / next steps

- Some UI actions are scaffolded but not fully wired (e.g., drag/drop persistence, print/export output, complete meal-swap mutations).
- Password reset and email verification flows are UI-ready but require SMTP/token transport implementation.
- Grocery sharing and delivery provider integrations are modeled but currently mock/scaffold-level.
- Add richer moderation workflows, analytics, and caching for larger-scale production loads.
