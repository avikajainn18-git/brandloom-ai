-- Brandloom AI Phase A2 database foundation.
-- RLS is enabled below without public policies. Until authenticated policies
-- exist, the Supabase Data API cannot read or mutate these tables.

create extension if not exists pgcrypto;

create schema if not exists private;

create type public.campaign_status as enum (
  'draft',
  'in_review',
  'ready_for_approval',
  'approved',
  'archived'
);

create type public.brand_reference_type as enum (
  'campaign_brief',
  'brand_guidelines',
  'terminology',
  'claim',
  'fact',
  'offer',
  'other'
);

create type public.brand_reference_approval_status as enum (
  'pending',
  'approved',
  'rejected',
  'superseded'
);

create type public.asset_type as enum (
  'email',
  'advertisement',
  'social_post',
  'landing_page',
  'other'
);

create type public.review_run_status as enum (
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled'
);

create type public.finding_status as enum (
  'verified_mismatch',
  'uncertain',
  'conflict_requires_review',
  'resolved',
  'dismissed'
);

create type public.finding_severity as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type public.review_ticket_status as enum (
  'open',
  'in_review',
  'resolved',
  'dismissed'
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  description text,
  status public.campaign_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_references (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  reference_type public.brand_reference_type not null default 'other',
  content text not null check (btrim(content) <> ''),
  approval_status public.brand_reference_approval_status not null default 'pending',
  authority text,
  precedence integer check (precedence is null or precedence >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  asset_type public.asset_type not null default 'other',
  text_content text not null check (btrim(text_content) <> ''),
  current_revision integer not null default 1 check (current_revision >= 1),
  current_revision_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.review_runs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete restrict,
  status public.review_run_status not null default 'queued',
  finding_count integer not null default 0 check (finding_count >= 0),
  conflict_count integer not null default 0 check (conflict_count >= 0),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  review_run_id uuid not null references public.review_runs(id) on delete restrict,
  affected_asset_id uuid not null references public.assets(id) on delete restrict,
  category text not null check (btrim(category) <> ''),
  explanation text not null check (btrim(explanation) <> ''),
  status public.finding_status not null default 'uncertain',
  severity public.finding_severity,
  suggested_correction text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.review_tickets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete restrict,
  description text not null check (btrim(description) <> ''),
  decision_required text not null check (btrim(decision_required) <> ''),
  status public.review_ticket_status not null default 'open',
  reviewer_decision text,
  resolution_details text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Findings and tickets can cite multiple references and affect multiple assets.
-- These join tables keep those relationships relational and auditable.
create table public.finding_references (
  finding_id uuid not null references public.findings(id) on delete restrict,
  reference_id uuid not null references public.brand_references(id) on delete restrict,
  evidence_note text,
  primary key (finding_id, reference_id)
);

create table public.review_ticket_assets (
  review_ticket_id uuid not null references public.review_tickets(id) on delete restrict,
  asset_id uuid not null references public.assets(id) on delete restrict,
  primary key (review_ticket_id, asset_id)
);

create table public.review_ticket_references (
  review_ticket_id uuid not null references public.review_tickets(id) on delete restrict,
  reference_id uuid not null references public.brand_references(id) on delete restrict,
  primary key (review_ticket_id, reference_id)
);

comment on column public.brand_references.authority is
  'Human-defined authority label. The application must not infer authority from content.';
comment on column public.brand_references.precedence is
  'Optional explicit precedence. Higher numeric values take precedence; equal or null values do not resolve a conflict.';
comment on column public.assets.current_revision is
  'Revision number for the current text. Detailed revision history is added with correction workflows.';
comment on table public.finding_references is
  'Evidence links. Application code must verify that cited references are applicable and approved before presenting verified evidence.';

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function private.set_updated_at();

create trigger brand_references_set_updated_at
before update on public.brand_references
for each row execute function private.set_updated_at();

create trigger assets_set_updated_at
before update on public.assets
for each row execute function private.set_updated_at();

create trigger review_runs_set_updated_at
before update on public.review_runs
for each row execute function private.set_updated_at();

create trigger findings_set_updated_at
before update on public.findings
for each row execute function private.set_updated_at();

create trigger review_tickets_set_updated_at
before update on public.review_tickets
for each row execute function private.set_updated_at();

create index brand_references_campaign_id_idx
  on public.brand_references (campaign_id);
create index brand_references_campaign_status_idx
  on public.brand_references (campaign_id, approval_status);
create index assets_campaign_id_idx
  on public.assets (campaign_id);
create index assets_campaign_type_idx
  on public.assets (campaign_id, asset_type);
create index review_runs_campaign_id_idx
  on public.review_runs (campaign_id);
create index review_runs_campaign_status_idx
  on public.review_runs (campaign_id, status);
create index findings_review_run_id_idx
  on public.findings (review_run_id);
create index findings_affected_asset_id_idx
  on public.findings (affected_asset_id);
create index findings_status_idx
  on public.findings (status);
create index review_tickets_campaign_id_idx
  on public.review_tickets (campaign_id);
create index review_tickets_campaign_status_idx
  on public.review_tickets (campaign_id, status);
create index finding_references_reference_id_idx
  on public.finding_references (reference_id);
create index review_ticket_assets_asset_id_idx
  on public.review_ticket_assets (asset_id);
create index review_ticket_references_reference_id_idx
  on public.review_ticket_references (reference_id);

-- RLS is intentionally enabled with no public policies in Phase A2.
-- Until authenticated access policies are designed and tested, anon and
-- authenticated Data API roles have no access to these tables.
alter table public.campaigns enable row level security;
alter table public.brand_references enable row level security;
alter table public.assets enable row level security;
alter table public.review_runs enable row level security;
alter table public.findings enable row level security;
alter table public.review_tickets enable row level security;
alter table public.finding_references enable row level security;
alter table public.review_ticket_assets enable row level security;
alter table public.review_ticket_references enable row level security;
