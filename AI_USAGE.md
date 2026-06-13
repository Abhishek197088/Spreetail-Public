# AI Usage

## AI Tools Used
- Google Gemini 3.5 Pro for full-stack application scaffolding and architecture design.
- Automated API agents for executing CLI tools, running Prisma migrations, and generating file structures.

## Prompts Used
The primary prompt involved a Master Request to build a "COMPLETE SHARED EXPENSES APP" requiring:
1. CSV Anomaly Analysis
2. Full Stack (Next.js 15, Prisma, Tailwind, Shadcn UI)
3. Splitwise-style Balance Engine
4. Currency Engine
5. Documentation & CI/CD config

## AI Corrections & Fixes (Examples)

1. **Database Connection Issue**
   - *Initial Assumption*: Attempted to spin up a Docker container for PostgreSQL using `docker-compose`.
   - *Failure*: Docker daemon was not running on the host system.
   - *Fix*: The AI dynamically reconfigured the Prisma schema from `@db.Decimal` (PostgreSQL specific) to standard `Decimal` and switched the provider to `sqlite` to ensure local development could proceed unblocked.

2. **PowerShell Script Execution Policy**
   - *Initial Assumption*: Executed standard `npx create-next-app` via PowerShell.
   - *Failure*: PowerShell blocked `npx.ps1` due to strict execution policies (`PSSecurityException`).
   - *Fix*: AI adapted to the environment by forcing `npx.cmd` and `cmd /c` to bypass the `.ps1` restriction and execute the Windows batch script wrapper directly.

3. **Prisma Version 7.8.0 Syntax Changes**
   - *Initial Assumption*: Wrote `url = env("DATABASE_URL")` directly inside the `schema.prisma` file, which is the standard for Prisma < 6.x.
   - *Failure*: Prisma CLI threw error `P1012` stating that the `url` property is no longer supported in schema files.
   - *Fix*: AI read the error output, inspected `prisma.config.ts`, removed the invalid syntax from `schema.prisma`, and installed `dotenv` to handle the environment configuration natively via the newly generated `prisma.config.ts`.
