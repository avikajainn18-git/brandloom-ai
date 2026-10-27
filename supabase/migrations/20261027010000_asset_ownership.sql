-- Brandloom AI Phase A4 asset ownership and access policies.
-- Assets inherit access from the campaign that owns them.

create policy assets_select_own_campaign
  on public.assets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = assets.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy assets_insert_own_campaign
  on public.assets
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = assets.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy assets_update_own_campaign
  on public.assets
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = assets.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = assets.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );
