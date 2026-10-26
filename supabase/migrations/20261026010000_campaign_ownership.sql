-- Brandloom AI Phase A3.1 campaign ownership and access policies.
-- This migration is intentionally separate from the Phase A2 migration.

alter table public.campaigns
  add column owner_id uuid references auth.users(id) on delete restrict;

-- Existing campaigns cannot be safely assigned to an authenticated owner by
-- the database. Stop instead of silently assigning or exposing those rows.
do $$
begin
  if exists (select 1 from public.campaigns where owner_id is null) then
    raise exception
      'Cannot enforce campaign ownership: existing campaigns have no owner_id. Assign each row to a verified auth.users.id before retrying this migration.';
  end if;
end;
$$;

alter table public.campaigns
  alter column owner_id set not null,
  alter column owner_id set default auth.uid();

create index campaigns_owner_id_idx
  on public.campaigns (owner_id);

-- The policies intentionally cover only campaigns. Other Phase A2 tables
-- remain protected until their ownership/access model is implemented.
create policy campaigns_select_own
  on public.campaigns
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy campaigns_insert_own
  on public.campaigns
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy campaigns_update_own
  on public.campaigns
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
