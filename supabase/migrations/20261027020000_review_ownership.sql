-- Brandloom AI Phase B2 review-run, finding, and evidence ownership policies.
-- Review records inherit access from the campaign that owns the reviewed data.

create policy review_runs_select_own_campaign
  on public.review_runs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = review_runs.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy review_runs_insert_own_campaign
  on public.review_runs
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = review_runs.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy review_runs_update_own_campaign
  on public.review_runs
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = review_runs.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = review_runs.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy findings_select_own_campaign
  on public.findings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.review_runs
      join public.campaigns on campaigns.id = review_runs.campaign_id
      where review_runs.id = findings.review_run_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy findings_insert_own_campaign
  on public.findings
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.review_runs
      join public.campaigns on campaigns.id = review_runs.campaign_id
      join public.assets on assets.id = findings.affected_asset_id
      where review_runs.id = findings.review_run_id
        and assets.campaign_id = review_runs.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy finding_references_select_own_campaign
  on public.finding_references
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.findings
      join public.review_runs on review_runs.id = findings.review_run_id
      join public.campaigns on campaigns.id = review_runs.campaign_id
      join public.brand_references on brand_references.id = finding_references.reference_id
      where findings.id = finding_references.finding_id
        and brand_references.campaign_id = review_runs.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy finding_references_insert_own_campaign
  on public.finding_references
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.findings
      join public.review_runs on review_runs.id = findings.review_run_id
      join public.campaigns on campaigns.id = review_runs.campaign_id
      join public.brand_references on brand_references.id = finding_references.reference_id
      where findings.id = finding_references.finding_id
        and brand_references.campaign_id = review_runs.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );
