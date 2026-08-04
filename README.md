# PTI Campus Event Board

A responsive web application for the Petroleum Training Institute (PTI), Effurun, Delta State, Nigeria. Students and departments can post campus events; visitors can browse, RSVP, and receive push notifications.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Supabase** — Auth (Google OAuth), PostgreSQL, Storage, Edge Functions, pg_cron
- **Web Push** — Browser notifications (daily digest + new public events)

## Features

- Browse upcoming public events (no login required)
- Signed-in users can also browse past events
- Search by event name / hashtag and filter by category
- Event detail pages with share link, hashtags, host info, RSVP, attendee avatars
- Add events to Google Calendar or download `.ics`
- Post, edit, and delete events with Google sign-in
- Creator dashboard with RSVP counts and attendee management
- Public or private (unlisted) event visibility
- Browser push notifications: daily digest + instant alerts for new public events
- Optional flyer upload (JPG, PNG, WEBP — max 5 MB)

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
CRON_SECRET=your-cron-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:you@gmail.com
```

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
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

Use the same `cron_secret` value in `.env.local` and edge function secrets.

### 5. Deploy Edge Functions

Set edge function secrets:

```bash
pnpm exec supabase secrets set \
  CRON_SECRET=your-cron-secret \
  SITE_URL=https://your-app-url.vercel.app \
  VAPID_PUBLIC_KEY=your-vapid-public-key \
  VAPID_PRIVATE_KEY=your-vapid-private-key \
  VAPID_SUBJECT=mailto:you@gmail.com
```

Deploy:

```bash
pnpm functions:deploy
```

### 6. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Note: Browser push requires HTTPS and works best in production. Use Vercel for full push testing.

## Project Structure

```
src/
  app/
    page.tsx                    # Event listings (upcoming/past)
    dashboard/page.tsx          # Creator dashboard
    events/[id]/page.tsx        # Event detail
    events/[id]/edit/page.tsx   # Edit event
    post/page.tsx               # Create event
    auth/callback/              # OAuth callback
    api/
      events/                   # CRUD + RSVP
      notifications/preferences/
      push/subscribe/
  components/
  lib/
supabase/
  migrations/
  functions/
    send-push/                  # Browser push notifications
public/
  sw.js                         # Service worker for push
```

## Manual Testing

| Feature | How to test |
|---------|-------------|
| Browse events | Visit `/` — upcoming cards sorted by date |
| Past events | Sign in, then use the Past tab |
| Search / category | Use the search box and category select (AND filters) |
| Event detail | Click any event card |
| RSVP | Sign in, open event, click "RSVP — I'm attending" |
| Share / calendar | Use buttons on event detail page |
| Sign in | Click "Sign in with Google" in navbar |
| Dashboard | Visit `/dashboard` while signed in |
| Create event | Visit `/create` while signed in |
| Edit/delete | Dashboard or event detail → Edit / Delete |
| Private event | Create with "Private" visibility — hidden from home, accessible via link |
| Notifications | Sign in → bell / avatar menu → toggle push |
| Push (new event) | `curl -X POST https://<ref>.supabase.co/functions/v1/send-push -H "Authorization: Bearer <cron-secret>" -H "Content-Type: application/json" -d '{"type":"new_event","eventId":"<uuid>"}'` |
| Push (daily digest) | `curl -X POST https://<ref>.supabase.co/functions/v1/send-push -H "Authorization: Bearer <cron-secret>" -H "Content-Type: application/json" -d '{"type":"daily_digest"}'` |

## Cron Schedule

The migration schedules `pg_cron` to run **daily at 8:00 AM WAT** (7:00 UTC):

```
0 7 * * *
```

Triggers `send-push` with `type: daily_digest` (push only — no email).

## License

Private — Petroleum Training Institute, Effurun.
