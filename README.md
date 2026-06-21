# GolfGive 🏌️‍♂️

> **Golf Score Tracking · Monthly Draws · Charity Sweepstakes**

A full-stack Next.js 16 web application built for internship submission. GolfGive combines golf handicap tracking, subscription-gated prize draws, and charity fundraising into one premium platform.

---

## 🚀 Live Demo

| Role  | Email                      | Password   |
|-------|----------------------------|------------|
| Admin | admin@golfgive.demo        | Admin123!  |
| User  | user1@golfgive.demo        | User123!   |
| User  | user2@golfgive.demo        | User123!   |

---

## ✨ Features

### Player Dashboard
- 🔐 **Authentication** – Email/password sign-up and login via Supabase Auth
- ⛳ **Golf Scores** – Log, edit and delete daily scores (1–45 range, one per day)
- 🎰 **Monthly Draws** – Enter subscription-gated sweepstakes with auto-generated numbers
- 🏆 **My Winnings** – View prize history and submit proof for claim processing
- 📊 **My Insights** – Personal analytics: score trends, charity contributions, participation
- 💳 **Subscription** – Manage monthly (£9.99) or yearly (£89.99) plan
- ❤️ **Charity** – Browse and donate to partner charities

### Admin Panel
- 👥 **Users** – View all users and their profiles
- ⛳ **Scores** – Monitor all platform golf scores
- 🎰 **Draws** – Create, simulate, and publish monthly draws
- 🏆 **Winners** – Verify proof, approve/reject, and mark payments
- 📊 **BI Analytics** – Full business intelligence dashboard with charts
- 💳 **Subscriptions** – Monitor all active/expired subscriptions
- 🛡️ **Audit Logs** – Read-only trail of all platform actions

---

## 🛠️ Tech Stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Framework   | Next.js 16 (App Router)             |
| Language    | TypeScript 5                        |
| Styling     | Tailwind CSS v4                     |
| Database    | Supabase (PostgreSQL)               |
| Auth        | Supabase Auth + SSR                 |
| Charts      | Recharts                            |
| Forms       | React Hook Form + Zod               |
| State       | Zustand                             |
| Icons       | Lucide React                        |

---

## 📁 Project Structure

```
e:/GolfGive/
├── app/
│   ├── (auth)/          # Login, Register pages
│   ├── (dashboard)/     # Player routes
│   ├── (admin)/         # Admin routes
│   ├── api/             # API Route Handlers
│   ├── error.tsx        # Route-level error boundary
│   ├── global-error.tsx # Fatal error boundary
│   └── not-found.tsx    # 404 page
├── components/          # Shared UI components
├── features/            # Feature-specific components
├── hooks/               # Custom React hooks
├── lib/
│   ├── store/           # Zustand state stores
│   └── supabase/        # Supabase clients (client/server/middleware)
├── scripts/
│   └── seed.ts          # Demo data seeding
├── services/            # Business logic / data access layer
├── supabase/            # SQL schema files
├── types/               # TypeScript type definitions
└── utils/               # Utilities (rate limiter, etc.)
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd GolfGive
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Apply Database Schema

Run all schema files in the Supabase SQL editor in this order:

```
supabase/schema.sql              # Core tables (profiles, golf_scores)
supabase/subscription_schema.sql # Subscriptions
supabase/schema_update.sql       # Charities, user_charities
supabase/draw_schema.sql         # Draws, draw_entries, winners
supabase/verification_schema.sql # Verification + payment fields
supabase/audit_logs_schema.sql   # Audit logging
```

### 4. Seed Demo Data

```bash
npx ts-node --project tsconfig.json scripts/seed.ts
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- **Role-based access control** – `user` and `admin` roles
- **Server-side authorization** on all API routes
- **Input validation** via Zod schemas on all forms
- **Rate limiting** on sensitive endpoints (auth, proof submission)
- **Error boundaries** prevent cascading failures

---

## 📧 Email Service

Currently using a **mock email service** that logs to console. To enable real email:

1. Install your provider (e.g., `npm install resend`)
2. Add API key to `.env.local`
3. Replace mock internals in `services/emailService.ts`

---

## 🏗️ Build

```bash
npm run build    # Production build
npm run start    # Start production server
```

---

## 📄 Documentation

- [API Reference](./API_REFERENCE.md)
- [Submission Notes](./SUBMISSION.md)
- [QA Checklist](./QA_CHECKLIST.md)

---

## 👤 Author

Built as an internship project demonstrating full-stack Next.js development with Supabase.
