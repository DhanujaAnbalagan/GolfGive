# GolfGive – QA Checklist

Use this checklist to verify all platform functionality before submission or deployment.

---

## 🔐 Authentication

- [ ] User can register a new account with email and password
- [ ] User receives email verification (mock log in dev)
- [ ] User can log in with valid credentials
- [ ] User is redirected to `/dashboard` after login
- [ ] Admin is redirected to `/admin` after login (if role = admin)
- [ ] Invalid login shows error message
- [ ] User can log out
- [ ] Unauthenticated user is redirected to `/login` when accessing protected routes
- [ ] User cannot access `/admin/*` routes (403 returned)

---

## ⛳ Golf Scores

- [ ] User can log a score (1–45)
- [ ] User cannot log two scores on the same date
- [ ] User can edit an existing score
- [ ] User can delete a score
- [ ] Score list is paginated and sortable by date
- [ ] Admin can view all users' scores at `/admin/scores`
- [ ] Score out of range (0 or 46+) is rejected with validation error

---

## 💳 Subscriptions

- [ ] User can view subscription status on `/dashboard/subscription`
- [ ] User can subscribe to monthly plan
- [ ] User can subscribe to yearly plan
- [ ] Active subscriber can enter draws
- [ ] Inactive/expired user cannot enter draws (error shown)
- [ ] Admin can view all subscriptions at `/admin/subscriptions`
- [ ] Subscription cancellation works and marks status as `cancelled`

---

## ❤️ Charities

- [ ] User can browse active charities at `/charities`
- [ ] User can donate to a charity
- [ ] Admin can create a new charity at `/admin/charities`
- [ ] Admin can edit charity details
- [ ] Admin can deactivate a charity (removes from public list)
- [ ] Charity donation totals appear in analytics

---

## 🎰 Draws

- [ ] Admin can create a new monthly draw at `/admin/draws`
- [ ] Admin can simulate a draw (generates winning numbers)
- [ ] Admin can publish a draw (changes status to `published`)
- [ ] Published draw appears in user's draw list at `/dashboard/draws`
- [ ] Active subscriber can enter the draw
- [ ] Non-subscriber cannot enter the draw
- [ ] User cannot enter the same draw twice
- [ ] Draw entries show in admin view

---

## 🏆 Winners

- [ ] After draw simulation, winners are detected and created
- [ ] Winner receives notification (mock log in dev)
- [ ] Winner can view their prize at `/dashboard/winnings`
- [ ] Winner can submit proof (URL input)
- [ ] Admin can review proof at `/admin/winners`
- [ ] Admin can approve or reject proof with notes
- [ ] Approved winners show as `processing` payment
- [ ] Admin can mark winner as `paid`
- [ ] Paid status reflects in winner's dashboard

---

## 📊 Analytics

### User Insights (`/dashboard/analytics`)
- [ ] Personal score trend chart renders
- [ ] Charity contribution history displays
- [ ] Participation count and stats show correctly

### Admin BI (`/admin/analytics`)
- [ ] Overview cards load (users, revenue, draws, charities)
- [ ] Tabbed breakdowns work (Users / Subscriptions / Revenue / Draws / Winners)
- [ ] Charts render without errors
- [ ] Export button triggers CSV download

---

## 🛡️ Audit Logs (`/admin/audit`)

- [ ] Audit log page loads for admins
- [ ] Regular users cannot access `/admin/audit`
- [ ] Logs are filterable by action
- [ ] Pagination works for >20 entries
- [ ] Refresh button reloads data

---

## 🔧 Error Handling

- [ ] Visiting a non-existent page shows custom 404 (`not-found.tsx`)
- [ ] API errors show user-friendly messages (not raw JSON)
- [ ] Invalid form input shows field-level validation errors
- [ ] Loading skeletons appear while data fetches
- [ ] Error boundaries catch and display component errors gracefully

---

## 🏗️ Build & Performance

- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors in build output
- [ ] No ESLint critical errors
- [ ] Pages load within 3 seconds on localhost
- [ ] Responsive layout works on mobile (320px+) and desktop

---

## 🔒 Security

- [ ] User A cannot view or modify User B's scores
- [ ] User A cannot view User B's winnings
- [ ] Admin-only API endpoints return 403 for regular users
- [ ] Service-role key is not exposed to the browser
- [ ] Rate limiting triggers after repeated rapid requests to sensitive endpoints

---

## ✅ Submission Readiness

- [ ] Demo accounts seeded (`npm run scripts/seed.ts`)
- [ ] README.md is complete and accurate
- [ ] API_REFERENCE.md documents all endpoints
- [ ] SUBMISSION.md notes known limitations
- [ ] `.env.local` is NOT committed to git
- [ ] `.gitignore` includes `node_modules/`, `.next/`, `.env.local`
