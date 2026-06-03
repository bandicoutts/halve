# Halve — web

Next.js 16 app (iOS + Android) for [Halve](https://halve.today) — a premium daily 6×6 binary logic puzzle.

## Running locally

1. Copy the example env file and fill in your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   # edit .env.local with your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
   Find both values in the [Supabase dashboard](https://supabase.com/dashboard) under your project → Settings → API.

2. Install dependencies and start the dev server (from the monorepo root):
   ```bash
   pnpm install
   pnpm --filter @parity/web dev
   ```
   Or from this directory:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Further reading

- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) — system overview, data model, request flows
