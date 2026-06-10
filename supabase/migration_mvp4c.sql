-- ============================================================
--  IoMT MVP4c — Alert Event Log + Audit Trail
--  Run in the Supabase SQL Editor. Safe to re-run.
--
--  Design (medical-grade):
--   * Alerts are created SERVER-SIDE by a trigger on `vitals`, so the
--     log is complete and contemporaneous even if no dashboard is open.
--   * Server timestamps (now()/recorded_at) = trusted time source.
--   * audit_log is APPEND-ONLY (no update/delete policy) = tamper-evident.
--   * One alert per episode: onset -> (acknowledge) -> resolution.
-- ============================================================

-- ---- 1. Alert events (one row per alarm episode) ----
create table if not exists alerts (
  id              bigint generated always as identity primary key,
  device_id       text not null,
  parameter       text not null,        -- 'heart_rate' | 'body_temp'
  direction       text not null,        -- 'high' | 'low'
  value           numeric not null,     -- the reading that tripped it
  limit_min       numeric,
  limit_max       numeric,
  severity        text not null default 'high',
  onset_at        timestamptz not null default now(),   -- trusted server time
  acknowledged_at timestamptz,
  acknowledged_by text,                 -- who silenced/acknowledged it
  resolved_at     timestamptz,          -- null = still active
  note            text
);
create index if not exists alerts_open_idx on alerts (device_id, parameter) where resolved_at is null;
create index if not exists alerts_onset_idx on alerts (onset_at desc);

-- ---- 2. Append-only audit log (who did what, when) ----
create table if not exists audit_log (
  id        bigint generated always as identity primary key,
  ts        timestamptz not null default now(),
  actor     text,
  action    text not null,              -- 'acknowledge_alert','add_node',...
  entity    text,
  entity_id text,
  details   jsonb
);
create index if not exists audit_ts_idx on audit_log (ts desc);

-- ---- 3. Server-side detection: log alert onset & resolution ----
create or replace function fn_check_vitals_alerts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hrmin numeric; hrmax numeric; tmin numeric; tmax numeric;
begin
  select coalesce(p.hr_min,50), coalesce(p.hr_max,120),
         coalesce(p.temp_min,35), coalesce(p.temp_max,38)
    into hrmin, hrmax, tmin, tmax
    from patients p where p.device_id = NEW.device_id;
  hrmin := coalesce(hrmin,50); hrmax := coalesce(hrmax,120);
  tmin  := coalesce(tmin,35);  tmax  := coalesce(tmax,38);

  -- HEART RATE
  if NEW.heart_rate is not null then
    if NEW.heart_rate < hrmin or NEW.heart_rate > hrmax then
      if not exists (select 1 from alerts a
                     where a.device_id = NEW.device_id and a.parameter='heart_rate'
                       and a.resolved_at is null) then
        insert into alerts(device_id,parameter,direction,value,limit_min,limit_max,severity,onset_at)
        values (NEW.device_id,'heart_rate',
                case when NEW.heart_rate > hrmax then 'high' else 'low' end,
                NEW.heart_rate, hrmin, hrmax, 'high', NEW.recorded_at);
      end if;
    else
      update alerts set resolved_at = NEW.recorded_at
        where device_id = NEW.device_id and parameter='heart_rate' and resolved_at is null;
    end if;
  end if;

  -- BODY TEMPERATURE
  if NEW.body_temp is not null then
    if NEW.body_temp < tmin or NEW.body_temp > tmax then
      if not exists (select 1 from alerts a
                     where a.device_id = NEW.device_id and a.parameter='body_temp'
                       and a.resolved_at is null) then
        insert into alerts(device_id,parameter,direction,value,limit_min,limit_max,severity,onset_at)
        values (NEW.device_id,'body_temp',
                case when NEW.body_temp > tmax then 'high' else 'low' end,
                NEW.body_temp, tmin, tmax, 'high', NEW.recorded_at);
      end if;
    else
      update alerts set resolved_at = NEW.recorded_at
        where device_id = NEW.device_id and parameter='body_temp' and resolved_at is null;
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_vitals_alerts on vitals;
create trigger trg_vitals_alerts after insert on vitals
  for each row execute function fn_check_vitals_alerts();

-- ---- 4. Row Level Security ----
alter table alerts enable row level security;
alter table audit_log enable row level security;
do $$ begin
  -- alerts: read + acknowledge(update), NEVER delete
  if not exists (select 1 from pg_policies where tablename='alerts' and policyname='read alerts')
    then create policy "read alerts" on alerts for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename='alerts' and policyname='ack alerts')
    then create policy "ack alerts" on alerts for update using (true) with check (true); end if;
  -- audit_log: append-only (insert + read, NO update/delete) = tamper-evident
  if not exists (select 1 from pg_policies where tablename='audit_log' and policyname='read audit')
    then create policy "read audit" on audit_log for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename='audit_log' and policyname='insert audit')
    then create policy "insert audit" on audit_log for insert with check (true); end if;
end $$;

-- ---- 5. Realtime so the log updates live ----
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='alerts')
    then alter publication supabase_realtime add table alerts; end if;
end $$;