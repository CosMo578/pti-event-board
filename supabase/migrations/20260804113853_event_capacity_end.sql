-- Optional capacity and optional end date/time for multi-day events
alter table public.events
  add column max_attendees integer null
    check (max_attendees is null or (max_attendees >= 1 and max_attendees <= 10000)),
  add column end_date date null,
  add column end_time time null;

alter table public.events
  add constraint events_end_pair_check
  check (
    (end_date is null and end_time is null)
    or (end_date is not null and end_time is not null)
  );

alter table public.events
  add constraint events_end_after_start_check
  check (
    end_date is null
    or ((end_date + end_time) > (event_date + event_time))
  );
