# FinanceAI — Personal Finance Dashboard

A full-stack AI-powered personal finance dashboard built with Next.js, Prisma, and NextAuth. Track transactions, manage budgets and goals, visualize spending, import bank CSVs, and get AI-generated insights.

## Features

- **Dashboard** — net worth, income/expense summary, spending chart, category breakdown, budget progress, upcoming recurring bills
- **Transactions** — search, filter, sort, paginate; add/edit/delete with automatic AI keyword categorization
- **Budgets** — monthly/weekly/yearly budgets with progress bars and AI spending recommendations
- **Analytics** — income vs expense, savings over time, category pie chart, month-over-month trends, financial health score
- **AI Insights** — generated insights, monthly spending reports, and a chat assistant (local rule-based engine by default; plug in OpenAI/Anthropic via `AI_API_KEY`)
- **CSV Import** — 3-step wizard: upload → map columns → review results (auto-detects columns, validates, dedupes)
- **Goals** — track savings goals with progress and contributions
- **Recurring Transactions** — upcoming bill reminders
- **Notifications** — budget warnings, AI insights, goal milestones, recurring reminders
- **Onboarding** — 5-step first-run wizard (currency, goals, first budget, first transaction)
- **Settings** — profile, preferences, notification toggles, recurring items, security (password change, delete account)
- **Theming** — light/dark/system, keyboard command palette (Ctrl+K), fully responsive

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** Prisma ORM + SQLite (dev) / PostgreSQL (production)
- **Auth:** NextAuth v5 (Credentials, JWT sessions, bcrypt)
- **Forms:** react-hook-form + zod
- **Charts:** Recharts
- **UI:** Tailwind CSS v4, Radix UI primitives, lucide-react icons

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

The defaults work out of the box for local development (SQLite):

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"
AI_API_KEY=""
AI_PROVIDER="local"
```

> **Production:** use PostgreSQL and set `DATABASE_URL` to a `postgresql://` connection string, then change `provider` in `prisma/schema.prisma` to `postgresql`.

### 3. Set up the database

```bash
npx prisma migrate dev --name init
npm run db:seed
```

The seed creates a demo account with 6 months of realistic data:

- **Email:** `demo@financeai.app`
- **Password:** `demo1234`

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000 — new sign-ups land on the onboarding wizard; the demo account goes straight to the dashboard.

## AI Provider

By default (`AI_API_KEY=""`, `AI_PROVIDER="local"`) the app runs a deterministic rule-based insight engine — no external calls, works offline.

To use a real LLM:

```
AI_API_KEY="sk-..."
AI_PROVIDER="openai"   # or "anthropic"
```

The LLM provider automatically falls back to the local engine on errors, and your API key is never exposed to the browser.

## Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start dev server                   |
| `npm run build`      | Production build                   |
| `npm run start`      | Serve production build             |
| `npm run lint`       | Run ESLint                         |
| `npm run db:seed`    | Seed database with demo data       |

## Project Structure

```
src/
├── app/
│   ├── (auth)/            # login, register, forgot-password
│   ├── (dashboard)/       # dashboard, transactions, budgets, analytics,
│   │                      # insights, import, goals, settings, profile
│   ├── api/               # route handlers (transactions, budgets, goals,
│   │                      # insights, ai/chat, csv/import, analytics, auth...)
│   ├── onboarding/        # first-run wizard
│   ├── page.tsx           # public landing page
│   └── proxy.ts           # auth/route protection middleware
├── components/
│   ├── layout/            # sidebar, header, command palette, shell
│   ├── transactions/      # transaction form, detail dialog
│   └── ui/                # shadcn-style primitives
├── lib/
│   ├── ai/                # insight engine (local + LLM providers)
│   ├── auth/              # NextAuth config + helpers
│   ├── calculations/      # budget/health-score/monthly-series math
│   ├── csv/               # CSV parsing, validation, dedup
│   └── validations/       # zod schemas
└── types/
```

## Security

- Passwords hashed with bcrypt; JWT sessions
- All routes protected by proxy middleware (except public pages)
- Every query is scoped to the authenticated user
- zod validation on all API inputs; CSV parser guards against injection
- `NEXTAUTH_SECRET` must be changed before production

## License

MIT