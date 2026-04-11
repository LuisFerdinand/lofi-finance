# 🎮 LoFi Finance Tracker

A personal finance tracker with a pixelated lofi aesthetic, built with Next.js 15, NextAuth v5, Drizzle ORM, and Neon PostgreSQL.

---

## 🎨 Color Palette (MP072)

| Name             | Hex       | Usage            |
|------------------|-----------|------------------|
| Palladian        | `#EEE9DF` | Light background |
| Oatmeal          | `#C9C1B1` | Secondary, muted |
| Blue Fantastic   | `#2C3B4D` | Dark surfaces    |
| Burning Flame    | `#FFB162` | Primary/income   |
| Truffle Trouble  | `#A35139` | Accent/expense   |
| Abyssal Blue     | `#1B2632` | Darkest bg/text  |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd finance-tracker-lofi
npm install
```

### 2. Set up Neon PostgreSQL

1. Go to [neon.tech](https://neon.tech) and create a free project
2. Copy your connection string
3. Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
```

### 3. Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

### 4. Database Setup

```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations to Neon DB
npm run db:migrate

# Seed initial users + sample data
npm run db:seed

# Open Drizzle Studio (DB browser)
npm run db:studio
```

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 👤 Default Credentials (after seed)

| Role  | Email                      | Password   |
|-------|----------------------------|------------|
| Admin | admin@lofifinance.com      | admin123   |
| User  | alex@lofifinance.com       | user123    |
| User  | jordan@lofifinance.com     | user123    |

---

## 📁 Project Structure

```
├── app/
│   ├── (auth)/             # Login, Register pages
│   ├── (dashboard)/        # Protected: Dashboard, Transactions, Admin
│   ├── api/
│   │   ├── auth/           # NextAuth handler
│   │   ├── transactions/   # CRUD endpoints
│   │   └── users/          # User management (admin)
│   └── globals.css         # Lofi theme + pixel styles
│
├── components/
│   ├── layout/             # Sidebar, TopBar, MobileNav
│   ├── dashboard/          # StatsGrid, Charts, RecentTxns
│   ├── transactions/       # List, Filters, Add/Edit modals
│   └── admin/              # UserTable, AddUserButton
│
├── db/
│   ├── schema/             # Drizzle table definitions
│   ├── migrations/         # Auto-generated SQL migrations
│   └── index.ts            # DB connection
│
├── lib/
│   └── auth.ts             # NextAuth v5 config
│
├── middleware.ts            # Route protection + role guards
│
└── utils/
    ├── index.ts            # Currency, date, category helpers
    ├── transactions.ts     # Transaction DB queries
    └── users.ts            # User DB queries
```

---

## 🔐 Auth & Roles

| Feature           | User | Admin |
|-------------------|------|-------|
| Dashboard         | ✅   | ✅    |
| View transactions | ✅   | ✅    |
| Add/edit/delete   | ✅   | ✅    |
| Admin panel       | ❌   | ✅    |
| Create users      | ❌   | ✅    |
| Change roles      | ❌   | ✅    |
| Toggle active     | ❌   | ✅    |
| Delete users      | ❌   | ✅    |

---

## 💾 Database Schema

### `users`
- `id`, `name`, `email`, `password` (bcrypt), `role` (admin|user), `is_active`, `avatar`, `created_at`, `updated_at`

### `transactions`
- `id`, `user_id` (FK), `type` (income|expense), `category` (enum), `amount` (cents), `description`, `note`, `transaction_date`, `created_at`, `updated_at`

**Amounts are stored as whole integer Rupiah (IDR)** — e.g., Rp 50.000 is stored as `50000`. Use `dollarsToCents()` (alias for rounding) and `centsToDisplay()` helpers which output formatted IDR strings like `Rp 50.000`.

---

## 📦 Key Dependencies

| Package                  | Purpose                       |
|--------------------------|-------------------------------|
| `next-auth@^5`           | Authentication + JWT sessions |
| `drizzle-orm`            | Type-safe ORM                 |
| `@neondatabase/serverless` | Neon PostgreSQL driver       |
| `drizzle-kit`            | Migrations + Studio           |
| `bcryptjs`               | Password hashing              |
| `recharts`               | Dashboard charts              |
| `sonner`                 | Toast notifications           |
| `zod`                    | Schema validation             |
| `date-fns`               | Date utilities                |
| `lucide-react`           | Icons                         |

---

## 🛠️ Adding Shadcn Components

This project is pre-configured for shadcn/ui with the lofi pixel theme. Add components:

```bash
npx shadcn@latest init
# Choose: TypeScript, App Router, src/ directory
# CSS variables: Yes (already configured in globals.css)

npx shadcn@latest add button input select dialog
```

The `globals.css` already maps shadcn CSS variables to the MP072 lofi palette.

---

## 🧩 Extending

### Add a new category
1. Add to the enum in `db/schema/transactions.ts`
2. Run `npm run db:generate && npm run db:migrate`
3. Add label/emoji in `utils/index.ts`

### Add OAuth (e.g., Google)
1. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`
2. Add `Google()` provider in `lib/auth.ts`

### Add a new page
1. Create `app/(dashboard)/your-page/page.tsx`
2. Add nav item in `Sidebar.tsx` and `MobileNav.tsx`
3. Middleware auto-protects all `/dashboard/*` routes

---

## 📜 Scripts Reference

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:generate  # Generate SQL migrations from schema changes
npm run db:migrate   # Apply pending migrations to DB
npm run db:studio    # Open Drizzle Studio (visual DB browser)
npm run db:push      # Push schema directly (skip migration files)
npm run db:seed      # Seed initial users and sample transactions
```