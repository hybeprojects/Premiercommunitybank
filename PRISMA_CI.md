Prisma + CI migrations

Overview

This project uses Prisma for Postgres schema management when deploying to Supabase. The CI workflow (GitHub Actions) will run `prisma migrate deploy` on pushes to the `aura-hub` branch.

Secrets required (set in GitHub repo Settings -> Secrets):
- DATABASE_URL (postgres connection string to your Supabase DB)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

What the workflow does
1. Installs server dependencies (server/package.json)
2. Runs `npx prisma generate`
3. Runs `npx prisma migrate deploy` using DATABASE_URL
4. Builds the client

Notes
- Do NOT commit secrets to the repo. Use GitHub Secrets.
- The first time you run migrations locally, use `npx prisma migrate dev --name init` to create migration files. Those migration files are checked into git and used by `prisma migrate deploy` in CI.

Local dev

To set up locally using Supabase:
1. Create a Supabase project and copy the connection string to `DATABASE_URL`.
2. Install deps and generate prisma client:
   cd server
   npm install
   npx prisma generate
3. Create a migration locally (only once):
   npx prisma migrate dev --name init

To apply migrations on a remote server (CI or production):
- Ensure DATABASE_URL is set and run `npx prisma migrate deploy`.

If you want me to also convert the server data layer to use Prisma client (replace raw SQL queries), I can scaffold that in a follow-up.
