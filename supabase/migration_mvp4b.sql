-- ============================================================
--  IoMT MVP4b migration — drag-to-reorder persistence
--  (Inactive-node greying is client-side only; no schema needed.)
-- ============================================================
create table if not exists dashboard_state (
  id          int primary key default 1,
  node_order  jsonb not null default '[]'::jsonb,
  updated_at  timestamptz default now()
);
insert into dashboard_state (id, node_order) values (1, '[]'::jsonb)
on conflict (id) do nothing;

alter table dashboard_state enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='dashboard_state' and policyname='read state')
    then create policy "read state" on dashboard_state for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename='dashboard_state' and policyname='update state')
    then create policy "update state" on dashboard_state for update using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='dashboard_state' and policyname='insert state')
    then create policy "insert state" on dashboard_state for insert with check (true); end if;
end $$;
