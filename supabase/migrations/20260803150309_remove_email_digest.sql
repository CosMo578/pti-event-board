-- Remove email digest: drop email preference column and email cron job.
-- Keep daily push digest via send-push only.

alter table public.notification_preferences
  drop column if exists email_daily;

-- Replace combined email+push cron with push-only schedule (safe if job missing)
do $$
begin
  perform cron.unschedule('daily-event-digest');
exception
  when others then
    raise notice 'daily-event-digest job not found or already removed';
end $$;

do $$
begin
  perform cron.unschedule('daily-push-digest');
exception
  when others then
    null;
end $$;

select cron.schedule(
  'daily-push-digest',
  '0 7 * * *',
  $$
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
