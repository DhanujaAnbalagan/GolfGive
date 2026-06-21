# GolfGive – API Reference

All API routes are located under `/app/api/`. They follow RESTful conventions and return JSON.

---

## Authentication

All API routes require a valid Supabase session cookie (set by the SSR auth flow).
Requests without a session return **401 Unauthorized**.
Routes marked **[Admin]** also require the `admin` role on the user's profile.

---

## 📊 Analytics API

### `GET /api/analytics/overview`
Returns platform overview metrics.

**Role:** Admin

**Response:**
```json
{
  "total_users": 150,
  "active_subscribers": 85,
  "expired_subscribers": 32,
  "monthly_revenue": 849.15,
  "total_charities": 3,
  "total_draws": 12
}
```

---

### `GET /api/analytics/users`
User growth and registration trends.

**Role:** Admin

---

### `GET /api/analytics/subscriptions`
Subscription breakdown: monthly vs yearly, active vs expired.

**Role:** Admin

---

### `GET /api/analytics/revenue`
Monthly revenue aggregation over the past 12 months.

**Role:** Admin

---

### `GET /api/analytics/charities`
Charity donation totals and per-charity breakdown.

**Role:** Admin

---

### `GET /api/analytics/draws`
Draw participation trends and entry statistics.

**Role:** Admin

---

### `GET /api/analytics/winners`
Winner statistics: prize amounts, verification status, payment status.

**Role:** Admin

---

## 🎰 Draws API

### `GET /api/draws`
List all draws. Admins see all; users see only published draws.

**Response:**
```json
[
  {
    "id": "uuid",
    "draw_month": 6,
    "draw_year": 2026,
    "draw_type": "monthly",
    "status": "published",
    "winning_numbers": [3, 15, 22, 31, 40],
    "jackpot_amount": 500.00,
    "created_at": "2026-06-01T00:00:00Z"
  }
]
```

---

### `POST /api/draws`
Create a new draw.

**Role:** Admin

**Body:**
```json
{
  "draw_month": 7,
  "draw_year": 2026,
  "draw_type": "monthly",
  "jackpot_amount": 750.00
}
```

---

### `PATCH /api/draws/[id]`
Update a draw (simulate, publish, update jackpot).

**Role:** Admin

---

### `POST /api/draws/[id]/enter`
Enter the current draw (requires active subscription).

**Role:** User (active subscriber only)

---

## ⛳ Scores API

### `GET /api/scores`
Get golf scores. Users see own scores; admins see all.

**Query params:** `user_id`, `from_date`, `to_date`, `limit`, `offset`

---

### `POST /api/scores`
Log a new golf score.

**Role:** User

**Body:**
```json
{
  "score": 28,
  "score_date": "2026-06-20"
}
```

---

### `PATCH /api/scores/[id]`
Update a golf score.

**Role:** Owner only

---

### `DELETE /api/scores/[id]`
Delete a golf score.

**Role:** Owner only

---

## 💳 Subscriptions API

### `GET /api/subscriptions`
Get current user subscription, or all subscriptions for admins.

---

### `POST /api/subscriptions`
Create or update a subscription.

**Body:**
```json
{
  "plan": "monthly",
  "stripe_subscription_id": "sub_xxx"
}
```

---

### `DELETE /api/subscriptions/[id]`
Cancel a subscription.

---

## 🏆 Winners API

### `GET /api/winners`
List winners. Users see own winners; admins see all.

---

### `PATCH /api/winners/[id]/verify`
Approve or reject winner proof submission.

**Role:** Admin

**Body:**
```json
{
  "action": "approve",
  "review_notes": "Proof verified successfully."
}
```

---

### `PATCH /api/winners/[id]/pay`
Mark a winner as paid.

**Role:** Admin

---

### `POST /api/winners/[id]/proof`
Submit proof of eligibility.

**Role:** Owner (winner) only

**Body:** `multipart/form-data` with `file` field (PDF/image, max 5MB)

---

## ❤️ Charities API

### `GET /api/charities`
List all active charities.

---

### `POST /api/charities`
Create a new charity.

**Role:** Admin

---

### `PATCH /api/charities/[id]`
Update a charity.

**Role:** Admin

---

### `DELETE /api/charities/[id]`
Delete a charity.

**Role:** Admin

---

### `POST /api/user-charity`
Record a user donation to a charity.

---

## 📈 Reports API

### `GET /api/reports/export`
Export analytics data as CSV.

**Role:** Admin

**Query params:** `type` (users|subscriptions|revenue|draws|winners)

---

## 🛡️ Audit API

### `GET /api/audit`
Retrieve paginated audit log entries.

**Role:** Admin

**Query params:** `action`, `entity_type`, `from_date`, `to_date`, `limit`, `offset`

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "actor_email": "admin@golfgive.demo",
      "action": "draw.publish",
      "entity_type": "draws",
      "entity_id": "uuid",
      "details": {},
      "ip_address": "127.0.0.1",
      "created_at": "2026-06-20T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

## 📧 Email API

### `POST /api/email`
Trigger an email notification.

**Body:**
```json
{
  "to": "user@example.com",
  "template": "winner_notification",
  "data": { "prizeAmount": 500 }
}
```

**Available templates:**
- `welcome`
- `subscription_confirmed`
- `subscription_cancelled`
- `draw_entered`
- `winner_notification`
- `proof_submission_received`
- `proof_approved`
- `proof_rejected`
- `payment_processed`
- `password_reset`

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message"
}
```

| Status | Meaning                              |
|--------|--------------------------------------|
| 400    | Bad Request – missing/invalid fields |
| 401    | Unauthorized – no valid session      |
| 403    | Forbidden – insufficient role        |
| 404    | Not Found                            |
| 429    | Too Many Requests – rate limited     |
| 500    | Internal Server Error                |
