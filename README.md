# PTI Campus Event Board

A responsive web application for the Petroleum Training Institute (PTI), Effurun, Delta State, Nigeria. Students and departments can post upcoming campus events; all visitors can browse them and subscribe to a weekly email digest.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** — Auth (Google OAuth), PostgreSQL, Storage, Edge Functions, pg_cron
- **Resend** — Weekly email digest
- **Google Gemini** — AI category suggestion on event posting

## Features

- Browse upcoming events (no login required)
- Filter events by category (Academic, Social, Sports, Religious, Departmental)
- Subscribe to weekly email digest (no login required)
- Post events with Google sign-in (title, description, date, time, location, category, optional flyer)
- AI "Suggest Category" button powered by Gemini
- Weekly cron job (Monday 8:00 AM WAT) sends digest via Supabase Edge Function + Resend

## Getting Started

### 1. Clone and install

```bash
pnpm install
cp .env.example .env.local
```

### 2. Configure environment variables

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Link your project: `pnpm exec supabase link --project-ref <your-ref>`
3. Apply migrations: `pnpm exec supabase db push`
4. Enable **Google** auth provider in Supabase Dashboard → Authentication → Providers
5. Add redirect URL: `http://localhost:3000/auth/callback` (and your production URL)
6. Create a Google OAuth client in [Google Cloud Console](https://console.cloud.google.com) and add credentials to Supabase

### 4. Configure Vault secrets for cron

In the Supabase SQL editor, run:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<your-cron-secret>', 'cron_secret');
```

Use the same `cron_secret` value when deploying the edge function.

### 5. Deploy the weekly digest Edge Function

Set edge function secrets:

```bash
pnpm exec supabase secrets set \
  RESEND_API_KEY=re_xxx \
  CRON_SECRET=your-cron-secret \
  FROM_EMAIL="PTI Events <digest@yourdomain.com>" \
  SITE_URL=https://your-app-url.vercel.app
```

Deploy:

```bash
pnpm exec supabase functions deploy weekly-digest --no-verify-jwt
```

### 6. Set up Resend

1. Create an account at [resend.com](https://resend.com)
2. Verify your sending domain
3. Create an API key and add it as `RESEND_API_KEY` edge function secret

### 7. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    page.tsx              # Event listings
    post/page.tsx         # Post event form
    auth/callback/        # OAuth callback
    api/
      events/             # POST create event
      subscribe/          # POST email subscription
      suggest-category/   # POST Gemini category suggestion
  components/             # UI components
  lib/                    # Supabase clients, types, validations
supabase/
  migrations/             # Database schema, RLS, storage, cron
  functions/
    weekly-digest/        # Weekly email digest edge function
```

## Manual Testing

| Feature | How to test |
|---------|-------------|
| Browse events | Visit `/` — cards display sorted by date |
| Category filter | Click category pills — URL updates with `?category=` |
| Subscribe | Enter email in footer form |
| Sign in | Click "Sign in with Google" in navbar |
| Post event | Visit `/post` while signed in, fill form, upload flyer |
| Suggest Category | Enter title + description, click "Suggest Category" |
| Weekly digest | `curl -X POST https://<ref>.supabase.co/functions/v1/weekly-digest -H "Authorization: Bearer <cron-secret>"` |

## Cron Schedule

The migration schedules `pg_cron` to run every **Monday at 8:00 AM WAT** (7:00 UTC):

```
0 7 * * 1
```

## License

Private — Petroleum Training Institute, Effurun.
