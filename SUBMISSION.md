# GolfGive – Internship Submission Notes

## Project Overview

**GolfGive** is a full-stack web application built from scratch as an internship project. It demonstrates production-quality software engineering across a modern tech stack.

---

## Completed Modules (Phases 1–8)

| Phase | Module                              | Status |
|-------|--------------------------------------|--------|
| 1     | Authentication & RBAC               | ✅ Complete |
| 2     | Score Management                    | ✅ Complete |
| 3     | Charity Management                  | ✅ Complete |
| 4     | Subscription Management             | ✅ Complete |
| 5     | Draw & Reward Engine                | ✅ Complete |
| 6     | Winner Verification & Payout        | ✅ Complete |
| 7     | Reports & Analytics Dashboard       | ✅ Complete |
| 8     | Production Readiness                | ✅ Complete |

---

## Architecture Decisions

### Next.js App Router
- Used App Router with route groups: `(auth)`, `(dashboard)`, `(admin)`
- Server Components where possible for data fetching
- Client Components only for interactive UI
- `loading.tsx`, `error.tsx`, and `not-found.tsx` at every level

### Supabase
- PostgreSQL with Row Level Security on all tables
- SSR-compatible client using `@supabase/ssr`
- Service-role key only used server-side for audit logging and seeding

### State Management
- Zustand for client-side auth state
- Server components fetch data directly from Supabase
- No client-side data fetching leaks for protected resources

### Security Layers
1. **Supabase RLS** – database-level row enforcement
2. **Middleware** – session refresh and route protection
3. **API route guards** – explicit role checks in every handler
4. **Rate limiting** – in-memory sliding window on sensitive endpoints
5. **Input validation** – Zod schemas on all form submissions

---

## Demo Account Credentials

| Role  | Email                   | Password  |
|-------|-------------------------|-----------|
| Admin | admin@golfgive.demo     | Admin123! |
| User 1| user1@golfgive.demo     | User123!  |
| User 2| user2@golfgive.demo     | User123!  |

---

## Known Limitations / Future Improvements

| Area             | Current State          | Production Improvement          |
|-----------------|------------------------|---------------------------------|
| Email           | Mock (console log)      | Integrate Resend or Sendgrid    |
| File Upload     | URL-based proof         | Supabase Storage bucket         |
| Payments        | Mock stripe IDs         | Real Stripe Checkout            |
| Rate Limiting   | In-memory               | Redis (Upstash) for clustering  |
| Push Notifications | None               | WebSockets or Supabase Realtime |

---

## Testing Approach

All modules were tested manually using:
- Demo accounts covering all roles
- Happy path and error path validation
- Build verification (`npm run build`) after each phase
- Cross-route authorization checks

---

## Running the Project

```bash
npm install
# Set .env.local with Supabase credentials
npm run dev
```

Seed demo data:
```bash
npx ts-node --project tsconfig.json scripts/seed.ts
```

---

## Codebase Stats

| Metric             | Value (approx.)      |
|--------------------|----------------------|
| Total Files        | ~100                 |
| App Routes         | 15+ (user+admin)     |
| API Endpoints      | 25+                  |
| Database Tables    | 9                    |
| TypeScript         | 100%                 |
| Build Status       | ✅ Passing           |
