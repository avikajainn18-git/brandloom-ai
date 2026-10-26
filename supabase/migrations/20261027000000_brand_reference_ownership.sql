-- Brandloom AI Phase A3.2 brand-reference ownership and access policies.
-- References inherit access from the campaign that owns them.

create policy brand_references_select_own_campaign
  on public.brand_references
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = brand_references.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy brand_references_insert_own_campaign
  on public.brand_references
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = brand_references.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy brand_references_update_own_campaign
  on public.brand_references
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = brand_references.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = brand_references.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );
