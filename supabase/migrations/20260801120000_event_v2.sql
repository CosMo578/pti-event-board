-- Event visibility enum
create type public.event_visibility as enum ('public', 'private');

-- Extend events table
alter table public.events
  add column visibility public.event_visibility not null default 'public',
  add column hashtags text[] not null default '{}',
  add column host_name text not null default 'PTI User',
  add column host_avatar_url text,
  add column updated_at timestamptz not null default now();

-- Drop old SELECT policy (upcoming-only) and replace with full read access
drop policy if exists "Anyone can view upcoming events" on public.events;

create policy "Anyone can view events by direct access"
  on public.events
  for select
  to anon, authenticated
  using (true);

create policy "Owners can update events"
  on public.events
  for update
  to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "Owners can delete events"
  on public.events
  for delete
  to authenticated
  using (created_by = (select auth.uid()));

-- Auto-update updated_at on events
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on public.events
  for each row
  execute function public.set_updated_at();

-- Event RSVPs
create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index event_rsvps_event_id_idx on public.event_rsvps (event_id);

alter table public.event_rsvps enable row level security;

create policy "Anyone can view RSVPs"
  on public.event_rsvps
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can RSVP"
  on public.event_rsvps
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can cancel own RSVP"
  on public.event_rsvps
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Notification preferences (signed-in users only)
create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_daily boolean not null default true,
  push_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users can view own notification preferences"
  on public.notification_preferences
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own notification preferences"
  on public.notification_preferences
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own notification preferences"
  on public.notification_preferences
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Push subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users can view own push subscriptions"
  on public.push_subscriptions
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own push subscriptions"
  on public.push_subscriptions
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Drop anonymous subscribers table
drop policy if exists "Anyone can subscribe" on public.subscribers;
drop table if exists public.subscribers;

-- Reschedule cron: weekly -> daily, weekly-digest -> daily-digest + send-push
select cron.unschedule('weekly-event-digest');

select cron.schedule(
  'daily-event-digest',
  '0 7 * * *',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/daily-digest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := jsonb_build_object('triggered_at', now())
    ) as request_id;
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := jsonb_build_object('type', 'daily_digest', 'triggered_at', now())
    ) as request_id;
  $$
);
