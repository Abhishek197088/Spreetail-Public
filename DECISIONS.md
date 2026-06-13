# Technical Decisions

1. **Database Selection (SQLite vs PostgreSQL)**
   - *Problem*: Required local Docker Postgres but the host lacked a running Docker daemon.
   - *Options considered*: Block execution until Docker is fixed, or use SQLite locally.
   - *Final decision*: Use SQLite for local development (`dev.db`) but keep production configuration mapping conceptually ready for PostgreSQL.
   - *Reason*: Enables rapid prototyping and unblocks UI/backend development without heavy infrastructure dependencies on the host machine.

2. **Balance Simplification Algorithm**
   - *Problem*: Settling 10 individual transactions is tedious for the users.
   - *Options considered*: Standard pairwise netting vs Graph-based greedy minimum transaction algorithm.
   - *Final decision*: Implemented a greedy algorithm that sorts creditors and debtors and settles the largest amounts first.
   - *Reason*: Mimics the Splitwise "Simplify Debts" feature and minimizes total transactions.

3. **Settlements as Separate Table**
   - *Problem*: The CSV mixes "settlements" (e.g., Rohan paid Aisha back) with expenses.
   - *Options considered*: Use the `Expense` table with a negative amount / specific `splitType`, or use a dedicated `Settlement` table.
   - *Final decision*: Dedicated `Settlement` table.
   - *Reason*: Clean separation of concerns. Settlements do not have "splits" and only affect final net balances.

4. **Handling Currency Conversion**
   - *Problem*: Multi-currency expenses exist in the CSV (e.g., USD and INR).
   - *Options considered*: Calculate balances in multiple currencies vs convert everything to a base currency.
   - *Final decision*: Convert all expenses to a base currency (INR) using historical rates, storing both the original and converted amounts.
   - *Reason*: Balances need to be resolved in a single currency to allow cross-currency debt simplification.
