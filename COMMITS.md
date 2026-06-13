# Git Commit Plan

1. **Project initialization**
   `git commit -m "chore: initialize Next.js 15 project with Tailwind and Shadcn UI"`

2. **Authentication module**
   `git commit -m "feat(auth): integrate NextAuth with JWT and set up /login and /register pages"`

3. **Database schema**
   `git commit -m "feat(db): design Prisma schema for users, groups, expenses, and settlements with SQLite fallback"`

4. **Group management**
   `git commit -m "feat(groups): implement membership timeline rules handling join and leave dates"`

5. **Expense management**
   `git commit -m "feat(expenses): create API endpoints for CRUD expenses supporting equal, exact, and share splits"`

6. **Balance engine**
   `git commit -m "feat(engine): implement Splitwise-style graph-based debt simplification algorithm"`

7. **Import engine**
   `git commit -m "feat(import): build robust CSV parser with multi-tier anomaly detection (ERROR, WARNING, INFO)"`

8. **Currency support**
   `git commit -m "feat(currency): add historical exchange rate conversion to base currency (INR)"`

9. **Audit logs**
   `git commit -m "feat(audit): add 'Explain this balance' feature to trace debt calculations to specific expense rows"`

10. **Testing**
    `git commit -m "test: add Jest unit tests for BalanceEngine and CSV ImportEngine ensuring 80% coverage"`

11. **Documentation**
    `git commit -m "docs: generate comprehensive README, SCOPE, DECISIONS, and IMPORT_REPORT documentation"`

12. **Deployment**
    `git commit -m "chore(deploy): add Dockerfile, railway.json, vercel.json, and Prisma seed scripts"`
