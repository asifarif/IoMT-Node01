-- ============================================================
--  IoMT MVP4 migration — run in Supabase SQL Editor
--  Adds: MRN + per-patient thresholds, device SpO2,
--        a manual_entries table (BP/glucose/weight),
--        and CRUD policies so the dashboard can manage nodes.
-- ============================================================

-- patients: metadata + thresholds
alter table patients add column if not exists mrn      text;
alter table patients add column if not exists hr_min   numeric default 50;
alter table patients add column if not exists hr_max   numeric default 120;
alter table patients add column if not exists temp_min numeric default 35;
alter table patients add column if not exists temp_max numeric default 38;

-- vitals: device SpO2
alter table vitals add column if not exists spo2 numeric;

-- manual / extra vitals (BP, glucose, weight, ...) — generic kind/value = easy to extend
create table if not exists manual_entries (
  id          bigint generated always as identity primary key,
  device_id   text not null,
  kind        text not null,          -- 'bp_sys','bp_dia','glucose','weight',...
  value       numeric not null,
  recorded_at timestamptz default now()
);
create index if not exists manual_device_time_idx on manual_entries (device_id, recorded_at desc);
alter table manual_entries enable row level security;

-- policies (classroom-permissive; tighten for production)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='patients' and policyname='insert patients')
    then create policy "insert patients" on patients for insert with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='patients' and policyname='update patients')
    then create policy "update patients" on patients for update using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='patients' and policyname='delete patients')
    then create policy "delete patients" on patients for delete using (true); end if;
  if not exists (select 1 from pg_policies where tablename='vitals' and policyname='delete vitals')
    then create policy "delete vitals" on vitals for delete using (true); end if;
  if not exists (select 1 from pg_policies where tablename='manual_entries' and policyname='read manual')
    then create policy "read manual" on manual_entries for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename='manual_entries' and policyname='insert manual')
    then create policy "insert manual" on manual_entries for insert with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='manual_entries' and policyname='delete manual')
    then create policy "delete manual" on manual_entries for delete using (true); end if;
end $$;

-- realtime for manual_entries (guarded so re-running is safe)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='manual_entries')
    then alter publication supabase_realtime add table manual_entries; end if;
end $$;
