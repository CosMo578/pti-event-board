-- Event category enum
create type public.event_category as enum (
  'academic',
  'social',
  'sports',
  'religious',
  'departmental'
);

-- Events table
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) >= 3 and char_length(title) <= 200),
  description text not null check (char_length(description) >= 10 and char_length(description) <= 5000),
  event_date date not null,
  event_time time not null,
  location text not null check (char_length(location) >= 2 and char_length(location) <= 300),
  category public.event_category not null,
  flyer_url text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index events_event_date_idx on public.events (event_date, event_time);

-- Subscribers table
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  subscribed_at timestamptz not null default now()
);

-- RLS
alter table public.events enable row level security;
alter table public.subscribers enable row level security;

create policy "Anyone can view upcoming events"
  on public.events
  for select
  to anon, authenticated
  using (event_date >= current_date);

create policy "Authenticated users can create events"
  on public.events
  for insert
  to authenticated
  with check (created_by = (select auth.uid()));

create policy "Anyone can subscribe"
  on public.subscribers
  for insert
  to anon, authenticated
  with check (true);

-- Storage bucket for event flyers
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-flyers',
  'event-flyers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Public read access for event flyers"
  on storage.objects
  for select
  to public
  using (bucket_id = 'event-flyers');

create policy "Authenticated users can upload flyers"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'event-flyers'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- pg_cron weekly digest (Monday 8:00 AM WAT = 7:00 UTC)
-- Before applying: store secrets in Vault via Supabase SQL editor:
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<publishable-key>', 'publishable_key');
--   select vault.create_secret('<cron-secret>', 'cron_secret');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'weekly-event-digest',
  '0 7 * * 1',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/weekly-digest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := jsonb_build_object('triggered_at', now())
    ) as request_id;
  $$
);
