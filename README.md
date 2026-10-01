# KALOOK!

Simple Pageant Tabulation App for Kalook-Alike and pageant competitions.

KALOOK! is a focused serverless MVP built with Next.js App Router, React, TypeScript, Tailwind CSS, Supabase PostgreSQL/Auth/Storage, Zod, React Hook Form, and Vercel.

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code and never prefix it with `NEXT_PUBLIC_`.

## Development

```bash
npm run dev
```

## Supabase database

Apply migrations with Supabase CLI:

```bash
supabase db push
```

Load optional demonstration data:

```bash
supabase db reset
```

The seed file contains fictional demonstration users and no real passwords. Use Supabase Auth invites or password resets to sign in as demo users.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Main workflows

- Administrators create events, contestants, criteria, judges, and control event status.
- Judges sign in with their own account, save drafts, and submit final score sheets.
- Submitted score sheets lock until an administrator reopens them with a reason.
- Public users can only open published result pages.
- CSV exports and printable official result sheets are available from the admin tabulation page.

## Documentation

- [Scoring rules](docs/SCORING.md)
- [Database and RLS](docs/DATABASE.md)
- [Security model](docs/SECURITY.md)
- [Vercel deployment](docs/DEPLOYMENT.md)
