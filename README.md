# Shared Expenses App

A production-ready shared expenses management application built with Next.js 15, Prisma, Tailwind CSS, and Shadcn UI.

## Setup & Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Setup the database connection:
   - Copy `.env.example` to `.env` (or set `DATABASE_URL` manually).
   - This project uses SQLite locally for rapid development but is configured for PostgreSQL in production.
4. Run migrations: `npx prisma migrate dev`
5. Start development server: `npm run dev`

## Features
- **Group Management:** Add and remove members with timeline tracking.
- **Complex Splits:** Equal, Exact Amount, Percentage, and Shares.
- **Import Engine:** Upload CSV files, detect anomalies (duplicates, floating-point issues), and review before importing.
- **Balance Engine:** Uses a graph-based debt simplification algorithm to minimize transactions.
- **Multi-currency:** Native support for USD/INR with historical exchange rates.
- **Auditability:** Transparent balance calculations showing exactly who owes what and why.

## Deployment
- **Frontend:** Deploy on Vercel by importing the repository. Environment variables required: `DATABASE_URL`, `NEXTAUTH_SECRET`.
- **Database:** Deploy on Railway or Supabase and use the PostgreSQL connection string in Vercel.
